export interface PollSendOptions {
    /** False for a single choice poll, true for a multiple choice poll (false by default) */
    allowMultipleAnswers?: boolean,
    /**
     * The custom message secret, can be used as a poll ID
     * @note It has to be a unique vector with a length of 32
     */
    messageSecret?: Array<number>|undefined
}
