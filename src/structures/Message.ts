import Base from './Base.ts';
import MessageMedia from './MessageMedia.ts';
import Location from './Location.ts';
import Order from './Order.ts';
import Payment from './Payment.ts';
import Reaction from './Reaction.ts';
import Contact, { type ContactId } from './Contact.ts';
import { type MessageAck, MessageTypes } from '../util/Constants.ts';
import type Client from '../Client.ts';
import type { MessageContent, MessageId, MessageSendOptions } from '../types.ts';
import type Chat from './Chat.ts';

export type MessageInfo = {
    delivery: Array<{id: ContactId, t: number}>,
    deliveryRemaining: number,
    played: Array<{id: ContactId, t: number}>,
    playedRemaining: number,
    read: Array<{id: ContactId, t: number}>,
    readRemaining: number
}

export type InviteV4Data = {
    inviteCode: string,
    inviteCodeExp: number,
    groupId: string,
    groupName?: string,
    fromId: string,
    toId: string
}

export type ReactionList = {
    /**
     * Original emoji
     */
    id: string,
    /**
     * Aggregate emoji
     */
    aggregateEmoji: string,
    /**
     * Flag who sent the reaction
     */
    hasReactionByMe: boolean,
    /**
     * Reaction senders, to this message
     */
    senders: Array<Reaction>
}

/** Options for editing a message */
export interface MessageEditOptions {
    /** Show links preview. Has no effect on multi-device accounts. */
    linkPreview?: boolean;
    /** Contacts that are being mentioned in the message */
    mentions?: Array<Contact|string>;
    /** Extra options */
    extra?: any;
    groupMentions?: any | any[];
}

/**
 * Represents a Message on WhatsApp
 * @extends {Base}
 * @example
 * {
 *   mediaKey: undefined,
 *   id: {
 *     fromMe: false,
 *     remote: `554199999999@c.us`,
 *     id: '1234567890ABCDEFGHIJ',
 *     _serialized: `false_554199999999@c.us_1234567890ABCDEFGHIJ`
 *   },
 *   ack: -1,
 *   hasMedia: false,
 *   body: 'Hello!',
 *   type: 'chat',
 *   timestamp: 1591482682,
 *   from: `554199999999@c.us`,
 *   to: `554188888888@c.us`,
 *   author: undefined,
 *   isForwarded: false,
 *   broadcast: false,
 *   fromMe: false,
 *   hasQuotedMsg: false,
 *   hasReaction: false,
 *   location: undefined,
 *   mentionedIds: []
 * }
 */
class Message extends Base {
    /** ACK status for the message */
    ack!: typeof MessageAck[keyof typeof MessageAck];
    /** If the message was sent to a group, this field will contain the user that sent the message. */
    author?: string;
    /** String that represents from which device type the message was sent */
    deviceType!: string;
    /** Message content */
    body!: string;
    /** Indicates if the message was a broadcast */
    broadcast!: boolean;
    /** Indicates if the message was a status update */
    isStatus!: boolean;
    /** Indicates if the message is a Gif */
    isGif!: boolean;
    /** Indicates if the message will disappear after it expires */
    isEphemeral!: boolean;
    /** ID for the Chat that this message was sent to, except if the message was sent by the current user */
    from!: string;
    /** Indicates if the message was sent by the current user */
    fromMe!: boolean;
    /** Indicates if the message has media available for download */
    hasMedia!: boolean;
    /** Indicates if the message was sent as a reply to another message */
    hasQuotedMsg!: boolean;
    /** Indicates whether there are reactions to the message */
    hasReaction!: boolean;
    /** Indicates the duration of the message in seconds */
    duration!: string;
    /** ID that represents the message */
    id!: MessageId;
    /** Indicates if the message was forwarded */
    isForwarded!: boolean;
    /**
     * Indicates how many times the message was forwarded.
     * The maximum value is 127.
     */
    forwardingScore!: number;
    /** Indicates if the message was starred */
    isStarred!: boolean;
    /** Location information contained in the message, if the message is type "location" */
    location!: Location;
    /** List of vCards contained in the message */
    vCards!: string[];
    /** Invite v4 info */
    inviteV4!: InviteV4Data;
    /** MediaKey that represents the sticker 'ID' */
    mediaKey?: string;
    /** Indicates the mentions in the message body. */
    mentionedIds!: string[];
    /** Indicates whether there are group mentions in the message body */
    groupMentions!: {
        groupSubject: string;
        groupJid: {_serialized: string};
    }[];
    /** Unix timestamp for when the message was created */
    timestamp!: number;
    /**
     * ID for who this message is for.
     * If the message is sent by the current user, it will be the Chat to which the message is being sent.
     * If the message is sent by another user, it will be the ID for the current user.
     */
    to!: string;
    /** Message type */
    type!: typeof MessageTypes[keyof typeof MessageTypes];
    /** Links included in the message. */
    links!: Array<{
        link: string;
        isSuspicious: boolean;
    }>;
    /** Order ID */
    orderId!: string;
    /** title */
    title?: string;
    /** description*/
    description?: string;
    /** Business Owner JID */
    businessOwnerJid?: string;
    /** Product JID */
    productId?: string;
    /** Last edit time */
    latestEditSenderTimestampMs?: number;
    /** Last edit message author */
    latestEditMsgKey?: MessageId;
    /** Message buttons */
    dynamicReplyButtons?: object;
    /** Selected button ID */
    selectedButtonId?: string;
    /** Selected list row ID */
    selectedRowId?: string;
    pollName!: string;
    /** Avaiaible poll voting options */
    pollOptions!: string[];
    /** False for a single choice poll, true for a multiple choice poll */
    allowMultipleAnswers!: boolean;
    _data: any;

    pollInvalidated: any;
    isSentCagPollCreation: any;
    messageSecret: any;
    token?: string;

    constructor(client: Client, data: any) {
        super(client);

        if (data) this._patch(data);
    }

    override _patch(data: any): any {
        this._data = data;
        
        /**
         * MediaKey that represents the sticker 'ID'
         * @type {string}
         */
        this.mediaKey = data.mediaKey;
        
        /**
         * ID that represents the message
         * @type {object}
         */
        this.id = data.id;

        /**
         * ACK status for the message
         * @type {MessageAck}
         */
        this.ack = data.ack;

        /**
         * Indicates if the message has media available for download
         * @type {boolean}
         */
        this.hasMedia = Boolean(data.directPath);

        /**
         * Message content
         * @type {string}
         */
        if (this.hasMedia) {
            this.body = data.caption || data.filename || '';
        } else {
            this.body = data.body || data.pollName || '';
        }

        /**
         * Message type
         * @type {MessageTypes}
         */
        this.type = data.type;

        /**
         * Unix timestamp for when the message was created
         * @type {number}
         */
        this.timestamp = data.t;

        /**
         * ID for the Chat that this message was sent to, except if the message was sent by the current user.
         * @type {string}
         */
        this.from = (typeof (data.from) === 'object' && data.from !== null) ? data.from._serialized : data.from;

        /**
         * ID for who this message is for.
         *
         * If the message is sent by the current user, it will be the Chat to which the message is being sent.
         * If the message is sent by another user, it will be the ID for the current user.
         * @type {string}
         */
        this.to = (typeof (data.to) === 'object' && data.to !== null) ? data.to._serialized : data.to;

        /**
         * If the message was sent to a group, this field will contain the user that sent the message.
         * @type {string}
         */
        this.author = (typeof (data.author) === 'object' && data.author !== null) ? data.author._serialized : data.author;

        /**
         * String that represents from which device type the message was sent
         * @type {string}
         */
        this.deviceType = typeof data.id.id === 'string' && data.id.id.length > 21 ? 'android' : typeof data.id.id === 'string' && data.id.id.substring(0, 2) === '3A' ? 'ios' : 'web';
        /**
         * Indicates if the message was forwarded
         * @type {boolean}
         */
        this.isForwarded = data.isForwarded;

        /**
         * Indicates how many times the message was forwarded.
         *
         * The maximum value is 127.
         * @type {number}
         */
        this.forwardingScore = data.forwardingScore || 0;

        /**
         * Indicates if the message is a status update
         * @type {boolean}
         */
        this.isStatus = data.isStatusV3 || data.id.remote === 'status@broadcast';

        /**
         * Indicates if the message was starred
         * @type {boolean}
         */
        this.isStarred = data.star;

        /**
         * Indicates if the message was a broadcast
         * @type {boolean}
         */
        this.broadcast = data.broadcast;

        /**
         * Indicates if the message was sent by the current user
         * @type {boolean}
         */
        this.fromMe = data.id.fromMe;

        /**
         * Indicates if the message was sent as a reply to another message.
         * @type {boolean}
         */
        this.hasQuotedMsg = data.quotedMsg ? true : false;

        /**
         * Indicates whether there are reactions to the message
         * @type {boolean}
         */
        this.hasReaction = data.hasReaction ? true : false;

        /**
         * Indicates the duration of the message in seconds
         * @type {string}
         */
        this.duration = data.duration ? data.duration : undefined;

        /**
         * Location information contained in the message, if the message is type "location"
         * @type {Location}
         */
        this.location = (() => {
            if (data.type !== MessageTypes.LOCATION) {
                return undefined;
            }
            let description;
            if (data.loc && typeof data.loc === 'string') {
                const splitted = data.loc.split('\n');
                description = {
                    name: splitted[0],
                    address: splitted[1],
                    url: data.clientUrl
                };
            }
            return new Location(data.lat, data.lng, description);
        })();

        /**
         * List of vCards contained in the message.
         * @type {Array<string>}
         */
        this.vCards = data.type === MessageTypes.CONTACT_CARD_MULTI ? data.vcardList.map((c) => c.vcard) : data.type === MessageTypes.CONTACT_CARD ? [data.body] : [];

        /**
         * Group Invite Data
         * @type {object}
         */
        this.inviteV4 = data.type === MessageTypes.GROUP_INVITE ? {
            inviteCode: data.inviteCode,
            inviteCodeExp: data.inviteCodeExp,
            groupId: data.inviteGrp,
            groupName: data.inviteGrpName,
            fromId: typeof data.from === 'object' && '_serialized' in data.from ? data.from._serialized : data.from,
            toId: typeof data.to === 'object' && '_serialized' in data.to ? data.to._serialized : data.to
        } : undefined;

        /**
         * Indicates the mentions in the message body.
         * @type {string[]}
         */
        this.mentionedIds = data.mentionedJidList || [];

        /**
         * @typedef {Object} GroupMention
         * @property {string} groupSubject The name  of the group
         * @property {string} groupJid The group ID
         */

        /**
         * Indicates whether there are group mentions in the message body
         * @type {GroupMention[]}
         */
        this.groupMentions = data.groupMentions || [];

        /**
         * Order ID for message type ORDER
         * @type {string}
         */
        this.orderId = data.orderId ? data.orderId : undefined;
        /**
         * Order Token for message type ORDER
         * @type {string}
         */
        this.token = data.token ? data.token : undefined;

        /** 
         * Indicates whether the message is a Gif
         * @type {boolean}
         */
        this.isGif = Boolean(data.isGif);

        /**
         * Indicates if the message will disappear after it expires
         * @type {boolean}
         */
        this.isEphemeral = data.isEphemeral;

        /** Title */
        if (data.title) {
            this.title = data.title;
        }

        /** Description */
        if (data.description) {
            this.description = data.description;
        }

        /** Business Owner JID */
        if (data.businessOwnerJid) {
            this.businessOwnerJid = data.businessOwnerJid;
        }

        /** Product ID */
        if (data.productId) {
            this.productId = data.productId;
        }

        /** Last edit time */
        if (data.latestEditSenderTimestampMs) {
            this.latestEditSenderTimestampMs = data.latestEditSenderTimestampMs;
        }

        /** Last edit message author */
        if (data.latestEditMsgKey) {
            this.latestEditMsgKey = data.latestEditMsgKey;
        }
        
        /**
         * Links included in the message.
         * @type {Array<{link: string, isSuspicious: boolean}>}
         *
         */
        this.links = data.links;

        /** Buttons */
        if (data.dynamicReplyButtons) {
            this.dynamicReplyButtons = data.dynamicReplyButtons;
        }

        /** Selected Button Id **/
        if (data.selectedButtonId) {
            this.selectedButtonId = data.selectedButtonId;
        }

        /** Selected List row Id **/
        if (data.listResponse && data.listResponse.singleSelectReply.selectedRowId) {
            this.selectedRowId = data.listResponse.singleSelectReply.selectedRowId;
        }

        if (this.type === MessageTypes.POLL_CREATION) {
            this.pollName = data.pollName;
            this.pollOptions = data.pollOptions;
            this.allowMultipleAnswers = Boolean(!data.pollSelectableOptionsCount);
            this.pollInvalidated = data.pollInvalidated;
            this.isSentCagPollCreation = data.isSentCagPollCreation;
            this.messageSecret = Object.keys(data.messageSecret).map((key) =>  data.messageSecret[key]);
        }

        return super._patch(data);
    }

    _getChatId(): string {
        return this.fromMe ? this.to : this.from;
    }

    /**
     * Reloads this Message object's data in-place with the latest values from WhatsApp Web. 
     * Note that the Message must still be in the web app cache for this to work, otherwise will return null.
     * @returns {Promise<Message>}
     */
    async reload(): Promise<Message | null> {
        const newData = await this.client.evaluate(async (msgId: string) => {
            if (!window.Store || !window.Store.Msg || !window.Store.Msg.get || !window.Store.Msg.getMessagesById || !window.WWebJS.getMessageModel)
                throw new Error('window.Store.Msg or window.Store.Msg.get or window.Store.Msg.getMessagesById or window.WWebJS.getMessageModel is not defined');
            const msg = window.Store.Msg.get(msgId) || (await window.Store.Msg.getMessagesById([msgId]))?.messages?.[0];
            if (!msg) return null;
            return window.WWebJS.getMessageModel(msg);
        }, this.id._serialized);

        if(!newData) return null;
        
        this._patch(newData);
        return this;
    }

    /**
     * Returns message in a raw format
     * @type {Object}
     */
    get rawData(): any {
        return this._data;
    }
    
    /**
     * Returns the Chat this message was sent in
     * @returns {Promise<Chat>}
     */
    getChat(): Promise<Chat> {
        return this.client.getChatById(this._getChatId());
    }

    /**
     * Returns the Contact this message was sent from
     * @returns {Promise<Contact>}
     */
    getContact(): Promise<Contact> {
        return this.client.getContactById(this.author || this.from);
    }

    /**
     * Returns the Contacts mentioned in this message
     * @returns {Promise<Array<Contact>>}
     */
    async getMentions(): Promise<Contact[]> {
        return await Promise.all(this.mentionedIds.map(async m => await this.client.getContactById(m)));
    }
    
    /**
     * Returns groups mentioned in this message
     * @returns {Promise<GroupChat[]>}
     */
    async getGroupMentions(): Promise<Chat[]> {
        return await Promise.all(this.groupMentions.map(async (m) => await this.client.getChatById(m.groupJid._serialized)));
    }

    /**
     * Returns the quoted message, if any
     * @returns {Promise<Message>}
     */
    async getQuotedMessage(): Promise<Message | undefined> {
        if (!this.hasQuotedMsg) return undefined;

        const quotedMsg = await this.client.evaluate(async (msgId: string) => {
            if (!window.Store || !window.Store.Msg || !window.Store.Msg.get || !window.Store.Msg.getMessagesById || !window.WWebJS.getMessageModel)
                throw new Error('window.Store.Msg or window.Store.Msg.get or window.Store.Msg.getMessagesById or window.WWebJS.getMessageModel is not defined');
            const msg = window.Store.Msg.get(msgId) || (await window.Store.Msg.getMessagesById([msgId]))?.messages?.[0];
            const quotedMsg = window.Store.QuotedMsg.getQuotedMsgObj(msg);
            return window.WWebJS.getMessageModel(quotedMsg);
        }, this.id._serialized);

        return new Message(this.client, quotedMsg);
    }

    /**
     * Sends a message as a reply to this message. If chatId is specified, it will be sent
     * through the specified Chat. If not, it will send the message
     * in the same Chat as the original message was sent.
     *
     * @param {MessageContent} content
     * @param {string} [chatId]
     * @param {MessageSendOptions} [options]
     * @returns {Promise<Message>}
     */
    async reply(content: MessageContent, chatId?: string, options?: MessageSendOptions): Promise<Message> {
        if (!chatId) {
            chatId = this._getChatId();
        }

        options = {
            ...options,
            quotedMessageId: this.id._serialized
        };

        return await this.client.sendMessage(chatId, content, options);
    }

    /**
     * React to this message with an emoji
     * @param {string} reaction - Emoji to react with. Send an empty string to remove the reaction.
     * @return {Promise}
     */
    async react(reaction: string): Promise<void> {
        await this.client.evaluate(async (messageId: string, reaction: string) => {
            if (!messageId) return null;
            if (!window.Store || !window.Store.Msg || !window.Store.Msg.get || !window.Store.Msg.getMessagesById || !window.WWebJS.getMessageModel)
                throw new Error('window.Store.Msg or window.Store.Msg.get or window.Store.Msg.getMessagesById or window.WWebJS.getMessageModel is not defined');
            const msg =
                window.Store.Msg.get(messageId) || (await window.Store.Msg.getMessagesById([messageId]))?.messages?.[0];
            if(!msg) return null;
            await window.Store.sendReactionToMsg(msg, reaction);
        }, this.id._serialized, reaction);
    }

    /**
     * Accept the Group V4 Invite in message
     * @returns {Promise<Object>}
     */
    async acceptGroupV4Invite(): Promise<{status: number}> {
        return await this.client.acceptGroupV4Invite(this.inviteV4);
    }

    /**
     * Forwards this message to another chat (that you chatted before, otherwise it will fail)
     *
     * @param {string|Chat} chat Chat model or chat ID to which the message will be forwarded
     * @returns {Promise}
     */
    async forward(chat: string | Chat): Promise<void> {
        const chatId = typeof chat === 'string' ? chat : chat.id._serialized;

        await this.client.evaluate((msgId: string, chatId: string) => {
            if (!window.WWebJS || !window.WWebJS.forwardMessage) throw new Error('window.WWebJS.forwardMessage is not defined');
            return window.WWebJS.forwardMessage(chatId, msgId);
        }, this.id._serialized, chatId);
    }

    /**
     * Downloads and returns the attatched message media
     * @returns {Promise<MessageMedia>}
     */
    async downloadMedia(): Promise<MessageMedia | undefined> {
        if (!this.hasMedia) {
            return undefined;
        }

        const result = await this.client.evaluate(async (msgId: string) => {
            if (!window.Store || !window.Store.Msg || !window.Store.Msg.get || !window.Store.Msg.getMessagesById || !window.WWebJS.getMessageModel)
                throw new Error('window.Store.Msg or window.Store.Msg.get or window.Store.Msg.getMessagesById or window.WWebJS.getMessageModel is not defined');
            const msg = window.Store.Msg.get(msgId) || (await window.Store.Msg.getMessagesById([msgId]))?.messages?.[0];
            if (!msg || !msg.mediaData) {
                return null;
            }
            if (msg.mediaData.mediaStage != 'RESOLVED') {
                // try to resolve media
                await msg.downloadMedia({
                    downloadEvenIfExpensive: true,
                    rmrReason: 1
                });
            }

            if (msg.mediaData.mediaStage.includes('ERROR') || msg.mediaData.mediaStage === 'FETCHING') {
                // media could not be downloaded
                return undefined;
            }

            try {
                const decryptedMedia = await window.Store.DownloadManager.downloadAndMaybeDecrypt({
                    directPath: msg.directPath,
                    encFilehash: msg.encFilehash,
                    filehash: msg.filehash,
                    mediaKey: msg.mediaKey,
                    mediaKeyTimestamp: msg.mediaKeyTimestamp,
                    type: msg.type,
                    signal: (new AbortController).signal
                });

                const data = await window.WWebJS.arrayBufferToBase64Async(decryptedMedia);

                return {
                    data,
                    mimetype: msg.mimetype,
                    filename: msg.filename,
                    filesize: msg.size
                };
            } catch (e) {
                if ((e as {status: number}).status && (e as {status: number}).status === 404) return undefined;
                throw e;
            }
        }, this.id._serialized);

        if (!result) return undefined;
        return new MessageMedia(result.mimetype, result.data, result.filename, result.filesize);
    }

    /**
     * Deletes a message from the chat
     * @param {?boolean} everyone If true and the message is sent by the current user or the user is an admin, will delete it for everyone in the chat.
     * @param {?boolean} [clearMedia = true] If true, any associated media will also be deleted from a device.
     */
    async delete(everyone?: boolean, clearMedia: boolean = true): Promise<void> {
        await this.client.evaluate(async (msgId: string, everyone: boolean, clearMedia: boolean) => {
            if (!window.Store || !window.Store.Msg || !window.Store.Msg.get || !window.Store.Msg.getMessagesById || !window.WWebJS.getMessageModel)
                throw new Error('window.Store.Msg or window.Store.Msg.get or window.Store.Msg.getMessagesById or window.WWebJS.getMessageModel is not defined');
            const msg = window.Store.Msg.get(msgId) || (await window.Store.Msg.getMessagesById([msgId]))?.messages?.[0];
            const chat = window.Store.Chat.get(msg.id.remote) || (await window.Store.Chat.find(msg.id.remote));
            
            const canRevoke =
                window.Store.MsgActionChecks.canSenderRevokeMsg(msg) || window.Store.MsgActionChecks.canAdminRevokeMsg(msg);

            if (everyone && canRevoke) {
                return window.compareWwebVersions(window.Debug.VERSION, '>=', '2.3000.0')
                    ? window.Store.Cmd.sendRevokeMsgs(chat, { list: [msg], type: 'message' }, { clearMedia: clearMedia })
                    : window.Store.Cmd.sendRevokeMsgs(chat, [msg], { clearMedia: true, type: msg.id.fromMe ? 'Sender' : 'Admin' });
            }

            return window.compareWwebVersions(window.Debug.VERSION, '>=', '2.3000.0')
                ? window.Store.Cmd.sendDeleteMsgs(chat, { list: [msg], type: 'message' }, clearMedia)
                : window.Store.Cmd.sendDeleteMsgs(chat, [msg], clearMedia);
        }, this.id._serialized, everyone, clearMedia);
    }

    /**
     * Stars this message
     */
    async star(): Promise<void> {
        await this.client.evaluate(async (msgId: string) => {
            if (!window.Store || !window.Store.Msg || !window.Store.Msg.get || !window.Store.Msg.getMessagesById || !window.WWebJS.getMessageModel)
                throw new Error('window.Store.Msg or window.Store.Msg.get or window.Store.Msg.getMessagesById or window.WWebJS.getMessageModel is not defined');
            const msg = window.Store.Msg.get(msgId) || (await window.Store.Msg.getMessagesById([msgId]))?.messages?.[0];
            if (window.Store.MsgActionChecks.canStarMsg(msg)) {
                const chat = await window.Store.Chat.find(msg.id.remote);
                return window.Store.Cmd.sendStarMsgs(chat, [msg], false);
            }
        }, this.id._serialized);
    }

    /**
     * Unstars this message
     */
    async unstar(): Promise<void> {
        await this.client.evaluate(async (msgId: string) => {
            if (!window.Store || !window.Store.Msg || !window.Store.Msg.get || !window.Store.Msg.getMessagesById || !window.WWebJS.getMessageModel)
                throw new Error('window.Store.Msg or window.Store.Msg.get or window.Store.Msg.getMessagesById or window.WWebJS.getMessageModel is not defined');
            const msg = window.Store.Msg.get(msgId) || (await window.Store.Msg.getMessagesById([msgId]))?.messages?.[0];
            if (window.Store.MsgActionChecks.canStarMsg(msg)) {
                const chat = await window.Store.Chat.find(msg.id.remote);
                return window.Store.Cmd.sendUnstarMsgs(chat, [msg], false);
            }
        }, this.id._serialized);
    }

    /**
     * Pins the message (group admins can pin messages of all group members)
     * @param {number} duration The duration in seconds the message will be pinned in a chat
     * @returns {Promise<boolean>} Returns true if the operation completed successfully, false otherwise
     */
    async pin(duration: number): Promise<boolean> {
        return await this.client.evaluate(async (msgId: string, duration: number) => {
            if (!window.WWebJS || !window.WWebJS.pinUnpinMsgAction)
                throw Error("window.WWebJS.pinUnpinMsgAction is not defined")
            return await window.WWebJS.pinUnpinMsgAction(msgId, 1, duration);
        }, this.id._serialized, duration);
    }

    /**
     * Unpins the message (group admins can unpin messages of all group members)
     * @returns {Promise<boolean>} Returns true if the operation completed successfully, false otherwise
     */
    async unpin(): Promise<boolean> {
        return await this.client.evaluate(async (msgId: string) => {
            if (!window.WWebJS || !window.WWebJS.pinUnpinMsgAction)
                throw Error("window.WWebJS.pinUnpinMsgAction is not defined")
            return await window.WWebJS.pinUnpinMsgAction(msgId, 2);
        }, this.id._serialized);
    }

    /**
     * Message Info
     * @typedef {Object} MessageInfo
     * @property {Array<{id: ContactId, t: number}>} delivery Contacts to which the message has been delivered to
     * @property {number} deliveryRemaining Amount of people to whom the message has not been delivered to
     * @property {Array<{id: ContactId, t: number}>} played Contacts who have listened to the voice message
     * @property {number} playedRemaining Amount of people who have not listened to the message
     * @property {Array<{id: ContactId, t: number}>} read Contacts who have read the message
     * @property {number} readRemaining Amount of people who have not read the message
     */

    /**
     * Get information about message delivery status.
     * May return null if the message does not exist or is not sent by you.
     * @returns {Promise<?MessageInfo>}
     */
    async getInfo(): Promise<MessageInfo | null> {
        const info = await this.client.evaluate(async (msgId: string) => {
            const msg = window.Store.Msg.get(msgId) || (await window.Store.Msg.getMessagesById([msgId]))?.messages?.[0];
            if (!msg || !msg.id.fromMe) return null;

            return new Promise((resolve) => {
                setTimeout(async () => {
                    resolve(await window.Store.getMsgInfo(msg.id));
                }, (Date.now() - msg.t * 1000 < 1250) && Math.floor(Math.random() * (1200 - 1100 + 1)) + 1100 || 0);
            });
        }, this.id._serialized);

        return info as MessageInfo;
    }

    /**
     * Gets the order associated with a given message
     * @return {Promise<Order>}
     */
    async getOrder(): Promise<Order> {
        if (this.type === MessageTypes.ORDER) {
            const result = await this.client.evaluate((orderId, token, chatId) => {
                if (!window.WWebJS || !window.WWebJS.getOrderDetail)
                    throw Error("window.WWebJS.getOrderDetail is not defined")
                return window.WWebJS.getOrderDetail(orderId, token, chatId);
            }, this.orderId, this.token, this._getChatId());
            if (!result) return undefined;
            return new Order(this.client, result);
        }
        return undefined;
    }
    /**
     * Gets the payment details associated with a given message
     * @return {Promise<Payment>}
     */
    async getPayment(): Promise<Payment> {
        if (this.type === MessageTypes.PAYMENT) {
            const msg = await this.client.evaluate(async (msgId: string) => {
                const msg = window.Store.Msg.get(msgId) || (await window.Store.Msg.getMessagesById([msgId]))?.messages?.[0];
                if(!msg) return null;
                return msg.serialize();
            }, this.id._serialized);
            return new Payment(this.client, msg);
        }
        return undefined;
    }


    /**
     * Gets the reactions associated with the given message
     * @return {Promise<ReactionList[]>}
     */
    async getReactions(): Promise<ReactionList[] | undefined> {
        if (!this.hasReaction) {
            return undefined;
        }

        const reactions = await this.client.evaluate(async (msgId: string) => {
            const msgReactions = await window.Store.Reactions.find(msgId);
            if (!msgReactions || !msgReactions.reactions.length) return null;
            return msgReactions.reactions.serialize();
        }, this.id._serialized);

        if (!reactions) {
            return undefined;
        }

        return reactions.map(reaction => {
            reaction.senders = reaction.senders.map(sender => {
                sender.timestamp = Math.round(sender.timestamp / 1000);
                return new Reaction(this.client, sender);
            });
            return reaction;
        });
    }

    /**
     * Edits the current message.
     * @param {string} content
     * @param {MessageEditOptions} [options] - Options used when editing the message
     * @returns {Promise<?Message>}
     */
    async edit(content: string, options: MessageEditOptions = {}): Promise<Message | null> {
        if (options.mentions) {
            !Array.isArray(options.mentions) && (options.mentions = [options.mentions]);
            if (options.mentions.some((possiblyContact) => possiblyContact instanceof Contact)) {
                console.warn('Mentions with an array of Contact are now deprecated. See more at https://github.com/pedroslopez/whatsapp-web.js/pull/2166.');
                options.mentions = options.mentions.map((a: Contact | string) => a instanceof Contact ? a.id._serialized : a);
            }
        }

        options.groupMentions && !Array.isArray(options.groupMentions) && (options.groupMentions = [options.groupMentions]);

        const internalOptions = {
            linkPreview: options.linkPreview === false ? undefined : true,
            mentionedJidList: options.mentions || [],
            groupMentions: options.groupMentions,
            extraOptions: options.extra
        };
        
            if (!this.fromMe) {
            return null;
        }
        const messageEdit = await this.client.evaluate(async (msgId: string, message: string, options: any) => {
            const msg = window.Store.Msg.get(msgId) || (await window.Store.Msg.getMessagesById([msgId]))?.messages?.[0];
            if (!msg) return null;

            const canEdit = window.Store.MsgActionChecks.canEditText(msg) || window.Store.MsgActionChecks.canEditCaption(msg);
            if (canEdit) {
                const msgEdit = await window.WWebJS.editMessage(msg, message, options);
                return msgEdit.serialize();
            }
            return null;
        }, this.id._serialized, content, internalOptions);
        if (messageEdit) {
            return new Message(this.client, messageEdit);
        }
        return null;
    }
}

export default Message;
