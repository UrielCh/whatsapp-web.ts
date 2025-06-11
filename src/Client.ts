import process from 'node:process';
import EventEmitter from 'node:events';
import puppeteer, { type EvaluateFunc, ProtocolError } from 'puppeteer';
import { ModuleRaid } from './util/moduleraid.ts';

import Util from './util/Util.ts';
import InterfaceController from './util/InterfaceController.ts';
import { WhatsWebURL, DefaultOptions, Events, WAState, type MessageAck } from './util/Constants.ts';
import { ExposeAuthStore } from './util/Injected/AuthStore/AuthStore.ts';
import { ExposeStore } from './util/Injected/Store.ts';
import { ExposeLegacyAuthStore } from './util/Injected/AuthStore/LegacyAuthStore.ts';
import { ExposeLegacyStore } from './util/Injected/LegacyStore.ts';
import { LoadUtils } from './util/Injected/Utils.ts';
import ChatFactory from './factories/ChatFactory.ts';
import ContactFactory from './factories/ContactFactory.ts';
import WebCacheFactory from './webCache/WebCacheFactory.ts';
import { Broadcast, Buttons, Call, type Channel, type Chat, ClientInfo, Contact, GroupNotification, Label, List, Location, Message, MessageMedia, Poll, PollVote, Reaction } from './structures/index.ts';
import NoAuth from './authStrategies/NoAuth.ts';
import { exposeFunctionIfAbsent } from './util/Puppeteer.ts';
import type { ClientSession, MessageContent, ClientOptions } from './types.ts';
import type { AuthStrategy } from './types.ts';
import type { MessageSendOptions } from './types.ts';
import type { ChatId } from './structures/Chat.ts';
import type { GroupMembershipRequest, MembershipRequestActionOptions, MembershipRequestActionResult } from './structures/GroupChat.ts';
import type { InviteV4Data } from './structures/Message.ts';
import type { ContactId } from './structures/Contact.ts';
import type { TransferChannelOwnershipOptions } from './structures/Channel.ts';
import type { BatteryInfo } from './structures/ClientInfo.ts';
import { hideModuleRaid } from './payloads.ts';
import fs from 'node:fs/promises';
import { CallData } from "./structures/Call.ts";

const useLog = process.env.USE_LOG === "true";

class Logger {
    filename: string;
    lines: number;

    constructor(filename: string) {
        this.filename = filename;
        this.lines = 0;
    }

    async log(message: string): Promise<void> {
        if (!useLog)
            return;
        if (this.lines === 0)
            await fs.appendFile(this.filename, "---------------- START SESSION ----------------\n");
        await fs.appendFile(this.filename, '\n' + message + '\n');
        this.lines++;
    }
}

const logger = new Logger("./log.txt");

/** An object that handles the result for createGroup method */
export interface CreateChannelResult {
    /** A channel title */
    title: string,
    /** An object that handles the newly created channel ID */
    nid: ChatId,
    /** The channel invite link, starts with 'https://whatsapp.com/channel/' */
    inviteLink: string,
    /** The timestamp the channel was created at */
    createdAtTs: number
}


/** An object that handles options for channel creation */
export interface CreateChannelOptions {
    /** The channel description */
    description?: string,
    /** The channel profile picture */
    picture?: MessageMedia
}

/** Options for unsubscribe from a channel */
export interface UnsubscribeOptions {
    /**
     * If true, after an unsubscription, it will completely remove a channel from the channel collection
     * making it seem like the current user have never interacted with it.
     * Otherwise it will only remove a channel from the list of channels the current user is subscribed to
     * and will set the membership type for that channel to GUEST
     */
    deleteLocalModels?: boolean;

    eventSurface?: number;
}

/** Options for searching for channels */
export interface SearchChannelsOptions {
    searchText?: string;
    countryCodes?: string[];
    categories?: string[];
    skipSubscribedNewsletters?: boolean;
    view?: number;
    limit?: number;
    cursorToken?: string;
}

/** An object that handles options for group creation */
export interface CreateGroupOptions {
    /**
     * The number of seconds for the messages to disappear in the group,
     * won't take an effect if the group is been creating with myself only
     * @default 0
     */
    messageTimer?: number
    /**
     * The ID of a parent community group to link the newly created group with,
     * won't take an effect if the group is been creating with myself only
     */
    parentGroupId?: string
    /** If true, the inviteV4 will be sent to those participants
     * who have restricted others from being automatically added to groups,
     * otherwise the inviteV4 won't be sent
     * @default true
     */
    autoSendInviteV4?: boolean,
    /**
     * The comment to be added to an inviteV4 (empty string by default)
     * @default ''
     */
    comment?: string
}


/** An object that handles the result for createGroup method */
export interface CreateGroupResult {
    /** A group title */
    title: string;
    /** An object that handles the newly created group ID */
    gid: ChatId;
    /** An object that handles the result value for each added to the group participant */
    participants: {
        [participantId: string]: {
            statusCode: number,
            message: string,
            isGroupCreator: boolean,
            isInviteV4Sent: boolean
        };
    };
}



interface ClientEventsInterface {
    /** Generic event */
    on(event: string, listener: (...args: any) => void): this

    /** Emitted when there has been an error while trying to restore an existing session */
    on(event: 'auth_failure', listener: (message: string) => void): this
    
    /** Emitted when authentication is successful */
    on(event: 'authenticated', listener: (
        /** 
         * Object containing session information, when using LegacySessionAuth. Can be used to restore the session
         */
        session?: ClientSession
    ) => void): this
    
    /** 
     * Emitted when the battery percentage for the attached device changes
     * @deprecated 
     */
    on(event: 'change_battery', listener: (batteryInfo: BatteryInfo) => void): this
    
    /** Emitted when the connection state changes */
    on(event: 'change_state', listener: (
        /** the new connection state */
        state: typeof WAState[keyof typeof WAState]
    ) => void): this
    
    /** Emitted when the client has been disconnected */
    on(event: 'disconnected', listener: (
        /** reason that caused the disconnect */
        reason: typeof WAState[keyof typeof WAState] | "LOGOUT"
    ) => void): this
    
    /** Emitted when a user joins the chat via invite link or is added by an admin */
    on(event: 'group_join', listener: (
        /** GroupNotification with more information about the action */
        notification: GroupNotification
    ) => void): this
    
    /** Emitted when a user leaves the chat or is removed by an admin */
    on(event: 'group_leave', listener: (
        /** GroupNotification with more information about the action */
        notification: GroupNotification
    ) => void): this
    
    /** Emitted when a current user is promoted to an admin or demoted to a regular user */
    on(event: 'group_admin_changed', listener: (
        /** GroupNotification with more information about the action */
        notification: GroupNotification
    ) => void): this
    
    /**
     * Emitted when some user requested to join the group
     * that has the membership approval mode turned on
     */
    on(event: 'group_membership_request', listener: (
        /** GroupNotification with more information about the action */
        notification: GroupNotification
    ) => void): this
    
    /** Emitted when group settings are updated, such as subject, description or picture */
    on(event: 'group_update', listener: (
        /** GroupNotification with more information about the action */
        notification: GroupNotification
    ) => void): this
    
    /** Emitted when a contact or a group participant changed their phone number. */
    on(event: 'contact_changed', listener: (
        /** Message with more information about the event. */
        message: Message,
        /** Old user's id. */
        oldId : String,
        /** New user's id. */
        newId : String,
        /** Indicates if a contact or a group participant changed their phone number. */
        isContact : Boolean
    ) => void): this
    
    /** Emitted when media has been uploaded for a message sent by the client */
    on(event: 'media_uploaded', listener: (
        /** The message with media that was uploaded */
        message: Message
    ) => void): this
    
    /** Emitted when a new message is received */
    on(event: 'message', listener: (
        /** The message that was received */
        message: Message
    ) => void): this
    
    /** Emitted when an ack event occurrs on message type */
    on(event: 'message_ack', listener: (
        /** The message that was affected */
        message: Message,
        /** The new ACK value */
        ack: typeof MessageAck[keyof typeof MessageAck]
    ) => void): this
            
    /** Emitted when an ack event occurrs on message type */
    on(event: 'message_edit', listener: (
        /** The message that was affected */
        message: Message,
        /** New text message */
        newBody: String,
        /** Prev text message */
        prevBody: String
    ) => void): this
            
    /** Emitted when a chat unread count changes */
    on(event: 'unread_count', listener: (
        /** The chat that was affected */
        chat: Chat
    ) => void): this
    
    /** Emitted when a new message is created, which may include the current user's own messages */
    on(event: 'message_create', listener: (
        /** The message that was created */
        message: Message
    ) => void): this
            
    /** Emitted when a new message ciphertext is received  */
    on(event: 'message_ciphertext', listener: (
        /** The message that was ciphertext */
        message: Message
    ) => void): this
    
    /** Emitted when a message is deleted for everyone in the chat */
    on(event: 'message_revoke_everyone', listener: (
        /** The message that was revoked, in its current state. It will not contain the original message's data */
        message: Message,
        /**The message that was revoked, before it was revoked. 
         * It will contain the message's original data. 
         * Note that due to the way this data is captured, 
         * it may be possible that this param will be undefined. */
        revoked_msg?: Message | null
    ) => void): this
    
    /** Emitted when a message is deleted by the current user */
    on(event: 'message_revoke_me', listener: (
        /** The message that was revoked */
        message: Message
    ) => void): this
    
    /** Emitted when a reaction is sent, received, updated or removed */
    on(event: 'message_reaction', listener: (
        /** The reaction object */
        reaction: Reaction
    ) => void): this
    
    /** Emitted when a chat is removed */
    on(event: 'chat_removed', listener: (
        /** The chat that was removed */
        chat: Chat
    ) => void): this
    
    /** Emitted when a chat is archived/unarchived */
    on(event: 'chat_archived', listener: (
        /** The chat that was archived/unarchived */
        chat: Chat,
        /** State the chat is currently in */
        currState: boolean,
        /** State the chat was previously in */
        prevState: boolean
    ) => void): this
    
    /** Emitted when loading screen is appearing */
    on(event: 'loading_screen', listener: (percent: number, message: "WhatsApp") => void): this
    
    /** Emitted when the QR code is received */
    on(event: 'qr', listener: (
        /** qr code string
         *  @example ```1@9Q8tWf6bnezr8uVGwVCluyRuBOJ3tIglimzI5dHB0vQW2m4DQ0GMlCGf,f1/vGcW4Z3vBa1eDNl3tOjWqLL5DpYTI84DMVkYnQE8=,ZL7YnK2qdPN8vKo2ESxhOQ==``` */
        qr: string
    ) => void): this
    
    /** Emitted when a call is received */
    on(event: 'call', listener: (
        /** The call that started */
        call: Call
    ) => void): this
    
    /** Emitted when the client has initialized and is ready to receive messages */
    on(event: 'ready', listener: () => void): this
    
    /** Emitted when the RemoteAuth session is saved successfully on the external Database */
    on(event: 'remote_session_saved', listener: () => void): this
    
    /**
     * Emitted when some poll option is selected or deselected,
     * shows a user's current selected option(s) on the poll
     */
    on(event: 'vote_update', listener: (
        vote: PollVote
    ) => void): this    
}


/**
 * Starting point for interacting with the WhatsApp Web API
 * @extends {EventEmitter}
 * @param {object} options - Client options
 * @param {AuthStrategy} options.authStrategy - Determines how to save and restore sessions. Will use LegacySessionAuth if options.session is set. Otherwise, NoAuth will be used.
 * @param {string} options.webVersion - The version of WhatsApp Web to use. Use options.webVersionCache to configure how the version is retrieved.
 * @param {object} options.webVersionCache - Determines how to retrieve the WhatsApp Web version. Defaults to a local cache (LocalWebCache) that falls back to latest if the requested version is not found.
 * @param {number} options.authTimeoutMs - Timeout for authentication selector in puppeteer
 * @param {object} options.puppeteer - Puppeteer launch options. View docs here: https://github.com/puppeteer/puppeteer/
 * @param {number} options.qrMaxRetries - How many times should the qrcode be refreshed before giving up
 * @param {string} options.restartOnAuthFail - @deprecated This option should be set directly on the LegacySessionAuth.
 * @param {object} options.session - @deprecated Only here for backwards-compatibility. You should move to using LocalAuth, or set the authStrategy to LegacySessionAuth explicitly. 
 * @param {number} options.takeoverOnConflict - If another whatsapp web session is detected (another browser), take over the session in the current browser
 * @param {number} options.takeoverTimeoutMs - How much time to wait before taking over the session
 * @param {string} options.userAgent - User agent to use in puppeteer
 * @param {string} options.ffmpegPath - Ffmpeg path to use when formatting videos to webp while sending stickers 
 * @param {boolean} options.bypassCSP - Sets bypassing of page's Content-Security-Policy.
 * @param {object} options.proxyAuthentication - Proxy Authentication object.
 * 
 * @fires Client#qr
 * @fires Client#authenticated
 * @fires Client#auth_failure
 * @fires Client#ready
 * @fires Client#message
 * @fires Client#message_ack
 * @fires Client#message_create
 * @fires Client#message_revoke_me
 * @fires Client#message_revoke_everyone
 * @fires Client#message_ciphertext
 * @fires Client#message_edit
 * @fires Client#media_uploaded
 * @fires Client#group_join
 * @fires Client#group_leave
 * @fires Client#group_update
 * @fires Client#disconnected
 * @fires Client#change_state
 * @fires Client#contact_changed
 * @fires Client#group_admin_changed
 * @fires Client#group_membership_request
 * @fires Client#vote_update
 */
class Client extends EventEmitter implements ClientEventsInterface {
    options: ClientOptions;
    authStrategy: AuthStrategy;
    /** Puppeteer browser running WhatsApp Web */
    pupBrowser: puppeteer.Browser;
    /** Puppeteer page running WhatsApp Web */
    pupPage: puppeteer.Page;
    currentIndexHtml: string | null;
    lastLoggedOut: boolean;
    /** Current connection information */
    public info: ClientInfo
    /** Client interactivity interface */
    interface?: InterfaceController;

    constructor(options: ClientOptions = {}) {
        super();

        this.options = Util.mergeDefault(DefaultOptions, options);
        
        if(!this.options.authStrategy) {
            this.authStrategy = new NoAuth();
        } else {
            this.authStrategy = this.options.authStrategy;
        }

        this.authStrategy.setup(this);

        /**
         * @type {puppeteer.Browser}
         */
        this.pupBrowser = null;
        /**
         * @type {puppeteer.Page}
         */
        this.pupPage = null;

        this.currentIndexHtml = null;
        this.lastLoggedOut = false;

        Util.setFfmpegPath(this.options.ffmpegPath);
    }

    /**
     * Evaluate a function in the page context
     * Private function
     */
    /**
     * Serializes a function and its arguments into a string suitable for page.evaluate
     */
    private serializeFunctionWithArgs<Func extends (...args: any[]) => any>(fn: Func | string, args: any[]): string {
        let fnStr = typeof fn === 'string' ? fn : fn.toString();
        // Prepend debugger; to the function body
        if (typeof fn !== 'string') {
            fnStr = fnStr.replace('{', '{\n    debugger;');
        } else if (!fnStr.trim().startsWith('debugger;')) {
            fnStr = 'debugger;\n' + fnStr;
        }
        // Serialize arguments as JSON
        const argsStr = args.map(arg => JSON.stringify(arg)).join(', ');
        return `(${fnStr})(${argsStr})`;
    }

    public async evaluate<Params extends unknown[], Func extends EvaluateFunc<Params> = EvaluateFunc<Params>>(pageFunction: Func | string, ...args: Params): Promise<Awaited<ReturnType<Func>>> {
        const asStr = this.serializeFunctionWithArgs(pageFunction, args);
        try {
            let lastError: Error | undefined;
            // check evaluateOnNewDocument
            await logger.log(asStr);
            let result: Awaited<ReturnType<Func>>;
            for (let i = 0; i < 2; i++) {
                try {
                    result = await this.pupPage.evaluate(asStr) as Awaited<ReturnType<Func>>;
                    lastError = undefined;
                } catch (error) {
                    lastError = error as Error;
                    //  ERROR: ProtocolError: Runtime.evaluate timed out. Increase the 'protocolTimeout' setting in launch/connect calls for a higher timeout if needed.
                    if (error instanceof ProtocolError && error.message.includes('Runtime.evaluate timed out')) {
                        // retry once
                        continue;
                    }
                    // Let it go crash
                    throw error;
                }
            }
            if (lastError) {
                throw lastError;
            }
            return result as Awaited<ReturnType<Func>>;
        } catch (error) {
            // debugger;
            throw new Error(`ERROR: ${error}\n\nFailed to evaluate function: ${asStr.substring(0, 500)}...\n`);
        }
    }

    /**
     * Waits for the UNPAIRED state
     * @returns {Promise<'UNPAIRED' | 'UNPAIRED_IDLE'>}
     */
    private async waitForUNPAIREDState(): Promise<typeof WAState[keyof typeof WAState]> {
        const currentState = await this.evaluate(async () => {
            let state = window.AuthStore.AppState.state;

            if (state === 'OPENING' || state === 'UNLAUNCHED' || state === 'PAIRING') {
                // wait till state changes
                await new Promise<void>(r => {
                    window.AuthStore.AppState.on('change:state', function waitTillInit(_AppState: any, state: typeof WAState[keyof typeof WAState]) {
                        if (state !== 'OPENING' && state !== 'UNLAUNCHED' && state !== 'PAIRING') {
                            window.AuthStore.AppState.off('change:state', waitTillInit);
                            r();
                        } 
                    });
                }); 
            }
            state = window.AuthStore.AppState.state;
            return state;
        });
        return currentState as typeof WAState[keyof typeof WAState];
    }

    /**
     * Exposes a function to the page if it is not already exposed
     */
    private exposeFunction(name: string, fn: Function): Promise<void> {
        return exposeFunctionIfAbsent(this.pupPage, name, fn);
    }

    /**
     * Injection logic
     * Private function
     */
    async inject(): Promise<void> {
        // wait for window.Debug to be defined
        // await this.pupPage.waitForFunction('window.Debug?.VERSION != undefined', {timeout: this.options.authTimeoutMs});
        // const waitHandler = await this.pupPage.waitForFunction('window.Debug?.VERSION', {timeout: this.options.authTimeoutMs});
        // const version0 = await waitHandler.jsonValue()
        const version = await this.getWWebVersion();
        const isCometOrAbove = parseInt(version.split('.')?.[1] ?? '0') >= 3000;

        if (isCometOrAbove) {
            await this.evaluate(ExposeAuthStore);
        } else {
            await this.evaluate(ExposeLegacyAuthStore, ModuleRaid.toString());
        }

        const currentState = await this.waitForUNPAIREDState();

        if (currentState === 'UNPAIRED' || currentState === 'UNPAIRED_IDLE') {
            const { failed, failureEventPayload, restart } = await this.authStrategy.onAuthenticationNeeded();

            if(failed) {
                /**
                 * Emitted when there has been an error while trying to restore an existing session
                 * @event Client#auth_failure
                 * @param {string} message
                 */
                this.emit(Events.AUTHENTICATION_FAILURE, failureEventPayload);
                await this.destroy();
                if (restart) {
                    // session restore failed so try again but without session to force new authentication
                    return this.initialize();
                }
                return;
            }

            // Register qr events
            let qrRetries = 0;
            await this.exposeFunction('onQRChangedEvent', async (qr: string) => {
                /**
                * Emitted when a QR code is received
                * @event Client#qr
                * @param {string} qr QR Code
                */
                this.emit(Events.QR_RECEIVED, qr);
                if (this.options.qrMaxRetries > 0) {
                    qrRetries++;
                    if (qrRetries > this.options.qrMaxRetries) {
                        this.emit(Events.DISCONNECTED, 'Max qrcode retries reached');
                        await this.destroy();
                    }
                }
            });

            await this.evaluate(async () => {
                const { AuthStore } = window;
                const registrationInfo = await AuthStore.RegistrationUtils.waSignalStore.getRegistrationInfo();
                const noiseKeyPair = await AuthStore.RegistrationUtils.waNoiseInfo.get();
                const staticKeyB64 = AuthStore.Base64Tools.encodeB64(noiseKeyPair.staticKeyPair.pubKey);
                const identityKeyB64 = AuthStore.Base64Tools.encodeB64(registrationInfo.identityKeyPair.pubKey);
                const advSecretKey = await AuthStore.RegistrationUtils.getADVSecretKey();
                const platform = AuthStore.RegistrationUtils.DEVICE_PLATFORM;
                const getQR = (ref: string) => ref + ',' + staticKeyB64 + ',' + identityKeyB64 + ',' + advSecretKey + ',' + platform;
                
                window.onQRChangedEvent(getQR(AuthStore.Conn.ref)); // initial qr
                window.AuthStore.Conn.on('change:ref', (_: unknown, ref: string) => { window.onQRChangedEvent(getQR(ref)); }); // future QR changes
            });
        }
        
        /**
         * @param {WAState[keyof typeof WAState]} state WAState
         */
        await this.exposeFunction('onAuthAppStateChangedEvent', (state: typeof WAState[keyof typeof WAState]) => {
            if (state == 'UNPAIRED_IDLE') {
                // refresh qr code
                window.Store.Cmd.refreshQR();
            }
        });

        await this.exposeFunction('onAppStateHasSyncedEvent', async () => {
            const authEventPayload = await this.authStrategy.getAuthEventPayload();
            /**
             * Emitted when authentication is successful
             * @event Client#authenticated
             */
            this.emit(Events.AUTHENTICATED, authEventPayload);

            const injected = await this.evaluate(() => {
                return typeof window.Store !== 'undefined' && typeof window.WWebJS !== 'undefined';
            });

            if (!injected) {
                if (this.options.webVersionCache.type === 'local' && this.currentIndexHtml) {
                    const { type: webCacheType, ...webCacheOptions } = this.options.webVersionCache;
                    const webCache = WebCacheFactory.createWebCache(webCacheType, webCacheOptions);
            
                    await webCache.persist(this.currentIndexHtml, version);
                }

                if (isCometOrAbove) {
                    await this.evaluate(ExposeStore);
                } else {
                    // make sure all modules are ready before injection
                    // 2 second delay after authentication makes sense and does not need to be made dyanmic or removed
                    await new Promise(r => setTimeout(r, 2000)); 
                    await this.evaluate(ExposeLegacyStore);
                }

                // Check window.Store Injection
                await this.pupPage.waitForFunction('window.Store != undefined');
            
                const data = await this.evaluate(() => {
                    return { ...window.Store.Conn.serialize(), wid: window.Store.User.getMeUser() };
                });
                this.info = new ClientInfo(this, data);

                this.interface = new InterfaceController(this);
                
                //Load util functions (serializers, helper functions)
                await this.evaluate(LoadUtils);

                await this.attachEventListeners();
            }
            /**
                 * Emitted when the client has initialized and is ready to receive messages.
                 * @event Client#ready
                 */
            this.emit(Events.READY);
            this.authStrategy.afterAuthReady();
        });

        let lastPercent = -1;
        await this.exposeFunction('onOfflineProgressUpdateEvent', (percent: number) => {
            if (lastPercent !== percent) {
                lastPercent = percent;
                this.emit(Events.LOADING_SCREEN, percent, 'WhatsApp'); // Message is hardcoded as "WhatsApp" for now
            }
        });
        await this.exposeFunction('onLogoutEvent', async () => {
            this.lastLoggedOut = true;
            await this.pupPage.waitForNavigation({waitUntil: 'load', timeout: 5000}).catch((_) => _);
        });
        await this.evaluate(() => {
            window.AuthStore.AppState.on('change:state', (_AppState: {state: string}, state: string) => { window.onAuthAppStateChangedEvent(state); });
            window.AuthStore.AppState.on('change:hasSynced', () => { window.onAppStateHasSyncedEvent(); });
            window.AuthStore.Cmd.on('offline_progress_update', () => {
                window.onOfflineProgressUpdateEvent(window.AuthStore.OfflineMessageHandler.getOfflineDeliveryProgress()); 
            });
            window.AuthStore.Cmd.on('logout', async () => {
                await window.onLogoutEvent();
            });
        });
    }

    /**
     * Sets up events and requirements, kicks off authentication request
     */
    async initialize(): Promise<void> {
        let browser: puppeteer.Browser | null = null;
        let page: puppeteer.Page | null = null;

        await this.authStrategy.beforeBrowserInitialized();

        const puppeteerOpts = this.options.puppeteer;
        if (puppeteerOpts && (puppeteerOpts.browserWSEndpoint || puppeteerOpts.browserURL)) {
            browser = await puppeteer.connect(puppeteerOpts);
            page = await browser.newPage();
        } else {
            const browserArgs = [...(puppeteerOpts.args || [])];
            if(!browserArgs.find(arg => arg.includes('--user-agent'))) {
                browserArgs.push(`--user-agent=${this.options.userAgent}`);
            }
            // navigator.webdriver fix
            browserArgs.push('--disable-blink-features=AutomationControlled');

            browser = await puppeteer.launch({...puppeteerOpts, args: browserArgs});
            page = (await browser.pages())[0];
        }

        if (this.options.proxyAuthentication !== undefined) {
            await page.authenticate(this.options.proxyAuthentication);
        }
      
        await page.setUserAgent(this.options.userAgent);
        if (this.options.bypassCSP) await page.setBypassCSP(true);

        this.pupBrowser = browser;
        this.pupPage = page;

        await this.authStrategy.afterBrowserInitialized();
        await this.initWebVersionCache();
        // polyfill __name Injected by some typescript configuration.

        // await page.evaluateOnNewDocument(polyfill__name);
        // ocVersion (isOfficialClient patch)
        // remove after 2.3000.x hard release
        try {
            await page.evaluateOnNewDocument(hideModuleRaid);
        } catch (err) {
            console.log(err);
            throw err;
        }
        
        await page.goto(WhatsWebURL, {
            waitUntil: 'load',
            timeout: 0,
            referer: 'https://whatsapp.com/'
        });

        await this.inject();

        this.pupPage.on('framenavigated', async (frame) => {
            if(frame.url().includes('post_logout=1') || this.lastLoggedOut) {
                this.emit(Events.DISCONNECTED, 'LOGOUT');
                await this.authStrategy.logout();
                await this.authStrategy.beforeBrowserInitialized();
                await this.authStrategy.afterBrowserInitialized();
                this.lastLoggedOut = false;
            }
            await this.inject();
        });
    }

    /**
     * Request authentication via pairing code instead of QR code
     * @param {string} phoneNumber - Phone number in international, symbol-free format (e.g. 12025550108 for US, 551155501234 for Brazil)
     * @param {boolean} showNotification - Show notification to pair on phone number
     * @returns {Promise<string>} - Returns a pairing code in format "ABCDEFGH"
     */
    async requestPairingCode(phoneNumber: string, showNotification = true): Promise<string> {
        return await this.evaluate(async (phoneNumber, showNotification) => {
            window.AuthStore.PairingCodeLinkUtils.setPairingType('ALT_DEVICE_LINKING');
            await window.AuthStore.PairingCodeLinkUtils.initializeAltDeviceLinking();
            return window.AuthStore.PairingCodeLinkUtils.startAltLinkingFlow(phoneNumber, showNotification);
        }, phoneNumber, showNotification);
    }

    /**
     * Attach event listeners to WA Web
     * Private function
     * @property {boolean} reinject is this a reinject?
     */
    async attachEventListeners() {
        await this.exposeFunction('onAddMessageEvent', (msg: any) => {
            if (msg.type === 'gp2') {
                const notification = new GroupNotification(this, msg);
                if (['add', 'invite', 'linked_group_join'].includes(msg.subtype)) {
                    /**
                     * Emitted when a user joins the chat via invite link or is added by an admin.
                     * @event Client#group_join
                     * @param {GroupNotification} notification GroupNotification with more information about the action
                     */
                    this.emit(Events.GROUP_JOIN, notification);
                } else if (msg.subtype === 'remove' || msg.subtype === 'leave') {
                    /**
                     * Emitted when a user leaves the chat or is removed by an admin.
                     * @event Client#group_leave
                     * @param {GroupNotification} notification GroupNotification with more information about the action
                     */
                    this.emit(Events.GROUP_LEAVE, notification);
                } else if (msg.subtype === 'promote' || msg.subtype === 'demote') {
                    /**
                     * Emitted when a current user is promoted to an admin or demoted to a regular user.
                     * @event Client#group_admin_changed
                     * @param {GroupNotification} notification GroupNotification with more information about the action
                     */
                    this.emit(Events.GROUP_ADMIN_CHANGED, notification);
                } else if (msg.subtype === 'membership_approval_request') {
                    /**
                     * Emitted when some user requested to join the group
                     * that has the membership approval mode turned on
                     * @event Client#group_membership_request
                     * @param {GroupNotification} notification GroupNotification with more information about the action
                     * @param {string} notification.chatId The group ID the request was made for
                     * @param {string} notification.author The user ID that made a request
                     * @param {number} notification.timestamp The timestamp the request was made at
                     */
                    this.emit(Events.GROUP_MEMBERSHIP_REQUEST, notification);
                } else {
                    /**
                     * Emitted when group settings are updated, such as subject, description or picture.
                     * @event Client#group_update
                     * @param {GroupNotification} notification GroupNotification with more information about the action
                     */
                    this.emit(Events.GROUP_UPDATE, notification);
                }
                return;
            }

            const message = new Message(this, msg);

            /**
             * Emitted when a new message is created, which may include the current user's own messages.
             * @event Client#message_create
             * @param {Message} message The message that was created
             */
            this.emit(Events.MESSAGE_CREATE, message);

            if (msg.id.fromMe) return;

            /**
             * Emitted when a new message is received.
             * @event Client#message
             * @param {Message} message The message that was received
             */
            this.emit(Events.MESSAGE_RECEIVED, message);
        });

        let last_message;

        await this.exposeFunction('onChangeMessageTypeEvent', (msg) => {
            if (msg.type === 'revoked') {
                const message = new Message(this, msg);
                let revoked_msg;
                if (last_message && msg.id.id === last_message.id.id) {
                    revoked_msg = new Message(this, last_message);
                }
                /**
                 * Emitted when a message is deleted for everyone in the chat.
                 * @event Client#message_revoke_everyone
                 * @param {Message} message The message that was revoked, in its current state. It will not contain the original message's data.
                 * @param {?Message} revoked_msg The message that was revoked, before it was revoked. It will contain the message's original data. 
                 * Note that due to the way this data is captured, it may be possible that this param will be undefined.
                 */
                this.emit(Events.MESSAGE_REVOKED_EVERYONE, message, revoked_msg);
            }

        });

        await this.exposeFunction('onChangeMessageEvent', (msg) => {
            if (msg.type !== 'revoked') {
                last_message = msg;
            }
            /**
             * The event notification that is received when one of
             * the group participants changes their phone number.
             */
            const isParticipant = msg.type === 'gp2' && msg.subtype === 'modify';
            /**
             * The event notification that is received when one of
             * the contacts changes their phone number.
             */
            const isContact = msg.type === 'notification_template' && msg.subtype === 'change_number';
            if (isParticipant || isContact) {
                /** @type {GroupNotification} object does not provide enough information about this event, so a @type {Message} object is used. */
                const message: Message = new Message(this, msg);
                const newId = isParticipant ? msg.recipients[0] : msg.to;
                const oldId = isParticipant ? msg.author : msg.templateParams.find((id: string) => id !== newId);
                /**
                 * Emitted when a contact or a group participant changes their phone number.
                 * @event Client#contact_changed
                 * @param {Message} message Message with more information about the event.
                 * @param {String} oldId The user's id (an old one) who changed their phone number
                 * and who triggered the notification.
                 * @param {String} newId The user's new id after the change.
                 * @param {Boolean} isContact Indicates if a contact or a group participant changed their phone number.
                 */
                this.emit(Events.CONTACT_CHANGED, message, oldId, newId, isContact);
            }
        });

        await this.exposeFunction('onRemoveMessageEvent', (msg: { isNewMsg: boolean }) => {
            if (!msg.isNewMsg) return;
            const message = new Message(this, msg);
            /**
             * Emitted when a message is deleted by the current user.
             * @event Client#message_revoke_me
             * @param {Message} message The message that was revoked
             */
            this.emit(Events.MESSAGE_REVOKED_ME, message);
        });

        await this.exposeFunction('onMessageAckEvent', (msg, ack) => {
            const message = new Message(this, msg);
            /**
             * Emitted when an ack event occurrs on message type.
             * @event Client#message_ack
             * @param {Message} message The message that was affected
             * @param {MessageAck} ack The new ACK value
             */
            this.emit(Events.MESSAGE_ACK, message, ack);

        });

        await this.exposeFunction('onChatUnreadCountEvent', async (data: { id: string }) =>{
            const chat = await this.getChatById(data.id);
            /**
             * Emitted when the chat unread count changes
             */
            this.emit(Events.UNREAD_COUNT, chat);
        });

        await this.exposeFunction('onMessageMediaUploadedEvent', (msg) => {
            const message = new Message(this, msg);
            /**
             * Emitted when media has been uploaded for a message sent by the client.
             * @event Client#media_uploaded
             * @param {Message} message The message with media that was uploaded
             */
            this.emit(Events.MEDIA_UPLOADED, message);
        });

        await this.exposeFunction('onAppStateChangedEvent', async (state) => {
            /**
             * Emitted when the connection state changes
             * @event Client#change_state
             * @param {WAState} state the new connection state
             */
            this.emit(Events.STATE_CHANGED, state);

            const ACCEPTED_STATES: typeof WAState[keyof typeof WAState][] = [WAState.CONNECTED, WAState.OPENING, WAState.PAIRING, WAState.TIMEOUT];

            if (this.options.takeoverOnConflict) {
                ACCEPTED_STATES.push(WAState.CONFLICT);

                if (state === WAState.CONFLICT) {
                    setTimeout(() => {
                        this.evaluate(() => window.Store.AppState.takeover());
                    }, this.options.takeoverTimeoutMs);
                }
            }

            if (!ACCEPTED_STATES.includes(state)) {
                /**
                 * Emitted when the client has been disconnected
                 * @event Client#disconnected
                 * @param {WAState|"LOGOUT"} reason reason that caused the disconnect
                 */
                await this.authStrategy.disconnect();
                this.emit(Events.DISCONNECTED, state);
                this.destroy();
            }
        });

        await this.exposeFunction('onBatteryStateChangedEvent', (state) => {
            const { battery, plugged } = state;

            if (battery === undefined) return;

            /**
             * Emitted when the battery percentage for the attached device changes. Will not be sent if using multi-device.
             * @event Client#change_battery
             * @param {object} batteryInfo
             * @param {number} batteryInfo.battery - The current battery percentage
             * @param {boolean} batteryInfo.plugged - Indicates if the phone is plugged in (true) or not (false)
             * @deprecated
             */
            this.emit(Events.BATTERY_CHANGED, { battery, plugged });
        });

        await this.exposeFunction('onIncomingCall', (call: CallData) => {
            const cll = new Call(this, call);
            this.emit(Events.INCOMING_CALL, cll);
        });

        await this.exposeFunction('onReaction', (reactions) => {
            for (const reaction of reactions) {
                /**
                 * Emitted when a reaction is sent, received, updated or removed
                 * @event Client#message_reaction
                 * @param {object} reaction
                 * @param {object} reaction.id - Reaction id
                 * @param {number} reaction.orphan - Orphan
                 * @param {?string} reaction.orphanReason - Orphan reason
                 * @param {number} reaction.timestamp - Timestamp
                 * @param {string} reaction.reaction - Reaction
                 * @param {boolean} reaction.read - Read
                 * @param {object} reaction.msgId - Parent message id
                 * @param {string} reaction.senderId - Sender id
                 * @param {?number} reaction.ack - Ack
                 */

                this.emit(Events.MESSAGE_REACTION, new Reaction(this, reaction));
            }
        });

        await this.exposeFunction('onRemoveChatEvent', async (chat) => {
            const _chat = await this.getChatById(chat.id);

            /**
             * Emitted when a chat is removed
             * @event Client#chat_removed
             * @param {Chat} chat
             */
            this.emit(Events.CHAT_REMOVED, _chat);
        });
            
        await this.exposeFunction('onArchiveChatEvent', async (chat, currState, prevState) => {
            const _chat = await this.getChatById(chat.id);
            /**
             * Emitted when a chat is archived/unarchived
             * @event Client#chat_archived
             * @param {Chat} chat
             * @param {boolean} currState
             * @param {boolean} prevState
             */
            this.emit(Events.CHAT_ARCHIVED, _chat, currState, prevState);
        });

        await this.exposeFunction('onEditMessageEvent', (msg, newBody, prevBody) => {
            if(msg.type === 'revoked'){
                return;
            }
            /**
             * Emitted when messages are edited
             * @event Client#message_edit
             * @param {Message} message
             * @param {string} newBody
             * @param {string} prevBody
             */
            this.emit(Events.MESSAGE_EDIT, new Message(this, msg), newBody, prevBody);
        });
            
        await this.exposeFunction('onAddMessageCiphertextEvent', msg => {
            /**
             * Emitted when messages are edited
             * @event Client#message_ciphertext
             * @param {Message} message
             */
            this.emit(Events.MESSAGE_CIPHERTEXT, new Message(this, msg));
        });

        await this.exposeFunction('onPollVoteEvent', (vote) => {
            const _vote = new PollVote(this, vote);
            /**
             * Emitted when some poll option is selected or deselected,
             * shows a user's current selected option(s) on the poll
             * @event Client#vote_update
             */
            this.emit(Events.VOTE_UPDATE, _vote);
        });

        await this.evaluate(() => {
            window.Store.Msg.on('change', (msg) => { window.onChangeMessageEvent(window.WWebJS.getMessageModel(msg)); });
            window.Store.Msg.on('change:type', (msg) => { window.onChangeMessageTypeEvent(window.WWebJS.getMessageModel(msg)); });
            window.Store.Msg.on('change:ack', (msg, ack) => { window.onMessageAckEvent(window.WWebJS.getMessageModel(msg), ack); });
            window.Store.Msg.on('change:isUnsentMedia', (msg, unsent) => { if (msg.id.fromMe && !unsent) window.onMessageMediaUploadedEvent(window.WWebJS.getMessageModel(msg)); });
            window.Store.Msg.on('remove', (msg) => { if (msg.isNewMsg) window.onRemoveMessageEvent(window.WWebJS.getMessageModel(msg)); });
            window.Store.Msg.on('change:body change:caption', (msg, newBody, prevBody) => { window.onEditMessageEvent(window.WWebJS.getMessageModel(msg), newBody, prevBody); });
            window.Store.AppState.on('change:state', (_AppState, state) => { window.onAppStateChangedEvent(state); });
            window.Store.Conn.on('change:battery', (state) => { window.onBatteryStateChangedEvent(state); });
            window.Store.Call.on('add', (call: CallData) => { window.onIncomingCall(call); });
            window.Store.Chat.on('remove', async (chat) => { window.onRemoveChatEvent(await window.WWebJS.getChatModel(chat)); });
            window.Store.Chat.on('change:archive', async (chat, currState, prevState) => { window.onArchiveChatEvent(await window.WWebJS.getChatModel(chat), currState, prevState); });
            window.Store.Msg.on('add', (msg) => { 
                if (msg.isNewMsg) {
                    if(msg.type === 'ciphertext') {
                        // defer message event until ciphertext is resolved (type changed)
                        msg.once('change:type', (_msg) => window.onAddMessageEvent(window.WWebJS.getMessageModel(_msg)));
                        window.onAddMessageCiphertextEvent(window.WWebJS.getMessageModel(msg));
                    } else {
                        window.onAddMessageEvent(window.WWebJS.getMessageModel(msg)); 
                    }
                }
            });
            window.Store.Chat.on('change:unreadCount', (chat) => {window.onChatUnreadCountEvent(chat);});
            window.Store.PollVote.on('add', async (vote) => {
                const pollVoteModel = await window.WWebJS.getPollVoteModel(vote);
                pollVoteModel && window.onPollVoteEvent(pollVoteModel);
            });

            if (window.compareWwebVersions(window.Debug.VERSION, '>=', '2.3000.1014111620')) {
                const module = window.Store.AddonReactionTable;
                const ogMethod = module.bulkUpsert;
                module.bulkUpsert = ((...args) => {
                    window.onReaction(args[0].map(reaction => {
                        const msgKey = reaction.id;
                        const parentMsgKey = reaction.reactionParentKey;
                        const timestamp = reaction.reactionTimestamp / 1000;
                        const sender = reaction.author ?? reaction.from;
                        const senderUserJid = sender._serialized;

                        return {...reaction, msgKey, parentMsgKey, senderUserJid, timestamp };
                    }));

                    return ogMethod(...args);
                }).bind(module);
            } else {
                const module = window.Store.createOrUpdateReactionsModule;
                const ogMethod = module.createOrUpdateReactions;
                module.createOrUpdateReactions = ((...args) => {
                    window.onReaction(args[0].map(reaction => {
                        const msgKey = window.Store.MsgKey.fromString(reaction.msgKey);
                        const parentMsgKey = window.Store.MsgKey.fromString(reaction.parentMsgKey);
                        const timestamp = reaction.timestamp / 1000;

                        return {...reaction, msgKey, parentMsgKey, timestamp };
                    }));

                    return ogMethod(...args);
                }).bind(module);
            }
        });
    }    

    async initWebVersionCache() {
        const { type: webCacheType, ...webCacheOptions } = this.options.webVersionCache;
        const webCache = WebCacheFactory.createWebCache(webCacheType, webCacheOptions);
        const requestedVersion = this.options.webVersion;
        const versionContent = await webCache.resolve(requestedVersion);
        if(versionContent) {
            await this.pupPage.setRequestInterception(true);
            this.pupPage.on('request', (req) => {
                if(req.url() === WhatsWebURL) {
                    req.respond({
                        status: 200,
                        contentType: 'text/html',
                        body: versionContent
                    }); 
                } else {
                    req.continue();
                }
            });
        } else {
            this.pupPage.on('response', async (res) => {
                if(res.ok() && res.url() === WhatsWebURL) {
                    const indexHtml = await res.text();
                    this.currentIndexHtml = indexHtml;
                }
            });
        }
    }

    /**
     * Closes the client
     */
    async destroy(): Promise<void> {
        await this.pupBrowser.close();
        await this.authStrategy.destroy();
    }

    /**
     * Logs out the client, closing the current session
     */
    async logout(): Promise<void> {
        await this.evaluate(() => {
            if (window.Store && window.Store.AppState && typeof window.Store.AppState.logout === 'function') {
                return window.Store.AppState.logout();
            }
        });
        await this.pupBrowser.close();
        
        let maxDelay = 0;
        while (this.pupBrowser.isConnected() && (maxDelay < 10)) { // waits a maximum of 1 second before calling the AuthStrategy
            await new Promise(resolve => setTimeout(resolve, 100));
            maxDelay++; 
        }
        
        await this.authStrategy.logout();
    }

    /**
     * Returns the version of WhatsApp Web currently being run
     * if the page is not ready, it will wait for it to be ready
     * @param timeout timeout in milliseconds
     * @returns {Promise<string>}
     */
    async getWWebVersion(timeout?: number): Promise<string> {
        const waitHandler = await this.pupPage.waitForFunction('window.Debug?.VERSION', {timeout: timeout ?? this.options.authTimeoutMs});
        const version = await waitHandler.jsonValue();
        return version as string;
        //return await this.evaluate(() => {
        //    return window.Debug.VERSION;
        //});
    }

    /**
     * Mark as seen for the Chat
     *  @param {string} chatId
     *  @returns {Promise<boolean>} result
     * 
     */
    async sendSeen(chatId: string): Promise<boolean> {
        return await this.evaluate((chatId: string) => {
            if (!window.WWebJS || !window.WWebJS.sendSeen) {
                throw new Error('window.WWebJS.sendSeen is not defined');
            }
            return window.WWebJS.sendSeen(chatId);
        }, chatId);
    }
    /**
     * Send a message to a specific chatId
     * 
     * @returns Message that was just sent
     */
    async sendMessage(chatId: string, content: MessageContent, options: MessageSendOptions = {}): Promise<Message | null | undefined> {
        const isChannel = /@\w*newsletter\b/.test(chatId);

        if (isChannel && [
            options.sendMediaAsDocument, options.quotedMessageId, 
            options.parseVCards, options.isViewOnce,
            content instanceof Location, content instanceof Contact,
            content instanceof Buttons, content instanceof List,
            Array.isArray(content) && content.length > 0 && content[0] instanceof Contact
        ].includes(true)) {
            console.warn('The message type is currently not supported for sending in channels,\nthe supported message types are: text, image, sticker, gif, video, voice and poll.');
            return null;
        }
    
        if (options.mentions) {
            !Array.isArray(options.mentions) && (options.mentions = [options.mentions]);
            if (options.mentions.some((possiblyContact: string | Contact) => possiblyContact instanceof Contact)) {
                console.warn('Mentions with an array of Contact are now deprecated. See more at https://github.com/pedroslopez/whatsapp-web.js/pull/2166.');
                options.mentions = options.mentions.map((a: string | Contact) => a instanceof Contact ? a.id._serialized : a);
            }
        }

        options.groupMentions && !Array.isArray(options.groupMentions) && (options.groupMentions = [options.groupMentions]);
        

        interface InternalMessageSendOptions {
            linkPreview?: boolean;
            sendAudioAsVoice?: boolean;
            sendVideoAsGif?: boolean;
            sendMediaAsSticker?: boolean;
            sendMediaAsDocument?: boolean;
            sendMediaAsHd?: boolean;
            caption?: string;
            quotedMessageId?: string;
            parseVCards?: boolean;
            mentionedJidList?: string[];
            groupMentions?: {
                /** The name of a group to mention (can be custom) */
                subject: string,
                /** The group ID, e.g.: 'XXXXXXXXXX@g.us' */
                id: string
            }[];
            invokedBotWid?: string;
            ignoreQuoteErrors?: boolean;
            extraOptions?: any;
            media?: MessageMedia;
            isViewOnce?: boolean;
            location?: Location;
            poll?: Poll;
            contactCard?: string;
            contactCardList?: string[];
            buttons?: Buttons;
            list?: List;
            attachment?: string | MessageMedia;
        }

        const internalOptions: InternalMessageSendOptions = {
            linkPreview: options.linkPreview === false ? undefined : true,
            sendAudioAsVoice: options.sendAudioAsVoice,
            sendVideoAsGif: options.sendVideoAsGif,
            sendMediaAsSticker: options.sendMediaAsSticker,
            sendMediaAsDocument: options.sendMediaAsDocument,
            sendMediaAsHd: options.sendMediaAsHd,
            caption: options.caption,
            quotedMessageId: options.quotedMessageId,
            parseVCards: options.parseVCards !== false,
            mentionedJidList: options.mentions || [],
            groupMentions: options.groupMentions,
            invokedBotWid: options.invokedBotWid,
            ignoreQuoteErrors: options.ignoreQuoteErrors !== false,
            extraOptions: options.extra,
        };

        const sendSeen = options.sendSeen !== false;

        let contentText = "";

        if (content instanceof MessageMedia) {
            internalOptions.media = content;
            internalOptions.isViewOnce = options.isViewOnce;
        } else if (options.media instanceof MessageMedia) {
            internalOptions.media = options.media;
            // internalOptions.caption = content;
            internalOptions.isViewOnce = options.isViewOnce;
        } else if (content instanceof Location) {
            internalOptions.location = content;
        } else if (content instanceof Poll) {
            internalOptions.poll = content;
        } else if (content instanceof Contact) {
            internalOptions.contactCard = content.id._serialized;
        } else if (Array.isArray(content) && content.length > 0 && content[0] instanceof Contact) {
            internalOptions.contactCardList = content.map(contact => contact.id._serialized);
        } else if (content instanceof Buttons) {
            console.warn('Buttons are now deprecated. See more at https://www.youtube.com/watch?v=hv1R1rLeVVE.');
            if (content.type !== 'chat') { internalOptions.attachment = content.body; }
            internalOptions.buttons = content;
        } else if (content instanceof List) {
            console.warn('Lists are now deprecated. See more at https://www.youtube.com/watch?v=hv1R1rLeVVE.');
            internalOptions.list = content;
        } else if (typeof content === 'string') {
            contentText = content;
        } else {
            console.error('Unsupported message type: ' + typeof content);
            console.warn('the Send message will probably failed');
            contentText = content as any;
        }

        if (options.caption) {
            internalOptions.caption = options.caption;
        }

        if (internalOptions.sendMediaAsSticker && internalOptions.media) {
            internalOptions.media = await Util.formatToWebpSticker(
                internalOptions.media, {
                    name: options.stickerName,
                    author: options.stickerAuthor,
                    categories: options.stickerCategories
                }, this.pupPage
            );
        }

        const sentMsg = await this.evaluate(async (chatId, content, options, sendSeen) => {
            if (!window.WWebJS || !window.WWebJS.getChat || !window.WWebJS.sendSeen || !window.WWebJS.sendMessage || !window.WWebJS.getMessageModel) {
                throw new Error('window.WWebJS.getChat or window.WWebJS.sendSeen or window.WWebJS.sendMessage or window.WWebJS.getMessageModel is not defined');
            }
            const chat = await window.WWebJS.getChat(chatId, { getAsModel: false });

            if (!chat) return null;

            if (sendSeen) {
                await window.WWebJS.sendSeen(chatId);
            }

            const msg = await window.WWebJS.sendMessage(chat, content, options);
            return msg
                ? window.WWebJS.getMessageModel(msg)
                : undefined;
        }, chatId, contentText, internalOptions, sendSeen);

        return sentMsg
            ? new Message(this, sentMsg)
            : undefined;
    }

    /**
     * @typedef {Object} SendChannelAdminInviteOptions
     * @property {?string} comment The comment to be added to an invitation
     */

    /**
     * Sends a channel admin invitation to a user, allowing them to become an admin of the channel
     * @param {string} chatId The ID of a user to send the channel admin invitation to
     * @param {string} channelId The ID of a channel for which the invitation is being sent
     * @param {SendChannelAdminInviteOptions} options 
     * @returns {Promise<boolean>} Returns true if an invitation was sent successfully, false otherwise
     */
    async sendChannelAdminInvite(chatId: string, channelId: string, options: { comment?: string } = {}): Promise<boolean> {
        const response = await this.evaluate(async (chatId, channelId, options) => {
            if (!window.Store || !window.Store.WidFactory || !window.Store.WidFactory.createWid || !window.Store.Chat || !window.Store.Chat.get || !window.Store.Chat.find || !window.Store.SendChannelMessage || !window.Store.SendChannelMessage.sendNewsletterAdminInviteMessage || !window.WWebJS || !window.WWebJS.getProfilePicThumbToBase64) {
                throw new Error('window.Store.WidFactory.createWid or window.Store.Chat.get or window.Store.Chat.find or window.Store.SendChannelMessage.sendNewsletterAdminInviteMessage or window.WWebJS.getProfilePicThumbToBase64 is not defined');
            }
            const channelWid = window.Store.WidFactory.createWid(channelId);
            const chatWid = window.Store.WidFactory.createWid(chatId);
            const chat = window.Store.Chat.get(chatWid) || (await window.Store.Chat.find(chatWid));

            if (!chatWid.isUser()) {
                return false;
            }
            
            return await window.Store.SendChannelMessage.sendNewsletterAdminInviteMessage(
                chat,
                {
                    newsletterWid: channelWid,
                    invitee: chatWid,
                    inviteMessage: options.comment,
                    base64Thumb: await window.WWebJS.getProfilePicThumbToBase64(channelWid)
                }
            );
        }, chatId, channelId, options);

        return response.messageSendResult === 'OK';
    }
    
    /**
     * Searches for messages
     * @param {string} query
     * @param {Object} [options]
     * @param {number} [options.page]
     * @param {number} [options.limit]
     * @param {string} [options.chatId]
     * @returns {Promise<Message[]>}
     */
    async searchMessages(query: string, options: { page?: number, limit?: number, chatId?: string } = {}): Promise<Message[]> {
        const messages = await this.evaluate(async (query, page, count, remote) => {
            if (!window.Store || !window.Store.Msg || !window.Store.Msg.search || !window.WWebJS || !window.WWebJS.getMessageModel) {
                throw new Error('window.Store.Msg.search or window.WWebJS.getMessageModel is not defined');
            }
            const { messages } = await window.Store.Msg.search(query, page, count, remote);
            return messages.map(msg => window.WWebJS.getMessageModel(msg));
        }, query, options.page, options.limit, options.chatId);

        return messages.map(msg => new Message(this, msg));
    }

    /**
     * Get all current chat instances
     * @returns {Promise<Array<Chat>>}
     */
    async getChats(): Promise<Chat[]> {
        const chats = await this.evaluate(async () => {
            if (!window.WWebJS || !window.WWebJS.getChats) {
                throw new Error('window.WWebJS.getChats is not defined');
            }
            return await window.WWebJS.getChats();
        });

        return chats.map(chat => ChatFactory.create(this, chat)) as Chat[];
    }

    /**
     * Gets all cached {@link Channel} instance
     * @returns {Promise<Array<Channel>>}
     */
    async getChannels(): Promise<Channel[]> {
        const channels = await this.evaluate(async () => {
            if (!window.WWebJS || !window.WWebJS.getChannels) {
                throw new Error('window.WWebJS.getChannels is not defined');
            }
            return await window.WWebJS.getChannels();
        });

        return channels.map((channel) => ChatFactory.create(this, channel) as Channel);
    }

    /**
     * Gets chat or channel instance by ID
     * @param {string} chatId 
     * @returns {Promise<Chat|Channel>}
     */
    async getChatById(chatId: string): Promise<Chat | undefined> {
        const chat = await this.evaluate(async chatId => {
            if (!window.WWebJS || !window.WWebJS.getChat) {
                throw new Error('window.WWebJS.getChat is not defined');
            }
            return await window.WWebJS.getChat(chatId);
        }, chatId);
        return chat
            ? ChatFactory.create(this, chat) as Chat
            : undefined;
    }

    /**
     * Gets a {@link Channel} instance by invite code
     * @param {string} inviteCode The code that comes after the 'https://whatsapp.com/channel/'
     * @returns {Promise<Channel>}
     */
    async getChannelByInviteCode(inviteCode: string): Promise<Channel> {
        const channel = await this.evaluate(async (inviteCode) => {
            if (!window.WWebJS || !window.WWebJS.getChannelMetadata || !window.WWebJS.getChat) {
                throw new Error('window.WWebJS.getChannelMetadata or window.WWebJS.getChat is not defined');
            }
            let channelMetadata;
            try {
                channelMetadata = await window.WWebJS.getChannelMetadata(inviteCode);
            } catch (err) {
                if ((err as Error).name === 'ServerStatusCodeError') return null;
                throw err;
            }
            return await window.WWebJS.getChat(channelMetadata.id);
        }, inviteCode);

        return channel
            ? ChatFactory.create(this, channel) as Channel
            : undefined;
    }

    /**
     * Get all current contact instances
     * @returns {Promise<Array<Contact>>}
     */
    async getContacts(): Promise<Contact[]> {
        const contacts = await this.evaluate(() => {
            if (!window.WWebJS || !window.WWebJS.getContacts) {
                throw new Error('window.WWebJS.getContacts is not defined');
            }
            return window.WWebJS.getContacts();
        });

        return contacts.map(contact => ContactFactory.create(this, contact));
    }

    /**
     * Get contact instance by ID
     * @param {string} contactId
     * @returns {Promise<Contact>}
     */
    async getContactById(contactId: string): Promise<Contact> {
        const contact = await this.evaluate(contactId => {
            if (!window.WWebJS || !window.WWebJS.getContact) {
                throw new Error('window.WWebJS.getContact is not defined');
            }
            return window.WWebJS.getContact(contactId);
        }, contactId);

        return ContactFactory.create(this, contact);
    }
    
    async getMessageById(messageId: string): Promise<Message> {
        const msg = await this.evaluate(async messageId => {
            if (!window.Store || !window.Store.Msg || !window.Store.Msg.get || !window.WWebJS || !window.WWebJS.getMessageModel || !window.Store.Msg.getMessagesById) {
                throw new Error('window.Store.Msg.get or window.WWebJS.getMessageModel or window.Store.Msg.getMessagesById is not defined');
            }
            let msg = window.Store.Msg.get(messageId);
            if(msg) return window.WWebJS.getMessageModel(msg);

            const params = messageId.split('_');
            if (params.length !== 3 && params.length !== 4) throw new Error('Invalid serialized message id specified');

            const messagesObject = await window.Store.Msg.getMessagesById([messageId]);
            if (messagesObject && messagesObject.messages.length) msg = messagesObject.messages[0];
            
            if(msg) return window.WWebJS.getMessageModel(msg);
        }, messageId);

        if(msg) return new Message(this, msg);
        return null;
    }

    /**
     * Returns an object with information about the invite code's group
     * @param {string} inviteCode 
     * @returns {Promise<object>} Invite information
     */
    async getInviteInfo(inviteCode: string): Promise<{id: {_serialized: string}, participants: string[]}> {
        return await this.evaluate(inviteCode => {
            if (!window.Store || !window.Store.GroupInvite || !window.Store.GroupInvite.queryGroupInvite) {
                throw new Error('window.Store.GroupInvite.queryGroupInvite is not defined');
            }
            return window.Store.GroupInvite.queryGroupInvite(inviteCode);
        }, inviteCode);
    }

    /**
     * Accepts an invitation to join a group
     * @param {string} inviteCode Invitation code
     * @returns {Promise<string>} Id of the joined Chat
     */
    async acceptInvite(inviteCode: string): Promise<string> {
        const res = await this.evaluate(async inviteCode => {
            if (!window.Store || !window.Store.GroupInvite || !window.Store.GroupInvite.joinGroupViaInvite) {
                throw new Error('window.Store.GroupInvite.joinGroupViaInvite is not defined');
            }
            return await window.Store.GroupInvite.joinGroupViaInvite(inviteCode);
        }, inviteCode);

        return res.gid._serialized;
    }

    /**
     * Accepts a channel admin invitation and promotes the current user to a channel admin
     * @param {string} channelId The channel ID to accept the admin invitation from
     * @returns {Promise<boolean>} Returns true if the operation completed successfully, false otherwise
     */
    async acceptChannelAdminInvite(channelId: string): Promise<boolean> {
        return await this.evaluate(async (channelId) => {
            if (!window.Store || !window.Store.ChannelUtils || !window.Store.ChannelUtils.acceptNewsletterAdminInvite) {
                throw new Error('window.Store.ChannelUtils.acceptNewsletterAdminInvite is not defined');
            }
            try {
                await window.Store.ChannelUtils.acceptNewsletterAdminInvite(channelId);
                return true;
            } catch (err) {
                if ((err as Error).name === 'ServerStatusCodeError') return false;
                throw err;
            }
        }, channelId);
    }

    /**
     * Revokes a channel admin invitation sent to a user by a channel owner
     * @param {string} channelId The channel ID an invitation belongs to
     * @param {string} userId The user ID the invitation was sent to
     * @returns {Promise<boolean>} Returns true if the operation completed successfully, false otherwise
     */
    async revokeChannelAdminInvite(channelId: string, userId: string): Promise<boolean> {
        return await this.evaluate(async (channelId, userId) => {
            if (!window.Store || !window.Store.WidFactory || !window.Store.WidFactory.createWid || !window.Store.ChannelUtils || !window.Store.ChannelUtils.revokeNewsletterAdminInvite) {
                throw new Error('window.Store.WidFactory.createWid or window.Store.ChannelUtils.revokeNewsletterAdminInvite is not defined');
            }
            try {
                const userWid = window.Store.WidFactory.createWid(userId);
                await window.Store.ChannelUtils.revokeNewsletterAdminInvite(channelId, userWid);
                return true;
            } catch (err) {
                if ((err as Error).name === 'ServerStatusCodeError') return false;
                throw err;
            }
        }, channelId, userId);
    }

    /**
     * Demotes a channel admin to a regular subscriber (can be used also for self-demotion)
     * @param {string} channelId The channel ID to demote an admin in
     * @param {string} userId The user ID to demote
     * @returns {Promise<boolean>} Returns true if the operation completed successfully, false otherwise
     */
    async demoteChannelAdmin(channelId: string, userId: string): Promise<boolean> {
        return await this.evaluate(async (channelId, userId) => {
            if (!window.Store || !window.Store.WidFactory || !window.Store.WidFactory.createWid || !window.Store.ChannelUtils || !window.Store.ChannelUtils.demoteNewsletterAdmin) {
                throw new Error('window.Store.WidFactory.createWid or window.Store.ChannelUtils.demoteNewsletterAdmin is not defined');
            }
            try {
                const userWid = window.Store.WidFactory.createWid(userId);
                await window.Store.ChannelUtils.demoteNewsletterAdmin(channelId, userWid);
                return true;
            } catch (err) {
                if ((err as Error).name === 'ServerStatusCodeError') return false;
                throw err;
            }
        }, channelId, userId);
    }

    /**
     * Accepts a private invitation to join a group
     * @param {object} inviteInfo Invite V4 Info
     * @returns {Promise<Object>}
     */
    async acceptGroupV4Invite(inviteInfo: InviteV4Data): Promise<{status: number}> {
        if (!inviteInfo.inviteCode) throw 'Invalid invite code, try passing the message.inviteV4 object';
        if (inviteInfo.inviteCodeExp == 0) throw 'Expired invite code';
        return await this.evaluate(async inviteInfo => {
            if (!window.Store || !window.Store.WidFactory || !window.Store.WidFactory.createWid || !window.Store.GroupInviteV4 || !window.Store.GroupInviteV4.joinGroupViaInviteV4) {
                throw new Error('window.Store.WidFactory.createWid or window.Store.GroupInviteV4.joinGroupViaInviteV4 is not defined');
            }
            const { groupId, fromId, inviteCode, inviteCodeExp } = inviteInfo;
            const userWid = window.Store.WidFactory.createWid(fromId);
            return await window.Store.GroupInviteV4.joinGroupViaInviteV4(inviteCode, String(inviteCodeExp), groupId, userWid);
        }, inviteInfo);
    }

    /**
     * Sets the current user's status message
     * @param {string} status New status message
     */
    async setStatus(status: string): Promise<void> {
        await this.evaluate(async status => {
            if (!window.Store || !window.Store.StatusUtils || !window.Store.StatusUtils.setMyStatus) {
                throw new Error('window.Store.StatusUtils.setMyStatus is not defined');
            }
            return await window.Store.StatusUtils.setMyStatus(status);
        }, status);
    }

    /**
     * Sets the current user's display name. 
     * This is the name shown to WhatsApp users that have not added you as a contact beside your number in groups and in your profile.
     * @param {string} displayName New display name
     * @returns {Promise<Boolean>}
     */
    async setDisplayName(displayName: string): Promise<boolean> {
        const couldSet = await this.evaluate(async displayName => {
            if (!window.Store || !window.Store.Conn || !window.Store.Conn.canSetMyPushname || !window.Store.Settings || !window.Store.Settings.setPushname) {
                throw new Error('window.Store.Conn.canSetMyPushname or window.Store.Settings.setPushname is not defined');
            }
            if(!window.Store.Conn.canSetMyPushname()) return false;
            await window.Store.Settings.setPushname(displayName);
            return true;
        }, displayName);

        return couldSet;
    }
    
    /**
     * Gets the current connection state for the client
     * @returns {WAState} 
     */
    async getState(): Promise<typeof WAState[keyof typeof WAState]> {
        const result = await this.evaluate(() => {
            if(!window.Store || !window.Store.AppState || !window.Store.AppState.state) return null;
            return window.Store.AppState.state;
        });
        return result as typeof WAState[keyof typeof WAState];
    }

    /**
     * Marks the client as online
     */
    async sendPresenceAvailable(): Promise<void> {
        return await this.evaluate(() => {
            if (!window.Store || !window.Store.PresenceUtils || !window.Store.PresenceUtils.sendPresenceAvailable) {
                throw new Error('window.Store.PresenceUtils.sendPresenceAvailable is not defined');
            }
            return window.Store.PresenceUtils.sendPresenceAvailable();
        });
    }

    /**
     * Marks the client as unavailable
     */
    async sendPresenceUnavailable(): Promise<void> {
        return await this.evaluate(() => {
            if (!window.Store || !window.Store.PresenceUtils || !window.Store.PresenceUtils.sendPresenceUnavailable) {
                throw new Error('window.Store.PresenceUtils.sendPresenceUnavailable is not defined');
            }
            return window.Store.PresenceUtils.sendPresenceUnavailable();
        });
    }

    /**
     * Enables and returns the archive state of the Chat
     * @returns {boolean}
     */
    async archiveChat(chatId: string): Promise<boolean> {
        return await this.evaluate(async chatId => {
            if (!window.WWebJS || !window.WWebJS.getChat || !window.Store || !window.Store.Cmd || !window.Store.Cmd.archiveChat) {
                throw new Error('window.WWebJS.getChat or window.Store.Cmd.archiveChat is not defined');
            }
            const chat = await window.WWebJS.getChat(chatId, { getAsModel: false });
            await window.Store.Cmd.archiveChat(chat, true);
            return true;
        }, chatId);
    }

    /**
     * Changes and returns the archive state of the Chat
     * @returns {boolean}
     */
    async unarchiveChat(chatId: string): Promise<boolean> {
        return await this.evaluate(async chatId => {
            if (!window.WWebJS || !window.WWebJS.getChat || !window.Store || !window.Store.Cmd || !window.Store.Cmd.archiveChat) {
                throw new Error('window.WWebJS.getChat or window.Store.Cmd.archiveChat is not defined');
            }
            const chat = await window.WWebJS.getChat(chatId, { getAsModel: false });
            await window.Store.Cmd.archiveChat(chat, false);
            return false;
        }, chatId);
    }

    /**
     * Pins the Chat
     * @returns {Promise<boolean>} New pin state. Could be false if the max number of pinned chats was reached.
     */
    async pinChat(chatId: string): Promise<boolean> {
        return await this.evaluate(async chatId => {
            if (!window.WWebJS || !window.WWebJS.getChat || !window.Store || !window.Store.Chat || !window.Store.Chat.getModelsArray || !window.Store.Cmd || !window.Store.Cmd.pinChat) {
                throw new Error('window.WWebJS.getChat or window.Store.Chat.getModelsArray or window.Store.Cmd.pinChat is not defined');
            }
            const chat = await window.WWebJS.getChat(chatId, { getAsModel: false });
            if (chat.pin) {
                return true;
            }
            const MAX_PIN_COUNT = 3;
            const chatModels = window.Store.Chat.getModelsArray();
            if (chatModels.length > MAX_PIN_COUNT) {
                const maxPinned = chatModels[MAX_PIN_COUNT - 1].pin;
                if (maxPinned) {
                    return false;
                }
            }
            await window.Store.Cmd.pinChat(chat, true);
            return true;
        }, chatId);
    }

    /**
     * Unpins the Chat
     * @returns {Promise<boolean>} New pin state
     */
    async unpinChat(chatId: string): Promise<boolean> {
        return await this.evaluate(async chatId => {
            if (!window.WWebJS || !window.WWebJS.getChat || !window.Store || !window.Store.Cmd || !window.Store.Cmd.pinChat) {
                throw new Error('window.WWebJS.getChat or window.Store.Cmd.pinChat is not defined');
            }
            const chat = await window.WWebJS.getChat(chatId, { getAsModel: false });
            if (!chat.pin) {
                return false;
            }
            await window.Store.Cmd.pinChat(chat, false);
            return false;
        }, chatId);
    }

    /**
     * Mutes this chat forever, unless a date is specified
     * @param {string} chatId ID of the chat that will be muted
     * @param {?Date} unmuteDate Date when the chat will be unmuted, don't provide a value to mute forever
     * @returns {Promise<{isMuted: boolean, muteExpiration: number}>}
     */
    async muteChat(chatId: string, unmuteDate?: Date): Promise<{isMuted: boolean, muteExpiration: number}> {
        const unmuteDateTs = unmuteDate ? Math.floor(unmuteDate.getTime() / 1000) : -1;
        return await this._muteUnmuteChat(chatId, 'MUTE', unmuteDateTs);
    }

    /**
     * Unmutes the Chat
     * @param {string} chatId ID of the chat that will be unmuted
     * @returns {Promise<{isMuted: boolean, muteExpiration: number}>}
     */
    async unmuteChat(chatId: string): Promise<{isMuted: boolean, muteExpiration: number}> {
        return await this._muteUnmuteChat(chatId, 'UNMUTE');
    }

    /**
     * Internal method to mute or unmute the chat
     * @param {string} chatId ID of the chat that will be muted/unmuted
     * @param {string} action The action: 'MUTE' or 'UNMUTE'
     * @param {number} unmuteDateTs Timestamp at which the chat will be unmuted
     * @returns {Promise<{isMuted: boolean, muteExpiration: number}>}
     */
    async _muteUnmuteChat (chatId: string, action: string, unmuteDateTs?: number): Promise<{isMuted: boolean, muteExpiration: number}> {
        return await this.evaluate(async (chatId, action, unmuteDateTs) => {
            if (!window.Store || !window.Store.Chat || !window.Store.Chat.get || !window.Store.Chat.find) {
                throw new Error('window.Store.Chat.get or window.Store.Chat.find is not defined');
            }
            const chat = window.Store.Chat.get(chatId) ?? await window.Store.Chat.find(chatId);
            action === 'MUTE'
                ? await chat.mute.mute({ expiration: unmuteDateTs, sendDevice: true })
                : await chat.mute.unmute({ sendDevice: true });
            return { isMuted: chat.mute.expiration !== 0, muteExpiration: chat.mute.expiration };
        }, chatId, action, unmuteDateTs || -1);
    }

    /**
     * Mark the Chat as unread
     * @param {string} chatId ID of the chat that will be marked as unread
     */
    async markChatUnread(chatId: string): Promise<void> {
        await this.evaluate(async chatId => {
            if (!window.WWebJS || !window.WWebJS.getChat || !window.Store || !window.Store.Cmd || !window.Store.Cmd.markChatUnread) {
                throw new Error('window.WWebJS.getChat or window.Store.Cmd.markChatUnread is not defined');
            }
            const chat = await window.WWebJS.getChat(chatId, { getAsModel: false });
            await window.Store.Cmd.markChatUnread(chat, true);
        }, chatId);
    }

    /**
     * Returns the contact ID's profile picture URL, if privacy settings allow it
     * @param {string} contactId the whatsapp user's ID
     * @returns {Promise<string>}
     */
    async getProfilePicUrl(contactId: string): Promise<string> {
        const profilePic = await this.evaluate(async contactId => {
            if (!window.Store || !window.Store.WidFactory || !window.Store.WidFactory.createWid || !window.compareWwebVersions || !window.Store.ProfilePic || !window.Store.ProfilePic.profilePicFind || !window.Store.ProfilePic.requestProfilePicFromServer) {
                throw new Error('window.Store.WidFactory.createWid or window.compareWwebVersions or window.Store.ProfilePic.profilePicFind or window.Store.ProfilePic.requestProfilePicFromServer is not defined');
            }
            try {
                const chatWid = window.Store.WidFactory.createWid(contactId);
                return window.compareWwebVersions(window.Debug.VERSION, '<', '2.3000.0')
                    ? await window.Store.ProfilePic.profilePicFind(chatWid)
                    : await window.Store.ProfilePic.requestProfilePicFromServer(chatWid);
            } catch (err) {
                if((err as Error).name === 'ServerStatusCodeError') return undefined;
                throw err;
            }
        }, contactId);
        
        return profilePic ? profilePic.eurl : undefined;
    }

    /**
     * Gets the Contact's common groups with you. Returns empty array if you don't have any common group.
     * @param {string} contactId the whatsapp user's ID (_serialized format)
     * @returns {Promise<WAWebJS.ChatId[]>}
     */
    async getCommonGroups(contactId: string): Promise<ChatId[]> {
        const commonGroups = await this.evaluate(async (contactId) => {
            if (!window.Store || !window.Store.Contact || !window.Store.Contact.get || !window.Store.WidFactory || !window.Store.WidFactory.createUserWid || !window.Store.Contact.getModelsArray || !window.Store.findCommonGroups) {
                throw new Error('window.Store.Contact.get or window.Store.WidFactory.createUserWid or window.Store.Contact.getModelsArray or window.Store.findCommonGroups is not defined');
            }
            let contact = window.Store.Contact.get(contactId);
            if (!contact) {
                const wid = window.Store.WidFactory.createUserWid(contactId);
                const chatConstructor = window.Store.Contact.getModelsArray().find(c=>!c.isGroup).constructor;
                contact = new chatConstructor({id: wid});
            }

            if (contact.commonGroups) {
                return contact.commonGroups.serialize();
            }
            const status = await window.Store.findCommonGroups(contact);
            if (status) {
                return contact.commonGroups.serialize();
            }
            return [];
        }, contactId);
        const chats = [];
        for (const group of commonGroups) {
            chats.push(group.id);
        }
        return chats;
    }

    /**
     * Force reset of connection state for the client
    */
    async resetState(): Promise<void> {
        await this.evaluate(() => {
            if (!window.Store || !window.Store.AppState || !window.Store.AppState.reconnect) {
                throw new Error('window.Store.AppState.reconnect is not defined');
            }
            window.Store.AppState.reconnect(); 
        });
    }

    /**
     * Check if a given ID is registered in whatsapp
     * @param {string} contactId the whatsapp user's ID
     */
    async isRegisteredUser(contactId: string): Promise<boolean> {
        return Boolean(await this.getNumberId(contactId));
    }

    /**
     * Get the registered WhatsApp ID for a number. 
     * Will return null if the number is not registered on WhatsApp.
     * @param {string} number Number or ID ("@c.us" will be automatically appended if not specified)
     * @returns {Promise<Object|null>}
     */
    async getNumberId(number: string): Promise<ContactId | null> {
        if (!number.endsWith('@c.us')) {
            number += '@c.us';
        }

        return await this.evaluate(async number => {
            if (!window.Store || !window.Store.WidFactory || !window.Store.WidFactory.createWid || !window.Store.QueryExist) {
                throw new Error('window.Store.WidFactory.createWid or window.Store.QueryExist is not defined');
            }
            const wid = window.Store.WidFactory.createWid(number);
            const result = await window.Store.QueryExist(wid);
            if (!result || result.wid === undefined) return null;
            return result.wid;
        }, number);
    }

    /**
     * Get the formatted number of a WhatsApp ID. (12345678901@c.us) => (+1 (234) 5678-901)
     * @param {string} number Number or ID
     * @returns {Promise<string>}
     */
    async getFormattedNumber(number: string): Promise<string> {
        if (!number.endsWith('@s.whatsapp.net')) number = number.replace('c.us', 's.whatsapp.net');
        if (!number.includes('@s.whatsapp.net')) number = `${number}@s.whatsapp.net`;

        return await this.evaluate(numberId => {
            if (!window.Store || !window.Store.NumberInfo || !window.Store.NumberInfo.formattedPhoneNumber) {
                throw new Error('window.Store.NumberInfo.formattedPhoneNumber is not defined');
            }
            return window.Store.NumberInfo.formattedPhoneNumber(numberId);
        }, number);
    }

    /**
     * Get the country code of a WhatsApp ID. (154185968@c.us) => (1)
     * @param {string} number Number or ID
     * @returns {Promise<string>}
     */
    async getCountryCode(number: string): Promise<string> {
        number = number.replace(' ', '').replace('+', '').replace('@c.us', '');

        return await this.evaluate(numberId => {
            if (!window.Store || !window.Store.NumberInfo || !window.Store.NumberInfo.findCC) {
                throw new Error('window.Store.NumberInfo.findCC is not defined');
            }
            return window.Store.NumberInfo.findCC(numberId);
        }, number);
    }

    /**
     * An object that represents the result for a participant added to a group
     * @typedef {Object} ParticipantResult
     * @property {number} statusCode The status code of the result
     * @property {string} message The result message
     * @property {boolean} isGroupCreator Indicates if the participant is a group creator
     * @property {boolean} isInviteV4Sent Indicates if the inviteV4 was sent to the participant
     */

    /**
     * Creates a new group
     * @param {string} title Group title
     * @param {string|Contact|Array<Contact|string>|undefined} participants A single Contact object or an ID as a string or an array of Contact objects or contact IDs to add to the group
     * @param {CreateGroupOptions} options An object that handles options for group creation
     * @returns {Promise<CreateGroupResult|string>} Object with resulting data or an error message as a string
     */
    async createGroup(title: string, participants?: string | Contact | Contact[] | string[], options?: CreateGroupOptions): Promise< CreateGroupResult | string > {
        !Array.isArray(participants) && (participants = [participants as Contact]);
        participants.map(p => (p instanceof Contact) ? p.id._serialized : p);

        return await this.evaluate(async (title, participants, options: any) => {
            if (!window.Store || !window.Store.WidFactory || !window.Store.WidFactory.createWid || !window.Store.QueryExist || !window.Store.GroupUtils || !window.Store.GroupUtils.createGroup || !window.Store.Contact || !window.Store.Contact.gadd || !window.Store.GroupInviteV4 || !window.Store.GroupInviteV4.sendGroupInviteMessage || !window.Store.Chat || !window.Store.Chat.find || !window.WWebJS || !window.WWebJS.getProfilePicThumbToBase64 || !window.compareWwebVersions) {
                throw new Error('window.Store.WidFactory.createWid or window.Store.QueryExist or window.Store.GroupUtils.createGroup or window.Store.Contact.gadd or window.Store.GroupInviteV4.sendGroupInviteMessage or window.Store.Chat.find or window.WWebJS.getProfilePicThumbToBase64 or window.compareWwebVersions is not defined');
            }
            const { messageTimer = 0, parentGroupId, autoSendInviteV4 = true, comment = '' } = options;
            const participantData = {}, participantWids = [], failedParticipants = [];

            const addParticipantResultCodes = {
                default: 'An unknown error occupied while adding a participant',
                200: 'The participant was added successfully',
                403: 'The participant can be added by sending private invitation only',
                404: 'The phone number is not registered on WhatsApp'
            };

            for (const participant of participants) {
                const pWid = window.Store.WidFactory.createWid(participant as string);
                if ((await window.Store.QueryExist(pWid))?.wid) participantWids.push(pWid);
                else failedParticipants.push(participant);
            }

            let parentGroupWid: any;
            parentGroupId && (parentGroupWid = window.Store.WidFactory.createWid(parentGroupId));

            let createGroupResult: any;
            try {
                createGroupResult = await window.Store.GroupUtils.createGroup(
                    {
                        'memberAddMode': options.memberAddMode === undefined ? true : options.memberAddMode,
                        'membershipApprovalMode': options.membershipApprovalMode === undefined ? false : options.membershipApprovalMode,
                        'announce': options.announce === undefined ? true : options.announce,
                        'ephemeralDuration': messageTimer,
                        'full': undefined,
                        'parentGroupId': parentGroupWid,
                        'restrict': options.restrict === undefined ? true : options.restrict,
                        'thumb': undefined,
                        'title': title,
                    },
                    participantWids
                );
            } catch (_err) {
                return 'CreateGroupError: An unknown error occupied while creating a group';
            }

            for (const participant of createGroupResult.participants) {
                let isInviteV4Sent = false;
                const participantId = participant.wid._serialized;
                const statusCode = participant.error || 200;

                if (autoSendInviteV4 && statusCode === 403) {
                    window.Store.Contact.gadd(participant.wid, { silent: true });
                    const addParticipantResult = await window.Store.GroupInviteV4.sendGroupInviteMessage(
                        await window.Store.Chat.find(participant.wid),
                        createGroupResult.wid._serialized,
                        createGroupResult.subject,
                        participant.invite_code,
                        participant.invite_code_exp,
                        comment,
                        await window.WWebJS.getProfilePicThumbToBase64(createGroupResult.wid)
                    );
                    isInviteV4Sent = window.compareWwebVersions(window.Debug.VERSION, '<', '2.2335.6')
                        ? addParticipantResult === 'OK'
                        : addParticipantResult.messageSendResult === 'OK';
                }

                participantData[participantId] = {
                    statusCode: statusCode,
                    message: addParticipantResultCodes[statusCode] || addParticipantResultCodes.default,
                    isGroupCreator: participant.type === 'superadmin',
                    isInviteV4Sent: isInviteV4Sent
                };
            }

            for (const f of failedParticipants) {
                participantData[f] = {
                    statusCode: 404,
                    message: addParticipantResultCodes[404],
                    isGroupCreator: false,
                    isInviteV4Sent: false
                };
            }

            return { title: title, gid: createGroupResult.wid, participants: participantData };
        }, title, participants, options);
    }

    /**
     * Creates a new channel
     * @param {string} title The channel name
     * @param {CreateChannelOptions} options 
     * @returns {Promise<CreateChannelResult|string>} Returns an object that handles the result for the channel creation or an error message as a string
     */
    async createChannel(title: string, options?: CreateChannelOptions): Promise<CreateChannelResult | string> {
        const result = await this.evaluate(async (title, options) => {
            if (!window.Store || !window.Store.ChannelUtils || !window.Store.ChannelUtils.isNewsletterCreationEnabled || !window.WWebJS || !window.WWebJS.cropAndResizeImage || !window.Store.ChannelUtils.createNewsletterQuery || !window.Store.JidToWid || !window.Store.JidToWid.newsletterJidToWid) {
                throw new Error('window.Store.ChannelUtils.isNewsletterCreationEnabled or window.WWebJS.cropAndResizeImage or window.Store.ChannelUtils.createNewsletterQuery or window.Store.JidToWid.newsletterJidToWid is not defined');
            }
            let response: any;
            const { description = null, picture: pictureData = null } = options;

            if (!window.Store.ChannelUtils.isNewsletterCreationEnabled()) {
                return 'CreateChannelError: A channel creation is not enabled';
            }

            let picture: any;
            if (pictureData) {
                picture = await window.WWebJS.cropAndResizeImage(pictureData, {
                    asDataUrl: true,
                    mimetype: 'image/jpeg',
                    size: 640,
                    quality: 1
                });
            }

            try {
                response = await window.Store.ChannelUtils.createNewsletterQuery({
                    name: title,
                    description: description,
                    picture: picture,
                });
            } catch (err) {
                if ((err as Error).name === 'ServerStatusCodeError') {
                    return 'CreateChannelError: An error occupied while creating a channel';
                }
                throw err;
            }

            return {
                title: title,
                nid: window.Store.JidToWid.newsletterJidToWid(response.idJid),
                inviteLink: `https://whatsapp.com/channel/${response.newsletterInviteLinkMetadataMixin.inviteCode}`,
                createdAtTs: response.newsletterCreationTimeMetadataMixin.creationTimeValue
            };
        }, title, options);

        return result as any;
    }

    /**
     * Subscribe to channel
     * @param {string} channelId The channel ID
     * @returns {Promise<boolean>} Returns true if the operation completed successfully, false otherwise
     */
    async subscribeToChannel(channelId: string): Promise<boolean> {
        return await this.evaluate(async (channelId) => {
            if (!window.WWebJS || !window.WWebJS.subscribeToUnsubscribeFromChannel) {
                throw new Error('window.WWebJS.subscribeToUnsubscribeFromChannel is not defined');
            }
            return await window.WWebJS.subscribeToUnsubscribeFromChannel(channelId, 'Subscribe');
        }, channelId);
    }
    /**
     * Unsubscribe from channel
     * @param {string} channelId The channel ID
     * @param {UnsubscribeOptions} options
     * @returns {Promise<boolean>} Returns true if the operation completed successfully, false otherwise
     */
    async unsubscribeFromChannel(channelId: string, options?: UnsubscribeOptions): Promise<boolean> {
        return await this.evaluate(async (channelId, options) => {
            if (!window.WWebJS || !window.WWebJS.subscribeToUnsubscribeFromChannel) {
                throw new Error('window.WWebJS.subscribeToUnsubscribeFromChannel is not defined');
            }
            return await window.WWebJS.subscribeToUnsubscribeFromChannel(channelId, 'Unsubscribe', options);
        }, channelId, options);
    }

    /**
     * Options for transferring a channel ownership to another user
     * @typedef {Object} TransferChannelOwnershipOptions
     * @property {boolean} [shouldDismissSelfAsAdmin = false] If true, after the channel ownership is being transferred to another user, the current user will be dismissed as a channel admin and will become to a channel subscriber.
     */

    /**
     * Transfers a channel ownership to another user.
     * Note: the user you are transferring the channel ownership to must be a channel admin.
     * @param {string} channelId
     * @param {string} newOwnerId
     * @param {TransferChannelOwnershipOptions} options
     * @returns {Promise<boolean>} Returns true if the operation completed successfully, false otherwise
     */
    async transferChannelOwnership(channelId: string, newOwnerId: string, options: TransferChannelOwnershipOptions = {}): Promise<boolean> {
        return await this.evaluate(async (channelId, newOwnerId, options) => {
            if (!window.WWebJS || !window.WWebJS.getChat || !window.Store || !window.Store.Contact || !window.Store.Contact.get || !window.Store.Contact.find || !window.Store.NewsletterMetadataCollection || !window.Store.NewsletterMetadataCollection.update || !window.Store.ChannelUtils || !window.Store.ChannelUtils.changeNewsletterOwnerAction || !window.Store.ContactCollection || !window.Store.ContactCollection.getMeContact || !window.Store.ChannelUtils.demoteNewsletterAdminAction) {
                throw new Error('window.WWebJS.getChat or window.Store.Contact.get or window.Store.Contact.find or window.Store.NewsletterMetadataCollection.update or window.Store.ChannelUtils.changeNewsletterOwnerAction or window.Store.ContactCollection.getMeContact or window.Store.ChannelUtils.demoteNewsletterAdminAction is not defined');
            }
            const channel = await window.WWebJS.getChat(channelId, { getAsModel: false });
            const newOwner = window.Store.Contact.get(newOwnerId) || (await window.Store.Contact.find(newOwnerId));
            if (!channel.newsletterMetadata) {
                await window.Store.NewsletterMetadataCollection.update(channel.id);
            }

            try {
                await window.Store.ChannelUtils.changeNewsletterOwnerAction(channel, newOwner);

                if (options.shouldDismissSelfAsAdmin) {
                    const meContact = window.Store.ContactCollection.getMeContact();
                    meContact && (await window.Store.ChannelUtils.demoteNewsletterAdminAction(channel, meContact));
                }
            } catch (_error) {
                return false;
            }

            return true;
        }, channelId, newOwnerId, options);
    }

    /**
     * Searches for channels based on search criteria, there are some notes:
     * 1. The method finds only channels you are not subscribed to currently
     * 2. If you have never been subscribed to a found channel
     * or you have unsubscribed from it with {@link UnsubscribeOptions.deleteLocalModels} set to 'true',
     * the lastMessage property of a found channel will be 'null'
     *
     * @param {Object} searchOptions Search options
     * @param {string} [searchOptions.searchText = ''] Text to search
     * @param {Array<string>} [searchOptions.countryCodes = [your local region]] Array of country codes in 'ISO 3166-1 alpha-2' standart (@see https://en.wikipedia.org/wiki/ISO_3166-1_alpha-2) to search for channels created in these countries
     * @param {boolean} [searchOptions.skipSubscribedNewsletters = false] If true, channels that user is subscribed to won't appear in found channels
     * @param {number} [searchOptions.view = 0] View type, makes sense only when the searchText is empty. Valid values to provide are:
     * 0 for RECOMMENDED channels
     * 1 for TRENDING channels
     * 2 for POPULAR channels
     * 3 for NEW channels
     * @param {number} [searchOptions.limit = 50] The limit of found channels to be appear in the returnig result
     * @returns {Promise<Array<Channel>|[]>} Returns an array of Channel objects or an empty array if no channels were found
     */
    async searchChannels(searchOptions: SearchChannelsOptions = {}): Promise<Array<Channel> | []> {
        return await this.evaluate(async ({
            searchText = '',
            countryCodes = [window.Store.ChannelUtils.currentRegion],
            skipSubscribedNewsletters = false,
            view = 0,
            limit = 50
        }) => {
            if (!window.Store || !window.Store.ChannelUtils || !window.Store.ChannelUtils.currentRegion || !window.Store.ChannelUtils.countryCodesIso || !window.Store.ChannelUtils.getNewsletterDirectoryPageSize || !window.Store.ChannelUtils.fetchNewsletterDirectories || !window.WWebJS || !window.WWebJS.getChatModel) {
                throw new Error('window.Store.ChannelUtils.currentRegion or window.Store.ChannelUtils.countryCodesIso or window.Store.ChannelUtils.getNewsletterDirectoryPageSize or window.Store.ChannelUtils.fetchNewsletterDirectories or window.WWebJS.getChatModel is not defined');
            }
            searchText = searchText.trim();
            const currentRegion = window.Store.ChannelUtils.currentRegion;
            if (![0, 1, 2, 3].includes(view)) view = 0;

            countryCodes = countryCodes.length === 1 && countryCodes[0] === currentRegion
                ? countryCodes
                : countryCodes.filter((code) => Object.keys(window.Store.ChannelUtils.countryCodesIso).includes(code));

            const viewTypeMapping = {
                0: 'RECOMMENDED',
                1: 'TRENDING',
                2: 'POPULAR',
                3: 'NEW'
            };

            searchOptions = {
                searchText: searchText,
                countryCodes: countryCodes,
                skipSubscribedNewsletters: skipSubscribedNewsletters,
                view: viewTypeMapping[view],
                categories: [],
                cursorToken: ''
            };
            
            const originalFunction = window.Store.ChannelUtils.getNewsletterDirectoryPageSize;
            limit !== 50 && (window.Store.ChannelUtils.getNewsletterDirectoryPageSize = () => limit);

            const channels = (await window.Store.ChannelUtils.fetchNewsletterDirectories(searchOptions)).newsletters;

            limit !== 50 && (window.Store.ChannelUtils.getNewsletterDirectoryPageSize = originalFunction);

            return channels
                ? await Promise.all(channels.map((channel) => window.WWebJS.getChatModel(channel, { isChannel: true })))
                : [];
        }, searchOptions);
    }

    /**
     * Deletes the channel you created
     * @param {string} channelId The ID of a channel to delete
     * @returns {Promise<boolean>} Returns true if the operation completed successfully, false otherwise
     */
    async deleteChannel(channelId: string): Promise<boolean> {
        return await this.evaluate(async (channelId) => {
            if (!window.WWebJS || !window.WWebJS.getChat || !window.Store || !window.Store.ChannelUtils || !window.Store.ChannelUtils.deleteNewsletterAction) {
                throw new Error('window.WWebJS.getChat or window.Store.ChannelUtils.deleteNewsletterAction is not defined');
            }
            const channel = await window.WWebJS.getChat(channelId, { getAsModel: false });
            if (!channel) return false;
            try {
                await window.Store.ChannelUtils.deleteNewsletterAction(channel);
                return true;
            } catch (err) {
                if ((err as Error).name === 'ServerStatusCodeError') return false;
                throw err;
            }
        }, channelId);
    }

    /**
     * Get all current Labels
     * @returns {Promise<Array<Label>>}
     */
    async getLabels(): Promise<Array<Label>> {
        const labels = await this.evaluate(() => {
            if (!window.WWebJS || !window.WWebJS.getLabels) {
                throw new Error('window.WWebJS.getLabels is not defined');
            }
            return window.WWebJS.getLabels();
        });

        return labels.map(data => new Label(this, data));
    }
    
    /**
     * Get all current Broadcast
     * @returns {Promise<Array<Broadcast>>}
     */
    async getBroadcasts(): Promise<Array<Broadcast>> {
        const broadcasts = await this.evaluate(() => {
            if (!window.WWebJS || !window.WWebJS.getAllStatuses) {
                throw new Error('window.WWebJS.getAllStatuses is not defined');
            }
            return window.WWebJS.getAllStatuses();
        });
        return broadcasts.map(data => new Broadcast(this, data));
    }

    /**
     * Get Label instance by ID
     * @param {string} labelId
     * @returns {Promise<Label>}
     */
    async getLabelById(labelId: string): Promise<Label> {
        const label = await this.evaluate((labelId) => {
            if (!window.WWebJS || !window.WWebJS.getLabel) {
                throw new Error('window.WWebJS.getLabel is not defined');
            }
            return window.WWebJS.getLabel(labelId);
        }, labelId);

        return new Label(this, label);
    }

    /**
     * Get all Labels assigned to a chat 
     * @param {string} chatId
     * @returns {Promise<Array<Label>>}
     */
    async getChatLabels(chatId: string): Promise<Array<Label>> {
        const labels = await this.evaluate((chatId) => {
            if (!window.WWebJS || !window.WWebJS.getChatLabels) {
                throw new Error('window.WWebJS.getChatLabels is not defined');
            }
            return window.WWebJS.getChatLabels(chatId);
        }, chatId);

        return labels.map(data => new Label(this, data));
    }

    /**
     * Get all Chats for a specific Label
     * @param {string} labelId
     * @returns {Promise<Array<Chat>>}
     */
    async getChatsByLabelId(labelId: string): Promise<Array<Chat>> {
        const chatIds = await this.evaluate((labelId) => {
            if (!window.Store || !window.Store.Label || !window.Store.Label.get || !window.Store.Label.labelItemCollection || !window.Store.Label.labelItemCollection.getModelsArray) {
                throw new Error('window.Store.Label.get or window.Store.Label.labelItemCollection.getModelsArray is not defined');
            }
            const label = window.Store.Label.get(labelId);
            const labelItems = label.labelItemCollection.getModelsArray();
            return labelItems.reduce((result, item) => {
                if (item.parentType === 'Chat') {
                    result.push(item.parentId);
                }
                return result;
            }, []);
        }, labelId);

        return Promise.all(chatIds.map(id => this.getChatById(id)));
    }

    /**
     * Gets all blocked contacts by host account
     * @returns {Promise<Array<Contact>>}
     */
    async getBlockedContacts(): Promise<Array<Contact>> {
        const blockedContacts = await this.evaluate(() => {
            if (!window.Store || !window.Store.Blocklist || !window.Store.Blocklist.getModelsArray || !window.WWebJS || !window.WWebJS.getContact) {
                throw new Error('window.Store.Blocklist.getModelsArray or window.WWebJS.getContact is not defined');
            }
            const chatIds = window.Store.Blocklist.getModelsArray().map((a: { id: { _serialized: string } }) => a.id._serialized);
            return Promise.all(chatIds.map((id: string) => window.WWebJS.getContact(id)));
        });

        return blockedContacts.map(contact => ContactFactory.create(this, contact));
    }

    /**
     * Sets the current user's profile picture.
     * @param {MessageMedia} media
     * @returns {Promise<boolean>} Returns true if the picture was properly updated.
     */
    async setProfilePicture(media: MessageMedia): Promise<boolean> {
        const success = await this.evaluate((chatid, media) => {
            if (!window.WWebJS || !window.WWebJS.setPicture) {
                throw new Error('window.WWebJS.setPicture is not defined');
            }
            return window.WWebJS.setPicture(chatid, media);
        }, this.info.wid._serialized, media);

        return success;
    }

    /**
     * Deletes the current user's profile picture.
     * @returns {Promise<boolean>} Returns true if the picture was properly deleted.
     */
    async deleteProfilePicture(): Promise<boolean> {
        const success = await this.evaluate((chatid) => {
            if (!window.WWebJS || !window.WWebJS.deletePicture) {
                throw new Error('window.WWebJS.deletePicture is not defined');
            }
            return window.WWebJS.deletePicture(chatid);
        }, this.info.wid._serialized);

        return success;
    }
    
    /**
     * Change labels in chats
     * @param {Array<number|string>} labelIds
     * @param {Array<string>} chatIds
     * @returns {Promise<void>}
     */
    async addOrRemoveLabels(labelIds: Array<number|string>, chatIds: Array<string>): Promise<void> {

        return await this.evaluate(async (labelIds, chatIds) => {
            if (!window.Store || !window.Store.Conn || !window.Store.Conn.platform || !window.WWebJS || !window.WWebJS.getLabels || !window.Store.Chat || !window.Store.Chat.filter || !window.Store.Label || !window.Store.Label.addOrRemoveLabels) {
                throw new Error('window.Store.Conn.platform or window.WWebJS.getLabels or window.Store.Chat.filter or window.Store.Label.addOrRemoveLabels is not defined');
            }
            if (['smba', 'smbi'].indexOf(window.Store.Conn.platform) === -1) {
                throw '[LT01] Only Whatsapp business';
            }
            const labels = window.WWebJS.getLabels().filter(e => labelIds.find(l => l == e.id) !== undefined);
            const chats = window.Store.Chat.filter(e => chatIds.includes(e.id._serialized));

            const actions = labels.map(label => ({id: label.id, type: 'add'}));

            chats.forEach((chat) => {
                (chat.labels || []).forEach(n => {
                    if (!actions.find(e => e.id == n)) {
                        actions.push({id: n, type: 'remove'});
                    }
                });
            });

            return await window.Store.Label.addOrRemoveLabels(actions, chats);
        }, labelIds, chatIds);
    }

    /**
     * An object that handles the information about the group membership request
     * @typedef {Object} GroupMembershipRequest
     * @property {Object} id The wid of a user who requests to enter the group
     * @property {Object} addedBy The wid of a user who created that request
     * @property {Object|null} parentGroupId The wid of a community parent group to which the current group is linked
     * @property {string} requestMethod The method used to create the request: NonAdminAdd/InviteLink/LinkedGroupJoin
     * @property {number} t The timestamp the request was created at
     */

    /**
     * Gets an array of membership requests
     * @param {string} groupId The ID of a group to get membership requests for
     * @returns {Promise<Array<GroupMembershipRequest>>} An array of membership requests
     */
    async getGroupMembershipRequests(groupId: string): Promise<Array<GroupMembershipRequest>> {
        return await this.evaluate(async (groupId) => {
            if (!window.Store || !window.Store.WidFactory || !window.Store.WidFactory.createWid || !window.Store.MembershipRequestUtils || !window.Store.MembershipRequestUtils.getMembershipApprovalRequests) {
                throw new Error('window.Store.WidFactory.createWid or window.Store.MembershipRequestUtils.getMembershipApprovalRequests is not defined');
            }
            const groupWid = window.Store.WidFactory.createWid(groupId);
            return await window.Store.MembershipRequestUtils.getMembershipApprovalRequests(groupWid);
        }, groupId);
    }

    /**
     * An object that handles the result for membership request action
     * @typedef {Object} MembershipRequestActionResult
     * @property {string} requesterId User ID whos membership request was approved/rejected
     * @property {number|undefined} error An error code that occurred during the operation for the participant
     * @property {string} message A message with a result of membership request action
     */

    /**
     * An object that handles options for {@link approveGroupMembershipRequests} and {@link rejectGroupMembershipRequests} methods
     * @typedef {Object} MembershipRequestActionOptions
     * @property {Array<string>|string|null} requesterIds User ID/s who requested to join the group, if no value is provided, the method will search for all membership requests for that group
     * @property {Array<number>|number|null} sleep The number of milliseconds to wait before performing an operation for the next requester. If it is an array, a random sleep time between the sleep[0] and sleep[1] values will be added (the difference must be >=100 ms, otherwise, a random sleep time between sleep[1] and sleep[1] + 100 will be added). If sleep is a number, a sleep time equal to its value will be added. By default, sleep is an array with a value of [250, 500]
     */

    /**
     * Approves membership requests if any
     * @param {string} groupId The group ID to get the membership request for
     * @param {MembershipRequestActionOptions} options Options for performing a membership request action
     * @returns {Promise<Array<MembershipRequestActionResult>>} Returns an array of requester IDs whose membership requests were approved and an error for each requester, if any occurred during the operation. If there are no requests, an empty array will be returned
     */
    async approveGroupMembershipRequests(groupId: string, options: MembershipRequestActionOptions = {}): Promise<Array<MembershipRequestActionResult>> {
        return await this.evaluate(async (groupId, options) => {
            if (!window.WWebJS || !window.WWebJS.membershipRequestAction) {
                throw new Error('window.WWebJS.membershipRequestAction is not defined');
            }
            const { requesterIds = null, sleep = [250, 500] } = options;
            return await window.WWebJS.membershipRequestAction(groupId, 'Approve', requesterIds as string[], sleep as [number, number]);
        }, groupId, options);
    }

    /**
     * Rejects membership requests if any
     * @param {string} groupId The group ID to get the membership request for
     * @param {MembershipRequestActionOptions} options Options for performing a membership request action
     * @returns {Promise<Array<MembershipRequestActionResult>>} Returns an array of requester IDs whose membership requests were rejected and an error for each requester, if any occurred during the operation. If there are no requests, an empty array will be returned
     */
    async rejectGroupMembershipRequests(groupId: string, options: MembershipRequestActionOptions = {}): Promise<Array<MembershipRequestActionResult>> {
        return await this.evaluate(async (groupId, options) => {
            if (!window.WWebJS || !window.WWebJS.membershipRequestAction) {
                throw new Error('window.WWebJS.membershipRequestAction is not defined');
            }
            const { requesterIds = null, sleep = [250, 500] } = options;
            return await window.WWebJS.membershipRequestAction(groupId, 'Reject', requesterIds as string[], sleep as [number, number]);
        }, groupId, options);
    }


    /**
     * Setting  autoload download audio
     * @param {boolean} flag true/false
     */
    async setAutoDownloadAudio(flag: boolean): Promise<void> {
        await this.evaluate(async flag => {
            if (!window.Store || !window.Store.Settings || !window.Store.Settings.getAutoDownloadAudio || !window.Store.Settings.setAutoDownloadAudio) {
                throw new Error('window.Store.Settings.getAutoDownloadAudio or window.Store.Settings.setAutoDownloadAudio is not defined');
            }
            const autoDownload = window.Store.Settings.getAutoDownloadAudio();
            if (autoDownload === flag) {
                return flag;
            }
            await window.Store.Settings.setAutoDownloadAudio(flag);
            return flag;
        }, flag);
    }

    /**
     * Setting  autoload download documents
     * @param {boolean} flag true/false
     */
    async setAutoDownloadDocuments(flag: boolean): Promise<void> {
        await this.evaluate(async flag => {
            if (!window.Store || !window.Store.Settings || !window.Store.Settings.getAutoDownloadDocuments || !window.Store.Settings.setAutoDownloadDocuments) {
                throw new Error('window.Store.Settings.getAutoDownloadDocuments or window.Store.Settings.setAutoDownloadDocuments is not defined');
            }
            const autoDownload = window.Store.Settings.getAutoDownloadDocuments();
            if (autoDownload === flag) {
                return flag;
            }
            await window.Store.Settings.setAutoDownloadDocuments(flag);
            return flag;
        }, flag);
    }

    /**
     * Setting  autoload download photos
     * @param {boolean} flag true/false
     */
    async setAutoDownloadPhotos(flag: boolean): Promise<void> {
        await this.evaluate(async flag => {
            if (!window.Store || !window.Store.Settings || !window.Store.Settings.getAutoDownloadPhotos || !window.Store.Settings.setAutoDownloadPhotos) {
                throw new Error('window.Store.Settings.getAutoDownloadPhotos or window.Store.Settings.setAutoDownloadPhotos is not defined');
            }
            const autoDownload = window.Store.Settings.getAutoDownloadPhotos();
            if (autoDownload === flag) {
                return flag;
            }
            await window.Store.Settings.setAutoDownloadPhotos(flag);
            return flag;
        }, flag);
    }

    /**
     * Setting  autoload download videos
     * @param {boolean} flag true/false
     */
    async setAutoDownloadVideos(flag: boolean): Promise<void> {
        await this.evaluate(async flag => {
            if (!window.Store || !window.Store.Settings || !window.Store.Settings.getAutoDownloadVideos || !window.Store.Settings.setAutoDownloadVideos) {
                throw new Error('window.Store.Settings.getAutoDownloadVideos or window.Store.Settings.setAutoDownloadVideos is not defined');
            }
            const autoDownload = window.Store.Settings.getAutoDownloadVideos();
            if (autoDownload === flag) {
                return flag;
            }
            await window.Store.Settings.setAutoDownloadVideos(flag);
            return flag;
        }, flag);
    }

    /**
     * Setting background synchronization.
     * NOTE: this action will take effect after you restart the client.
     * @param {boolean} flag true/false
     * @returns {Promise<boolean>}
     */
    async setBackgroundSync(flag: boolean): Promise<boolean> {
        const result = await this.evaluate(async flag => {
            if (!window.Store || !window.Store.Settings || !window.Store.Settings.getGlobalOfflineNotifications || !window.Store.Settings.setGlobalOfflineNotifications) {
                throw new Error('window.Store.Settings.getGlobalOfflineNotifications or window.Store.Settings.setGlobalOfflineNotifications is not defined');
            }
            const backSync = window.Store.Settings.getGlobalOfflineNotifications();
            if (backSync === flag) {
                return flag;
            }
            await window.Store.Settings.setGlobalOfflineNotifications(flag);
            return flag;
        }, flag);
        return result as boolean;
    }
    
    /**
     * Get user device count by ID
     * Each WaWeb Connection counts as one device, and the phone (if exists) counts as one
     * So for a non-enterprise user with one WaWeb connection it should return "2"
     * @param {string} userId
     * @returns {Promise<number>}
     */
    async getContactDeviceCount(userId: string): Promise<number> {
        return await this.evaluate(async (userId) => {
            if (!window.Store || !window.Store.DeviceList || !window.Store.DeviceList.getDeviceIds || !window.Store.WidFactory || !window.Store.WidFactory.createWid) {
                throw new Error('window.Store.DeviceList.getDeviceIds or window.Store.WidFactory.createWid is not defined');
            }
            const devices = await window.Store.DeviceList.getDeviceIds([window.Store.WidFactory.createWid(userId)]);
            if (devices && devices.length && devices[0] != null && typeof devices[0].devices == 'object') {
                return devices[0].devices.length;
            }
            return 0;
        }, userId);
    }

    /**
     * Sync chat history conversation
     * @param {string} chatId
     * @return {Promise<boolean>} True if operation completed successfully, false otherwise.
     */
    async syncHistory(chatId: string): Promise<boolean> {
        return await this.evaluate(async (chatId) => {
            if (!window.Store || !window.Store.WidFactory || !window.Store.WidFactory.createWid || !window.Store.Chat || !window.Store.Chat.get || !window.Store.Chat.find || !window.Store.HistorySync || !window.Store.HistorySync.sendPeerDataOperationRequest) {
                throw new Error('window.Store.WidFactory.createWid or window.Store.Chat.get or window.Store.Chat.find or window.Store.HistorySync.sendPeerDataOperationRequest is not defined');
            }
            const chatWid = window.Store.WidFactory.createWid(chatId);
            const chat = window.Store.Chat.get(chatWid) ?? (await window.Store.Chat.find(chatWid));
            if (chat?.endOfHistoryTransferType === 0) {
                await window.Store.HistorySync.sendPeerDataOperationRequest(3, {
                    chatId: chat.id
                });
                return true;
            }
            return false;
        }, chatId);
    }
  
    /**
     * Save new contact to user's addressbook or edit the existing one
     * @param {string} phoneNumber The contact's phone number in a format "17182222222", where "1" is a country code
     * @param {string} firstName 
     * @param {string} lastName 
     * @param {boolean} [syncToAddressbook = false] If set to true, the contact will also be saved to the user's address book on their phone. False by default
     * @returns {Promise<import('..').ChatId>} Object in a wid format
     */
    async saveOrEditAddressbookContact(phoneNumber: string, firstName: string, lastName: string, syncToAddressbook: boolean = false): Promise<ChatId>
    {
        return await this.evaluate(async (phoneNumber, firstName, lastName, syncToAddressbook) => {
            if (!window.Store || !window.Store.AddressbookContactUtils || !window.Store.AddressbookContactUtils.saveContactAction) {
                throw new Error('window.Store.AddressbookContactUtils.saveContactAction is not defined');
            }
            return await window.Store.AddressbookContactUtils.saveContactAction(
                phoneNumber,
                null,
                firstName,
                lastName,
                syncToAddressbook
            );
        }, phoneNumber, firstName, lastName, syncToAddressbook);
    }

    /**
     * Deletes the contact from user's addressbook
     * @param {string} phoneNumber The contact's phone number in a format "17182222222", where "1" is a country code
     * @returns {Promise<void>}
     */
    async deleteAddressbookContact(phoneNumber: string): Promise<void>
    {
        return await this.evaluate(async (phoneNumber) => {
            if (!window.Store || !window.Store.AddressbookContactUtils || !window.Store.AddressbookContactUtils.deleteContactAction) {
                throw new Error('window.Store.AddressbookContactUtils.deleteContactAction is not defined');
            }
            return await window.Store.AddressbookContactUtils.deleteContactAction(phoneNumber);
        }, phoneNumber);
    }
}

export default Client;
