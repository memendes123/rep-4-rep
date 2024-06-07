const sqlite3 = require('sqlite3');
const { open } = require('sqlite');

class DbWrapper {
    constructor() {
        this.db = null;
    }

    async init() {
        this.db = await open({
            filename: './steamprofiles.db',
            driver: sqlite3.Database
        });

        await this.createProfilesTable();
        await this.createCommentsTable();
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

    async createCommentsTable() {
        await this.db.exec(
            `CREATE TABLE IF NOT EXISTS comments (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                steamId VARCHAR,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
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
        await this.db.run(`UPDATE steamprofile SET lastComment=DATETIME('now', 'localtime') WHERE steamId = ?`, [steamId]);
        await this.db.run(`INSERT INTO comments (steamId) VALUES (?)`, [steamId]);
    }

    async getCommentsInLast24Hours(steamId) {
        const result = await this.db.get(
            `SELECT COUNT(*) as count FROM comments WHERE steamId = ? AND timestamp >= DATETIME('now', '-24 hours')`,
            [steamId]
        );
        return result.count;
    }
}

module.exports = new DbWrapper();
