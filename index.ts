export * from './src/util/Constants.js';
// export {default as pkg} from './package.json' with { type: 'json' };
export {default as Chat} from './src/structures/Chat.js';
export {default as PrivateChat} from './src/structures/PrivateChat.js';
export {default as GroupChat} from './src/structures/GroupChat.js';
export {default as Channel} from './src/structures/Channel.js';
export {default as Message} from './src/structures/Message.js';
export {default as MessageMedia} from './src/structures/MessageMedia.js';
export {default as Contact} from './src/structures/Contact.js';
export {default as PrivateContact} from './src/structures/PrivateContact.js';
export {default as BusinessContact} from './src/structures/BusinessContact.js';
export {default as ClientInfo} from './src/structures/ClientInfo.js';
export {default as Location} from './src/structures/Location.js';
export {default as Poll} from './src/structures/Poll.js';
export {default as ProductMetadata} from './src/structures/ProductMetadata.js';
export {default as List} from './src/structures/List.js';
export {default as Buttons} from './src/structures/Buttons.js';
export {default as Broadcast} from './src/structures/Broadcast.js';
export {default as NoAuth} from './src/authStrategies/NoAuth.js';
export {default as LocalAuth} from './src/authStrategies/LocalAuth.js';
export {default as RemoteAuth} from './src/authStrategies/RemoteAuth.js';
export { default as Client } from './src/Client.js';

import * as Constants from './src/util/Constants.js';
import pkg from './deno.json' with { type: 'json' };
import Chat from './src/structures/Chat.js';
import PrivateChat from './src/structures/PrivateChat.js';
import GroupChat from './src/structures/GroupChat.js';
import Channel from './src/structures/Channel.js';
import Message from './src/structures/Message.js';
import MessageMedia from './src/structures/MessageMedia.js';
import Contact from './src/structures/Contact.js';
import PrivateContact from './src/structures/PrivateContact.js';
import BusinessContact from './src/structures/BusinessContact.js';
import ClientInfo from './src/structures/ClientInfo.js';
import Location from './src/structures/Location.js';
import Poll from './src/structures/Poll.js';
import ProductMetadata from './src/structures/ProductMetadata.js';
import List from './src/structures/List.js';
import Buttons from './src/structures/Buttons.js';
import Broadcast from './src/structures/Broadcast.js';
import NoAuth from './src/authStrategies/NoAuth.js';
import LocalAuth from './src/authStrategies/LocalAuth.js';
import RemoteAuth from './src/authStrategies/RemoteAuth.js';
import Client from './src/Client.js';

export default {
    Client,
    version: pkg.version,
    // Structures
    Chat,
    PrivateChat,
    GroupChat,
    Channel,
    Message,
    MessageMedia,
    Contact,
    PrivateContact,
    BusinessContact,
    ClientInfo,
    Location,
    Poll,
    ProductMetadata,
    List,
    Buttons,
    Broadcast,
    // Auth Strategies
    NoAuth,
    LocalAuth,
    RemoteAuth,
    ...Constants
};
