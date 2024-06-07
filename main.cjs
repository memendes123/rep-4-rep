const parseArgs = require('minimist');
require('dotenv').config();
const steamBot = require('./src/steamBot.cjs'); // Ensure correct import based on your project structure
const db = require('./src/db.cjs'); // Ensure correct import based on your project structure
const api = require('./src/api.cjs'); // Ensure correct import based on your project structure
const { log, showAllProfiles, addProfileSetup, authAllProfiles, removeProfile, autoRun, addProfilesFromFile, addProfilesAndRun, checkAndSyncProfiles, checkCommentAvailability } = require('./src/util.cjs');

(async () => {
    await db.init();

    var argv = parseArgs(process.argv.slice(2));

    // autoRun:
    //  --run

    // list profiles:
    //  --profiles

    // auth profiles:
    // --auth-profiles

    // add profile:
    //  --add-profile username:password:shared_code

    // remove profile:
    //  --remove-profile username

    // add profiles from file:
    //  --add-profiles-from-file

    // add profiles from file and run:
    //  --add-profiles-and-run

    // check and sync profiles:
    //  --check-and-sync-profiles

    // check comment availability:
    // --check-comment-availability

    if (argv['run']) {
        await autoRun();
    }

    if (argv['profiles']) {
        await showAllProfiles();
    }

    if (argv['auth-profiles']) {
        await authAllProfiles();
    }

    if (argv['add-profile']) {
        let profile = argv['add-profile'].split(':');
        await addProfileSetup(profile[0], profile[1], profile[2]);
    }

    if (argv['remove-profile']) {
        await removeProfile(argv['remove-profile']);
    }

    if (argv['add-profiles-from-file']) {
        await addProfilesFromFile();
    }

    if (argv['add-profiles-and-run']) {
        await addProfilesAndRun();
    }

    if (argv['check-and-sync-profiles']) {
        await checkAndSyncProfiles();
    }

    if (argv['check-comment-availability']) {
        await checkCommentAvailability();
    }

    process.exit();
})();
