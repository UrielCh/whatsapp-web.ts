import MessageMedia from './MessageMedia.ts';
import Util from '../util/Util.ts';

/**
 * Button spec used in Buttons constructor
 */
export type ButtonSpec = {
    /**
     * Custom ID to set on the button. A random one will be generated if one is not passed.
     */
    id?: string;
    /**
     * The text to show on the button.
     */
    body: string;
};



export interface FormattedButtonSpec {
    buttonId: string;
    type: number;
    buttonText: {
        displayText: string;
    };
}

/**
 * Message type buttons
 */
class Buttons {
    type: string;
    body: string | MessageMedia;
    title: string;
    footer: string;
    buttons: FormattedButtonSpec[];
    
    /**
     * @param {string|MessageMedia} body
     * @param {ButtonSpec[]} buttons - See {@link ButtonSpec}
     * @param {string?} title
     * @param {string?} footer
     */
    constructor(body: string | MessageMedia, buttons: ButtonSpec[], title: string, footer: string) {
        /**
         * Message body
         * @type {string|MessageMedia}
         */
        this.body = body;

        /**
         * title of message
         * @type {string}
         */
        this.title = title;
        
        /**
         * footer of message
         * @type {string}
         */
        this.footer = footer;

        if (body instanceof MessageMedia) {
            this.type = 'media';
            this.title = '';
        }else{
            this.type = 'chat';
        }

        /**
         * buttons of message
         * @type {FormattedButtonSpec[]}
         */
        this.buttons = this._format(buttons);
        if(!this.buttons.length){ throw '[BT01] No buttons';}
                
    }

    /**
     * Creates button array from simple array
     * @param {ButtonSpec[]} buttons
     * @returns {FormattedButtonSpec[]}
     * @example 
     * Input: [{id:'customId',body:'button1'},{body:'button2'},{body:'button3'},{body:'button4'}]
     * Returns: [{ buttonId:'customId',buttonText:{'displayText':'button1'},type: 1 },{buttonId:'n3XKsL',buttonText:{'displayText':'button2'},type:1},{buttonId:'NDJk0a',buttonText:{'displayText':'button3'},type:1}]
     */
    _format(buttons: ButtonSpec[]) {
        buttons = buttons.slice(0,3); // phone users can only see 3 buttons, so lets limit this
        return buttons.map((btn) => {
            return {'buttonId':btn.id ? String(btn.id) : Util.generateHash(6),'buttonText':{'displayText':btn.body},'type':1};
        });
    }
    
}

export default Buttons;