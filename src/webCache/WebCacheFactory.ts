import RemoteWebCache from './RemoteWebCache.ts';
import LocalWebCache from './LocalWebCache.ts';
import { WebCache } from './WebCache.ts';

export const createWebCache = (type: string, options: any) => {
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

export default { createWebCache };