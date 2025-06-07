import Base from './Base.ts';

/**
 * Represents a Call on WhatsApp
 * @extends {Base}
 */
class Call extends Base {
    id?: string;
    from?: string;
    timestamp?: number;
    isVideo?: boolean;
    isGroup?: boolean;
    fromMe?: boolean;
    canHandleLocally?: boolean;
    webClientShouldHandle?: boolean;
    participants?: object;

    constructor(client: any, data: any) {
        super(client);

        if (data) this._patch(data);
    }

    override _patch(data: any) {
        /**
         * Call ID
         * @type {string}
         */
        this.id = data.id;
        /**
         * From
         * @type {string}
         */
        this.from = data.peerJid;
        /**
         * Unix timestamp for when the call was created
         * @type {number}
         */
        this.timestamp = data.offerTime;
        /**
         * Is video
         * @type {boolean}
         */
        this.isVideo = data.isVideo;
        /**
         * Is Group
         * @type {boolean}
         */
        this.isGroup = data.isGroup;
        /**
         * Indicates if the call was sent by the current user
         * @type {boolean}
         */
        this.fromMe = data.outgoing;
        /**
         * Indicates if the call can be handled in waweb
         * @type {boolean}
         */
        this.canHandleLocally = data.canHandleLocally;
        /**
         * Indicates if the call Should be handled in waweb
         * @type {boolean}
         */
        this.webClientShouldHandle = data.webClientShouldHandle;
        /**
         * Object with participants
         * @type {object}
         */
        this.participants = data.participants;
        
        return super._patch(data);
    }

    /**
     * Reject the call
    */
    async reject() {
        return this.client.pupPage.evaluate((peerJid, id) => {
            return window.WWebJS.rejectCall(peerJid, id);
        }, this.from, this.id);
    }
}

export default Call;