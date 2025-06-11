import PrivateContact from '../structures/PrivateContact.ts';
import BusinessContact from '../structures/BusinessContact.ts';
import Client from '../Client.ts';

class ContactFactory {
    static create(client: Client, data: any) {
        if(data.isBusiness) {
            return new BusinessContact(client, data);
        }

        return new PrivateContact(client, data);
    }
}

export default ContactFactory;