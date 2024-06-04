async createProfilesTable() {
    await this.db.exec(
        `CREATE TABLE IF NOT EXISTS steamprofile (
            id integer PRIMARY KEY AUTOINCREMENT,
            username varchar,
            password varchar,
            steamId varchar UNIQUE,
            cookies text,
            lastComment datetime
        )`
    )
}

async addOrUpdateProfile(username, password, steamId, cookies) {
    const result = await this.db.run('INSERT OR REPLACE INTO steamprofile (username, password, steamId, cookies) VALUES (?, ?, ?, ?)', [
        username,
        password,
        steamId,
        JSON.stringify(cookies)
    ])
    return result
}

async updateCookies(steamId, cookies) {
    const result = await this.db.run('UPDATE steamprofile SET cookies = ? WHERE steamId = ?', [
        JSON.stringify(cookies),
        steamId
    ])
    return result
}

async getProfileBySteamId(steamId) {
    const result = await this.db.get('SELECT * FROM steamprofile WHERE steamId = ?', [steamId])
    return result
}
