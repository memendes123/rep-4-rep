import SteamCommunity from 'steamcommunity';
import steamTotp from 'steam-totp';
import db from './db.js';

export default (config) => {
    const client = {
        status: 0,
        captchaUrl: null,
        emailDomain: null,
    };

    const community = new SteamCommunity();

    client.isLoggedIn = async () => {
        return new Promise((resolve, reject) => {
            community.loggedIn((err, loggedIn, familyView) => {
                if (err) return reject(err);
                resolve(loggedIn);
            });
        });
    };

    client.getSteamId = async () => {
        return community.steamID ? community.steamID.getSteamID64() : null;
    };

    client.postComment = async (steamId, commentText) => {
        return new Promise((resolve, reject) => {
            community.postUserComment(steamId, commentText, (err) => {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        });
    };

    client.steamLogin = async (accountName, password, authCode, sharedSecret, captcha, cookies) => {
        if (cookies) {
            community.setCookies(cookies);
        }

        return new Promise((resolve, reject) => {
            community.login({
                accountName: accountName,
                password: password,
                authCode: authCode,
                twoFactorCode: sharedSecret ? steamTotp.generateAuthCode(sharedSecret) : null,
                captcha: captcha
            }, async (err, sessionID, cookies, steamguard) => {
                if (err) {
                    switch (err.message) {
                        case 'SteamGuard':
                            client.status = 1;
                            client.emailDomain = err.emaildomain;
                            resolve();
                            break;
                        case 'SteamGuardMobile':
                            client.status = 2;
                            resolve();
                            break;
                        case 'CAPTCHA':
                            client.status = 3;
                            client.captchaUrl = err.captchaurl;
                            resolve();
                            break;
                        case 'AccountLoginDeniedThrottle':
                            client.status = 5;  // Define a new status for throttling
                            console.log('Login attempts throttled. Please try again later.');
                            resolve();
                            break;
                        default:
                            console.log(err);
                            reject(err);
                    }
                } else {
                    console.log('Login successful');
                    console.log('Cookies:', cookies);

                    // Save cookies after successful login
                    await db.addOrUpdateProfile(accountName, password, community.steamID ? community.steamID.getSteamID64() : null, cookies);

                    community.getSteamUser(community.steamID || '', (err, user) => {
                        if (err || !user) {
                            console.log('Error fetching SteamID:', err || 'User not found');
                            reject(new Error('SteamID not found'));
                        } else {
                            community.steamID = user.steamID;
                            console.log('SteamID:', community.steamID);
                            client.status = 4;
                            resolve();
                        }
                    });
                }
            });
        });
    };

    client.getSteamGuardCode = async (sharedSecret) => {
        return steamTotp.generateAuthCode(sharedSecret);
    };

    return client;
};
