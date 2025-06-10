/**
 * Default implementation of a web version cache that does nothing.
 */
class WebCache {
    async resolve(version: string): Promise<string | null> { return null; }
    async persist(indexHtml: string, version: string): Promise<void> { }
}

class VersionResolveError extends Error { }

export { WebCache, VersionResolveError };