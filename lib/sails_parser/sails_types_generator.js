
/* eslint-disable no-useless-escape */
// ^ eslint doesn't understand the regex...

const fs = require('fs');
const path = require('path');
const vanity = require('../vanity');
const jsdoc = require('./jsdoc_helper');

function isValidType(typeName, modelsCollection) {
    const validTypes = [
        'string',
        'String',
        'object',
        'Object',
        'number',
        'Number',
        'boolean',
        'Boolean',
        'Promise',
        'Array',
        'Function',
        'void',
    ];

    function validatePromiseType(promiseType) {
        const m = (promiseType || '').match(/Promise<([A-Za-z_$<>\[\]\|]+)>/);
        if (typeof m[1] !== 'string') {
            return false;
        }
        // grab all potential promise types and test them, returning false on any failure
        const types = m[1].split('|');
        for (let i = 0; i < types.length; i++) {
            if (!isValidType(types[i], modelsCollection)) {
                return false;
            }
        }
        return true;    // all tests went through good!
    }
    if (typeof typeName !== 'string') {
        return false;
    }
    if (typeName.endsWith('[]')) {
        const trimmedName = typeName.substr(0, typeName.length - '[]'.length);
        return isValidType(trimmedName, modelsCollection);
    }
    if (typeName.startsWith('Promise<')) {
        return validatePromiseType(typeName);
    }
    if (typeName.endsWith('Instance')) {
        const trimmedName = typeName.substr(0, typeName.length - 'Instance'.length);
        return typeof modelsCollection[trimmedName] === 'object';
    }

    return validTypes.includes(typeName);
}

function waterlineTypeToTS(typeName) {
    const types = {
        string: 'string',
        number: 'number',
        boolean: 'boolean',
        json: 'object',
        ref: 'any',
    };
    return types[typeName] || 'any';
}

function resolveFunctionTypes(modelOrService, modelsCollection) {
    function validateDocParameters(func) {
        if (!func || !func.doc || !Array.isArray(func.doc.parameters)) {
            return;
        }
        func.doc.parameters.filter(param => Array.isArray(param.types)).forEach(param => {
            const types = new Set();
            param.types.forEach(type => {
                if (isValidType(type, modelsCollection)) {
                    return types.add(type);
                }
                return types.add('any');
            });
            param.types = Array.from(types);
        });
    }
    function validateDocReturn(func) {
        if (!func || !func.doc || !func.doc.returns || !Array.isArray(func.doc.returns.types)) {
            return;
        }
        const types = new Set();
        func.doc.returns.types.forEach(type => {
            if (isValidType(type, modelsCollection)) {
                return types.add(type);
            }
            return types.add('any');
        });
        func.doc.returns.types = Array.from(types);
    }
    function getTypedParameters(func) {
        function getTypesForParam(name) {
            if (!func.doc || !Array.isArray(func.doc.parameters)) {
                return ['any'];
            }
            for (let i = 0; i < func.doc.parameters.length; i++) {
                const p = func.doc.parameters[i];
                if (p.name === name) {
                    return p.types;
                }
            }
            return ['any'];
        }
        function isParamOptional(name) {
            if (!func.doc || !Array.isArray(func.doc.parameters)) {
                return false;
            }
            for (let i = 0; i < func.doc.parameters.length; i++) {
                const p = func.doc.parameters[i];
                if (p.name === name) {
                    return p.optional === true;
                }
            }
            return false;
        }
        if (!func || !Array.isArray(func.params)) {
            return [];
        }
        const out = [];
        func.params.forEach(param => {
            const types = getTypesForParam(param);
            out.push({
                name: param,
                types: Array.isArray(types) ? types : ['any'],
                optional: isParamOptional(param),
            });
        });
        return out;
    }
    function getImportModules(typedParams, returns) {
        if (!Array.isArray(typedParams)) {
            return [];
        }
        const out = [];
        const typeCheck = (type) => {
            if (type.endsWith('Instance')) {
                out.push(type.substr(0, type.length - 'Instance'.length));
            } else if (type.endsWith('Instance[]')) {
                out.push(type.substr(0, type.length - 'Instance[]'.length));
            }
        };
        typedParams.forEach(param => {
            param.types.forEach(typeCheck);
        });
        if (returns && Array.isArray(returns.types)) {
            returns.types.forEach(typeCheck);
        }
        return out;
    }

    if (!Array.isArray(modelOrService.functions)) {
        return;
    }

    modelOrService.imports = modelOrService.imports || new Set();
    modelOrService.functions.forEach(func => {
        validateDocParameters(func);
        validateDocReturn(func);

        func.paramsTyped = getTypedParameters(func);
        const impModules = getImportModules(func.paramsTyped, func.doc ? func.doc.returns : undefined);
        if (Array.isArray(impModules) && impModules.length > 0) {
            modelOrService.imports.add(...impModules);
        }
    });
}

function resolveAttributeTypes(modelOrService, modelsCollection) {
    function getValidWaterlineTypes() {
        const validWaterlineTypes = [
            'string',
            'number',
            'boolean',
            'json',
            'ref',
        ];
        return validWaterlineTypes;
    }
    function validatePropertyType(type) {
        return getValidWaterlineTypes().includes(type);
    }
    function findModelByIdentity(identity) {
        if (typeof modelsCollection !== 'object') {
            return undefined;
        }
        identity = identity.toLowerCase();
        for (const name in modelsCollection) {
            if (name.toLowerCase() === identity) {
                return modelsCollection[name];
            }
        }
        return undefined;
    }

    if (!Array.isArray(modelOrService.attributes)) {
        return;
    }

    modelOrService.imports = modelOrService.imports || new Set();
    modelOrService.attributes.forEach(attr => {
        if (!attr.properties) {
            attr.properties = {};
        }
        const properties = attr.properties;

        if (!properties.type && !properties.collection && !properties.model && !properties.through) {
            throw `Invalid attribute "${attr.name}" found in ${modelOrService.name} ("${modelOrService.filename}"). Expected either a type or association specified, but found neither! Please add a type, model, or collection property for this attribute.`;
        }

        if (properties.type) {  // validate basic types
            if (!validatePropertyType(properties.type)) {
                throw `Invalid type "${properties.type}" specified for attribute "${attr.name}" in ${modelOrService.name} ("${modelOrService.filename}")! Valid attribute values are: ${getValidWaterlineTypes().join(', ')}.`;
            }
        } else if (properties.collection) { // validate against available models (and add import)
            const model = findModelByIdentity(properties.collection);
            if (properties.collection.toLowerCase() !== properties.collection) {
                vanity.logWarning(`Model identity "${properties.collection}" for attribute "${attr.name}" should be all lowercase (in ${modelOrService.name}: "${modelOrService.filename}").`);
            }
            if (!model) {
                throw `Failed to resolve model collection type "${properties.collection}" for attribute "${attr.name}" in ${modelOrService.name} ("${modelOrService.filename}"). Valid models are: ${Object.keys(modelsCollection).join(', ')}.`;
            }

            properties.collection = model.name; // resolve to case-name for later on
            modelOrService.imports.add(model.name);
        } else if (properties.model) {      // validate against available models (and add import)
            const model = findModelByIdentity(properties.model);
            if (properties.model.toLowerCase() !== properties.model) {
                vanity.logWarning(`Model identity "${properties.model}" for attribute "${attr.name}" should be all lowercase (in ${modelOrService.name}: "${modelOrService.filename}").`);
            }
            if (!model) {
                throw `Failed to resolve model type "${properties.model}" for attribute "${attr.name}" in ${modelOrService.name} ("${modelOrService.filename}"). Valid models are: ${Object.keys(modelsCollection).join(', ')}.`;
            }

            properties.model = model.name;  // resolve to case-name for later on
            modelOrService.imports.add(model.name);
        }
    });
}

function resolveTypes(modelOrService, modelsCollection) {
    resolveFunctionTypes(modelOrService, modelsCollection);
    resolveAttributeTypes(modelOrService, modelsCollection);
}

function makeClassPropsFromAttributes(attributes) {
    let out = '';
    (attributes || []).forEach(attr => {
        const props = attr.properties || {};
        let doc = jsdoc.constructJSDoc(attr.doc);
        if (doc.length > 0) {
            doc = `  ${doc}\n`;
        }
        out += `\n\n${doc}  ${attr.name}${!props.required ? '?' : ''}: `;
        if (props.type) {
            out += waterlineTypeToTS(props.type);
        } else if (props.model) {
            out += props.model + 'Instance';
        } else if (props.collection) {
            out += props.collection + 'Instance[]';
        }
        out += ';';
    });
    return out + '\n\n';
}

function makeStaticSignaturesFromFunctionDefs(functions) {
    /**
     * Helper function to determine the result type as a simple string, based on the extrapolated
     * JSdoc type, or if there is no valid JSDoc entry, then 'any'.
     */
    function determineResultType(func) {
        if (!func || !func.doc || !func.doc.returns || !Array.isArray(func.doc.returns.types)) {
            return 'any';
        }
        return func.doc.returns.types.join('|');
    }

    let out = '';
    (functions || []).forEach(func => {
        const paramDefs = [];
        let hasOutputOptionalParam = false;
        (func.paramsTyped || []).forEach(param => {
            if (!Array.isArray(param.types) || param.types.length === 0) {
                param.types = ['any'];
            }
            let outParam = param.name;
            if (hasOutputOptionalParam || param.optional) {
                hasOutputOptionalParam = true;
                outParam += '?';
            }
            outParam += `: ${param.types.join(' | ')}`;
            paramDefs.push(outParam);
        });

        // result type is wrapped up with Promise<> if we've an async func, as async functions are not directly allowed in ambient scope
        const resultType = func.async ? `Promise<${determineResultType(func)}>` : determineResultType(func);
        // further, add an async annotation tag if we're async
        if (func.async) {
            func.doc = func.doc || {};
            func.doc.annotations = func.doc.annotations || [];
            func.doc.annotations.push({
                type: '@async',
            });
        }
        // generate our JSDoc
        let doc = jsdoc.constructJSDoc(func.doc);
        if (doc.length > 0) {
            doc = `  ${doc}\n`;
        }
        out += `\n\n${doc}  abstract ${func.name}(${paramDefs.join(', ')}): ${resultType};`;
    });

    return out + '\n\n';
}

function generateStandaloneModelDefinition(model) {

    const classProps = makeClassPropsFromAttributes(model.attributes);
    const instanceClass = `abstract class ${model.name}Instance {${classProps}}`;

    const staticFuncs = makeStaticSignaturesFromFunctionDefs(model.functions);
    const staticClass = `export declare abstract class ${model.name} extends $ailsModel<${model.name}Instance> {${staticFuncs}}`;

    model.tsDefinitions = {
        static: staticClass,
        instance: instanceClass,
    };

}

function generateStandaloneServiceDefinition(service) {

    const staticFuncs = makeStaticSignaturesFromFunctionDefs(service.functions);
    const staticClass = `export declare abstract class ${service.name} {${staticFuncs}}`;

    service.tsDefinitions = {
        static: staticClass,
    };

}

function generateStandaloneDefinition(modelOrService, modelsCollection) {
    resolveTypes(modelOrService, modelsCollection);

    if (modelOrService.isModel) {
        generateStandaloneModelDefinition(modelOrService);
    } else if (modelOrService.isService) {
        generateStandaloneServiceDefinition(modelOrService);
    }
}

function generateLinkedDefinition(modelOrService, modelsCollection) {
    let linkedDefinition = modelOrService.isModel ? '\n' : '';

    if (modelOrService.isModel) {
        linkedDefinition += '\nimport { $ailsModel } from \'../sails/model\';';
    }

    const evaluatedModules = new Set();
    const imports = Array.from(modelOrService.imports || []);
    const depInstanceClasses = [];
    while (imports.length > 0) {
        const imp = imports.pop();
        // leave if we're importing ourself
        if (imp === modelOrService.name) {
            break;
        }
        // leave if we've evaluated this import path already
        if (evaluatedModules.has(imp)) {
            break;
        }
        const impModel = modelsCollection[imp];
        if (!impModel) {
            vanity.logWarning(`Failed to import model ${imp} within ${modelOrService.name}: "${modelOrService.filename}". WTF?`);
            break;
        }

        if (impModel.imports) {
            for (const iSub of impModel.imports) {
                imports.push(iSub);
            }
        }
        if (impModel.tsDefinitions && impModel.tsDefinitions.instance) {
            depInstanceClasses.push(impModel.tsDefinitions.instance);
        }

        // count the module as evaluated, so we won't scan it again
        evaluatedModules.add(imp);
    }

    depInstanceClasses.forEach(dep => {
        linkedDefinition += `\n\n// Inlined dependency...\n${dep}`;
    });

    if (modelOrService.isModel) {
        linkedDefinition += `\n\n// Main instance class...\n${modelOrService.tsDefinitions.instance}`;
    }

    linkedDefinition += `\n\n// Main static class...\n${modelOrService.tsDefinitions.static}\n`;

    modelOrService.tsDefinitions.linked = linkedDefinition;

}

function generateGlobalDefinitionFile(models, services) {

    let out = '\nimport { sails } from \'./sails/sails\';';

    if ((typeof models === 'object') && (Object.keys(models).length > 0)) {
        out += '\n\n// Models';
        for (const model in models) {
            out += `\nimport { ${model} } from './models/${model}';`;
        }
    }

    if ((typeof services === 'object') && (Object.keys(services).length > 0)) {
        out += '\n\n// Services';
        for (const service in services) {
            out += `\nimport { ${service} } from './services/${service}';`;
        }
    }

    out += '\n\ndeclare global {\n\n';
    out += '  const sails: sails;';

    if ((typeof models === 'object') && (Object.keys(models).length > 0)) {
        out += '\n';
        for (const model in models) {
            out += `\n  const ${model}: ${model};`;
        }
    }

    if ((typeof services === 'object') && (Object.keys(services).length > 0)) {
        out += '\n';
        for (const service in services) {
            out += `\n  const ${service}: ${service};`;
        }
    }

    out += '\n\n}\n';

    return out;

}

function prepareOutputDirectory(outDir, models, services) {
    function removeDirectory(directoryPath) {
        if (fs.existsSync(directoryPath)) {
            fs.readdirSync(directoryPath).forEach((file) => {
                const filePath = path.join(directoryPath, file);
                return fs.lstatSync(filePath).isDirectory() ? removeDirectory(filePath) : fs.unlinkSync(filePath);
            });
            fs.rmdirSync(directoryPath);
        }
    }
    removeDirectory(outDir);

    fs.mkdirSync(outDir);
    fs.mkdirSync(path.join(outDir, './sails/'));
    fs.mkdirSync(path.join(outDir, './models/'));
    fs.mkdirSync(path.join(outDir, './services/'));

    const TYPES_DIR = path.join(__dirname, '../../types/');
    fs.copyFileSync(TYPES_DIR + 'sails/model.d.ts', path.join(outDir + './sails/model.d.ts'));
    fs.copyFileSync(TYPES_DIR + 'sails/sails.ts', path.join(outDir + './sails/sails.ts'));
    fs.writeFileSync(path.join(outDir + './globals.d.ts'), generateGlobalDefinitionFile(models, services));


    for (const modelName in models) {
        const model = models[modelName];
        if (!model.tsDefinitions || !model.tsDefinitions.linked) {
            return;
        }
        fs.writeFileSync(path.join(outDir + './models/' + model.name + '.ts'), model.tsDefinitions.linked);
    }

    for (const serviceName in services) {
        const service = services[serviceName];
        if (!service.tsDefinitions || !service.tsDefinitions.linked) {
            return;
        }
        fs.writeFileSync(path.join(outDir + './services/' + service.name + '.ts'), service.tsDefinitions.linked);
    }

}

module.exports = {

    prepareOutputDirectory,
    generateStandaloneDefinition,
    generateLinkedDefinition,



};