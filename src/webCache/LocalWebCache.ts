import path from 'node:path';
import fs from 'node:fs';

import { WebCache, VersionResolveError } from './WebCache.js';

/**
 * LocalWebCache - Fetches a WhatsApp Web version from a local file store
 * @param {object} options - options
 * @param {string} options.path - Path to the directory where cached versions are saved, default is: "./.wwebjs_cache/" 
 * @param {boolean} options.strict - If true, will throw an error if the requested version can't be fetched. If false, will resolve to the latest version.
 */
class LocalWebCache extends WebCache {
    path: string;
    strict: boolean;
    
    constructor(options: { path?: string, strict?: boolean } = {}) {
        super();

        this.path = options.path || './.wwebjs_cache/';
        this.strict = options.strict || false;
    }

    async resolve(version: string): Promise<string | null> {
        const filePath = path.join(this.path, `${version}.html`);
        
        try {
            const data = await fs.promises.readFile(filePath, 'utf-8');
            return data;
        }
        catch (err) {
            if (this.strict) throw new VersionResolveError(`Couldn't load version ${version} from the cache`);
            return null;
        }
    }

    async persist(indexHtml: string, version: string): Promise<void> {
        // version = (version+'').replace(/[^0-9.]/g,'');
        const filePath = path.join(this.path, `${version}.html`);
        await fs.promises.mkdir(this.path, { recursive: true });
        await fs.promises.writeFile(filePath, indexHtml);
    }
}

export default LocalWebCache;
