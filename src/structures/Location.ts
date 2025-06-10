/**
 * Location send options
 * @typedef {Object} LocationSendOptions
 * @property {string} [name] Location name
 * @property {string} [address] Location address
 * @property {string} [url] URL address to be shown within a location message
 * @property {string} [description] Location full description
 */

/** Options for sending a location */
export interface LocationSendOptions {
    /** Location name */
    name?: string;
    /** Location address */
    address?: string;
    /** URL address to be shown within a location message */
    url?: string;
}

/**
 * Location information
 */
class Location {
    latitude: number;
    longitude: number;
    name?: string;
    address?: string;
    url?: string;
    description?: string;

    /**
     * @param {number} latitude
     * @param {number} longitude
     * @param {LocationSendOptions} [options] Location send options
     */
    constructor(latitude: number, longitude: number, options?: LocationSendOptions) {
        /**
         * Location latitude
         * @type {number}
         */
        this.latitude = latitude;

        /**
         * Location longitude
         * @type {number}
         */
        this.longitude = longitude;

        /**
         * Name for the location
         * @type {string|undefined}
         */
        this.name = options.name;

        /**
         * Location address
         * @type {string|undefined}
         */
        this.address = options.address;

        /**
         * URL address to be shown within a location message
         * @type {string|undefined}
         */
        this.url = options.url;

        /**
         * Location full description
         * @type {string|undefined}
         */
        this.description = this.name && this.address
            ? `${this.name}\n${this.address}`
            : this.name || this.address || '';
    }
}

export default Location;