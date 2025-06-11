import type Client from "../Client.ts";
import Base from './Base.js';
import type { ContactId } from './Contact.js';

/** 
 * Information about the phone this client is connected to 
 * @deprecated
 */
export interface ClientInfoPhone {
    /** WhatsApp Version running on the phone */
    wa_version: string
    /** OS Version running on the phone (iOS or Android version) */
    os_version: string
    /** Device manufacturer */
    device_manufacturer: string
    /** Device model */
    device_model: string
    /** OS build number */
    os_build_number: string
}

/** 
 * @deprecated
 */
export interface BatteryInfo {
    /** The current battery percentage */
    battery: number,
    /** Indicates if the phone is plugged in (true) or not (false) */
    plugged: boolean,
}


/**
 * Current connection information
 * @extends {Base}
 */
class ClientInfo extends Base {
    /** 
     * Current user ID 
     * @deprecated Use .wid instead 
     */
    me: ContactId;
    /** Current user ID */
    wid: ContactId;
    /** 
     * Information about the phone this client is connected to.  Not available in multi-device. 
     * @deprecated 
     */
    phone: ClientInfoPhone;
    /** Platform the phone is running on */
    platform: string
    /** Name configured to be shown in push notifications */
    pushname: string
    
    constructor(client: Client, data: any) {
        super(client);

        if (data) this._patch(data);
    }
    /**
     * @param {object} data
     * @param {string} data.id
     * @param {string} data.platform
     * @param {string} data.pushname
     * @param {string} data.ref
     * @param {number} data.refTTL
     * @param {number} data.smbTos
     */
    override _patch(data: any): any {
        /**
         * Name configured to be shown in push notifications
         * @type {string}
         */
        this.pushname = data.pushname;

        /**
         * Current user ID
         * @type {object}
         */
        this.wid = data.wid;

        /**
         * @type {object}
         * @deprecated Use .wid instead
         */
        this.me = data.wid;

        /**
         * Information about the phone this client is connected to. Not available in multi-device.
         * @type {object}
         * @property {string} wa_version WhatsApp Version running on the phone
         * @property {string} os_version OS Version running on the phone (iOS or Android version)
         * @property {string} device_manufacturer Device manufacturer
         * @property {string} device_model Device model
         * @property {string} os_build_number OS build number
         * @deprecated
         */
        this.phone = data.phone;

        /**
         * Platform WhatsApp is running on
         * @type {string}
         */
        this.platform = data.platform;

        return super._patch(data);
    }

    /**
     * Get current battery percentage and charging status for the attached device
     * @returns {object} batteryStatus
     * @returns {number} batteryStatus.battery - The current battery percentage
     * @returns {boolean} batteryStatus.plugged - Indicates if the phone is plugged in (true) or not (false)
     * @deprecated
     */
    async getBatteryStatus(): Promise<BatteryInfo> {
        return await this.client.evaluate(() => {
            if (!window.Store || !window.Store.Conn) 
                throw new Error('window.Store.Conn is not defined');
            const { battery, plugged } = window.Store.Conn;
            return { battery, plugged };
        });
    }
}

export default ClientInfo;