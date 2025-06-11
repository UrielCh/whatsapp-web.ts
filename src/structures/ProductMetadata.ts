import Client from '../Client.js';
import Base from './Base.js';

/**
 * Represents the metadata associated with a given product
 */
class ProductMetadata extends Base {
    /** Product Id */
    id: string;
    /** Product Name */
    name: string;
    /** Product Description */
    description: string;
    /** Retailer ID */
    retailer_id?: string;
    
    constructor(client: Client, data: {id: string, retailer_id?: string, name: string, description: string}) {
        super(client);
        if (data) this._patch(data);
    }

    override _patch(data: {id: string, retailer_id?: string, name: string, description: string}): any {
        /** Product ID */
        this.id = data.id;
        /** Retailer ID */
        this.retailer_id = data.retailer_id;
        /** Product Name  */
        this.name = data.name;
        /** Product Description */
        this.description = data.description;

        return super._patch(data);
    }

}

export default ProductMetadata;