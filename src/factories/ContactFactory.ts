import PrivateContact from '../structures/PrivateContact.js';
import BusinessContact from '../structures/BusinessContact.js';
import Client from '../Client.js';

class ContactFactory {
    static create(client: Client, data: any) {
        if(data.isBusiness) {
            return new BusinessContact(client, data);
        }

        return new PrivateContact(client, data);
    }
}

export default ContactFactory;