
/**
 * Ridiculous logo printing method...
 */
function printLogo () {
    console.log(`
    \x1b[91m██████╗  █████╗ ██████╗  █████╗  ██████╗  ██████╗  ██████╗ ██╗
    \x1b[92m██╔════╝ ██╔══██╗██╔══██╗██╔══██╗██╔════╝ ██╔═══██╗██╔═══██╗██║
    \x1b[93m██║  ███╗███████║██████╔╝███████║██║  ███╗██║   ██║██║   ██║██║
    \x1b[94m██║   ██║██╔══██║██╔══██╗██╔══██║██║   ██║██║   ██║██║   ██║██║
    \x1b[95m╚██████╔╝██║  ██║██████╔╝██║  ██║╚██████╔╝╚██████╔╝╚██████╔╝███████╗
    \x1b[96m ╚═════╝ ╚═╝  ╚═╝╚═════╝ ╚═╝  ╚═╝ ╚═════╝  ╚═════╝  ╚═════╝ ╚══════╝
    \x1b[0m`);
}

function logError(...message) {
    console.error('\x1b[31m[Error]\x1b[0m', ...message);
}

function logWarning(...message) {
    console.error('\x1b[33m[Warning]\x1b[0m', ...message);
}

function logInfo(...message) {
    console.error('\x1b[32m[Info]\x1b[0m', ...message);
}

module.exports = {
    printLogo,
    logError,
    logWarning,
    logInfo,
};
