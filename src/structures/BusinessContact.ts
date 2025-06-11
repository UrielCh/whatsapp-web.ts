import Contact, { ContactId } from './Contact.js';

export interface BusinessCategory {
    id: string,
    localized_display_name: string,
}


export interface BusinessHoursOfDay {
    mode: string,
    hours: number[] 
}

export interface BusinessHours {
    config: {
        sun: BusinessHoursOfDay,
        mon: BusinessHoursOfDay,
        tue: BusinessHoursOfDay,
        wed: BusinessHoursOfDay,
        thu: BusinessHoursOfDay,
        fri: BusinessHoursOfDay,
    }
    timezone: string,
}

/**
 * Represents a Business Contact on WhatsApp
 * @extends {Contact}
 */
class BusinessContact extends Contact {
    /** 
     * The contact's business profile
     */
    businessProfile: {
        /** The contact's business profile id */
        id: ContactId;
    
        /** The contact's business profile tag */
        tag: string;
    
        /** The contact's business profile description */
        description: string;
    
        /** The contact's business profile categories */
        categories: BusinessCategory[];
    
        /** The contact's business profile options */
        profileOptions: {
            /** The contact's business profile commerce experience*/
            commerceExperience: string;
                    
            /** The contact's business profile cart options */
            cartEnabled: boolean;
        };
    
        /** The contact's business profile email */
        email: string;
    
        /** The contact's business profile websites */
        website: string[];
    
        /** The contact's business profile latitude */
        latitude: number;
                
        /** The contact's business profile longitude */
        longitude: number;
              
        /** The contact's business profile work hours*/
        businessHours: BusinessHours;

        /** The contact's business profile address */
        address: string;
                
        /** The contact's business profile facebook page */
        fbPage: object;
                
        /** Indicate if the contact's business profile linked */
        ifProfileLinked: boolean;
                
        /** The contact's business profile coverPhoto */
        coverPhoto: null | any;
    }
    
    override _patch(data: any): any {
        /**
         * The contact's business profile
         */
        this.businessProfile = data.businessProfile;

        return super._patch(data);
    }

}

export default BusinessContact;