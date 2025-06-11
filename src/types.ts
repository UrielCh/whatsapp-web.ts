import type BaseAuthStrategy from "./authStrategies/BaseAuthStrategy.ts";
import type {LaunchOptions, ConnectOptions} from 'puppeteer'
import type MessageMedia from "./structures/MessageMedia.ts";
import type Poll from "./structures/Poll.ts";
import type Contact from "./structures/Contact.ts";
import type List from "./structures/List.ts";
import type Buttons from "./structures/Buttons.ts";
import type Location from "./structures/Location.ts";

/**
 * Base class which all authentication strategies extend
 */

export type AuthStrategy = BaseAuthStrategy; // T extends BaseAuthStrategy ? T : never;

export interface LocalWebCacheOptions {
    type: 'local',
    path?: string,
    strict?: boolean
}

export interface RemoteWebCacheOptions {
    type: 'remote',
    remotePath: string,
    strict?: boolean
}

export interface NoWebCacheOptions {
    type: 'none'
}

export type WebCacheOptions = NoWebCacheOptions | LocalWebCacheOptions | RemoteWebCacheOptions;

/** 
 * Represents a WhatsApp client session
 */
export interface ClientSession {
    WABrowserId: string,
    WASecretBundle: string,
    WAToken1: string,
    WAToken2: string,
}

/** Options for initializing the whatsapp client */
export interface ClientOptions {
    /** Timeout for authentication selector in puppeteer
     * @default 0 */
    authTimeoutMs?: number,
    /** Puppeteer launch options. View docs here: https://github.com/puppeteer/puppeteer/ */
    puppeteer?: LaunchOptions & ConnectOptions
	/** Determines how to save and restore sessions. Will use LegacySessionAuth if options.session is set. Otherwise, NoAuth will be used. */
    authStrategy?: AuthStrategy,
    /** The version of WhatsApp Web to use. Use options.webVersionCache to configure how the version is retrieved. */
    webVersion?: string,
    /**  Determines how to retrieve the WhatsApp Web version specified in options.webVersion. */
    webVersionCache?: WebCacheOptions,
    /** How many times should the qrcode be refreshed before giving up
	 * @default 0 (disabled) */
	qrMaxRetries?: number,
    /** 
     * @deprecated This option should be set directly on the LegacySessionAuth
     */
    restartOnAuthFail?: boolean
    /** 
     * @deprecated Only here for backwards-compatibility. You should move to using LocalAuth, or set the authStrategy to LegacySessionAuth explicitly.  
     */
    session?: ClientSession
    /** If another whatsapp web session is detected (another browser), take over the session in the current browser
     * @default false */
    takeoverOnConflict?: boolean,
    /** How much time to wait before taking over the session
     * @default 0 */
    takeoverTimeoutMs?: number,
    /** User agent to use in puppeteer.
     * @default 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/72.0.3626.109 Safari/537.36' */
    userAgent?: string
    /** Ffmpeg path to use when formatting videos to webp while sending stickers 
     * @default 'ffmpeg' */
    ffmpegPath?: string,
    /** Object with proxy autentication requirements @default: undefined */
    proxyAuthentication?: {username: string, password: string} | undefined
    // need doc
    bypassCSP?: boolean;
}

/** Options for sending a message */
export interface MessageSendOptions {
    /** Show links preview. Has no effect on multi-device accounts. */
    linkPreview?: boolean
    /** Send audio as voice message with a generated waveform */
    sendAudioAsVoice?: boolean
    /** Send video as gif */
    sendVideoAsGif?: boolean
    /** Send media as sticker */
    sendMediaAsSticker?: boolean
    /** Send media as document */
    sendMediaAsDocument?: boolean
    /** Send media as quality HD */
    sendMediaAsHd?: boolean
    /** Send photo/video as a view once message */
    isViewOnce?: boolean
    /** Automatically parse vCards and send them as contacts */
    parseVCards?: boolean
    /** Image or videos caption */
    caption?: string
    /** Id of the message that is being quoted (or replied to) */
    quotedMessageId?: string
    /** User IDs to mention in the message */
    mentions?: string[]
    /** An array of object that handle group mentions */
    groupMentions?: {
        /** The name of a group to mention (can be custom) */
        subject: string,
        /** The group ID, e.g.: 'XXXXXXXXXX@g.us' */
        id: string
    }[]
    /** Send 'seen' status */
    sendSeen?: boolean
    /** Bot Wid when doing a bot mention like @Meta AI */
    invokedBotWid?: string
    /** Media to be sent */
    media?: MessageMedia
    /** Extra options */
    extra?: any
    /** Sticker name, if sendMediaAsSticker is true */
    stickerName?: string
    /** Sticker author, if sendMediaAsSticker is true */
    stickerAuthor?: string
    /** Sticker categories, if sendMediaAsSticker is true */
    stickerCategories?: string[],
    /** Should the bot send a quoted message without the quoted message if it fails to get the quote?
     * @default true (enabled) */
    ignoreQuoteErrors?: boolean
}

/** ID that represents a message */
export interface MessageId {
    fromMe: boolean,
    remote: string,
    id: string,
    _serialized: string,
}

export type MessageContent = string | MessageMedia | Location | Poll | Contact | Contact[] | List | Buttons

