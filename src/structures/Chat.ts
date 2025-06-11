import Base from './Base.js';
import Message from './Message.js';
import Client from '../Client.js';
import Contact from './Contact.js';
import Label from './Label.js';
import MessageMedia from "./MessageMedia.ts";
import { MessageContent, MessageSendOptions } from "../types.ts";


export interface MessageSearchOptions {
    /**
     * The amount of messages to return. If no limit is specified, the available messages will be returned.
     * Note that the actual number of returned messages may be smaller if there aren't enough messages in the conversation. 
     * Set this to Infinity to load all messages.
     */
    limit?: number
    /**
    * Return only messages from the bot number or vise versa. To get all messages, leave the option undefined.
    */
    fromMe?: boolean
}
/**
 * Id that represents the chat
 * 
 * @example
 * id: {
 *   server: 'c.us',
 *   user: '554199999999',
 *   _serialized: `554199999999@c.us`
 * },
 */
export interface ChatId {
    /**
     * Whatsapp server domain
     * @example `c.us`
     */
    server: string,
    /**
     * User whatsapp number
     * @example `554199999999`
     */
    user: string,
    /**
     * Serialized id
     * @example `554199999999@c.us`
     */
    _serialized: string,
}

/**
 * Represents a Chat on WhatsApp
 * @extends {Base}
 */
class Chat extends Base {
    /** Indicates if the Chat is archived */
    archived?: boolean;
    /** ID that represents the chat */
    id!: ChatId;
    /** Indicates if the Chat is a Group Chat */
    isGroup?: boolean;
    /** Indicates if the Chat is readonly */
    isReadOnly?: boolean;
    /** Indicates if the Chat is muted */
    isMuted?: boolean;
    /** Unix timestamp for when the mute expires */
    muteExpiration?: number;
    /** Title of the chat */
    name?: string;
    /** Unix timestamp for when the last activity occurred */
    timestamp?: number;
    /** Amount of messages unread */
    unreadCount?: number;
    /** Last message of chat */
    lastMessage?: Message;
    /** Indicates if the Chat is pinned */
    pinned?: boolean;

    constructor(client: Client, data: any) {
        super(client);

        if (data) this._patch(data);
    }

    override _patch(data: any): any {
        /**
         * ID that represents the chat
         * @type {object}
         */
        this.id = data.id;

        /**
         * Title of the chat
         * @type {string}
         */
        this.name = data.formattedTitle;

        /**
         * Indicates if the Chat is a Group Chat
         * @type {boolean}
         */
        this.isGroup = data.isGroup;

        /**
         * Indicates if the Chat is readonly
         * @type {boolean}
         */
        this.isReadOnly = data.isReadOnly;

        /**
         * Amount of messages unread
         * @type {number}
         */
        this.unreadCount = data.unreadCount;

        /**
         * Unix timestamp for when the last activity occurred
         * @type {number}
         */
        this.timestamp = data.t;

        /**
         * Indicates if the Chat is archived
         * @type {boolean}
         */
        this.archived = data.archive;

        /**
         * Indicates if the Chat is pinned
         * @type {boolean}
         */
        this.pinned = !!data.pin;

        /**
         * Indicates if the chat is muted or not
         * @type {boolean}
         */
        this.isMuted = data.isMuted;

        /**
         * Unix timestamp for when the mute expires
         * @type {number}
         */
        this.muteExpiration = data.muteExpiration;

        /**
         * Last message fo chat
         * @type {Message}
         */
        this.lastMessage = data.lastMessage ? new Message(this.client, data.lastMessage) : undefined;
        
        return super._patch(data);
    }

    /**
     * Send a message to this chat
     * @param {string|MessageMedia|Location} content
     * @param {MessageSendOptions} [options] 
     * @returns {Promise<Message>} Message that was just sent
     */
    async sendMessage(content: MessageContent, options?: MessageSendOptions): Promise<Message | null | undefined> {
        return await this.client.sendMessage(this.id._serialized, content, options);
    }

    /**
     * Sets the chat as seen
     * @returns {Promise<Boolean>} result
     */
    async sendSeen(): Promise<boolean> {
        return await this.client.sendSeen(this.id._serialized);
    }

    /**
     * Clears all messages from the chat
     * @returns {Promise<boolean>} result
     */
    async clearMessages(): Promise<boolean> {
        return await this.client.evaluate(chatId => {
            if (!window.WWebJS || !window.WWebJS.sendClearChat)
                throw new Error('window.WWebJS.sendClearChat is not defined');
            return window.WWebJS.sendClearChat(chatId);
        }, this.id._serialized);
    }

    /**
     * Deletes the chat
     * @returns {Promise<Boolean>} result
     */
    async delete(): Promise<boolean> {
        return await this.client.evaluate(chatId => {
            if (!window.WWebJS || !window.WWebJS.sendDeleteChat)
                throw new Error('window.WWebJS.sendDeleteChat is not defined');
            return window.WWebJS.sendDeleteChat(chatId);
        }, this.id._serialized);
    }

    /**
     * Archives this chat
     */
    async archive(): Promise<boolean> {
        return await this.client.archiveChat(this.id._serialized);
    }

    /**
     * un-archives this chat
     */
    async unarchive(): Promise<boolean> {
        return await this.client.unarchiveChat(this.id._serialized);
    }

    /**
     * Pins this chat
     * @returns {Promise<boolean>} New pin state. Could be false if the max number of pinned chats was reached.
     */
    async pin(): Promise<boolean> {
        return await this.client.pinChat(this.id._serialized);
    }

    /**
     * Unpins this chat
     * @returns {Promise<boolean>} New pin state
     */
    async unpin(): Promise<boolean> {
        return await this.client.unpinChat(this.id._serialized);
    }

    /**
     * Mutes this chat forever, unless a date is specified
     * @param {?Date} unmuteDate Date when the chat will be unmuted, don't provide a value to mute forever
     * @returns {Promise<{isMuted: boolean, muteExpiration: number}>}
     */
    async mute(unmuteDate?: Date): Promise<{isMuted: boolean, muteExpiration: number}> {
        const result = await this.client.muteChat(this.id._serialized, unmuteDate);
        this.isMuted = result.isMuted;
        this.muteExpiration = result.muteExpiration;
        return result;
    }

    /**
     * Unmutes this chat
     * @returns {Promise<{isMuted: boolean, muteExpiration: number}>}
     */
    async unmute(): Promise<{isMuted: boolean, muteExpiration: number}> {
        const result = await this.client.unmuteChat(this.id._serialized);
        this.isMuted = result.isMuted;
        this.muteExpiration = result.muteExpiration;
        return result;
    }

    /**
     * Mark this chat as unread
     */
    async markUnread(): Promise<void> {
        return await this.client.markChatUnread(this.id._serialized);
    }

    /**
     * Loads chat messages, sorted from earliest to latest.
     * @param {Object} searchOptions Options for searching messages. Right now only limit and fromMe is supported.
     * @param {Number} [searchOptions.limit] The amount of messages to return. If no limit is specified, the available messages will be returned. Note that the actual number of returned messages may be smaller if there aren't enough messages in the conversation. Set this to Infinity to load all messages.
     * @param {Boolean} [searchOptions.fromMe] Return only messages from the bot number or vise versa. To get all messages, leave the option undefined.
     * @returns {Promise<Array<Message>>}
     */
    async fetchMessages(searchOptions?: MessageSearchOptions): Promise<Message[]> {
        const messages = await this.client.evaluate(async (chatId, searchOptions) => {
            const msgFilter = (m: any) => {
                if (m.isNotification) {
                    return false; // dont include notification messages
                }
                if (searchOptions && searchOptions.fromMe !== undefined && m.id.fromMe !== searchOptions.fromMe) {
                    return false;
                }
                return true;
            };

            if (!window.WWebJS) {
                throw new Error('window.WWebJS is not defined');
            }

            if (!window.Store) {
                throw new Error('window.Store is not defined');
            }
            const getMessageModel = window.WWebJS.getMessageModel;
            if (!window.WWebJS.getChat || !window.Store.ConversationMsgs || !getMessageModel) {
                throw new Error('window.WWebJS.getChat or window.Store.ConversationMsgs or window.WWebJS.getMessageModel is not defined');
            }

            const chat = await window.WWebJS.getChat(chatId, { getAsModel: false });
            let msgs = chat.msgs.getModelsArray().filter(msgFilter);

            if (searchOptions && searchOptions.limit && searchOptions.limit > 0) {
                while (msgs.length < searchOptions.limit) {
                    const loadedMessages = await window.Store.ConversationMsgs.loadEarlierMsgs(chat);
                    if (!loadedMessages || !loadedMessages.length) break;
                    msgs = [...loadedMessages.filter(msgFilter), ...msgs];
                }
                
                if (msgs.length > searchOptions.limit) {
                    msgs.sort((a: any, b: any) => (a.t > b.t) ? 1 : -1);
                    msgs = msgs.splice(msgs.length - searchOptions.limit);
                }
            }

            return msgs.map((m: any) => getMessageModel(m));

        }, this.id._serialized, searchOptions);

        return messages.map((m: any) => new Message(this.client, m));
    }

    /**
     * Simulate typing in chat. This will last for 25 seconds.
     */
    async sendStateTyping(): Promise<boolean> {
        return await this.client.evaluate(chatId => {
            if (!window.WWebJS || !window.WWebJS.sendChatstate) {
                throw new Error('window.WWebJS.sendChatstate is not defined');
            }
            window.WWebJS.sendChatstate('typing', chatId);
            return true;
        }, this.id._serialized);
    }

    /**
     * Simulate recording audio in chat. This will last for 25 seconds.
     */
    async sendStateRecording(): Promise<boolean> {
        return await this.client.evaluate(chatId => {
            if (!window.WWebJS || !window.WWebJS.sendChatstate) {
                throw new Error('window.WWebJS.sendChatstate is not defined');
            }
            window.WWebJS.sendChatstate('recording', chatId);
            return true;
        }, this.id._serialized);
    }

    /**
     * Stops typing or recording in chat immediately.
     */
    async clearState(): Promise<boolean> {
        return await this.client.evaluate(chatId => {
            if (!window.WWebJS || !window.WWebJS.sendChatstate) {
                throw new Error('window.WWebJS.sendChatstate is not defined');
            }
            window.WWebJS.sendChatstate('stop', chatId);
            return true;
        }, this.id._serialized);
    }

    /**
     * Returns the Contact that corresponds to this Chat.
     * @returns {Promise<Contact>}
     */
    async getContact(): Promise<Contact> {
        return await this.client.getContactById(this.id._serialized);
    }

    /**
     * Returns array of all Labels assigned to this Chat
     * @returns {Promise<Array<Label>>}
     */
    async getLabels(): Promise<Label[]> {
        return await this.client.getChatLabels(this.id._serialized);
    }

    /**
     * Add or remove labels to this Chat
     * @param {Array<number|string>} labelIds
     * @returns {Promise<void>}
     */
    async changeLabels(labelIds: Array<number | string>): Promise<void> {
        return await this.client.addOrRemoveLabels(labelIds, [this.id._serialized]);
    }

    /**
     * Sync chat history conversation
     * @return {Promise<boolean>} True if operation completed successfully, false otherwise.
     */
    async syncHistory(): Promise<boolean> {
        return await this.client.syncHistory(this.id._serialized);
    }
}

export default Chat;
