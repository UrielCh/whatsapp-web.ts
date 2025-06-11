import Client from '../Client.ts';
import { MessageId } from '../types.ts';
import Base from './Base.ts';

/**
 * Represents a Reaction on WhatsApp
 * @extends {Base}
 */
class Reaction extends Base {
    id: MessageId;
    orphan: number;
    orphanReason?: string;
    timestamp: number;
    reaction: string;
    read: boolean;
    msgId: MessageId;
    senderId: string;
    ack?: number;

    constructor(client: Client, data: any) {
        super(client);

        if (data) this._patch(data);
    }

    override _patch(data: any): any {
        /**
         * Reaction ID
         * @type {object}
         */
        this.id = data.msgKey;
        /**
         * Orphan
         * @type {number}
         */
        this.orphan = data.orphan;
        /**
         * Orphan reason
         * @type {?string}
         */
        this.orphanReason = data.orphanReason;
        /**
         * Unix timestamp for when the reaction was created
         * @type {number}
         */
        this.timestamp = data.timestamp;
        /**
         * Reaction
         * @type {string}
         */
        this.reaction = data.reactionText;
        /**
         * Read
         * @type {boolean}
         */
        this.read = data.read;
        /**
         * Message ID
         * @type {object}
         */
        this.msgId = data.parentMsgKey;
        /**
         * Sender ID
         * @type {string}
         */
        this.senderId = data.senderUserJid;
        /**
         * ACK
         * @type {?number}
         */
        this.ack = data.ack;
        
        
        return super._patch(data);
    }
    
}

export default Reaction;