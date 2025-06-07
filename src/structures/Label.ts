import Base from './Base.ts';
// eslint-disable-next-line no-unused-vars
import Chat from './Chat.ts';

/**
 * WhatsApp Business Label information
 */
class Label extends Base {
    id?: string;
    name?: string;
    hexColor?: string;
    
    /**
     * @param {Base} client
     * @param {object} labelData
     */
    constructor(client: Base, labelData: any){
        super(client);

        if(labelData) this._patch(labelData);
    }

    override _patch(labelData: any){
        /**
         * Label ID
         * @type {string}
         */
        this.id = labelData.id;

        /**
         * Label name
         * @type {string}
         */
        this.name = labelData.name;

        /**
         * Label hex color
         * @type {string}
         */
        this.hexColor = labelData.hexColor;
    }
    /**
     * Get all chats that have been assigned this Label
     * @returns {Promise<Array<Chat>>}
     */
    async getChats(): Promise<Array<Chat>> {
        return this.client.getChatsByLabelId(this.id);
    }

}

export default Label;