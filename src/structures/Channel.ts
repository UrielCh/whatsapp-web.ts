import Client from '../Client.ts';
import { MessageSendOptions } from '../types.ts';
import Base from './Base.ts';
import { MessageSearchOptions } from './Chat.ts';
import Contact from './Contact.ts';
import Message from './Message.ts';
import MessageMedia from './MessageMedia.ts';

/**
 * Channel ID structure
 * @typedef {Object} ChannelId
 * @property {string} server
 * @property {string} user
 * @property {string} _serialized
 */

/** Options for transferring a channel ownership to another user */
export interface TransferChannelOwnershipOptions {
    /**
     * If true, after the channel ownership is being transferred to another user,
     * the current user will be dismissed as a channel admin and will become to a channel subscriber.
     */
    shouldDismissSelfAsAdmin?: boolean
}

/**
 * Represents a Channel on WhatsApp
 * @extends {Base}
 */
class Channel extends Base {
    /** ID that represents the channel */
    id!: {
        server: string;
        user: string;
        _serialized: string;
    };
    /** Title of the channel */
    name!: string;
    /** The channel description */
    description!: string;
    /** Indicates if it is a Channel */
    isChannel!: boolean;
    /** Indicates if it is a Group */
    isGroup!: boolean;
    /** Indicates if the channel is readonly */
    isReadOnly!: boolean;
    /** Amount of messages unread */
    unreadCount!: number;
    /** Unix timestamp for when the last activity occurred */
    timestamp!: number;
    /** Indicates if the channel is muted or not */
    isMuted!: boolean;
    /** Unix timestamp for when the mute expires */
    muteExpiration!: number;
    /** Last message in the channel */
    lastMessage: Message | undefined;
    channelMetadata: any;
    
    constructor(client: Client, data: any) {
        super(client);

        if (data) this._patch(data);
    }

    override _patch(data: any): any {
        this.channelMetadata = data.channelMetadata;

        /**
         * ID that represents the channel
         * @type {ChannelId}
         */
        this.id = data.id;

        /**
         * Title of the channel
         * @type {string}
         */
        this.name = data.name;

        /** 
         * The channel description
         * @type {string}
         */
        this.description = data.channelMetadata.description;

        /**
         * Indicates if it is a Channel
         * @type {boolean}
         */
        this.isChannel = data.isChannel;

        /**
         * Indicates if it is a Group
         * @type {boolean}
         */
        this.isGroup = data.isGroup;

        /**
         * Indicates if the channel is readonly
         * @type {boolean}
         */
        this.isReadOnly = data.isReadOnly;

        /**
         * Amount of messages unread
         * @type {number}
         */
        this.unreadCount = data.unreadCount;

        /**
         * Unix timestamp for when the last activity occurred
         * @type {number}
         */
        this.timestamp = data.t;

        /**
         * Indicates if the channel is muted or not
         * @type {boolean}
         */
        this.isMuted = data.isMuted;

        /**
         * Unix timestamp for when the mute expires
         * @type {number}
         */
        this.muteExpiration = data.muteExpiration;

        /**
         * Last message in the channel
         * @type {Message}
         */
        this.lastMessage = data.lastMessage ? new Message(this.client, data.lastMessage) : undefined;

        return super._patch(data);
    }

    /**
     * Gets the subscribers of the channel (only those who are in your contact list)
     * @param {?number} limit Optional parameter to specify the limit of subscribers to retrieve
     * @returns {Promise<{contact: Contact, role: string}[]>} Returns an array of objects that handle the subscribed contacts and their roles in the channel
     */
    async getSubscribers(limit?: number): Promise<{contact: Contact, role: string}[]> {
        return await this.client.evaluate(async (channelId, limit) => {
            if (!window.WWebJS || !window.Store)
                throw new Error('window.WWebJS or window.Store is not defined');
            const getContactModel = window.WWebJS.getContactModel;
            if (!window.WWebJS.getChat || !window.Store.ChannelSubscribers || !window.Store.ChannelSubscribers.mexFetchNewsletterSubscribers || !getContactModel)
                throw new Error('window.WWebJS.getChat or window.Store.ChannelSubscribers or window.Store.ChannelSubscribers.mexFetchNewsletterSubscribers or window.WWebJS.getContactModel is not defined');
            const channel = await window.WWebJS.getChat(channelId, { getAsModel: false });
            if (!channel) return [];
            !limit && (limit = window.Store.ChannelUtils.getMaxSubscriberNumber());
            const response = await window.Store.ChannelSubscribers.mexFetchNewsletterSubscribers(channelId, limit);
            const contacts = window.Store.ChannelSubscribers.getSubscribersInContacts(response.subscribers);
            return Promise.all(contacts.map((obj: any) => ({
                ...obj,
                contact: getContactModel(obj.contact)
            })));
        }, this.id._serialized, limit);
    }

    /**
     * Updates the channel subject
     * @param {string} newSubject 
     * @returns {Promise<boolean>} Returns true if the subject was properly updated. This can return false if the user does not have the necessary permissions.
     */
    async setSubject(newSubject: string): Promise<boolean> {
        const success = await this._setChannelMetadata({ name: newSubject }, { editName: true });
        success && (this.name = newSubject);
        return success;
    }

    /**
     * Updates the channel description
     * @param {string} newDescription 
     * @returns {Promise<boolean>} Returns true if the operation completed successfully, false otherwise
     */
    async setDescription(newDescription: string): Promise<boolean> {
        const success = await this._setChannelMetadata({ description: newDescription }, { editDescription: true });
        success && (this.description = newDescription);
        return success;
    }

    /**
     * Updates the channel profile picture
     * @param {MessageMedia} newProfilePicture 
     * @returns {Promise<boolean>} Returns true if the operation completed successfully, false otherwise
     */
    async setProfilePicture(newProfilePicture: MessageMedia): Promise<boolean> {
        return await this._setChannelMetadata({ picture: newProfilePicture }, { editPicture: true });
    }

    /**
     * Updates available reactions to use in the channel
     * 
     * Valid values for passing to the method are:
     * 0 for NONE reactions to be avaliable
     * 1 for BASIC reactions to be available: 👍, ❤️, 😂, 😮, 😢, 🙏
     * 2 for ALL reactions to be available
     * @param {number} reactionCode 
     * @returns {Promise<boolean>} Returns true if the operation completed successfully, false otherwise
     */
    async setReactionSetting(reactionCode: number): Promise<boolean> {
        if (![0, 1, 2].includes(reactionCode)) return false;
        const reactionMapper = {
            0: 3,
            1: 1,
            2: 0
        };
        const success = await this._setChannelMetadata(
            { reactionCodesSetting: reactionMapper[reactionCode as keyof typeof reactionMapper] },
            { editReactionCodesSetting: true }
        );
        success && (this.channelMetadata.reactionCodesSetting = reactionCode);
        return success;
    }

    /**
     * Mutes the channel
     * @returns {Promise<boolean>} Returns true if the operation completed successfully, false otherwise
     */
    async mute(): Promise<boolean> {
        const success = await this._muteUnmuteChannel('MUTE');
        if (success) {
            this.isMuted = true;
            this.muteExpiration = -1;
        }
        return success;
    }
    
    /**
     * Unmutes the channel
     * @returns {Promise<boolean>} Returns true if the operation completed successfully, false otherwise
     */
    async unmute(): Promise<boolean> {
        const success = await this._muteUnmuteChannel('UNMUTE');
        if (success) {
            this.isMuted = false;
            this.muteExpiration = 0;
        }
        return success;
    }

    /**
     * Message options
     * @typedef {Object} MessageSendOptions
     * @property {?string} caption Image or video caption
     * @property {?string[]} mentions User IDs of user that will be mentioned in the message
     * @property {?MessageMedia} media Image or video to be sent
     */

    /**
     * Sends a message to this channel
     * @param {string|MessageMedia} content
     * @param {?MessageSendOptions} options
     * @returns {Promise<Message>} Message that was just sent
     */
    async sendMessage(content: string|MessageMedia, options?: MessageSendOptions): Promise<Message | null | undefined> {
        return await this.client.sendMessage(this.id._serialized, content, options);
    }

    /**
     * Sets the channel as seen
     * @returns {Promise<boolean>}
     */
    async sendSeen(): Promise<boolean> {
        return await this.client.sendSeen(this.id._serialized);
    }

    /**
     * @typedef {Object} SendChannelAdminInviteOptions
     * @property {?string} comment The comment to be added to an invitation
     */

    /**
     * Sends a channel admin invitation to a user, allowing them to become an admin of the channel
     * @param {string} chatId The ID of a user to send the channel admin invitation to
     * @param {SendChannelAdminInviteOptions} options 
     * @returns {Promise<boolean>} Returns true if an invitation was sent successfully, false otherwise
     */
    async sendChannelAdminInvite(chatId: string, options: { comment?: string } = {}): Promise<boolean> {
        return await this.client.sendChannelAdminInvite(chatId, this.id._serialized, options);
    }

    /**
     * Accepts a channel admin invitation and promotes the current user to a channel admin
     * @returns {Promise<boolean>} Returns true if the operation completed successfully, false otherwise
     */
    async acceptChannelAdminInvite(): Promise<boolean> {
        return await this.client.acceptChannelAdminInvite(this.id._serialized);
    }

    /**
     * Revokes a channel admin invitation sent to a user by a channel owner
     * @param {string} userId The user ID the invitation was sent to
     * @returns {Promise<boolean>} Returns true if the operation completed successfully, false otherwise
     */
    async revokeChannelAdminInvite(userId: string): Promise<boolean> {
        return await this.client.revokeChannelAdminInvite(this.id._serialized, userId);
    }

    /**
     * Demotes a channel admin to a regular subscriber (can be used also for self-demotion)
     * @param {string} userId The user ID to demote
     * @returns {Promise<boolean>} Returns true if the operation completed successfully, false otherwise
     */
    async demoteChannelAdmin(userId: string): Promise<boolean> {
        return await this.client.demoteChannelAdmin(this.id._serialized, userId);
    }

    /**
     * Options for transferring a channel ownership to another user
     * @typedef {Object} TransferChannelOwnershipOptions
     * @property {boolean} [shouldDismissSelfAsAdmin = false] If true, after the channel ownership is being transferred to another user, the current user will be dismissed as a channel admin and will become to a channel subscriber.
     */

    /**
     * Transfers a channel ownership to another user.
     * Note: the user you are transferring the channel ownership to must be a channel admin.
     * @param {string} newOwnerId
     * @param {TransferChannelOwnershipOptions} options
     * @returns {Promise<boolean>} Returns true if the operation completed successfully, false otherwise
     */
    async transferChannelOwnership(newOwnerId: string, options: TransferChannelOwnershipOptions = {}): Promise<boolean> {
        return await this.client.transferChannelOwnership(this.id._serialized, newOwnerId, options);
    }

    /**
     * Loads channel messages, sorted from earliest to latest
     * @param {Object} searchOptions Options for searching messages. Right now only limit and fromMe is supported
     * @param {Number} [searchOptions.limit] The amount of messages to return. If no limit is specified, the available messages will be returned. Note that the actual number of returned messages may be smaller if there aren't enough messages in the conversation. Set this to Infinity to load all messages
     * @param {Boolean} [searchOptions.fromMe] Return only messages from the bot number or vise versa. To get all messages, leave the option undefined
     * @returns {Promise<Array<Message>>}
     */
    async fetchMessages(searchOptions: MessageSearchOptions): Promise<Message[]> {
        const messages = await this.client.evaluate(async (channelId, searchOptions: MessageSearchOptions) => {
            if (!window.WWebJS || !window.Store) {
                throw new Error('window.WWebJS or window.Store is not defined');
            }
            const getMessageModel = window.WWebJS.getMessageModel;
            if (!window.WWebJS.getChat || !window.Store.ChannelUtils || !window.Store.ChannelUtils.deleteNewsletterAction || !getMessageModel) {
                throw new Error('window.WWebJS.getChat or window.Store.ChannelUtils.deleteNewsletterAction or getMessageModel is not defined');
            }
            const msgFilter = (m: any) => {
                if (m.isNotification || m.type === 'newsletter_notification') {
                    return false; // dont include notification messages
                }
                if (searchOptions && searchOptions.fromMe !== undefined && m.id.fromMe !== searchOptions.fromMe) {
                    return false;
                }
                return true;
            };

            const channel = await window.WWebJS.getChat(channelId, { getAsModel: false });
            let msgs = channel.msgs.getModelsArray().filter(msgFilter);

            if (searchOptions && searchOptions.limit && searchOptions.limit > 0) {
                while (msgs.length < searchOptions.limit) {
                    const loadedMessages = await window.Store.ConversationMsgs.loadEarlierMsgs(channel);
                    if (!loadedMessages || !loadedMessages.length) break;
                    msgs = [...loadedMessages.filter(msgFilter), ...msgs];
                }
                
                if (msgs.length > searchOptions.limit) {
                    msgs.sort((a: any, b: any) => (a.t > b.t) ? 1 : -1);
                    msgs = msgs.splice(msgs.length - searchOptions.limit);
                }
            }

            return msgs.map((m: any) => getMessageModel(m));

        }, this.id._serialized, searchOptions);

        return messages.map((msg: any) => new Message(this.client, msg));
    }

    /**
     * Deletes the channel you created
     * @returns {Promise<boolean>} Returns true if the operation completed successfully, false otherwise
     */
    async deleteChannel(): Promise<boolean> {
        return await this.client.deleteChannel(this.id._serialized);
    }

    /**
     * Internal method to change the channel metadata
     * @param {string|number|MessageMedia} value The new value to set
     * @param {string} property The property of a channel metadata to change
     * @returns {Promise<boolean>} Returns true if the operation completed successfully, false otherwise
     */
    async _setChannelMetadata(value: {picture?: string | MessageMedia, name?: string, description?: string, reactionCodesSetting?: number}, property: {editReactionCodesSetting?: boolean, editPicture?: boolean, editDescription?: boolean, editName?: boolean}): Promise<boolean> {
        if (!value) throw new Error('value is not defined');
        return await this.client.evaluate(async (channelId: string, value: any, property: any) => {
            if (!window.WWebJS || !window.WWebJS.getChat || !window.Store || !window.Store.ChannelUtils || !window.Store.ChannelUtils.editNewsletterMetadataAction || !window.WWebJS.cropAndResizeImage) {
                throw new Error('window.WWebJS.getChat or window.Store.ChannelUtils.editNewsletterMetadataAction is not defined');
            }
            const channel = await window.WWebJS.getChat(channelId, { getAsModel: false });
            if (!channel) return false;
            if (property.editPicture) {
                value.picture = value.picture
                    ? await window.WWebJS.cropAndResizeImage(value.picture, {
                        asDataUrl: true,
                        mimetype: 'image/jpeg',
                        size: 640,
                        quality: 1
                    })
                    : null;
            }
            try {
                await window.Store.ChannelUtils.editNewsletterMetadataAction(channel, property, value);
                return true;
            } catch (err) {
                if ((err as Error).name === 'ServerStatusCodeError') return false;
                throw err;
            }
        }, this.id._serialized, value, property);
    }

    /**
     * Internal method to mute or unmute the channel
     * @param {string} action The action: 'MUTE' or 'UNMUTE'
     * @returns {Promise<boolean>} Returns true if the operation completed successfully, false otherwise
     */
    async _muteUnmuteChannel(action: string): Promise<boolean> {
        return await this.client.evaluate(async (channelId: string, action: string) => {
            if (!window.Store || !window.Store.ChannelUtils || !window.Store.ChannelUtils.muteNewsletter || !window.Store.ChannelUtils.unmuteNewsletter) {
                throw new Error('window.Store.ChannelUtils.muteNewsletter or window.Store.ChannelUtils.unmuteNewsletter is not defined');
            }
            try {
                action === 'MUTE'
                    ? await window.Store.ChannelUtils.muteNewsletter([channelId])
                    : await window.Store.ChannelUtils.unmuteNewsletter([channelId]);
                return true;
            } catch (err) {
                if ((err as Error).name === 'ServerStatusCodeError') return false;
                throw err;
            }
        }, this.id._serialized, action);
    }
}

export default Channel;
