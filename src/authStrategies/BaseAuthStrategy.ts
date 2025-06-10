import Client from "../Client.js";

/**
 * Base class which all authentication strategies extend
 */
class BaseAuthStrategy {
    client: Client;
    
    constructor() {}
    setup(client: Client) {
        this.client = client;
    }
    async beforeBrowserInitialized() {}
    async afterBrowserInitialized() {}
    async onAuthenticationNeeded() {
        return {
            failed: false,
            restart: false,
            failureEventPayload: undefined
        };
    }
    async getAuthEventPayload() {}
    async afterAuthReady() {}
    async disconnect() {}
    async destroy() {}
    async logout() {}
}

export default BaseAuthStrategy;