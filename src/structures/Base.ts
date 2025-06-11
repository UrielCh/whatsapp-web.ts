/**
 * Represents a WhatsApp data structure
 */
// import Contact from './Contact.ts';

import type Client from "../Client.ts";

class Base {
    client!: Client;
    constructor(client: Client) {
        /**
         * The client that instantiated this
         * @readonly
         */
        Object.defineProperty(this, 'client', { value: client });
    }

    _clone(): any {
        return Object.assign(Object.create(this), this);
    }
    
    _patch(data: any): any { return data; }
}

export default Base;