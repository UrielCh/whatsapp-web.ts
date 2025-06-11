export * from './src/util/Constants.ts';
// export {default as pkg} from './package.json' with { type: 'json' };
export {default as Chat} from './src/structures/Chat.ts';
export {default as PrivateChat} from './src/structures/PrivateChat.ts';
export {default as GroupChat} from './src/structures/GroupChat.ts';
export {default as Channel} from './src/structures/Channel.ts';
export {default as Message} from './src/structures/Message.ts';
export {default as MessageMedia} from './src/structures/MessageMedia.ts';
export {default as Contact} from './src/structures/Contact.ts';
export {default as PrivateContact} from './src/structures/PrivateContact.ts';
export {default as BusinessContact} from './src/structures/BusinessContact.ts';
export {default as ClientInfo} from './src/structures/ClientInfo.ts';
export {default as Location} from './src/structures/Location.ts';
export {default as Poll} from './src/structures/Poll.ts';
export {default as ProductMetadata} from './src/structures/ProductMetadata.ts';
export {default as List} from './src/structures/List.ts';
export {default as Buttons} from './src/structures/Buttons.ts';
export {default as Broadcast} from './src/structures/Broadcast.ts';
export {default as NoAuth} from './src/authStrategies/NoAuth.ts';
export {default as LocalAuth} from './src/authStrategies/LocalAuth.ts';
export {default as RemoteAuth} from './src/authStrategies/RemoteAuth.ts';
export { default as Client } from './src/Client.ts';

import * as Constants from './src/util/Constants.ts';
import pkg from './deno.json' with { type: 'json' };
import Chat from './src/structures/Chat.ts';
import PrivateChat from './src/structures/PrivateChat.ts';
import GroupChat from './src/structures/GroupChat.ts';
import Channel from './src/structures/Channel.ts';
import Message from './src/structures/Message.ts';
import MessageMedia from './src/structures/MessageMedia.ts';
import Contact from './src/structures/Contact.ts';
import PrivateContact from './src/structures/PrivateContact.ts';
import BusinessContact from './src/structures/BusinessContact.ts';
import ClientInfo from './src/structures/ClientInfo.ts';
import Location from './src/structures/Location.ts';
import Poll from './src/structures/Poll.ts';
import ProductMetadata from './src/structures/ProductMetadata.ts';
import List from './src/structures/List.ts';
import Buttons from './src/structures/Buttons.ts';
import Broadcast from './src/structures/Broadcast.ts';
import NoAuth from './src/authStrategies/NoAuth.ts';
import LocalAuth from './src/authStrategies/LocalAuth.ts';
import RemoteAuth from './src/authStrategies/RemoteAuth.ts';
import Client from './src/Client.ts';

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
