import RemoteWebCache from './RemoteWebCache.js';
import LocalWebCache from './LocalWebCache.js';
import { WebCache } from './WebCache.js';

const createWebCache = (type, options) => {
    switch (type) {
    case 'remote':
        return new RemoteWebCache(options);
    case 'local':
        return new LocalWebCache(options);
    case 'none':
        return new WebCache();
    default:
        throw new Error(`Invalid WebCache type ${type}`);
    }
};

export {
    createWebCache,
};

export default { createWebCache };