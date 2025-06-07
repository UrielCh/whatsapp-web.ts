import * as Constants from './src/util/Constants.js';
import Client from './src/Client.js';
import pkg from './package.json' with { type: 'json' };
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
