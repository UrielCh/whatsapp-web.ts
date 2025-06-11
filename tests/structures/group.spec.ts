import { describe, it, beforeAll, afterAll, beforeEach, afterEach } from "https://deno.land/std@0.207.0/testing/bdd.ts";
import { assertEquals, assertExists, assertMatch, assertRejects, assertThrows, assertNotEquals, assert, assertGreaterOrEqual } from "https://deno.land/std@0.207.0/assert/mod.ts";

import * as helper from '../helper.js';
import { Client } from '../../index.js';
import GroupChat from "../../src/structures/GroupChat.ts";

const remoteId = helper.remoteId;

describe.skip('Group', function() {
    let client: Client;
    let group: GroupChat | undefined;

    beforeAll(async function() {
        // this.timeout(35000); // Deno default timeout or per-test option
        client = await helper.createClient({
            authenticated: true,
            options: {puppeteer: { headless: false }},
        });
        await client.initialize();

        const createRes = await client.createGroup('My Awesome Group', [remoteId]);
        if (typeof createRes === 'string') throw new Error(createRes);
        assertExists(createRes.gid, "Group ID should exist after creation");
        await helper.sleep(500);
        group = await client.getChatById(createRes.gid._serialized) as GroupChat | undefined;
        assertExists(group, "Group chat should exist after fetching by ID");
    });

    beforeEach(async function () {
        await helper.sleep(500);
    });

    describe('Settings', function () {
        it('can change the group subject', async function () {
            assertExists(group, "Group must be defined for this test");
            assertEquals(group!.name, 'My Awesome Group');
            const res = await group!.setSubject('My Amazing Group');
            assertEquals(res, true);

            await helper.sleep(1000);

            // reload
            group = await client.getChatById(group!.id._serialized) as GroupChat | undefined;
            assertExists(group, "Group must be defined after reload");
            assertEquals(group!.name, 'My Amazing Group');
        });

        it('can change the group description', async function () {
            assertExists(group, "Group must be defined for this test");
            assertEquals(group!.description, undefined);
            const res = await group!.setDescription('some description');
            assertEquals(res, true);
            assertEquals(group!.description, 'some description');

            await helper.sleep(1000);

            // reload
            group = await client.getChatById(group!.id._serialized) as GroupChat | undefined;
            assertExists(group, "Group must be defined after reload");
            assertEquals(group!.description, 'some description');
        });

        it('can set only admins able to send messages', async function () {
            assertExists(group, "Group must be defined for this test");
            assertEquals(group!.groupMetadata.announce, false);
            const res = await group!.setMessagesAdminsOnly();
            assertEquals(res, true);
            assertEquals(group!.groupMetadata.announce, true);

            await helper.sleep(1000);

            // reload
            group = await client.getChatById(group!.id._serialized) as GroupChat | undefined;
            assertExists(group, "Group must be defined after reload");
            assertEquals(group!.groupMetadata.announce, true);
        });

        it('can set all participants able to send messages', async function () {
            assertExists(group, "Group must be defined for this test");
            assertEquals(group!.groupMetadata.announce, true);
            const res = await group!.setMessagesAdminsOnly(false);
            assertEquals(res, true);
            assertEquals(group!.groupMetadata.announce, false);

            await helper.sleep(1000);

            // reload
            group = await client.getChatById(group!.id._serialized) as GroupChat | undefined;
            assertExists(group, "Group must be defined after reload");
            assertEquals(group!.groupMetadata.announce, false);
        });

        it('can set only admins able to set group info', async function () {
            assertExists(group, "Group must be defined for this test");
            assertEquals(group!.groupMetadata.restrict, false);
            const res = await group!.setInfoAdminsOnly();
            assertEquals(res, true);
            assertEquals(group!.groupMetadata.restrict, true);

            await helper.sleep(1000);

            // reload
            group = await client.getChatById(group!.id._serialized) as GroupChat | undefined;
            assertExists(group, "Group must be defined after reload");
            assertEquals(group!.groupMetadata.restrict, true);
        });

        it('can set all participants able to set group info', async function () {
            assertExists(group, "Group must be defined for this test");
            assertEquals(group!.groupMetadata.restrict, true);
            const res = await group!.setInfoAdminsOnly(false);
            assertEquals(res, true);
            assertEquals(group!.groupMetadata.restrict, false);

            await helper.sleep(1000);

            // reload
            group = await client.getChatById(group!.id._serialized) as GroupChat | undefined;
            assertExists(group, "Group must be defined after reload");
            assertEquals(group!.groupMetadata.restrict, false);
        });
    });

    describe('Invites', function () {
        it('can get the invite code', async function () {
            assertExists(group, "Group must be defined for this test");
            const code = await group!.getInviteCode();
            assertEquals(typeof code, 'string');
        });

        it('can get invite info', async function () {
            assertExists(group, "Group must be defined for this test");
            const code = await group!.getInviteCode();
            const info = await client.getInviteInfo(code);
            assertEquals(info.id._serialized, group!.id._serialized);
            assertEquals(info.participants.length, 2);
        });

        it('can revoke the invite code', async function () {
            assertExists(group, "Group must be defined for this test");
            const code = await group!.getInviteCode();
            const newCode = await group!.revokeInvite();
            assertEquals(typeof newCode, 'string');
            assertNotEquals(newCode, code);
        });
    });

    describe('Participants', function () {
        it('can promote a user to admin', async function () {
            assertExists(group, "Group must be defined for this test");
            let participant = group!.participants.find(p => p.id._serialized === remoteId);
            assertExists(participant, "Participant should exist before promotion");
            assertEquals(participant!.isAdmin, false);

            const res = await group!.promoteParticipants([remoteId]);
            assertGreaterOrEqual(res.status, 200);

            await helper.sleep(1000);

            // reload and check
            group = await client.getChatById(group!.id._serialized) as GroupChat | undefined;
            assertExists(group, "Group must be defined after reload");
            participant = group!.participants.find(p => p.id._serialized=== remoteId);
            assertExists(participant, "Participant should exist after promotion and reload");
            assertEquals(participant!.isAdmin, true);
        });

        it('can demote a user', async function () {
            assertExists(group, "Group must be defined for this test");
            let participant = group!.participants.find(p => p.id._serialized=== remoteId);
            assertExists(participant, "Participant should exist before demotion");
            assertEquals(participant!.isAdmin, true);

            const res = await group!.demoteParticipants([remoteId]);
            assertGreaterOrEqual(res.status, 200);

            await helper.sleep(1000);

            // reload and check
            group = await client.getChatById(group!.id._serialized) as GroupChat | undefined;
            assertExists(group, "Group must be defined after reload");
            participant = group!.participants.find(p => p.id._serialized=== remoteId);
            assertExists(participant, "Participant should exist after demotion and reload");
            assertEquals(participant!.isAdmin, false);
        });

        it('can remove a user from the group', async function () {
            assertExists(group, "Group must be defined for this test");
            let participant = group!.participants.find(p => p.id._serialized=== remoteId);
            assertExists(participant, "Participant should exist before removal");

            const res = await group!.removeParticipants([remoteId]);
            assertGreaterOrEqual(res.status, 200);

            await helper.sleep(1000);

            // reload and check
            group = await client.getChatById(group!.id._serialized) as GroupChat | undefined;
            assertExists(group, "Group must be defined after reload");
            participant = group!.participants.find(p => p.id._serialized=== remoteId);
            assertEquals(participant, undefined, "Participant should not exist after removal");
        });

        //it('can add back a user to the group', async function () {
        //    assertExists(group, "Group must be defined for this test");
        //    let participant = group!.participants.find(p => p.id._serialized=== remoteId);
        //    assertEquals(participant, undefined, "Participant should not exist before adding back");
        //    const res = await group!.addParticipants([remoteId]);
        //    assertGreaterOrEqual(res.status, 200);
        //    await helper.sleep(1000);
        //    // reload and check
        //    group = await client.getChatById(group!.id._serialized) as GroupChat | undefined;
        //    assertExists(group, "Group must be defined after reload");
        //    participant = group!.participants.find(p => p.id._serialized=== remoteId);
        //    assertExists(participant, "Participant should exist after adding back");
        //});
    });

    describe('Leave / re-join', function () {
        let code: string;
        
        beforeAll(async function () { // Changed from before to beforeAll for this inner describe
            assertExists(group, "Group must be defined to get invite code");
            code = await group!.getInviteCode();
        });

        it('can leave the group', async function () {
            assertExists(group, "Group must be defined for this test");
            assertEquals(group!.isReadOnly, false);
            await group!.leave();

            await helper.sleep(1000);

            // reload and check
            group = await client.getChatById(group!.id._serialized) as GroupChat | undefined;
            assertExists(group, "Group must be defined after reload");
            assertEquals(group!.isReadOnly, true);
        });

        it('can join a group via invite code', async function () {
            assertExists(group, "Group must be defined for this test");
            const chatId = await client.acceptInvite(code);
            assertEquals(chatId, group!.id._serialized);

            await helper.sleep(1000);

            // reload and check
            group = await client.getChatById(group!.id._serialized) as GroupChat | undefined;
            assertExists(group, "Group must be defined after reload");
            assertEquals(group!.isReadOnly, false);
        });
    });

    afterAll(async function () {
        if (client) {
            await client.destroy();
        }
    });

});
