import PrivateChat from '../structures/PrivateChat.ts';
import GroupChat from '../structures/GroupChat.ts';
import Channel from '../structures/Channel.ts';
import Chat from '../structures/Chat.ts';
import Client from '../Client.ts';

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
