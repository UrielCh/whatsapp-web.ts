import Base from './Base.ts';
import Product from './Product.ts';

/**
 * Represents a Order on WhatsApp
 * @extends {Base}
 */
class Order extends Base {
    products?: any;
    subtotal?: string;
    total?: string;
    currency?: string;
    createdAt?: number;
    
    constructor(client: any, data: any) {
        super(client);

        if (data) this._patch(data);
    }

    override _patch(data: any) {
        /**
         * List of products
         * @type {Array<Product>}
         */
        if (data.products) {
            this.products = data.products.map((product: any) => new Product(this.client, product));
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
