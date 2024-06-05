import fs from 'fs';
import db from './db.js';
import api from './api.js';
import steamBot from './steamBot.js';
import { table } from 'table';
import ReadLine from 'readline';
import moment from 'moment';
import 'dotenv/config';

let rl = ReadLine.createInterface({
    input: process.stdin,
    output: process.stdout
});

const statusMessage = {
    inactive: 0,
    steamGuardRequired: 1,
    steamGuardMobileRequired: 2,
    captchaRequired: 3,
    loggedIn: 4
};

function log(message, emptyLine = false) {
    console.log(`[rep4rep-bot] ${message}`);
    if (emptyLine) {
        console.log();
    }
}

async function autoRun() {
    let profiles = await db.getAllProfiles();
    let r4rProfiles = await api.getSteamProfiles();

    for (const [i, profile] of profiles.entries()) {
        log(`Attempting to leave comments from: ${profile.username} (${profile.steamId})`);

        let hours = moment().diff(moment(profile.lastComment), 'hours');
        if (!profile.lastComment || hours >= 24) {
            let r4rSteamProfile = r4rProfiles.find(r4rProfile => r4rProfile['steamId'] == profile.steamId);
            if (!r4rSteamProfile) {
                log(`[${profile.username}] steamProfile doesn't exist on rep4rep`);
                log(`Try syncing it with --auth-profiles`, true);
                continue;
            }

            let tasks = await api.getTasks(r4rSteamProfile.id);
            if (!tasks || tasks.length === 0) {
                log(`[${profile.username}] No tasks found for the profile. Skipping...`, true);
                continue;
            }

            let client = steamBot();
            await loginWithRetries(client, profile);
            if (client.status !== 4 && !await client.isLoggedIn()) {
                log(`[${profile.username}] is logged out. reAuth needed`, true);
                continue;
            } else {
                await autoRunComments(profile, client, tasks, r4rSteamProfile.id, 10);
                if (i !== profiles.length - 1) {
                    await sleep(process.env.LOGIN_DELAY);
                }
                continue;
            }
        } else {
            log(`[${profile.username}] is not ready yet`);
            log(`[${profile.username}] try again in: ${Math.round(24 - hours)} hours`, true);
            continue;
        }
    }

    log('autoRun completed');
}

async function autoRunComments(profile, client, tasks, authorSteamProfileId, maxComments = 10) {
    let commentsPosted = 0;
    let taskIndex = 0;
    let consecutiveFailures = 0;
    const maxConsecutiveFailures = 3;
    let completedTasks = new Set();

    while (commentsPosted < maxComments && taskIndex < tasks.length && consecutiveFailures < maxConsecutiveFailures) {
        const task = tasks[taskIndex];
        if (!task || !task.requiredCommentText || !task.targetSteamProfileName) {
            log(`[${profile.username}] Invalid task data. Skipping...`, true);
            taskIndex++;
            continue;
        }

        log(`[${profile.username}] posting comment:`);
        log(`${task.requiredCommentText} > ${task.targetSteamProfileName}`, true);

        try {
            await client.postComment(task.targetSteamProfileId, task.requiredCommentText);
            await api.completeTask(task.taskId, task.requiredCommentId, authorSteamProfileId);
            await db.updateLastComment(profile.steamId);
            log(`[${profile.username}] comment posted and marked as completed`, true);
            commentsPosted++;
            completedTasks.add(task.taskId);
            consecutiveFailures = 0; // Reset failures on success
        } catch (err) {
            log(`[${profile.username}] failed to post comment: ${err.message}`, true);
            consecutiveFailures++;
        }

        await sleep(process.env.COMMENT_DELAY);
        taskIndex++;
    }

    while (commentsPosted < maxComments && consecutiveFailures < maxConsecutiveFailures) {
        log(`[${profile.username}] Attempting additional comment ${commentsPosted + 1}/${maxComments}`);
        const availableTasks = tasks.filter(t => !completedTasks.has(t.taskId));
        if (availableTasks.length === 0) {
            log(`[${profile.username}] No valid tasks available for additional comments. Skipping...`, true);
            break;
        }

        const randomTask = availableTasks[Math.floor(Math.random() * availableTasks.length)];
        if (!randomTask || !randomTask.requiredCommentText || !randomTask.targetSteamProfileId) {
            log(`[${profile.username}] Invalid random task for additional comments. Skipping...`, true);
            break;
        }

        const randomComment = randomTask.requiredCommentText;
        const targetSteamProfileId = randomTask.targetSteamProfileId;
        try {
            await client.postComment(targetSteamProfileId, randomComment);
            await api.completeTask(randomTask.taskId, randomTask.requiredCommentId, authorSteamProfileId); // Mark additional comments as completed
            commentsPosted++;
            log(`[${profile.username}] additional comment posted successfully`, true);
            consecutiveFailures = 0; // Reset failures on success
        } catch (err) {
            log(`[${profile.username}] failed to post additional comment: ${err.message}`, true);
            consecutiveFailures++;
        }
        await sleep(process.env.COMMENT_DELAY);
    }

    log(`[${profile.username}] done with posting comments`, true);
}

async function loginWithRetries(client, profile, maxRetries = 3) {
    let attempts = 0;
    while (attempts < maxRetries) {
        try {
            await client.steamLogin(profile.username, profile.password, null, profile.sharedSecret, null, JSON.parse(profile.cookies));
            if (client.status === 4 || await client.isLoggedIn()) {
                log(`[${profile.username}] login successful`);
                return;
            }
        } catch (error) {
            if (error.code === 502) {
                log(`[${profile.username}] WebAPI error 502. Retrying...`);
                await sleep(10000); // wait 10 seconds before retrying
            } else {
                throw error;
            }
        }
        attempts++;
    }
    throw new Error(`[${profile.username}] login failed after ${maxRetries} attempts.`);
}

async function sleep(millis) {
    let sec = Math.round(millis / 1000);
    log(`[ ${sec}s delay ] ...`, true);
    return new Promise(resolve => setTimeout(resolve, millis));
}

async function authAllProfiles() {
    let profiles = await db.getAllProfiles();
    for (const [i, profile] of profiles.entries()) {
        log(`Attempting to auth: ${profile.username} (${profile.steamId})`);
        let client = steamBot();
        await loginWithRetries(client, profile);
        if (client.status !== 4 && !await client.isLoggedIn()) {
            let code = await client.getSteamGuardCode(profile.sharedSecret);
            switch (client.status) {
                case 1:
                    await client.steamLogin(profile.username, profile.password, code);
                    break;
                case 2:
                    await client.steamLogin(profile.username, profile.password, null, code);
                    break;
                case 3:
                    await client.steamLogin(profile.username, profile.password, null, null, code);
                    break;
            }
        }

        log(`[${profile.username}] Authorized`);

        let res = await syncWithRep4rep(client);
        if (res === true || res === 'Steam profile already added/exists on rep4rep.') {
            log(`[${profile.username}] Synced to Rep4Rep`, true);
        } else {
            log(`[${profile.username}] Failed to sync:`);
            log(res, true);
        }

        if (i !== profiles.length - 1) {
            await sleep(process.env.LOGIN_DELAY);
        }
    }

    log(`authProfiles completed`);
}

async function syncWithRep4rep(client) {
    let steamId = await client.getSteamId();
    let steamProfiles;

    try {
        steamProfiles = await api.getSteamProfiles();
        console.log("steamProfiles:", steamProfiles); // Debugging log
    } catch (error) {
        console.error("Error fetching steamProfiles:", error);
        return `Error fetching steamProfiles: ${error.message}`;
    }

    // Ensure steamProfiles is an array
    if (!Array.isArray(steamProfiles)) {
        console.error("Error: steamProfiles is not an array");
        return "steamProfiles is not an array"; // Or handle the error appropriately
    }

    const exists = steamProfiles.some(steamProfile => steamProfile.steamId == steamId);

    if (!exists) {
        let res;
        try {
            res = await api.addSteamProfile(steamId);
        } catch (error) {
            console.error("Error adding steamProfile:", error);
            return `Error adding steamProfile: ${error.message}`;
        }
        if (res.error) {
            return res.error;
        }
    }
    return true;
}

async function showAllProfiles() {
    let profiles = await db.getAllProfiles();
    let data = [
        ['steamId', 'username', 'lastComment']
    ];
    profiles.forEach(profile => {
        data.push([profile.steamId, profile.username, profile.lastComment]);
    });

    console.log(table(data));
}

async function addProfileSetup(accountName, password, sharedSecret) {
    let client = steamBot();

    let attempts = 0;
    const maxAttempts = 5;
    let success = false;

    while (attempts < maxAttempts && !success) {
        try {
            await client.steamLogin(accountName, password, null, sharedSecret, null);

            if (client.status !== 4 && !await client.isLoggedIn()) {
                let code = await client.getSteamGuardCode(sharedSecret);
                switch (client.status) {
                    case 1:
                        await addProfileSetup(accountName, password, code);
                        return;
                    case 2:
                        await addProfileSetup(accountName, password, null, code);
                        return;
                    case 3:
                        await addProfileSetup(accountName, password, null, null, code);
                        return;
                }
            }

            let res = await syncWithRep4rep(client);
            if (res === true || res === 'Steam profile already added/exists on rep4rep.') {
                log(`[${accountName}] Synced to Rep4Rep`, true);
            } else {
                log(`[${accountName}] Failed to sync:`);
                log(res, true);
            }

            log(`[${accountName}] Profile added`);
            success = true;
        } catch (error) {
            attempts++;
            if (error.message.includes('RateLimitExceeded')) {
                log(`Rate limit exceeded for ${accountName}. Waiting before retrying...`);
                await sleep(60000); // wait 1 minute before retrying
            } else {
                log(`Error adding profile ${accountName}: ${error.message}`);
                break;
            }
        }
    }

    if (!success) {
        log(`Failed to add profile ${accountName} after ${maxAttempts} attempts.`);
    }
}

async function removeProfile(username) {
    let res = await db.removeProfile(username);
    if (res.changes == 0) {
        log('profile not found', true);
    } else {
        log('profile removed', true);
    }
    process.exit();
}

async function promptForCode(username, client) {
    switch (client.status) {
        case 1:
            log(`[${username}] steamGuard code required  (${client.emailDomain})`);
            break;
        case 2:
            log(`[${username}] steamGuardMobile code required`);
            break;
        case 3:
            log(`[${username}] captcha required`);
            log(`URL: ${client.captchaUrl}`);
            break;
        default:
            console.log('fatal?');
            console.log(client.status);
            process.exit();
    }

    let res = await new Promise(resolve => {
        rl.question('>> ', resolve);
    });
    return res;
}

async function addProfilesFromFile() {
    const accounts = fs.readFileSync('accounts.txt', 'utf-8').split('\n').filter(Boolean);
    let accountCount = accounts.length;
    log(`Starting to add ${accountCount} profiles from file.`);

    for (const [index, account] of accounts.entries()) {
        const [username, password, sharedSecret] = account.split(':');
        log(`Adding profile ${index + 1} of ${accountCount}: ${username}`);

        try {
            await addProfileSetup(username, password, sharedSecret);
            log(`Profile ${username} added successfully.`);
        } catch (error) {
            log(`Error adding profile ${username}: ${error.message}`);
        }

        if (index !== accounts.length - 1) {
            await sleep(60000); // Add delay to avoid throttling
        }
    }
    log('All profiles from file added');
}

async function addProfilesAndRun() {
    const accounts = fs.readFileSync('accounts.txt', 'utf-8').split('\n').filter(Boolean);
    let accountCount = accounts.length;
    log(`Starting to add and run ${accountCount} profiles from file.`);

    for (const [index, account] of accounts.entries()) {
        const [username, password, sharedSecret] = account.split(':');
        log(`Adding and running profile ${index + 1} of ${accountCount}: ${username}`);

        try {
            await addProfileSetup(username, password, sharedSecret);
            await autoRun();
            log(`Profile ${username} added and run successfully.`);
        } catch (error) {
            log(`Error adding and running profile ${username}: ${error.message}`);
        }

        if (index !== accounts.length - 1) {
            await sleep(60000); // Add delay to avoid throttling
        }
    }
    log('All profiles from file added and run completed');
}

async function checkAndSyncProfiles() {
    let profiles = await db.getAllProfiles();
    for (const profile of profiles) {
        let client = steamBot();
        await loginWithRetries(client, profile);
        if (client.status !== 4 && !await client.isLoggedIn()) {
            let code = await client.getSteamGuardCode(profile.sharedSecret);
            switch (client.status) {
                case 1:
                    await client.steamLogin(profile.username, profile.password, code);
                    break;
                case 2:
                    await client.steamLogin(profile.username, profile.password, null, code);
                    break;
                case 3:
                    await client.steamLogin(profile.username, profile.password, null, null, code);
                    break;
            }
        }

        let res = await syncWithRep4rep(client);
        if (res === true || res === 'Steam profile already added/exists on rep4rep.') {
            log(`[${profile.username}] Synced to Rep4Rep`, true);
        } else {
            log(`[${profile.username}] Failed to sync:`);
            log(res, true);
        }
    }
    log('Check and sync completed');
}

async function checkCommentAvailability() {
    let profiles = await db.getAllProfiles();
    let r4rProfiles = await api.getSteamProfiles();
    const maxCommentsPerDay = 10; // Defina o limite diário de comentários aqui

    for (const profile of profiles) {
        let r4rSteamProfile = r4rProfiles.find(r4rProfile => r4rProfile['steamId'] == profile.steamId);
        if (!r4rSteamProfile) {
            log(`[${profile.username}] steamProfile não existe no rep4rep`);
            continue;
        }

        let hoursSinceLastComment = moment().diff(moment(profile.lastComment), 'hours');
        let commentsRemaining = (hoursSinceLastComment >= 24) ? maxCommentsPerDay : Math.max(0, maxCommentsPerDay - Math.floor(hoursSinceLastComment / 24 * maxCommentsPerDay));

        log(`[${profile.username}] pode fazer mais ${commentsRemaining} comentários nas próximas 24 horas.`);
    }

    log('Verificação de disponibilidade de comentários concluída');
}

export { log, statusMessage, showAllProfiles, addProfileSetup, authAllProfiles, removeProfile, autoRun, addProfilesFromFile, addProfilesAndRun, checkAndSyncProfiles, checkCommentAvailability };
