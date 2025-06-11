


export const polyfill__name = `function __name(fn, name) { try { Object.defineProperty(fn, 'name', { value: name, configurable: true }); } catch (e) { } return fn; }`;
// const _hideModuleRaid = `{
// const originalError = Error;
// window.originalError = originalError;
// Error = (message) => {
//     const error = new originalError(message);
//     const originalStack = error.stack;
//     if (error.stack.includes('moduleRaid')) error.stack = originalStack + '\n    at https://web.whatsapp.com/vendors~lazy_loaded_low_priority_components.05e98054dbd60f980427.js:2:44';
//     return error;
// }`;
// 
// export const hideModuleRaid = `(${_hideModuleRaid})();`;

export const hideModuleRaid = () => {
    const originalError = Error;
    // deno-lint-ignore no-window
    window.originalError = originalError;
    // @ts-ignore 
    Error = function (message: string) {
        const error = new originalError(message);
        const originalStack = error.stack;
        if (error.stack.includes('moduleRaid')) error.stack = originalStack + '\n    at https://web.whatsapp.com/vendors~lazy_loaded_low_priority_components.05e98054dbd60f980427.js:2:44';
        return error;
    };
}
// Error must be overwrite with an Array function