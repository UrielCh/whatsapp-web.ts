import Contact from './Contact.ts';

/**
 * Represents a Business Contact on WhatsApp
 * @extends {Contact}
 */
class BusinessContact extends Contact {
    businessProfile?: any;
    override _patch(data: any) {
        /**
         * The contact's business profile
         */
        this.businessProfile = data.businessProfile;

        return super._patch(data);
    }

}

export default BusinessContact;