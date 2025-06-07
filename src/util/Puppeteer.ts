import { Page } from "puppeteer";

/**
 * Expose a function to the page if it does not exist
 *
 * NOTE:
 * Rewrite it to 'upsertFunction' after updating Puppeteer to 20.6 or higher
 * using page.removeExposedFunction
 * https://pptr.dev/api/puppeteer.page.removeExposedFunction
 *
 * @param {import(puppeteer).Page} page
 * @param {string} name
 * @param {Function} fn
 */
export async function exposeFunctionIfAbsent(page: Page, name: string, fn: Function) {
    const exist = await page.evaluate((name) => {
        return !!window[name];
    }, name);
    if (exist) {
        return;
    }
    await page.exposeFunction(name, fn);
}

