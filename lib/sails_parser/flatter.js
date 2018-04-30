/**
 * @file flatter.js
 *
 * Handles flattening a program AST belonging to some Sails model/service.
 *
 * The flattening process entails pulling out specific fields from the module.exports value,
 * this includes:
 *      - items within the attributes key
 *      - all top-level functions
 */

const jsdoc = require('./jsdoc_helper');
const vanity = require('../vanity');

/**
 * Attempts to grab the object assigned to the module.exports within the given program AST
 * object.
 * @returns {ObjectExpression|undefined} an ObjectExpression when module.exports could be
 * found, undefined otherwise.
 */
function findModuleExports(programAst) {
    const statements = programAst.body || [];
    for (let i = 0; i < statements.length; i++) {
        const m = statements[i];
        if (m.type === 'ExpressionStatement') {
            const expr = m.expression;
            if (expr.left && expr.right && expr.left.object && expr.left.property && (expr.left.type === 'MemberExpression') && (expr.right.type === 'ObjectExpression') && (expr.left.object.name === 'module') && (expr.left.property.name === 'exports')) {
                return expr.right;
            }
        }
    }
}

/**
 * Attempts to find an attributes object within a module's exports object. There is no
 * guarantee that this exists for any given module, though it should typically be defined
 * for any Sails model.
 * @param {ObjectExpression} exportsObject - The exported module object, which should
 * be of type ObjectExpression.
 * @param {any} fileDesc - The file reference, used to reference path/name for errors.
 */
function findAttributesObject(exportsObject, fileDesc) {
    const properties = exportsObject.properties || [];
    for (let i = 0; i < properties.length; i++) {
        const p = properties[i];
        if (p.key && (p.type === 'ObjectProperty') && (p.key.type === 'Identifier') && (p.key.name === 'attributes')) {
            if (p.key.shorthand) {
                return vanity.logWarning(`Found shorthand attributes key in ${fileDesc.name} ("${fileDesc.filename}"). Please note that this is not currently supported, and that inline attributes should be used instead.`);
            }
            return p.value;
        }
    }
}

/**
 * Attempts to extract JSDoc information for any given Babel AST node.
 * If there is any block commment directly before the node, then it will be parsed and the
 * JSDoc-based information returned. Otherwise, undefined will be returned.
 */
function extractNodeJSDocInfo(node) {
    if (!node || !Array.isArray(node.leadingComments)) {
        return undefined;
    }
    const lastComment = node.leadingComments[node.leadingComments.length - 1];
    // leave if we don't have a block-type comment
    if (lastComment.type !== 'CommentBlock') {
        return undefined;
    }

    return jsdoc.parseJSDoc(lastComment.value);
}

/**
 * Attempts to extract any attributes from the given attributes object.
 */
function extractAttributes(attributesObject, _fileDesc) {
    /**
     * Helper function used to extract the 1-level-deep properties within an attribute's ObjectExpression.
     */
    function extractAttrProperties(attrObjExpression, attrName) {
        if (!attrObjExpression || !Array.isArray(attrObjExpression.properties)) {
            return [];
        }
        const out = {};
        const usedNames = new Set();
        attrObjExpression.properties.forEach(property => {
            if (property.shorthand) {
                return; // warn
            }
            if (!property.key || !property.key.name || !property.value || !property.value.value) {
                return;
            }
            if (usedNames.has(property.key.name)) {
                vanity.logWarning(`Duplicate key used in attribute "${attrName}" definition in ${_fileDesc.name} ("${_fileDesc.filename}"). Using new key value...`);
            }
            usedNames.add(property.key.name);
            out[property.key.name] = property.value.value;
        });

        return out;
    }

    // leave if we've received an object of invalid type
    if (!attributesObject || attributesObject.type !== 'ObjectExpression') {
        return [];
    }
    // leave if we don't have a properties array for some reason
    if (!Array.isArray(attributesObject.properties)) {
        return [];
    }

    const out = [];
    const usedNamesLCase = new Set();   // we've got to enforce lcase here, for DB safety (case-insensitive field names)
    attributesObject.properties.forEach(property => {
        if (property.shorthand || !property.key || !property.key.name || !property.value || (property.type !== 'ObjectProperty')) {
            return;
        }
        if (property.value.type !== 'ObjectExpression') {
            return vanity.logWarning(`Found invalid attribute "${property.key.name}" in ${_fileDesc.name} ("${_fileDesc.filename}"). Expected an object expression but found ${property.value.type} instead.`);
        }
        if (usedNamesLCase.has(property.key.name.toLowerCase())) {
            throw `Found attribute conflict in ${_fileDesc.name} ("${_fileDesc.filename}"). The "${property.key.name}" attribute's identity has already been assigned.`;
        }
        usedNamesLCase.add(property.key.name.toLowerCase());
        const attrProps = extractAttrProperties(property.value, property.key.name);
        out.push({
            name: property.key.name,
            properties: attrProps,
            doc: extractNodeJSDocInfo(property),
        });
    });

    return out;
}

/**
 * Attempts to find any top-level methods defined within the given module export object,
 * complete with parameter typing extracted from JSDoc.
 */
function extractFunctions(exportsObject, _fileDesc) {
    function extractFunctionParams(parameters) {
        if (!Array.isArray(parameters)) {
            return [];
        }
        return parameters.filter(p => p.type === 'Identifier').map(p => p.name);
    }

    const properties = exportsObject.properties || [];
    const out = [];

    properties.forEach(property => {
        if (property.type === 'ObjectProperty') {
            if (!property.value || ((property.value.type !== 'FunctionExpression') && (property.value.type !== 'ArrowFunctionExpression'))) {
                return;
            }
            vanity.logWarning(`Found method "${property.key.name}" defined as property in ${_fileDesc.name} ("${_fileDesc.filename}"). Please use the ES2015 object method syntax instead!`);
        } else if (property.type !== 'ObjectMethod') {
            return;
        }

        const funcDef = (property.type === 'ObjectMethod') ? property : property.value;
        out.push({
            name: property.key && property.key.name,
            params: extractFunctionParams(funcDef.params),
            async: funcDef.async === true,
            doc: extractNodeJSDocInfo(property),
        });
    });

    return out;
}

/**
 * Flattens the given loaded file, as parsed by the sails_module_loader.
 */
function flatten(loadedFile) {
    // toss if we've no Babel program AST
    if (!loadedFile.program) {
        throw `Failed to locate program entry for ${loadedFile.name} ("${loadedFile.filename}")!`;
    }

    const exportsObject = findModuleExports(loadedFile.program);
    if (!exportsObject) {
        return vanity.logWarning(`No module.exports assignment found for ${loadedFile.name} ("${loadedFile.filename}"), type information will not be generated.`);
    }

    const attributesObj = findAttributesObject(exportsObject, loadedFile);
    const attributes = extractAttributes(attributesObj, loadedFile);
    const methods = extractFunctions(exportsObject, loadedFile);

    // setup the attribute and function lists
    loadedFile.attributes = attributes || [];
    loadedFile.functions = methods || [];

    return loadedFile;
}

module.exports = {

    flatten

};
