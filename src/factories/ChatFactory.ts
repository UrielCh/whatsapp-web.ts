import PrivateChat from '../structures/PrivateChat.js';
import GroupChat from '../structures/GroupChat.js';
import Channel from '../structures/Channel.js';
import Chat from '../structures/Chat.js';
import Client from '../Client.js';

class ChatFactory {
    static create(client: Client, data: any): Chat | Channel | GroupChat {
        if (data.isGroup) {
            return new GroupChat(client, data);
        }
        
        if (data.isChannel) {
            return new Channel(client, data);
        }

        return new PrivateChat(client, data);
    }
}

export default ChatFactory;
