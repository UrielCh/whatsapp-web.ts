import Base from './Base.ts';
import ProductMetadata from './ProductMetadata.ts';

/**
 * Represents a Product on WhatsAppBusiness
 * @extends {Base}
 */
class Product extends Base {
    id?: string;
    price?: string;
    thumbnailUrl?: string;
    currency?: string;
    name?: string;
    quantity?: number;
    data?: ProductMetadata | null;

    constructor(client: any, data: any) {
        super(client);

        if (data) this._patch(data);
    }

    override _patch(data: any) {
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

    async getData() {
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