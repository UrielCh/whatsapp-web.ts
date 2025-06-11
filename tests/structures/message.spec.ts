/// <reference lib="deno.ns" />
import { describe, it, beforeAll, afterAll } from "@std/testing/bdd";
import { assertEquals, assertExists, assert, assertInstanceOf } from "@std/assert";
import { spy } from "jsr:@std/testing/mock";

import * as helper from '../helper.ts';
import { Contact, Chat } from '../../src/structures/index.ts';
import type { Client, Message } from '../../index.ts';

const remoteId = helper.remoteId;

describe.skip('Message', function () {
    let client: Client;
    let chat: Chat;
    let message: Message | null | undefined;

    beforeAll(async function() {
        // this.timeout(35000); // Handled by Deno's test runner options or default
        client = await helper.createClient({ authenticated: true, 
            options: {puppeteer: { headless: false }},
         });
        
        await client.initialize();

        const c = await client.getChatById(remoteId);
        assertExists(c, "Chat must exist to send a message");
        chat = c;
        message = await chat.sendMessage('this is only a test');
        assertExists(message, "Message must exist after sending");

        // wait for message to be sent
        await helper.sleep(1000);
    });

    afterAll(async function () {
        if (client) await client.destroy();
    });

    it('can get the related chat', async function () {
        assertExists(message, "Message must be defined for this test");
        const chatResult = await message!.getChat();
        assertInstanceOf(chatResult, Chat);
        assertEquals(chatResult.id._serialized, remoteId);
    });

    it('can get the related contact', async function () {
        assertExists(message, "Message must be defined for this test");
        const contact = await message!.getContact();
        assertInstanceOf(contact, Contact);
        assertEquals(contact.id._serialized, client.info.wid._serialized);
    });

    it('can get message info', async function () {
        assertExists(message, "Message must be defined for this test");
        const info = await message!.getInfo();
        assertEquals(typeof info, 'object');
        assertExists(info, "Info should not be null");
        assert(Array.isArray(info!.played), "info.played should be an array");
        assert(Array.isArray(info!.read), "info.read should be an array");
        assert(Array.isArray(info!.delivery), "info.delivery should be an array");
    });

    describe('Replies', function () {
        let replyMsg: Message | null | undefined;

        it('can reply to a message', async function () {
            assertExists(message, "Message must be defined to reply to");
            replyMsg = await message!.reply('this is my reply');
            assertExists(replyMsg, "Reply message should exist");
            assertEquals(replyMsg!.hasQuotedMsg, true);
        });

        it('can get the quoted message', async function () {
            assertExists(replyMsg, "Reply message must exist to get its quoted message");
            assertExists(message, "Original message must exist to compare IDs");
            const quotedMsg = await replyMsg!.getQuotedMessage();
            assertExists(quotedMsg, "Quoted message should exist");
            assertEquals(quotedMsg!.id._serialized, message!.id._serialized);
        });
    });

    describe('Star', function () {
        it('can star a message', async function () {
            assertExists(message, "Message must be defined for this test");
            assertEquals(message!.isStarred, false);
            await message!.star();

            await helper.sleep(1000);

            // reload and check
            await message!.reload();
            assertEquals(message!.isStarred, true);
        });

        it('can un-star a message', async function () {
            assertExists(message, "Message must be defined for this test");
            assertEquals(message!.isStarred, true);
            await message!.unstar();

            await helper.sleep(1000);

            // reload and check
            await message!.reload();
            assertEquals(message!.isStarred, false);
        });
    });

    describe('Delete', function () {
        it('can delete a message for me', async function () {
            assertExists(message, "Message must be defined for this test");
            await message!.delete(); // Deletes for me by default
            
            await helper.sleep(5000);
            // After deletion, reloading the message data might result in null or an error
            // The original test expected reload() to return null.
            const reloadedMessage = await message!.reload();
            assertEquals(reloadedMessage, null, "Message should be null after reload if deleted");
        });

        it('can delete a message for everyone', async function () {
            assertExists(chat, "Chat must be defined to send a new message");
            message = await chat.sendMessage('sneaky message');
            assertExists(message, "New message for deletion test must exist");
            await helper.sleep(1000);

            const callback = spy();
            // client.once('message_revoke_everyone', callback); // Deno doesn't have client.once in the same way.
            // We'd typically listen and potentially remove the listener after one call, or just check callCount.
            // For simplicity in conversion, we'll assume the event fires and check spy state.
            // A more direct Deno equivalent might involve custom event handling or a promise.
            client.on('message_revoke_everyone', callback);


            await message!.delete(true); // Delete for everyone
            await helper.sleep(1000);

            const reloadedMessage = await message!.reload();
            assertEquals(reloadedMessage, null, "Message should be null after reload if deleted for everyone");

            assert(callback.calls.length >= 1, "Revoke callback should have been called at least once");
            const [ revokeMsg, originalMsg ] = callback.calls[0].args; // Assuming it's the first call

            assertEquals(revokeMsg.id._serialized, originalMsg.id._serialized);
            assertEquals(originalMsg.body, 'sneaky message');
            assertEquals(originalMsg.type, 'chat'); // 'chat' is WWebJS's type for text messages
            assertEquals(revokeMsg.body, '');
            assertEquals(revokeMsg.type, 'revoked');

            // Clean up listener if possible, though Deno's EventEmitter might not have `off` or `removeListener`
            // depending on the exact implementation used by the Client class.
            // If `client.off` exists: client.off('message_revoke_everyone', callback);
        });
    });
});