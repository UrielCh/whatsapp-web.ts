import Client from '../Client.js';
import Base from './Base.js';
import Chat, { ChatId } from './Chat.js';

export interface ContactId {
    server: string,
    user: string,
    _serialized: string,
}


/**
 * Represents a Contact on WhatsApp
 *
 * @example 
 * {
 *   id: {
 *     server: 'c.us',
 *     user: '554199999999',
 *     _serialized: `554199999999@c.us`
 *   },
 *   number: '554199999999',
 *   isBusiness: false,
 *   isEnterprise: false,
 *   labels: [],
 *   name: undefined,
 *   pushname: 'John',
 *   sectionHeader: undefined,
 *   shortName: undefined,
 *   statusMute: false,
 *   type: 'in',
 *   verifiedLevel: undefined,
 *   verifiedName: undefined,
 *   isMe: false,
 *   isUser: true,
 *   isGroup: false,
 *   isWAContact: true,
 *   isMyContact: false
 * }
 */

/**
 * ID that represents a contact
 * @typedef {Object} ContactId
 * @property {string} server
 * @property {string} user
 * @property {string} _serialized
 */

/**
 * Represents a Contact on WhatsApp
 * @extends {Base}
 */
class Contact extends Base {
    /** Contact's phone number */
    number: string;
    /** Indicates if the contact is a business contact */
    isBusiness: boolean;
    /** ID that represents the contact */
    id: ContactId;
    /** Indicates if the contact is an enterprise contact */
    isEnterprise: boolean;
    /** Indicates if the contact is a group contact */
    isGroup: boolean;
    /** Indicates if the contact is the current user's contact */
    isMe: boolean;
    /** Indicates if the number is saved in the current phone's contacts */
    isMyContact: boolean;
    /** Indicates if the contact is a user contact */
    isUser: boolean;
    /** Indicates if the number is registered on WhatsApp */
    isWAContact: boolean;
    /** Indicates if you have blocked this contact */
    isBlocked: boolean;
    /** @todo verify labels type. didn't have any documentation */
    labels?: string[];
    /** The contact's name, as saved by the current user */
    name?: string;
    /** The name that the contact has configured to be shown publically */
    pushname: string;
    /** @todo missing documentation */
    sectionHeader: string;
    /** A shortened version of name */
    shortName?: string;
    /** Indicates if the status from the contact is muted */
    statusMute: boolean;
    /** @todo missing documentation */
    type: string;
    /** @todo missing documentation */
    verifiedLevel?: undefined;
    /** @todo missing documentation */
    verifiedName?: undefined;

    constructor(client: Client, data: any) {
        super(client);

        if(data) this._patch(data);
    }

    override _patch(data: any): any {
        /**
         * ID that represents the contact
         * @type {ContactId}
         */
        this.id = data.id;

        /**
         * Contact's phone number
         * @type {string}
         */
        this.number = data.userid;

        /**
         * Indicates if the contact is a business contact
         * @type {boolean}
         */
        this.isBusiness = data.isBusiness;

        /**
         * Indicates if the contact is an enterprise contact
         * @type {boolean}
         */
        this.isEnterprise = data.isEnterprise;

        this.labels = data.labels;

        /**
         * The contact's name, as saved by the current user
         * @type {?string}
         */
        this.name = data.name;

        /**
         * The name that the contact has configured to be shown publically
         * @type {string}
         */
        this.pushname = data.pushname;

        this.sectionHeader = data.sectionHeader;

        /**
         * A shortened version of name
         * @type {?string}
         */
        this.shortName = data.shortName;

        this.statusMute = data.statusMute;
        this.type = data.type;
        this.verifiedLevel = data.verifiedLevel;
        this.verifiedName = data.verifiedName;

        /**
         * Indicates if the contact is the current user's contact
         * @type {boolean}
         */
        this.isMe = data.isMe;

        /**
         * Indicates if the contact is a user contact
         * @type {boolean}
         */
        this.isUser = data.isUser;

        /**
         * Indicates if the contact is a group contact
         * @type {boolean}
         */
        this.isGroup = data.isGroup;

        /**
         * Indicates if the number is registered on WhatsApp
         * @type {boolean}
         */
        this.isWAContact = data.isWAContact;

        /**
         * Indicates if the number is saved in the current phone's contacts
         * @type {boolean}
         */
        this.isMyContact = data.isMyContact;

        /**
         * Indicates if you have blocked this contact
         * @type {boolean}
         */
        this.isBlocked = data.isBlocked;
        
        return super._patch(data);
    }

    /**
     * Returns the contact's profile picture URL, if privacy settings allow it
     */
    async getProfilePicUrl(): Promise<string> {
        return await this.client.getProfilePicUrl(this.id._serialized);
    }

    /**
     * Returns the contact's formatted phone number, (12345678901@c.us) => (+1 (234) 5678-901)
     */
    async getFormattedNumber(): Promise<string> {
        return await this.client.getFormattedNumber(this.id._serialized);
    }
    
    /**
     * Returns the contact's countrycode, (1541859685@c.us) => (1)
     */
    async getCountryCode(): Promise<string> {
        return await this.client.getCountryCode(this.id._serialized);
    }
    
    /**
     * Returns the Chat that corresponds to this Contact. 
     * Will return null when getting chat for currently logged in user.
     */
    async getChat(): Promise<Chat> {
        if(this.isMe) return null;

        return await this.client.getChatById(this.id._serialized);
    }

    /**
     * Blocks this contact from WhatsApp
     */
    async block(): Promise<boolean> {
        if(this.isGroup) return false;

        await this.client.evaluate(async (contactId) => {
            if (!window.Store || !window.Store.Contact || !window.Store.BlockContact) 
                throw new Error('window.Store.Contact or window.Store.BlockContact is not defined');
            const contact = window.Store.Contact.get(contactId);
            await window.Store.BlockContact.blockContact({contact});
        }, this.id._serialized);

        this.isBlocked = true;
        return true;
    }

    /**
     * Unblocks this contact from WhatsApp
     */
    async unblock(): Promise<boolean> {
        if(this.isGroup) return false;

        await this.client.evaluate(async (contactId) => {
            if (!window.Store || !window.Store.Contact || !window.Store.BlockContact) 
                throw new Error('window.Store.Contact or window.Store.BlockContact is not defined');
            const contact = window.Store.Contact.get(contactId);
            await window.Store.BlockContact.unblockContact(contact);
        }, this.id._serialized);

        this.isBlocked = false;
        return true;
    }
    
    /**
     * Gets the Contact's current "about" info. Returns null if you don't have permission to read their status.
     * @returns {Promise<?string>}
     */
    async getAbout(): Promise<string | null> {
        const about = await this.client.evaluate((contactId: string) => {
            if (!window.Store || !window.Store.WidFactory || !window.Store.StatusUtils) 
                throw new Error('window.Store.WidFactory or window.Store.StatusUtils is not defined');
            const wid = window.Store.WidFactory.createWid(contactId);
            return window.Store.StatusUtils.getStatus(wid);
        }, this.id._serialized);

        if (typeof about.status !== 'string')
            return null;

        return about.status;
    }

    /**
     * Gets the Contact's common groups with you. Returns empty array if you don't have any common group.
     */
    async getCommonGroups(): Promise<ChatId[]> {
        return await this.client.getCommonGroups(this.id._serialized);
    }    
}

export default Contact;
