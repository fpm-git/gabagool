
const cd = process.cwd();
// const args = process.argv.slice(2);
const vanity = require('./lib/vanity');

vanity.printLogo();
const startTime = Date.now();

// for now, this will be our ownly command, so run it...
require('./commands/process_project')(cd).then(_res => {
    const elapsedTime = Date.now() - startTime;
    const elapsedSeconds = Math.round(elapsedTime / 10) / 100;
    vanity.logInfo(`finished after ${elapsedSeconds}s`);
    console.log('');    // <-- good manners
});
