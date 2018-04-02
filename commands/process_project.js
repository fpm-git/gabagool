
const fs = require('fs');
const path = require('path');

const wrapper = require('./wrapper');
const vanity = require('../lib/vanity');
const moduleLoader = require('../lib/sails_parser/sails_module_loader');
const typesGenerator = require('../lib/sails_parser/sails_types_generator');

async function tryReadProjectPackage(projectDirectory) {
    const filePath = projectDirectory + '/package.json';
    return new Promise((resolve, reject) => {
        try {
            const pkg = require(filePath);
            if (typeof pkg !== 'object') {
                return reject('Unable to load package.json! An unknown error occurred...');
            }
            return resolve(pkg);
        } catch (e) {
            // if the file doesn't exist, tell the user...
            if (!fs.existsSync(filePath)) {
                return reject('Unable to load package.json! Ensure that this file is accessible and try again.');
            }
            // otherwise, we've likely got some syntax error, just toss out the error
            return reject('Unable to load package.json! ' + e);
        }
    });
}

/**
 * @param {Array<string>} dependencies - List of all dependency names required by the package.
 * @param {string} projectDirectory - Directory of the project to extract dependencies from.
 * @param {Object} parentHook - Hook which is importing the specified hook.
 */
async function extractHookDependencies(dependencies, projectDirectory, parentHook) {
    function tryLoadPackage(depName) {
        return new Promise((resolve, reject) => {
            const hookFolderPath = projectDirectory + '/node_modules/' + depName + '/';
            const hookPackagePath = hookFolderPath + 'package.json';
            const packageRes = {
                path: hookFolderPath,
                package: hookPackagePath,
                isHook: false,
                isMarlinHook: false,
                dependencies: [],       // names only
                devDependencies: []     // names only
            };
            try {
                const pkg = require(hookPackagePath);
                if (typeof pkg !== 'object') {
                    // no proper package, resolve out with a non-hook res
                    return resolve(packageRes);
                }
                // pull in hook sails properties, if they exist
                if (pkg.sails) {
                    packageRes.isHook = pkg.sails.isHook || false;
                    packageRes.isMarlinHook = typeof (pkg.dependencies || {})['marlinspike'] === 'string';
                    packageRes.hookName = pkg.sails.hookName || pkg.name;
                }
                // extract name
                packageRes.name = pkg.name;
                // extract dependency names
                packageRes.dependencies = Object.keys((typeof pkg.dependencies === 'object') ? pkg.dependencies : {});
                packageRes.devDependencies = Object.keys((typeof pkg.devDependencies === 'object') ? pkg.devDependencies : {});
                // set the parent hook (just a reference to the hook which imported this one, if not the parent module)
                packageRes.parentHook = parentHook;
                return resolve(packageRes);
            } catch (e) {
                // if the file doesn't exist, tell the user...
                if (!fs.existsSync(hookPackagePath)) {
                    return reject(`Unable to load hook information from "${hookPackagePath}"! Ensure that this file is accessible, and that all dependencies have been installed via npm/yarn.`);
                }
                // otherwise, we've likely got some syntax error, just toss out the error
                return reject(`Unable to load ${hookPackagePath}! ` + e);
            }
        });
    }
    return new Promise((resolve, reject) => {
        Promise.all(dependencies.map(dep => tryLoadPackage(dep))).then(dependencies => {
            const hookDependencies = dependencies.filter(pkg => pkg.isMarlinHook);
            return resolve(hookDependencies);
        }).catch(reject);
    });
}

/**
 * Attempts to detect common issues with the given list of hooks.
 *
 * Issues which are checked for include:
 *  - [ERROR] using Marlinspike hooks as normal dependencies (as opposed to devDependencies)
 *  - [WARN] a devDependency with name containing 'hook-' or '-hook' has not been loaded as a proper hook within the parent package
 */
async function analyseSubhookIssues(hooks) {
    const processHook = async (hook) => {
        const dependencies = Array.isArray(hook.dependencies) ? hook.dependencies : [];
        const devDependencies = Array.isArray(hook.devDependencies) ? hook.devDependencies : [];

        // Ensure no marlin hooks are loaded as normal deps...
        for (let i = 0; i < dependencies.length; i++) {
            const dep = dependencies[i];
            try {
                const trHook = await extractHookDependencies([dep], hook.path.substr(0, hook.path.length - 1), hook);
                if (trHook.isMarlinHook) {
                    return `Found a Marlinspike hook (${trHook.name}) within dependencies of subhook "${hook.name}". Please install all Marlinspike hooks as devDependencies.`;
                }
            } catch (e) {
                // catch the file read error, nothing serious here...
            }
        }

        // Emit warnings where any potential tertiary hook has not been loaded...
        const potentialHooks = devDependencies.filter(depName => (depName.indexOf('hook-') >= 0) || (depName.indexOf('-hook') >= 0));
        potentialHooks.forEach(ptrHookName => {
            if (!hooks.find(v => v.name === ptrHookName)) {
                vanity.logWarning(`Imported hook contains a reference to potential hook "${ptrHookName}", though ${ptrHookName} has not been installed in the main package's devDependencies.`);
            }
        });

        return true;
    };

    if (!Array.isArray(hooks)) {
        return new Error(`Expected an array of hooks, but found type ${typeof hooks} instead.`);
    }
    for (let i = 0; i < hooks.length; i++) {
        await processHook(hooks[i]);
    }
    return true;
}

/**
 * Pulls out package information for the main project and all hook dependencies.
 */
async function parseProjectPackages(projectDirectory) {
    const projectPackage = await tryReadProjectPackage(projectDirectory);

    // ensure the returned package is an object...
    if (typeof projectPackage !== 'object') {
        throw 'The loaded package.json is not a proper object!';
    }

    // pull out dependency names...
    const dependencies = Object.keys((typeof projectPackage.dependencies === 'object') ? projectPackage.dependencies : {});
    const devDependencies = Object.keys((typeof projectPackage.devDependencies === 'object') ? projectPackage.devDependencies : {});
    // warn if the user doesn't have a sails dependency
    if (!dependencies.includes('sails') && !devDependencies.includes('sails')) {
        vanity.logWarning(
            `The active project (${projectPackage.name}) has no sails dependency listed!`,
            '\nIt is recommended that you run an `npm install sails --save`, so this project may function without a global sails installation.'
        );
    }

    const hooks = await extractHookDependencies(dependencies, projectDirectory);
    const hooksDev = await extractHookDependencies(devDependencies, projectDirectory);
    const allHooks = hooks.concat(hooksDev);    // essentially hooksDev below

    // toss an error if we've imported any marlin hook in normal dependencies
    if (hooks.length > 0) {
        throw `Found Marlinspike-based "${hooks[0].name}" within package dependencies. Please install all Marlinspike hooks as devDependencies instead.`;
    }

    return [projectPackage, allHooks];
}

/**
 * @param {string} projectDirectory
 */
async function processProject(projectDirectory) {
    vanity.logInfo('processing Sails project...');

    // eslint-disable-next-line no-unused-vars
    const [projectPackage, extHooks] = await parseProjectPackages(projectDirectory);

    // attempt to find any common hook issues, throwing if we've a serious error
    await analyseSubhookIssues(extHooks);

    // ideally separate
    const lcaseNames = {};
    const models = {};
    const services = {};
    [{ name: 'root project', path: projectDirectory }].concat(extHooks).forEach(hook => {
        moduleLoader.readModels(hook.path).forEach(model => {
            const dupModel = lcaseNames[model.name.toLowerCase()];
            if (dupModel) {
                throw `Found duplicate definition of model "${model.name}" (${model.filename}) in ${hook.name} (defined already in "${dupModel.filename}" [${dupModel.owner.name}]).`;
            }
            model.owner = hook;
            models[model.name] = model;
            lcaseNames[model.name.toLowerCase()] = model;
        });
        moduleLoader.readServices(hook.path).forEach(service => {
            const dupService = lcaseNames[service.name.toLowerCase()];
            if (dupService) {
                throw `Found duplicate definition of service "${service.name}" (${service.filename}) in ${hook.name} (defined already in "${dupService.filename}" [${dupService.owner.name}]).`;
            }
            service.owner = hook;
            services[service.name] = service;
            lcaseNames[service.name.toLowerCase()] = service;
        });
    });

    // standalone definition generation
    for (const name in models) {
        typesGenerator.generateStandaloneDefinition(models[name], models);
    }
    for (const name in services) {
        typesGenerator.generateStandaloneDefinition(services[name], models);
    }

    // linked definition generation
    for (const name in models) {
        typesGenerator.generateLinkedDefinition(models[name], models);
    }
    for (const name in services) {
        typesGenerator.generateLinkedDefinition(services[name], models);
    }

    const OUT_DIR = path.join(process.cwd(), './.types/');
    typesGenerator.prepareOutputDirectory(OUT_DIR, models, services);

    if (!fs.existsSync(path.join(process.cwd(), './jsconfig.json'))) {
        fs.writeFileSync(path.join(process.cwd(), './jsconfig.json'), JSON.stringify({
            compilerOptions: {
                target: 'es2017'
            },
            include: [
                './.types/globals.d.ts',
                '**/*.js',
            ],
            exclude: [
                'node_modules'
            ]
        }, null, 2));
    }

    return 'OKAY!';
}

module.exports = wrapper(processProject, 'process-project');
