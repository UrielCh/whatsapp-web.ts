import Base from './Base.js';
import Product from './Product.js';
import Client from '../Client.js';

/**
 * Represents a Order on WhatsApp
 *
 * @example
 * {
 * "products": [
 * {
 * "id": "123456789",
 * "price": "150000",
 * "thumbnailId": "123456789",
 * "thumbnailUrl": "https://mmg.whatsapp.net",
 * "currency": "GTQ",
 * "name": "Store Name",
 * "quantity": 1
 * }
 * ],
 * "subtotal": "150000",
 * "total": "150000",
 * "currency": "GTQ",
 * "createdAt": 1610136796,
 * "sellerJid": "55555555@s.whatsapp.net"
 * }
 */

class Order extends Base {
    /** List of products*/
    products: Array<Product>;
    /** Order Subtotal */
    subtotal: string;
    /** Order Total */
    total: string;
    /** Order Currency */
    currency: string;
    /** Order Created At*/
    createdAt: number;
    constructor(client: Client, data: any) {
        super(client);

        if (data) this._patch(data);
    }

    override _patch(data: any): any {
        /**
         * List of products
         * @type {Array<Product>}
         */
        if (data.products) {
            this.products = data.products.map(product => new Product(this.client, product));
        }
        /**
         * Order Subtotal
         * @type {string}
         */
        this.subtotal = data.subtotal;
        /**
         * Order Total
         * @type {string}
         */
        this.total = data.total;
        /**
         * Order Currency
         * @type {string}
         */
        this.currency = data.currency;
        /**
         * Order Created At
         * @type {number}
         */
        this.createdAt = data.createdAt;

        return super._patch(data);
    }


}

export default Order;