import fs from 'node:fs';
import path from 'node:path';
import mime from 'mime';
// import fetch from 'node-fetch';
import { URL } from 'node:url';
import { Buffer } from "node:buffer";

export interface MessageMediaData {
    data: string;
    mimetype: string;
    filename?: string;
    filesize?: number;
 }

/**
 * Media attached to a message
 * @param {string} mimetype MIME type of the attachment
 * @param {string} data Base64-encoded data of the file
 * @param {?string} filename Document file name. Value can be null
 * @param {?number} filesize Document file size in bytes. Value can be null
 */
export class MessageMedia implements MessageMediaData {
    mimetype: string;
    data: string;
    filename?: string;
    filesize?: number;

    constructor(mimetype: string, data: string, filename?: string, filesize?: number) {
        /**
         * MIME type of the attachment
         * @type {string}
         */
        this.mimetype = mimetype;

        /**
         * Base64 encoded data that represents the file
         * @type {string}
         */
        this.data = data;

        /**
         * Document file name. Value can be null
         * @type {?string}
         */
        this.filename = filename;
        
        /**
         * Document file size in bytes. Value can be null
         * @type {?number}
         */
        this.filesize = filesize;
    }

    /**
     * Creates a MessageMedia instance from a local file path
     * @param {string} filePath 
     * @returns {MessageMedia}
     */
    static fromFilePath(filePath: string): MessageMedia {
        const b64data = fs.readFileSync(filePath, {encoding: 'base64'});
        const mimetype = mime.getType(filePath); 
        const filename = path.basename(filePath);

        return new MessageMedia(mimetype, b64data, filename);
    }

    /**
     * Creates a MessageMedia instance from a URL
     * @param {string} url
     * @param {Object} [options]
     * @param {boolean} [options.unsafeMime=false]
     * @param {string} [options.filename]
     * @param {object} [options.client]
     * @param {object} [options.reqOptions]
     * @param {number} [options.reqOptions.size=0]
     * @returns {Promise<MessageMedia>}
     */
    static async fromUrl(url: string, options: {
        unsafeMime?: boolean;
        filename?: string;
        client?: any;// Client;
        reqOptions?: {
            size?: number;
        };
    } = {}): Promise<MessageMedia> {
        const pUrl = new URL(url);
        let mimetype = mime.getType(pUrl.pathname);

        if (!mimetype && !options.unsafeMime)
            throw new Error('Unable to determine MIME type using URL. Set unsafeMime to true to download it anyway.');

        async function fetchData (url: string, options: {
            size?: number;
        }) {
            const reqOptions = Object.assign({ headers: { accept: 'image/* video/* text/* audio/*' } }, options);
            const response = await fetch(url, reqOptions);
            const mime = response.headers.get('Content-Type');
            const size = response.headers.get('Content-Length');

            const contentDisposition = response.headers.get('Content-Disposition');
            const name = contentDisposition ? contentDisposition.match(/((?<=filename=")(.*)(?="))/) : null;

            let data = '';
            
            // Get array buffer from response
            const arrayBuffer = await response.arrayBuffer();
            const uint8Array = new Uint8Array(arrayBuffer);

            // Check if we're in Node.js environment
            if (typeof Buffer !== 'undefined') {
                // Node.js - use Buffer
                data = Buffer.from(uint8Array).toString('base64');
            } else {
                // Browser/Deno - use btoa with proper binary string conversion
                let binaryString = '';
                uint8Array.forEach((byte) => {
                    binaryString += String.fromCharCode(byte);
                });
                data = btoa(binaryString);
            }
            return { data, mime, name, size };
        }

        const res = options.client
            ? (await options.client.pupPage.evaluate(fetchData, url, options.reqOptions))
            : (await fetchData(url, options.reqOptions));

        const filename = options.filename ||
            (res.name ? res.name[0] : (pUrl.pathname.split('/').pop() || 'file'));
        
        if (!mimetype)
            mimetype = res.mime;

        return new MessageMedia(mimetype, res.data, filename, res.size || null);
    }
}

export default MessageMedia;
