import Client from '../Client.js';
import Base from './Base.js';
import Chat from './Chat.js';
import Contact from './Contact.js';
import Message from './Message.js';

/**
 * Represents a Status/Story on WhatsApp
 * @extends {Base}
 */
class Broadcast extends Base {
    /** Chat Object ID */
    id: {
        server: string;
        user: string;
        _serialized: string;
    };
    /** Unix timestamp of last story */
    timestamp: number;
    /** Number of available statuses */
    totalCount: number;
    /** Number of not viewed */
    unreadCount: number;
    /** Unix timestamp of last story */
    msgs: Message[];
    
    constructor(client: Client, data: any) {
        super(client);

        if (data) this._patch(data);
    }

    _patch(data: any) {
        /**
         * ID that represents the chat
         * @type {object}
         */
        this.id = data.id;

        /**
         * Unix timestamp of last status
         * @type {number}
         */
        this.timestamp = data.t;

        /**
         * Number of available statuses
         * @type {number}
         */
        this.totalCount = data.totalCount;

        /**
         * Number of not viewed
         * @type {number}
         */
        this.unreadCount = data.unreadCount;

        /**
         * Messages statuses
         * @type {Message[]}
         */
        this.msgs = data.msgs?.map(msg => new Message(this.client, msg));

        return super._patch(data);
    }

    /**
     * Returns the Chat this message was sent in
     * @returns {Promise<Chat>}
     */
    getChat(): Promise<Chat> {
        return this.client.getChatById(this.id._serialized);
    }

    /**
     * Returns the Contact this message was sent from
     * @returns {Promise<Contact>}
     */
    getContact(): Promise<Contact> {
        return this.client.getContactById(this.id._serialized);
    }

}

export default Broadcast;
