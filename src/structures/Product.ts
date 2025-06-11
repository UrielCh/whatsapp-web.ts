import Client from '../Client.ts';
import Base from './Base.ts';
import ProductMetadata from './ProductMetadata.ts';

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
    id!: string;
    /** Price */
    price?: string;
    /** Product Thumbnail*/
    thumbnailUrl!: string;
    /** Currency */
    currency!: string;
    /** Product Name */
    name!: string;
    /** Product Quantity*/
    quantity!: number;
    data?: ProductMetadata;
    
    constructor(client: Client, data: {id: string, price?: string, thumbnailUrl: string, currency: string, name: string, quantity: number}) {
        super(client);

        if (data) this._patch(data);
    }

    override _patch(data: {id: string, price?: string, thumbnailUrl: string, currency: string, name: string, quantity: number}): any {
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
        this.data = undefined;
        return super._patch(data);
    }


    /** Gets the Product metadata */
    async getData(): Promise<ProductMetadata> {
        if (this.data === null) {
            const result = await this.client.evaluate((productId: string) => {
                if (!window.WWebJS || !window.WWebJS.getProductMetadata)
                    throw Error("window.WWebJS.getProductMetadata is not defined")
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