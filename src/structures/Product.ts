import Client from '../Client.js';
import Base from './Base.js';
import ProductMetadata from './ProductMetadata.js';

/**
 * Represents a Product on WhatsAppBusiness
 * @extends {Base}
 * @example
 * {
 * "id": "123456789",
 * "price": "150000",
 * "thumbnailId": "123456789",
 * "thumbnailUrl": "https://mmg.whatsapp.net",
 * "currency": "GTQ",
 * "name": "Store Name",
 * "quantity": 1
 * }
 */
class Product extends Base {
    /** Product Id */
    id: string;
    /** Price */
    price?: string;
    /** Product Thumbnail*/
    thumbnailUrl: string;
    /** Currency */
    currency: string;
    /** Product Name */
    name: string;
    /** Product Quantity*/
    quantity: number;
    data?: ProductMetadata;
    
    constructor(client: Client, data: any) {
        super(client);

        if (data) this._patch(data);
    }

    _patch(data) {
        /**
         * Product ID
         * @type {string}
         */
        this.id = data.id;
        /**
         * Price
         * @type {string}
         */
        this.price = data.price ? data.price : '';
        /**
         * Product Thumbnail
         * @type {string}
         */
        this.thumbnailUrl = data.thumbnailUrl;
        /**
         * Currency
         * @type {string}
         */
        this.currency = data.currency;
        /**
         * Product Name
         * @type {string}
         */
        this.name = data.name;
        /**
         * Product Quantity
         * @type {number}
         */
        this.quantity = data.quantity;
        /** Product metadata */
        this.data = null;
        return super._patch(data);
    }


    /** Gets the Product metadata */
    async getData(): Promise<ProductMetadata> {
        if (this.data === null) {
            let result = await this.client.pupPage.evaluate((productId) => {
                return window.WWebJS.getProductMetadata(productId);
            }, this.id);
            if (!result) {
                this.data = undefined;
            } else {
                this.data = new ProductMetadata(this.client, result);
            }
        }
        return this.data;
    }
}

export default Product;