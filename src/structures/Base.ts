/**
 * Represents a WhatsApp data structure
 */
class Base {
    constructor(client: any) {
        /**
         * The client that instantiated this
         * @readonly
         */
        Object.defineProperty(this, 'client', { value: client });
    }

    _clone() {
        return Object.assign(Object.create(this), this);
    }
    
    _patch(data: any) { return data; }
}

export default Base;
