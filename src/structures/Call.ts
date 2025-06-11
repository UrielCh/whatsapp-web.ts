import Client from '../Client.js';
import Base from './Base.js';

/**
 * Represents a Call on WhatsApp
 * @extends {Base}
 * @example
 * Call {
 * id: 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
 * from: '5511999999@c.us',
 * timestamp: 1625003709,
 * isVideo: false,
 * isGroup: false,
 * fromMe: false,
 * canHandleLocally: false,
 * webClientShouldHandle: false,
 * participants: []
 * }
 */
class Call extends Base {
    /** Call Id */
    id: string;
    /** from */
    from?: string;
    /** Unix timestamp for when the call was created*/
    timestamp: number;
    /** Is video */
    isVideo: boolean;
    /** Is Group */
    isGroup: boolean;
    /** Indicates if the call was sent by the current user */
    fromMe: boolean;
    /** indicates if the call can be handled in waweb */
    canHandleLocally: boolean;
    /** indicates if the call should be handled in waweb */
    webClientShouldHandle: boolean;
    /** Object with participants */
    participants: object;

    constructor(client: Client, data: any) {
        super(client);

        if (data) this._patch(data);
    }

    override _patch(data: any): any {
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
    async reject(): Promise<void> {
        if (!this.from) throw new Error('Call.from is not defined');
        return await this.client.evaluate((peerJid, id) => {
            if (!window.WWebJS || !window.WWebJS.rejectCall)
                throw new Error('window.WWebJS.rejectCall is not defined');
            return window.WWebJS.rejectCall(peerJid, id);
        }, this.from, this.id);
    }
}

export default Call;