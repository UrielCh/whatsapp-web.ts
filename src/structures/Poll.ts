
/** Poll send options */
export interface PollSendOptions {
    /** False for a single choice poll, true for a multiple choice poll (false by default) */
    allowMultipleAnswers?: boolean,
    /**
     * The custom message secret, can be used as a poll ID
     * @note It has to be a unique vector with a length of 32
     */
    messageSecret?: Array<number>|undefined
}

/**
 * Poll send options
 * @typedef {Object} PollSendOptions
 * @property {boolean} [allowMultipleAnswers=false] If false it is a single choice poll, otherwise it is a multiple choice poll (false by default)
 * @property {?Array<number>} messageSecret The custom message secret, can be used as a poll ID. NOTE: it has to be a unique vector with a length of 32
 */

class Poll {
    pollName: string
    pollOptions: Array<{
        name: string,
        localId: number
    }>
    options: PollSendOptions;
/**
     * @param {string} pollName
     * @param {Array<string>} pollOptions
     * @param {PollSendOptions} options
     */
    constructor(pollName: string, pollOptions: Array<string>, options: PollSendOptions = {}) {
        /**
         * The name of the poll
         * @type {string}
         */
        this.pollName = pollName.trim();

        /**
         * The array of poll options
         * @type {Array.<{name: string, localId: number}>}
         */
        this.pollOptions = pollOptions.map((option, index) => ({
            name: option.trim(),
            localId: index
        }));

        /**
         * The send options for the poll
         * @type {PollSendOptions}
         */
        this.options = {
            allowMultipleAnswers: options.allowMultipleAnswers === true,
            messageSecret: options.messageSecret
        };
    }
}

export default Poll;
