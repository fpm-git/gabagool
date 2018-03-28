
const vanity = require('../lib/vanity');

module.exports = (func, commandName) => {
    return async function (...params) {
        if (typeof commandName !== 'string') {
            vanity.logError('command wrapper called without name:', new Error());
            return process.exit(1);
        }
        try {
            return await func(...params);
        } catch (e) {
            vanity.logError(`command ${commandName} failed:`, e);
            return process.exit(1);
        }
    };
};

