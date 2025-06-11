import { MessageSendOptions } from '../types.ts';
import { GroupNotificationTypes } from '../util/Constants.ts';
import Base from './Base.ts';
import Chat from './Chat.ts';
import Contact from './Contact.ts';
import Location from './Location.ts';
import Message from './Message.ts';
import MessageMedia from './MessageMedia.ts';
import Client from '../Client.ts';

/**
 * Represents a GroupNotification on WhatsApp
 * @extends {Base}
 */
class GroupNotification extends Base {
    /** ContactId for the user that produced the GroupNotification */
    author: string;
    /** Extra content */
    body: string;
    /** ID for the Chat that this groupNotification was sent for */
    chatId: string;
    /** ID that represents the groupNotification 
     *  @todo create a more specific type for the id object */
    id: object;
    /** Contact IDs for the users that were affected by this GroupNotification */
    recipientIds: string[];
    /** Unix timestamp for when the groupNotification was created */
    timestamp: number;
    /** GroupNotification type */
    type: typeof GroupNotificationTypes[keyof typeof GroupNotificationTypes];

    constructor(client: Client, data: any) {
        super(client);

        if(data) this._patch(data);
    }

    override _patch(data: any): any {
        /**
         * ID that represents the groupNotification
         * @type {object}
         */
        this.id = data.id;

        /**
         * Extra content
         * @type {string}
         */
        this.body = data.body || '';

        /** 
         * GroupNotification type
         * @type {GroupNotificationTypes}
         */
        this.type = data.subtype;
        
        /**
         * Unix timestamp for when the groupNotification was created
         * @type {number}
         */
        this.timestamp = data.t;

        /**
         * ID for the Chat that this groupNotification was sent for.
         * 
         * @type {string}
         */
        this.chatId = typeof (data.id.remote) === 'object' ? data.id.remote._serialized : data.id.remote;

        /**
         * ContactId for the user that produced the GroupNotification.
         * @type {string}
         */
        this.author = typeof (data.author) === 'object' ? data.author._serialized : data.author;
        
        /**
         * Contact IDs for the users that were affected by this GroupNotification.
         * @type {Array<string>}
         */
        this.recipientIds = [];

        if (data.recipients) {
            this.recipientIds = data.recipients;
        }

        return super._patch(data);
    }

    /**
     * Returns the Chat this groupNotification was sent in
     * @returns {Promise<Chat>}
     */
    getChat(): Promise<Chat> {
        return this.client.getChatById(this.chatId);
    }

    /**
     * Returns the Contact this GroupNotification was produced by
     * @returns {Promise<Contact>}
     */
    getContact(): Promise<Contact> {
        return this.client.getContactById(this.author);
    }

    /**
     * Returns the Contacts affected by this GroupNotification.
     * @returns {Promise<Array<Contact>>}
     */
    async getRecipients(): Promise<Contact[]> {
        return await Promise.all(this.recipientIds.map(async m => await this.client.getContactById(m)));
    }

    /**
     * Sends a message to the same chat this GroupNotification was produced in.
     * 
     * @param {string|MessageMedia|Location} content 
     * @param {object} options
     * @returns {Promise<Message>}
     */
    async reply(content: string | MessageMedia | Location, options: MessageSendOptions={}): Promise<Message> {
        return await this.client.sendMessage(this.chatId, content, options);
    }
    
}

export default GroupNotification;
