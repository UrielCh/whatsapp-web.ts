import Base from './Base.ts';

/**
 * Represents a Reaction on WhatsApp
 * @extends {Base}
 */
class Reaction extends Base {
    id?: any;
    orphan?: any;
    orphanReason?: any;
    timestamp?: any;
    reaction?: any;
    read?: any;
    msgId?: any;
    senderId?: any;
    ack?: any;
    
    constructor(client: any, data: any) {
        super(client);

        if (data) this._patch(data);
    }

    override _patch(data: any) {
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