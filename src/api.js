import 'dotenv/config'
import fetch from 'node-fetch'
import { FormData, File, Blob } from 'formdata-node'

class apiWrapper {
    url;
    token;

    constructor() {
        this.url = 'https://rep4rep.com/pub-api'
        this.token = process.env.REP4REP_KEY
    }

    buildForm(params) {
        let form = new FormData()
        form.set('apiToken', this.token)
        for (const [k, v] of Object.entries(params)) {
            form.set(k, v)
        }
        return form
    }

    async fetchWithJsonCheck(url, options) {
        const response = await fetch(url, options);
        const text = await response.text();
        try {
            return JSON.parse(text);
        } catch (error) {
            console.error("Failed to parse JSON response:", text);
            throw new Error("Failed to parse JSON response");
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

const instance = new apiWrapper()
export { instance as default }
