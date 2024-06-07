require('dotenv').config();
let fetch;
let FormData;

(async () => {
    fetch = (await import('node-fetch')).default;
    FormData = (await import('formdata-node')).FormData;
})();

class ApiWrapper {
    constructor() {
        this.url = 'https://rep4rep.com/pub-api';
        this.token = process.env.REP4REP_KEY;
    }

    buildForm(params) {
        const form = new FormData();
        form.set('apiToken', this.token);
        for (const [key, value] of Object.entries(params)) {
            form.set(key, value);
        }
        return form;
    }

    async fetchWithJsonCheck(url, options) {
        while (!fetch || !FormData) {
            await new Promise(resolve => setTimeout(resolve, 10));
        }
        let attempts = 0;
        const maxAttempts = 3;
        const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
        
        while (attempts < maxAttempts) {
            try {
                const response = await fetch(url, options);
                const text = await response.text();
                return JSON.parse(text);
            } catch (error) {
                if (attempts < maxAttempts - 1) {
                    await delay((attempts + 1) * 1000);
                    attempts++;
                } else {
                    console.error("Failed to parse JSON response:", text);
                    throw new Error("Failed to parse JSON response");
                }
            }
        }
    }

    async addSteamProfile(steamId) {
        const response = await this.fetchWithJsonCheck(`${this.url}/user/steamprofiles/add`, {
            method: 'post',
            body: this.buildForm({ steamProfile: steamId })
        });
        return response;
    }

    async getSteamProfiles() {
        const response = await this.fetchWithJsonCheck(`${this.url}/user/steamprofiles?apiToken=${this.token}`, {
            method: 'get'
        });
        return response;
    }

    async getTasks(r4rSteamId) {
        const response = await this.fetchWithJsonCheck(`${this.url}/tasks?apiToken=${this.token}&steamProfile=${r4rSteamId}`, {
            method: 'get'
        });
        return response;
    }

    async completeTask(taskId, commentId, authorSteamProfileId) {
        const response = await this.fetchWithJsonCheck(`${this.url}/tasks/complete`, {
            method: 'post',
            body: this.buildForm({ 
                taskId: taskId,
                commentId: commentId,
                authorSteamProfileId: authorSteamProfileId
            })
        });
        return response;
    }
}

module.exports = new ApiWrapper();
