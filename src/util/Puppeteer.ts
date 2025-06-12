import type { Page } from 'puppeteer';

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
async function exposeFunctionIfAbsent(page: Page, name: string, fn: Function): Promise<void> {
    // const exist = await page.evaluate((name: string) => { return !!window[name]; }, name);
    const exist = await page.evaluate((name: string) => !!window[name], name);
    if (exist) return;
    await page.exposeFunction(name, fn);
    //const check2 = await page.evaluate((name: string) => !!window[name], name);
    //if (check2)
    //    console.log("✅ exposeFunctionIfAbsent is now exposed: ", name);
    //else
    //    console.log("❌ exposeFunctionIfAbsent failed to expose: ", name);
}

export {exposeFunctionIfAbsent};
