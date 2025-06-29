import type Client from "../Client.ts";

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
    onAuthenticationNeeded(): Promise<{failed: boolean, restart: boolean, failureEventPayload: any}> {
        return Promise.resolve({
            failed: false,
            restart: false,
            failureEventPayload: undefined
        });
    }
    async getAuthEventPayload() {}
    async afterAuthReady() {}
    async disconnect() {}
    async destroy() {}
    async logout() {}
}

export default BaseAuthStrategy;