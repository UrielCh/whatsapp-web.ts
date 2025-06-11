/// <reference lib="deno.ns" />
import { describe, it, beforeAll, afterAll, beforeEach, afterEach } from "@std/testing/bdd";
import { assertEquals, assertExists, assertMatch, assertRejects, assertThrows, assertNotEquals, assert, assertGreaterOrEqual, assertInstanceOf } from "@std/assert";

import * as helper from '../helper.js';
import Message from '../../src/structures/Message.js';
import { MessageTypes } from '../../src/util/Constants.js';
import Contact from '../../src/structures/Contact.js';
import type Client from "../../src/Client.ts";
import type { Chat } from "../../src/structures/index.ts";

const remoteId = helper.remoteId;

describe.skip('Chat', function () {
    let client: Client;
    let chat: Chat;

    beforeAll(async function() {
        // this.timeout(35000); // Deno's default timeout or per-test option
        client = await helper.createClient({
            authenticated: true,
            options: {puppeteer: { headless: false }},
        });
        await client.initialize();
        const c = await client.getChatById(remoteId);
        assertExists(c, "Chat should exist");
        chat = c;
    });

    afterAll(async function () {
        if (client) { // Ensure client exists before destroying
            await client.destroy();
        }
    });

    it('can send a message to a chat', async function () {
        const msg = await chat.sendMessage('hello world');
        assert(msg instanceof Message);
        if (!msg) return;
        assertEquals(msg.type, MessageTypes.TEXT);
        assertEquals(msg.fromMe, true);
        assertEquals(msg.body, 'hello world');
        assertEquals(msg.to, remoteId);
    });

    it('can fetch messages sent in a chat', async function () {
        await helper.sleep(1000);
        const msg = await chat.sendMessage('another message');
        assertExists(msg, "Message should exist after sending");
        if (!msg) return;
        await helper.sleep(500);

        const messages = await chat.fetchMessages();
        assertGreaterOrEqual(messages.length, 2);

        const fetchedMsg = messages[messages.length-1];
        assert(fetchedMsg instanceof Message);
        assertEquals(fetchedMsg.type, MessageTypes.TEXT);
        assertEquals(fetchedMsg.id._serialized, msg.id._serialized);
        assertEquals(fetchedMsg.body, msg.body);
    });

    it('can use a limit when fetching messages sent in a chat', async function () {
        await helper.sleep(1000);  
        const msg = await chat.sendMessage('yet another message');
        assertExists(msg, "Message should exist after sending");
        if (!msg) return;
        await helper.sleep(500);

        const messages = await chat.fetchMessages({limit: 1});
        assertEquals(messages.length, 1);

        const fetchedMsg = messages[0];
        assert(fetchedMsg instanceof Message);
        if (!fetchedMsg) return; // Should be handled by assertExists if we want to be stricter
        assertEquals(fetchedMsg.type, MessageTypes.TEXT);
        assertEquals(fetchedMsg.id._serialized, msg.id._serialized);
        assertEquals(fetchedMsg.body, msg.body);
    });

    it('can use fromMe=true when fetching messages sent in a chat to get only bot messages', async function () {
        const messages = await chat.fetchMessages({fromMe: true});
        assertEquals(messages.length, 2); // This might be flaky depending on previous tests if not isolated
    });

    it('can use fromMe=false when fetching messages sent in a chat to get only non bot messages', async function () {
        const messages = await chat.fetchMessages({fromMe: false});
        assertEquals(messages.length, 0); // This might be flaky
    });

    it('can get the related contact', async function () {
        const contact = await chat.getContact();
        assert(contact instanceof Contact);
        assertEquals(contact.id._serialized, chat.id._serialized);
    });

    describe('Seen', function () {
        it('can mark a chat as unread', async function () {
            await chat.markUnread();
            await helper.sleep(500);

            // refresh chat
            const refreshedChat = await client.getChatById(remoteId);
            assertExists(refreshedChat);
            chat = refreshedChat;
            assertEquals(chat.unreadCount, -1);
        });

        it('can mark a chat as seen', async function () {
            const res = await chat.sendSeen();
            assertEquals(res, true);

            await helper.sleep(1000);

            // refresh chat
            const refreshedChat = await client.getChatById(remoteId);
            assertExists(refreshedChat);
            chat = refreshedChat;
            assertEquals(chat.unreadCount, 0);
        });
    });

    describe('Archiving', function (){
        it('can archive a chat', async function () {
            const res = await chat.archive();
            assertEquals(res, true);

            await helper.sleep(1000);

            // refresh chat
            const refreshedChat = await client.getChatById(remoteId);
            assertExists(refreshedChat);
            chat = refreshedChat;
            assertEquals(chat.archived, true);
        });

        it('can unarchive a chat', async function () {
            const res = await chat.unarchive();
            assertEquals(res, false); // Original test expects false, this might indicate unarchive doesn't return true on success or it was already unarchived?

            await helper.sleep(1000);

            // refresh chat
            const refreshedChat = await client.getChatById(remoteId);
            assertExists(refreshedChat);
            chat = refreshedChat;
            assertEquals(chat.archived, false);
        });
    });

    describe('Pinning', function () {
        it('can pin a chat', async function () {
            const res = await chat.pin();
            assertEquals(res, true);

            await helper.sleep(1000);

            // refresh chat
            const refreshedChat = await client.getChatById(remoteId);
            assertExists(refreshedChat);
            chat = refreshedChat;
            assertEquals(chat.pinned, true);
        });

        it('can unpin a chat', async function () {
            const res = await chat.unpin();
            assertEquals(res, false); // Similar to unarchive, original expects false.
            await helper.sleep(1000);

            // refresh chat
            const refreshedChat = await client.getChatById(remoteId);
            assertExists(refreshedChat);
            chat = refreshedChat;
            assertEquals(chat.pinned, false);
        });
    });

    describe('Muting', function () {
        it('can mute a chat forever', async function() {
            await chat.mute();

            await helper.sleep(1000);

            // refresh chat
            const refreshedChat = await client.getChatById(remoteId);
            assertExists(refreshedChat);
            chat = refreshedChat;
            assertEquals(chat.isMuted, true);
            assertEquals(chat.muteExpiration, -1);
        });

        it('can mute a chat until a specific date', async function() {
            const unmuteDate = new Date(new Date().getTime() + (1000*60*60));  
            await chat.mute(unmuteDate);

            await helper.sleep(1000);

            // refresh chat
            const refreshedChat = await client.getChatById(remoteId);
            assertExists(refreshedChat);
            chat = refreshedChat;
            assertEquals(chat.isMuted, true);
            assertEquals(chat.muteExpiration, Math.round(unmuteDate.getTime() / 1000));
        });

        it('can unmute a chat', async function () {
            await chat.unmute();
            await helper.sleep(500);
            
            // refresh chat
            const refreshedChat = await client.getChatById(remoteId);
            assertExists(refreshedChat);
            chat = refreshedChat;
            assertEquals(chat.isMuted, false);
            assertEquals(chat.muteExpiration, 0);
        });
    });
  
    // eslint-disable-next-line mocha/no-skipped-tests
    describe.skip('Destructive operations', function () {
        it('can clear all messages from chat', async function () { 
            const res = await chat.clearMessages();
            assertEquals(res, true);
  
            await helper.sleep(3000);
  
            const msgs = await chat.fetchMessages();
            assertEquals(msgs.length, 0);
        });
  
        it('can delete a chat', async function () {
            const res = await chat.delete();
            assertEquals(res, true);
        });
    });
});