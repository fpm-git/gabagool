/**
 * @file sails_module_loader.js
 *
 * Loads Sails model and service modules with Babel, generating ASTs to be used in extracting
 * parameter names and typing information from JSDoc comments/model type specifiers.
 */

const fs = require('fs');
const path = require('path');
const babel = require('babel-core');

const flatter = require('./flatter');

function getDirectoryFiles (directoryPath) {
    if (fs.statSync(directoryPath).isDirectory()) {
        return [].concat(...fs.readdirSync(directoryPath).map(file => getDirectoryFiles(path.join(directoryPath, file)))).filter(v => v);
    }
    if (directoryPath.endsWith('.js')) {
        return directoryPath;
    }
    return undefined;
}

/**
 * Retrieves a list of all model files residing within the project of the given path.
 */
function getModelFiles(projectDirectory) {
    const modelsPath = path.join(projectDirectory, '/api/models/');

    try {
        return getDirectoryFiles(modelsPath);
    } catch (e) {
        return [];
    }
}

/**
 * Retrieves a list of all service files residing within the project of the given path.
 */
function getServiceFiles(projectDirectory) {
    const servicesPath = path.join(projectDirectory, '/api/services/');

    try {
        return getDirectoryFiles(servicesPath);
    } catch (e) {
        return [];
    }
}

function tryParseModel(modelFilename) {
    let _model = undefined;
    try {
        _model = babel.transform(fs.readFileSync(modelFilename, 'utf-8'));
    } catch (e) {
        // just a syntax error
        throw `Failed to load model file "${modelFilename}": ` + e;
    }

    const outModel = {
        filename: modelFilename,
        name: path.parse(modelFilename).name,
        program: _model.ast.program,
        isModel: true,
    };

    flatter.flatten(outModel);

    return outModel;
}

function tryParseService(serviceFilename) {
    let _service = undefined;
    try {
        _service = babel.transform(fs.readFileSync(serviceFilename, 'utf-8'));
    } catch (e) {
        // just a syntax error
        throw `Failed to load service file "${serviceFilename}": ` + e;
    }

    const outService = {
        filename: serviceFilename,
        name: path.parse(serviceFilename).name,
        program: _service.ast.program,
        isService: true,
    };

    flatter.flatten(outService);

    return outService;
}

function readModels(projectDirectory) {
    const outModels = [];
    getModelFiles(projectDirectory).forEach(modelFile => {
        const mParsed = tryParseModel(modelFile);
        if (mParsed) {
            outModels.push(mParsed);
        }
    });
    return outModels;
}

function readServices(projectDirectory) {
    const outServices = [];
    getServiceFiles(projectDirectory).forEach(serviceFile => {
        const svcParsed = tryParseService(serviceFile);
        if (svcParsed) {
            outServices.push(svcParsed);
        }
    });
    return outServices;
}

module.exports = {

    readModels,
    readServices,

};
