import Client from '../Client.js';
import Base from './Base.js';
import type Chat from './Chat.js';

/**
 * WhatsApp Business Label information
 */
class Label extends Base {
    /** Label name */
    name: string;
    /** Label ID */
    id: string;
    /** Color assigned to the label */
    hexColor: string;
    
    constructor(client: Client, labelData: {id: string, name: string, hexColor: string}){
        super(client);

        if(labelData) this._patch(labelData);
    }

    override _patch(labelData: {id: string, name: string, hexColor: string}){
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
    async getChats(): Promise<Chat[]>{
        return this.client.getChatsByLabelId(this.id);
    }

}

export default Label;