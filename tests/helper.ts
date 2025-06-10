import path from 'node:path';
import process from 'node:process';
import { Client, LocalAuth } from '../index.js';

import('dotenv').then(dotenv => dotenv.config());

export const remoteId = process.env['WWEBJS_TEST_REMOTE_ID'];
if(!remoteId) throw new Error('The WWEBJS_TEST_REMOTE_ID environment variable has not been set.');

export function isUsingLegacySession() {
    return Boolean(process.env['WWEBJS_TEST_SESSION'] || process.env['WWEBJS_TEST_SESSION_PATH']);
}

export function isMD() {
    return Boolean(process.env['WWEBJS_TEST_MD']);
}

if(isUsingLegacySession() && isMD()) throw 'Cannot use legacy sessions with WWEBJS_TEST_MD=true';

export async function getSessionFromEnv() {
    if (!isUsingLegacySession()) return null;

    const envSession = process.env['WWEBJS_TEST_SESSION'];
    if(envSession) return JSON.parse(envSession);

    const envSessionPath = process.env['WWEBJS_TEST_SESSION_PATH'];
    if(envSessionPath) {
        const absPath = path.resolve(process.cwd(), envSessionPath);
        return (await import(absPath)).default;
    }
}

export async function createClient({authenticated, options: additionalOpts} = {authenticated: false, options: {}} as {authenticated?: boolean, options?: any}): Promise<Client> {
    const options: any = {};

    if(authenticated) {
        const clientId = process.env['WWEBJS_TEST_CLIENT_ID'];
        if(!clientId) throw new Error('No session found in environment.');
        options.authStrategy = new LocalAuth({
            clientId
        });
    }

    const allOpts = {...options, ...(additionalOpts || {})};
    return new Client(allOpts);
}

export function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// export default { sleep, createClient, isUsingLegacySession, isMD, remoteId };
