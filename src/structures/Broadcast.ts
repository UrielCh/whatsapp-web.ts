'use strict';

import Base from './Base.ts';
import Message from './Message.ts';

/**
 * Represents a Status/Story on WhatsApp
 * @extends {Base}
 */
export default class Broadcast extends Base {
    id?: any;
    timestamp?: number;
    totalCount?: number;
    unreadCount?: number;
    msgs?: Message[];
    
    constructor(client: any, data: any) {
        super(client);

        if (data) this._patch(data);
    }

    override _patch(data: any) {
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
    getChat() {
        return this.client.getChatById(this.id._serialized);
    }

    /**
     * Returns the Contact this message was sent from
     * @returns {Promise<Contact>}
     */
    getContact() {
        return this.client.getContactById(this.id._serialized);
    }

}

module.exports = Broadcast;
