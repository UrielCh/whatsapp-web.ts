export {};

declare global {
  interface Window {
    WWebJS: any; // Replace 'any' with the actual type if available
    Store: any;
    Debug: { VERSION: string };
    AuthStore: any;
    mR: {
      findModule: any
    };
    compareWwebVersions: any;
  }
}
