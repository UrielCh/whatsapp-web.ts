import Base from './Base.ts';

export default class ProductMetadata extends Base {
    id?: string;
    retailer_id?: string;
    name?: string;
    description?: string;

    constructor(client: any, data: any) {
        super(client);

        if (data) this._patch(data);
    }

    override _patch(data: any) {
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
