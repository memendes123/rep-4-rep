import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

class dbWrapper {
    constructor() {
        this.db = null;
    }

    async init() {
        this.db = await open({
            filename: './steamprofiles.db',
            driver: sqlite3.Database
        });

        await this.createProfilesTable();
    }

    async createProfilesTable() {
        await this.db.exec(
            `CREATE TABLE IF NOT EXISTS steamprofile (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username VARCHAR,
                password VARCHAR,
                steamId VARCHAR UNIQUE,
                cookies TEXT,
                lastComment DATETIME
            )`
        );
    }

    async addOrUpdateProfile(username, password, steamId, cookies) {
        const result = await this.db.run(
            `INSERT INTO steamprofile (username, password, steamId, cookies) 
            VALUES (?, ?, ?, ?)
            ON CONFLICT(steamId) DO UPDATE SET
            username=excluded.username,
            password=excluded.password,
            cookies=excluded.cookies`,
            [username, password, steamId, JSON.stringify(cookies)]
        );
        return result;
    }

    async removeProfile(username) {
        const result = await this.db.run('DELETE FROM steamprofile WHERE username = ?', [username]);
        return result;
    }

    async getAllProfiles() {
        const result = await this.db.all('SELECT * FROM steamprofile');
        return result;
    }

    async updateLastComment(steamId) {
        const result = await this.db.run(`UPDATE steamprofile SET lastComment=DATETIME('now', 'localtime') WHERE steamId = ?`, [steamId]);
        return result;
    }
}

const instance = new dbWrapper();
export { instance as default };
