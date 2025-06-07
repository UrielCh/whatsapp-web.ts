/**
 * Default implementation of a web version cache that does nothing.
 */
export class WebCache {
    resolve(_version: string):Promise<string | null> { return Promise.resolve(null); }
    persist(_indexHtml: string, _version: string): Promise<void> { return Promise.resolve(); }
}

export class VersionResolveError extends Error { }

//export default {
//    WebCache,
//    VersionResolveError
//};