import path from 'node:path';
import process from 'node:process';
import { Client, LocalAuth } from '../index.js';

import * as dotenv from "@std/dotenv";
const env = await dotenv.load();

export const remoteId = env['WWEBJS_TEST_REMOTE_ID'] || "";
if(!remoteId) throw new Error('The WWEBJS_TEST_REMOTE_ID environment variable has not been set.');

export function isUsingLegacySession() {
    return Boolean(env['WWEBJS_TEST_SESSION'] || env['WWEBJS_TEST_SESSION_PATH']);
}

export function isMD() {
    return Boolean(env['WWEBJS_TEST_MD']);
}

if(isUsingLegacySession() && isMD()) throw 'Cannot use legacy sessions with WWEBJS_TEST_MD=true';

export async function getSessionFromEnv() {
    if (!isUsingLegacySession()) return null;

    const envSession = env['WWEBJS_TEST_SESSION'];
    if(envSession) return JSON.parse(envSession);

    const envSessionPath = env['WWEBJS_TEST_SESSION_PATH'];
    if(envSessionPath) {
        const absPath = path.resolve(process.cwd(), envSessionPath);
        return (await import(absPath)).default;
    }
}

export function createClient({authenticated, options: additionalOpts} = {authenticated: false, options: {}} as {authenticated?: boolean, options?: any}): Promise<Client> {
    const options: any = {};

    if(authenticated) {
        const clientId = env['WWEBJS_TEST_CLIENT_ID'];
        if(!clientId) throw new Error('No session found in environment.');
        options.authStrategy = new LocalAuth({
            clientId
        });
    }

    const allOpts = {...options, ...(additionalOpts || {})};
    const client = new Client(allOpts);
    return Promise.resolve(client);
}

export function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// export default { sleep, createClient, isUsingLegacySession, isMD, remoteId };
