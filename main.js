import parseArgs from 'minimist';
import 'dotenv/config';
import steamBot from './src/steamBot.js';
import db from './src/db.js';
import api from './src/api.js';
import { log, showAllProfiles, addProfileSetup, authAllProfiles, removeProfile, autoRun, addProfilesFromFile, addProfilesAndRun, checkCommentAvailability } from './src/util.js';

var argv = parseArgs(process.argv.slice(2));
await db.init();
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
