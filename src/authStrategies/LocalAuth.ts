import path from 'node:path';
import fs from 'node:fs/promises';
import BaseAuthStrategy from './BaseAuthStrategy.ts';

/**
 * Local directory-based authentication
 * @param {object} options - options
 * @param {string} options.clientId - Client id to distinguish instances if you are using multiple, otherwise keep null if you are using only one instance
 * @param {string} options.dataPath - Change the default path for saving session files, default is: "./.wwebjs_auth/" 
 * @param {number} options.rmMaxRetries - Sets the maximum number of retries for removing the session directory
*/
class LocalAuth extends BaseAuthStrategy {
    public clientId?: string;
    public dataPath?: string;
    public rmMaxRetries?: number;
    public userDataDir?: string;

    constructor({ clientId, dataPath, rmMaxRetries }: {
        clientId?: string,
        dataPath?: string,
        rmMaxRetries?: number
    }={}) {
        super();

        const idRegex = /^[-_\w]+$/i;
        if(clientId && !idRegex.test(clientId)) {
            throw new Error('Invalid clientId. Only alphanumeric characters, underscores and hyphens are allowed.');
        }

        this.dataPath = path.resolve(dataPath || './.wwebjs_auth/');
        this.clientId = clientId;
        this.rmMaxRetries = rmMaxRetries ?? 4;
    }

    override async beforeBrowserInitialized() {
        const puppeteerOpts = this.client.options.puppeteer;
        const sessionDirName = this.clientId ? `session-${this.clientId}` : 'session';
        const dirPath = path.join(this.dataPath, sessionDirName);

        if(puppeteerOpts.userDataDir && puppeteerOpts.userDataDir !== dirPath) {
            throw new Error('LocalAuth is not compatible with a user-supplied userDataDir.');
        }

        await fs.mkdir(dirPath, { recursive: true });
        
        this.client.options.puppeteer = {
            ...puppeteerOpts,
            userDataDir: dirPath
        };

        this.userDataDir = dirPath;
    }

    override async logout() {
        if (this.userDataDir) {
            await fs.rm(this.userDataDir, { recursive: true, force: true, maxRetries: this.rmMaxRetries })
                .catch((e) => {
                    throw new Error(e);
                });
        }
    }

}

export default LocalAuth;
