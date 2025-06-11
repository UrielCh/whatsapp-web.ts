import Message from './Message.js';
import Base from './Base.js';
import Client from '../Client.js';


/** Selected poll option structure */
export interface SelectedPollOption {
    /** The local selected option ID */
    id: number;
    /** The option name */
    name: string;
}


/**
 * Represents a Poll Vote on WhatsApp
 * @extends {Base}
 */
class PollVote extends Base {
    /** The person who voted */
    voter: string;

    /**
     * The selected poll option(s)
     * If it's an empty array, the user hasn't selected any options on the poll,
     * may occur when they deselected all poll options
     */
    selectedOptions: SelectedPollOption[];
    
    /** Timestamp the option was selected or deselected at */
    interractedAtTs: number;
    
    /** The poll creation message associated with the poll vote */
    parentMessage: Message;

    constructor(client: Client, data: any) {
        super(client);

        if (data) this._patch(data);
    }

    override _patch(data: any): any {
        /**
         * The person who voted
         * @type {string}
         */
        this.voter = data.sender;

        /**
         * The selected poll option(s)
         * If it's an empty array, the user hasn't selected any options on the poll,
         * may occur when they deselected all poll options
         * @type {SelectedPollOption[]}
         */
        this.selectedOptions =
            data.selectedOptionLocalIds.length > 0
                ? data.selectedOptionLocalIds.map((e) => ({
                    name: data.parentMessage.pollOptions.find((x) => x.localId === e).name,
                    localId: e
                }))
                : [];

        /**
         * Timestamp the option was selected or deselected at
         * @type {number}
         */
        this.interractedAtTs = data.senderTimestampMs;

        /**
         * The poll creation message associated with the poll vote
         * @type {Message}
         */
        this.parentMessage = new Message(this.client, data.parentMessage);

        return super._patch(data);
    }
}

export default PollVote;
