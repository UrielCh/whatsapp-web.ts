import { describe, it, before, after } from "https://deno.land/std@0.207.0/testing/bdd.ts";
import { assertEquals, assertExists, assertMatch, assertRejects, assertThrows, assertNotEquals, assertLess, assertGreaterOrEqual } from "https://deno.land/std@0.207.0/assert/mod.ts";
import { spy, stub, mockSession } from "https://deno.land/std@0.207.0/testing/mock.ts";

import * as helper from './helper.js';
import Chat from '../src/structures/Chat.js';
import Contact from '../src/structures/Contact.js';
import Message from '../src/structures/Message.js';
import MessageMedia from '../src/structures/MessageMedia.js';
import Location from '../src/structures/Location.js';
import { MessageTypes, WAState, DefaultOptions } from '../src/util/Constants.js';
import Client from "../src/Client.js";

const remoteId = helper.remoteId;
const isMD = helper.isMD();

const TIMEOUT = 3000;
const LONG_WAIT = 500;
const SUPER_TIMEOUT = 600000;
const AUTH_TIMEOUT = 600000;

const PUPPETER_HEADLESS = { headless: false };


Deno.test('TSX environment', async function () {
    const test = () => {
        const fnc = () => {
            return 1;
        };
    }
    const str = test.toString();
    assert(!str.includes('__name'), 'Typescript transpile configuration should not add __name in function');
});

// for debug
describe('Client', function() {
    describe.skip('User Agent', function () {
        Deno.test({
            name: 'should set user agent on browser',
            //ignore: true, // describe.skip implies tests within are skipped
            fn: async function () {
            // this.timeout(SUPER_TIMEOUT); // Deno.test has timeout in options

            const client = await helper.createClient({
                options: {
                    puppeteer: {...PUPPETER_HEADLESS}
                }
            });
            try {
                await client.initialize();

                await helper.sleep(LONG_WAIT);
    
                const browserUA = await client.pupBrowser.userAgent();
                assertEquals(browserUA, DefaultOptions.userAgent);
    
                const pageUA = await client.pupPage.evaluate(() => window.navigator.userAgent);
                assertEquals(pageUA, DefaultOptions.userAgent);
            } finally {
                await client.destroy();
            }
        }});

        Deno.test({
            name: 'should set custom user agent on browser',
            //ignore: true,
            fn: async function () {
            // this.timeout(SUPER_TIMEOUT);
            const customUA = DefaultOptions.userAgent.replace(/Chrome\/.* /, 'Chrome/99.9.9999.999 ');

            const client = await helper.createClient({
                options: {
                    userAgent: customUA,
                    puppeteer: {...PUPPETER_HEADLESS}
                }
            });
            try {
                await client.initialize();
                await helper.sleep(LONG_WAIT);
    
                const browserUA = await client.pupBrowser.userAgent();
                assertEquals(browserUA, customUA);
                assert(browserUA.includes('Chrome/99.9.9999.999'));
    
                const pageUA = await client.pupPage.evaluate(() => window.navigator.userAgent);
                assertEquals(pageUA, customUA);
            } finally {
                await client.destroy();
            }
        }});

        Deno.test({
            name: 'should respect an existing user agent arg',
            //ignore: true,
            fn: async function () {
            // this.timeout(SUPER_TIMEOUT);

            const customUA = DefaultOptions.userAgent.replace(/Chrome\/.* /, 'Chrome/99.9.9999.999 ');

            const client = await helper.createClient({
                options: {
                    puppeteer: {
                        args: [`--user-agent=${customUA}`],
                        ...PUPPETER_HEADLESS
                    }
                }
            });

            try {
                await client.initialize();
                await helper.sleep(LONG_WAIT);
    
                const browserUA = await client.pupBrowser.userAgent();
                assertEquals(browserUA, customUA);
                assert(browserUA.includes('Chrome/99.9.9999.999'));
    
                const pageUA = await client.pupPage.evaluate(() => window.navigator.userAgent);
                assertEquals(pageUA, DefaultOptions.userAgent);
            } finally {
                await client.destroy();
            }
        }});
    });

    describe.skip('Authentication', function() {
        Deno.test({
            name: 'should emit QR code if not authenticated',
            //ignore: true,
            fn: async function() {
            // this.timeout(SUPER_TIMEOUT);
            const callback = spy();

            const client = await helper.createClient({
                options: {
                    puppeteer: {...PUPPETER_HEADLESS}
                }
            });
            client.on('qr', callback);
            try {
                await client.initialize();

                await helper.sleep(LONG_WAIT);
    
                assertEquals(callback.callCount > 0, true);
                assertGreaterOrEqual(callback.calls[0].args[0].length, 152);
            } finally {
                await client.destroy();
            }
        }});

        Deno.test({
            name: 'should disconnect after reaching max qr retries',
            //ignore: true,
            fn: async function () {
            // this.timeout(SUPER_TIMEOUT);

            let nbQrCode = 0;
            const getQrCode = (_qrCode: string) => nbQrCode++;
    
            let disconectHandler: () => void = () => {};
            const disconectPromise = new Promise<void>((resolve) => {
                disconectHandler = resolve;
            });
            let disconnectedReason = "";
            const disconnectedCallback = (deco_reason: string) => {disconnectedReason = deco_reason; disconectHandler()};

            const client = await helper.createClient({options: {qrMaxRetries: 1, puppeteer: {...PUPPETER_HEADLESS} } });
            client.on('qr', getQrCode);
            client.on('disconnected', disconnectedCallback);

            try {
                await client.initialize();
                await Promise.race([
                    disconectPromise,
                    helper.sleep(60000)
                ]);
                assertGreaterOrEqual(nbQrCode, 2);
                assertEquals(disconnectedReason, 'Max qrcode retries reached');
            } finally {
                await client.destroy();
            }
        }});

        // get stuck with a QRcode.
        // it('should authenticate with existing session', async function() {
        //     this.timeout(SUPER_TIMEOUT);
        //     const authenticatedCallback = sinon.spy();
        //     const client = await helper.createClient({
        //         authenticated: true,
        //         options: {puppeteer: {...PUPPETER_HEADLESS} }
        //     });
        //     try {
        //         let nbQrCode = 0;
        //         const getQrCode = (_qrCode: string) => nbQrCode++;
        //         let nbReady = 0;
        //         const getReady = () => nbReady++;
        //         client.on('qr', getQrCode);
        //         client.on('authenticated', authenticatedCallback);
        //         client.on('ready', getReady);
        //         await client.initialize();
        //         expect(authenticatedCallback.called).to.equal(true);
        //         if(helper.isUsingLegacySession()) {
        //             const newSession = authenticatedCallback.args[0][0];
        //             expect(newSession).to.have.key([
        //                 'WABrowserId', 
        //                 'WASecretBundle', 
        //                 'WAToken1', 
        //                 'WAToken2'
        //             ] as any as string); // bypasse bad mocha typing
        //         }
        //         expect(nbReady).to.equal(1);
        //         expect(nbQrCode).to.equal(0);                    
        //     } finally {
        //         await client.destroy();
        //     }
        // });

        // describe('LegacySessionAuth', function () {
        //     it('should fail auth if session is invalid', async function() {
        //         this.timeout(40000);
        // 
        //         const authFailCallback = sinon.spy();
        //         const qrCallback = sinon.spy();
        //         const readyCallback = sinon.spy();
        // 
        //         const client = await helper.createClient({
        //             options: {
        //                 authStrategy: new LegacySessionAuth({
        //                     session: {
        //                         WABrowserId: 'invalid', 
        //                         WASecretBundle: 'invalid', 
        //                         WAToken1: 'invalid', 
        //                         WAToken2: 'invalid'
        //                     },
        //                     restartOnAuthFail: false,
        //                 }),
        //             }
        //         });
        // 
        //         client.on('qr', qrCallback);
        //         client.on('auth_failure', authFailCallback);
        //         client.on('ready', readyCallback);
        // 
        //         client.initialize();
        // 
        //         await helper.sleep(25000);
        // 
        //         expect(authFailCallback.called).to.equal(true);
        //         expect(authFailCallback.args[0][0]).to.equal('Unable to log in. Are the session details valid?');
        // 
        //         expect(readyCallback.called).to.equal(false);
        //         expect(qrCallback.called).to.equal(false);
        // 
        //         await client.destroy();
        //     });
        // 
        //     it('can restart without a session if session was invalid and restartOnAuthFail=true', async function() {
        //         this.timeout(40000);
        // 
        //         const authFailCallback = sinon.spy();
        //         const qrCallback = sinon.spy();
        // 
        //         const client = await helper.createClient({
        //             options: {
        //                 authStrategy: new LegacySessionAuth({
        //                     session: {
        //                         WABrowserId: 'invalid', 
        //                         WASecretBundle: 'invalid', 
        //                         WAToken1: 'invalid', 
        //                         WAToken2: 'invalid'
        //                     },
        //                     restartOnAuthFail: true,
        //                 }),
        //             }
        //         });
        // 
        //         client.on('auth_failure', authFailCallback);
        //         client.on('qr', qrCallback);
        // 
        //         client.initialize();
        // 
        //         await helper.sleep(35000);
        // 
        //         expect(authFailCallback.called).to.equal(true);
        //         expect(qrCallback.called).to.equal(true);
        //         expect(qrCallback.args[0][0]).to.have.length.greaterThanOrEqual(152);
        // 
        //         await client.destroy();
        //     });
        // });

        describe('Non-MD only', function () {
            if(!isMD) {
                Deno.test({
                    name: 'can take over if client was logged in somewhere else with takeoverOnConflict=true',
                    //ignore: true, // This test is conditionally run
                    fn: async function() {
                    // this.timeout(TIMEOUT + LONG_WAIT + LONG_WAIT);
    
                    const readyCallback1 = spy();
                    const readyCallback2 = spy();
                    const disconnectedCallback1 = spy();
                    const disconnectedCallback2 = spy();
    
                    const client1 = await helper.createClient({
                        authenticated: true, 
                        options: { takeoverOnConflict: true, takeoverTimeoutMs: 5000, puppeteer: { headless: false }}
                    });
                    const client2 = await helper.createClient({authenticated: true});
    
                    client1.on('ready', readyCallback1);
                    client2.on('ready', readyCallback2);
                    client1.on('disconnected', disconnectedCallback1);
                    client2.on('disconnected', disconnectedCallback2);
    
                    await client1.initialize();
                    assertEquals(readyCallback1.callCount > 0, true);
                    assertEquals(readyCallback2.callCount > 0, false);
                    assertEquals(disconnectedCallback1.callCount > 0, false);
                    assertEquals(disconnectedCallback2.callCount > 0, false);
    
                    await client2.initialize();
                    assertEquals(readyCallback2.callCount > 0, true);
                    assertEquals(disconnectedCallback1.callCount > 0, false);
                    assertEquals(disconnectedCallback2.callCount > 0, false);
    
                    // wait for takeoverTimeoutMs to kick in
                    await helper.sleep(5200);
                    assertEquals(disconnectedCallback1.callCount > 0, false);
                    assertEquals(disconnectedCallback2.callCount > 0, true);
                    assertEquals(disconnectedCallback2.calls[0].args[0], WAState.CONFLICT);
    
                    await client1.destroy();
                }});
            }
        }); 
    });

    describe('Authenticated', function() {
        // Deno.test options can handle timeouts
        let client: Client;

        beforeAll(async function() { // Changed from before to beforeAll
            // this.timeout(AUTH_TIMEOUT); // Deno.test options can handle timeouts
            client = await helper.createClient({authenticated: true, options: {puppeteer: { ...PUPPETER_HEADLESS }}});
            await client.initialize();
            console.log('Client initialized');
        });

        afterAll(async function () { // Changed from after to afterAll
            try {
                await client.destroy();
            } catch (error) {
                // ignore error
            }
        });

        Deno.test('can get current WhatsApp Web version', async function () {
            const version = await client.getWWebVersion();
            assertEquals(typeof version, 'string');
            console.log(`WA Version: ${version}`);
        });

        describe.skip('Expose Store', function() {
            it('exposes the store', async function() { // it.skip can be used if preferring Deno.test directly
                const loops = 5000;
                const exposed = await client.pupPage.evaluate(async () => {
                    for (let i=0; i< loops; i++) {
                        if (window.Store) {
                            return i + 1;
                        }
                        await new Promise(resolve => setTimeout(resolve, 100));
                    }
                    return -1;
                });
                assertGreaterOrEqual(exposed, 1, `Store not exposed, Ou shoult authenticate the current Session you have ${(loops / 10)} seconds to do so.`);
            });
    
            it('exposes all required WhatsApp Web internal models 1/3', async function() { // it.skip
                const expectedModules = [
                    'AppState',
                    'BlockContact',
                    'Chat',
                    'ChatState',
                    'Cmd',
                    'Conn',
                    'Contact',
                    'DownloadManager',
                    'EphemeralFields',
                    'GroupMetadata',
                    'GroupParticipants',
                    'GroupUtils',
                    'Msg',
                    'MsgKey',
                    'OpaqueData',
                ];
              
                const loadedModules = await client.evaluate((expectedModules: string[]) => {
                    return expectedModules.filter(m => Boolean((window.Store as any)[m]));
                }, expectedModules);
                
                const missingModules = [];
                for (const module of expectedModules) {
                    if (!loadedModules.includes(module)) {
                        missingModules.push(module);
                    }
                }
                assertEquals(loadedModules.length, expectedModules.length, `Missing modules: ${missingModules.join(', ')}`); // A simple way to check if all members are present
                // For a more detailed check, one might loop or use set operations if order doesn't matter.
                // For now, assuming order might matter or that simple length check is sufficient for this context.
                // A more robust check for members:
                // expectedModules.forEach(module => assert(loadedModules.includes(module), `Missing module: ${module}`));
            });


            it('exposes all required WhatsApp Web internal models 2/3', async function() { // it.skip
                const expectedModules = [
                    'Call',
                    'QueryOrder',
                    'SendClear',
                    'PresenceUtils',
                    'ProfilePic',
                    'QueryExist',
                    'QueryProduct',
                    'SendDelete',
                    'SendMessage',
                    'SendSeen',
                    'StatusUtils',
                    'UserConstructor',
                    'VCard',
                    'Validators',
                    'WidFactory',
                    'findCommonGroups',
                    'sendReactionToMsg',
                ];
              
                const loadedModules = await client.evaluate((expectedModules: string[]) => {
                    return expectedModules.filter(m => Boolean((window.Store as any)[m]));
                }, expectedModules);
                
                const missingModules = [];
                for (const module of expectedModules) {
                    if (!loadedModules.includes(module)) {
                        missingModules.push(module);
                    }
                }
                assertEquals(loadedModules.length, expectedModules.length, `Missing modules: ${missingModules.join(', ')}`);
                // expectedModules.forEach(module => assert(loadedModules.includes(module), `Missing module: ${module}`));
            });

            it('exposes all required WhatsApp Web internal models 3/3', async function() { // it.skip
                const expectedModules = [
                    'Features',
                    'Invite',
                    'InviteInfo',
                    'JoinInviteV4',
                    'MessageInfo',
                    'UploadUtils',
                ];
              
                const loadedModules = await client.evaluate((expectedModules: string[]) => {
                    return expectedModules.filter(m => Boolean((window.Store as any)[m]));
                }, expectedModules);
                
                const missingModules = [];
                for (const module of expectedModules) {
                    if (!loadedModules.includes(module)) {
                        missingModules.push(module);
                    }
                }
                assertEquals(loadedModules.length, expectedModules.length, `Missing modules: ${missingModules.join(', ')}`);
                // expectedModules.forEach(module => assert(loadedModules.includes(module), `Missing module: ${module}`));
            });
        });
    
        describe('Send Messages', function () { // Deno.test has timeout in its options, not on describe
            // this.timeout(15000); // This was Mocha's way. Apply to individual tests if needed.
            it.skip('can send a message', async function() {
                const msg = await client.sendMessage(remoteId, 'hello world');
                if (!msg) return;
                assert(msg instanceof Message, "Expected message to be an instance of Message");
                assertEquals(msg.type, MessageTypes.TEXT, "Expected message type to be TEXT");
                assertEquals(msg.fromMe, true, "Expected message to be from me");
                assertEquals(msg.body, 'hello world', "Expected message body to be 'hello world'");
                assertEquals(msg.to, remoteId, "Expected message to be sent to remoteId");
            });
    
            it('can send a media message', async function() { // No .skip, so this will run
                const media = new MessageMedia(
                    'image/png', 
                    'iVBORw0KGgoAAAANSUhEUgAAAV4AAACWBAMAAABkyf1EAAAAG1BMVEXMzMyWlpacnJyqqqrFxcWxsbGjo6O3t7e+vr6He3KoAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAEcElEQVR4nO2aTW/bRhCGh18ij1zKknMkbbf2UXITIEeyMhIfRaF1exQLA/JRclslRykO+rs7s7s0VwytNmhJtsA8gHZEcox9PTs7uysQgGEYhmEYhmEYhmEYhmEYhmEYhmEYhmEYhmEYhmEYhmGYr2OWRK/ReIKI8Zt7Hb19wTcQ0uTkGh13bQupcw7gPOvdo12/5CzNtNR7xLUtNtT3CGBQ6g3InjY720pvofUec22LJPr8PhEp2OMPyI40PdwWUdronCu9yQpdPx53bQlfLKnfOVhlnDYRBXve4Ov+IZTeMgdedm0NR+xoXJeQvdJ3CvziykSukwil16W/Oe7aGjIjqc/9ib4jQlJy0uArtN4A0+cvXFvDkmUJ47sJ1Y1ATLDNVXZkNPIepQzxy1ki9fqiwbUj/I+64zxWNzyZnPuhvohJ9K70VvXBixpcu2SAHU+Xd9EKdEJDNpYP3AQr3bQSpPQ6Y6/4dl1z7ZDbArsszjA7L0g7ibB0CDcidUWVoErvIMKZh2Xs0LUzcLW6V5NfiUgNEbaYmAVL6bXl0nJRc+1S72ua/D/cTjGPlQj7eUqd7A096rYlRjdPYlhz7VIvxpVG3cemDKF+WAwLY/6XelOZKTXXzsC4xvDjjtSN6kHLhLke6PrwM8h1raf40qjrGO7H9aTEbduucjS04ZrYU/4iuS5Z2Hdt0rvCLFdmLEXcU30AGddST62o+sLcf5l6k7CP+ru4pLYqX/VFyxbm/utQbx/r22ZEbTb2f5I2kns1Y1OQR8ZyofX+TjJxj1Rz7QQVnf1QzR26Oth0ueJVYcRP6ZUPac/Rx/5M6ixO1dhSrT3Y1DpiYmx3tF4ZUdpz9LD/dSg9PXES0LB71BwcGjKROuV28lnvnv7HHJsezheBGH5+X2CfSfRbMKW+5aGs3JFjMrjGibJc0S7TJzqjHrh2hDybj9XRXNZa89Aro55XBdbW5wti2c/5WJ7jJ1RolVUn/HWpb0I58Tziup6Rx7Dm2hnbRP1GM9PW/NFmQ4PtVRVN63Wvxfmu5sowDMMwDMMwDMMwDMMwDMMwDMMwzL+CpT//F/6beoV8zb2Jmt4Qryx6lTUCsENQ75HOkhXAO3EPVgyQtKtUy3C/e+FJg17Zjnew1Xrdb9InbG4WqfUAftG+WhLwPVyfg536+MU7m4C1CMk4ZznpXZzDYI1PDL2nS1hpvc5cNd7E2sJg05Fe7/7d3Fln8Cvc3bwB616auxsKl4WPghjemHrDqyDWeu1UNW5s2btPnSQ75oOdunEwWazfwgVG0kqluYCM9OIjWOGnfA2b9G4Ha63XKpvQ8perTvTifJNhi6+WMWmi7smEZf6G8MmhlyGq+NqP8GV84TLuJr7UIQVx+bDEoEpRZIz42gs40OuN4Mv8hXzelV7KX1isH+ewTWckikyVv+CfHuqVF7I16gN0VKypX6wPsE+zFPzkinolU9UH8OMGvSpnZqKsv13p/RsMun6X5x/y2LeAr8O66lsBwzBMP/wJfyGq8pgBk6IAAAAASUVORK5CYII='
                );
    
                const msg = await client.sendMessage(remoteId, media, {caption: 'here\'s my media'});
                assert(msg instanceof Message, "Expected message to be an instance of Message");
                if (!msg) return;
                assertEquals(msg.type, MessageTypes.IMAGE, "Expected message type to be IMAGE");
                assertEquals(msg.fromMe, true, "Expected message to be from me");
                assertEquals(msg.hasMedia, true, "Expected message to have media");
                assertEquals(msg.body, 'here\'s my media', "Expected message body to be 'here\'s my media'");
                assertEquals(msg.to, remoteId, "Expected message to be sent to remoteId");
            });

            it.skip('can send a media message from URL', async function() {
                const media = await MessageMedia.fromUrl('https://github.com/UrielCh/whatsapp-web.ts/blob/esm/data/350x150.jpeg?raw=true');
                // const media = await MessageMedia.fromUrl('https://www.o-immobilierdurable.fr/wp-content/uploads/2023/06/Image3-350x150.png');
                const msg = await client.sendMessage(remoteId, media);
                assert(msg instanceof Message, "Expected message to be an instance of Message");
                if (!msg) return;
                assertEquals(msg.type, MessageTypes.IMAGE, "Expected message type to be IMAGE");
                assertEquals(msg.fromMe, true, "Expected message to be from me");
                assertEquals(msg.hasMedia, true, "Expected message to have media");
                assertEquals(msg.to, remoteId, "Expected message to be sent to remoteId");
            });
    
            it.skip('can send a media message as a document', async function() {
                const media = new MessageMedia(
                    'image/png', 
                    'iVBORw0KGgoAAAANSUhEUgAAAV4AAACWBAMAAABkyf1EAAAAG1BMVEXMzMyWlpacnJyqqqrFxcWxsbGjo6O3t7e+vr6He3KoAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAEcElEQVR4nO2aTW/bRhCGh18ij1zKknMkbbf2UXITIEeyMhIfRaF1exQLA/JRclslRykO+rs7s7s0VwytNmhJtsA8gHZEcox9PTs7uysQgGEYhmEYhmEYhmEYhmEYhmEYhmEYhmEYhmEYhmEYhmGYr2OWRK/ReIKI8Zt7Hb19wTcQ0uTkGh13bQupcw7gPOvdo12/5CzNtNR7xLUtNtT3CGBQ6g3InjY720pvofUec22LJPr8PhEp2OMPyI40PdwWUdronCu9yQpdPx53bQlfLKnfOVhlnDYRBXve4Ov+IZTeMgdedm0NR+xoXJeQvdJ3CvziykSukwil16W/Oe7aGjIjqc/9ib4jQlJy0uArtN4A0+cvXFvDkmUJ47sJ1Y1ATLDNVXZkNPIepQzxy1ki9fqiwbUj/I+64zxWNzyZnPuhvohJ9K70VvXBixpcu2SAHU+Xd9EKdEJDNpYP3AQr3bQSpPQ6Y6/4dl1z7ZDbArsszjA7L0g7ibB0CDcidUWVoErvIMKZh2Xs0LUzcLW6V5NfiUgNEbaYmAVL6bXl0nJRc+1S72ua/D/cTjGPlQj7eUqd7A096rYlRjdPYlhz7VIvxpVG3cemDKF+WAwLY/6XelOZKTXXzsC4xvDjjtSN6kHLhLke6PrwM8h1raf40qjrGO7H9aTEbduucjS04ZrYU/4iuS5Z2Hdt0rvCLFdmLEXcU30AGddST62o+sLcf5l6k7CP+ru4pLYqX/VFyxbm/utQbx/r22ZEbTb2f5I2kns1Y1OQR8ZyofX+TjJxj1Rz7QQVnf1QzR26Oth0ueJVYcRP6ZUPac/Rx/5M6ixO1dhSrT3Y1DpiYmx3tF4ZUdpz9LD/dSg9PXES0LB71BwcGjKROuV28lnvnv7HHJsezheBGH5+X2CfSfRbMKW+5aGs3JFjMrjGibJc0S7TJzqjHrh2hDybj9XRXNZa89Aro55XBdbW5wti2c/5WJ7jJ1RolVUn/HWpb0I58Tziup6Rx7Dm2hnbRP1GM9PW/NFmQ4PtVRVN63Wvxfmu5sowDMMwDMMwDMMwDMMwDMMwDMMwzL+CpT//F/6beoV8zb2Jmt4Qryx6lTUCsENQ75HOkhXAO3EPVgyQtKtUy3C/e+FJg17Zjnew1Xrdb9InbG4WqfUAftG+WhLwPVyfg536+MU7m4C1CMk4ZznpXZzDYI1PDL2nS1hpvc5cNd7E2sJg05Fe7/7d3Fln8Cvc3bwB616auxsKl4WPghjemHrDqyDWeu1UNW5s2btPnSQ75oOdunEwWazfwgVG0kqluYCM9OIjWOGnfA2b9G4Ha63XKpvQ8perTvTifJNhi6+WMWmi7smEZf6G8MmhlyGq+NqP8GV84TLuJr7UIQVx+bDEoEpRZIz42gs40OuN4Mv8hXzelV7KX1isH+ewTWckikyVv+CfHuqVF7I16gN0VKypX6wPsE+zFPzkinolU9UH8OMGvSpnZqKsv13p/RsMun6X5x/y2LeAr8O66lsBwzBMP/wJfyGq8pgBk6IAAAAASUVORK5CYII=',
                    'this is my filename.png'
                );
    
                const msg = await client.sendMessage(remoteId, media, { sendMediaAsDocument: true});
                assert(msg instanceof Message, "Expected message to be an instance of Message");
                if (!msg) return;
                assertEquals(msg.type, MessageTypes.DOCUMENT, "Expected message type to be DOCUMENT");
                assertEquals(msg.fromMe, true, "Expected message to be from me");
                assertEquals(msg.hasMedia, true, "Expected message to have media");
                assertEquals(msg.body, 'this is my filename.png', "Expected message body to be 'this is my filename.png'");
                assertEquals(msg.to, remoteId, "Expected message to be sent to remoteId");
            });
    
            it.skip('can send a sticker message', async function() {
                const media = new MessageMedia(
                    'image/png', 
                    'iVBORw0KGgoAAAANSUhEUgAAAV4AAACWBAMAAABkyf1EAAAAG1BMVEXMzMyWlpacnJyqqqrFxcWxsbGjo6O3t7e+vr6He3KoAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAEcElEQVR4nO2aTW/bRhCGh18ij1zKknMkbbf2UXITIEeyMhIfRaF1exQLA/JRclslRykO+rs7s7s0VwytNmhJtsA8gHZEcox9PTs7uysQgGEYhmEYhmEYhmEYhmEYhmEYhmEYhmEYhmEYhmEYhmGYr2OWRK/ReIKI8Zt7Hb19wTcQ0uTkGh13bQupcw7gPOvdo12/5CzNtNR7xLUtNtT3CGBQ6g3InjY720pvofUec22LJPr8PhEp2OMPyI40PdwWUdronCu9yQpdPx53bQlfLKnfOVhlnDYRBXve4Ov+IZTeMgdedm0NR+xoXJeQvdJ3CvziykSukwil16W/Oe7aGjIjqc/9ib4jQlJy0uArtN4A0+cvXFvDkmUJ47sJ1Y1ATLDNVXZkNPIepQzxy1ki9fqiwbUj/I+64zxWNzyZnPuhvohJ9K70VvXBixpcu2SAHU+Xd9EKdEJDNpYP3AQr3bQSpPQ6Y6/4dl1z7ZDbArsszjA7L0g7ibB0CDcidUWVoErvIMKZh2Xs0LUzcLW6V5NfiUgNEbaYmAVL6bXl0nJRc+1S72ua/D/cTjGPlQj7eUqd7A096rYlRjdPYlhz7VIvxpVG3cemDKF+WAwLY/6XelOZKTXXzsC4xvDjjtSN6kHLhLke6PrwM8h1raf40qjrGO7H9aTEbduucjS04ZrYU/4iuS5Z2Hdt0rvCLFdmLEXcU30AGddST62o+sLcf5l6k7CP+ru4pLYqX/VFyxbm/utQbx/r22ZEbTb2f5I2kns1Y1OQR8ZyofX+TjJxj1Rz7QQVnf1QzR26Oth0ueJVYcRP6ZUPac/Rx/5M6ixO1dhSrT3Y1DpiYmx3tF4ZUdpz9LD/dSg9PXES0LB71BwcGjKROuV28lnvnv7HHJsezheBGH5+X2CfSfRbMKW+5aGs3JFjMrjGibJc0S7TJzqjHrh2hDybj9XRXNZa89Aro55XBdbW5wti2c/5WJ7jJ1RolVUn/HWpb0I58Tziup6Rx7Dm2hnbRP1GM9PW/NFmQ4PtVRVN63Wvxfmu5sowDMMwDMMwDMMwDMMwDMMwDMMwzL+CpT//F/6beoV8zb2Jmt4Qryx6lTUCsENQ75HOkhXAO3EPVgyQtKtUy3C/e+FJg17Zjnew1Xrdb9InbG4WqfUAftG+WhLwPVyfg536+MU7m4C1CMk4ZznpXZzDYI1PDL2nS1hpvc5cNd7E2sJg05Fe7/7d3Fln8Cvc3bwB616auxsKl4WPghjemHrDqyDWeu1UNW5s2btPnSQ75oOdunEwWazfwgVG0kqluYCM9OIjWOGnfA2b9G4Ha63XKpvQ8perTvTifJNhi6+WMWmi7smEZf6G8MmhlyGq+NqP8GV84TLuJr7UIQVx+bDEoEpRZIz42gs40OuN4Mv8hXzelV7KX1isH+ewTWckikyVv+CfHuqVF7I16gN0VKypX6wPsE+zFPzkinolU9UH8OMGvSpnZqKsv13p/RsMun6X5x/y2LeAr8O66lsBwzBMP/wJfyGq8pgBk6IAAAAASUVORK5CYII='
                );
    
                const msg = await client.sendMessage(remoteId, media, {sendMediaAsSticker: true});
                assert(msg instanceof Message, "Expected message to be an instance of Message");
                if (!msg) return;
                assertEquals(msg.type, MessageTypes.STICKER, "Expected message type to be STICKER");
                assertEquals(msg.fromMe, true, "Expected message to be from me");
                assertEquals(msg.hasMedia, true, "Expected message to have media");
                assertEquals(msg.to, remoteId, "Expected message to be sent to remoteId");
            });
    
            it.skip('can send a sticker message with custom author and name', async function() {
                const media = new MessageMedia(
                    'image/png', 
                    'iVBORw0KGgoAAAANSUhEUgAAAV4AAACWBAMAAABkyf1EAAAAG1BMVEXMzMyWlpacnJyqqqrFxcWxsbGjo6O3t7e+vr6He3KoAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAEcElEQVR4nO2aTW/bRhCGh18ij1zKknMkbbf2UXITIEeyMhIfRaF1exQLA/JRclslRykO+rs7s7s0VwytNmhJtsA8gHZEcox9PTs7uysQgGEYhmEYhmEYhmEYhmEYhmEYhmEYhmEYhmEYhmEYhmGYr2OWRK/ReIKI8Zt7Hb19wTcQ0uTkGh13bQupcw7gPOvdo12/5CzNtNR7xLUtNtT3CGBQ6g3InjY720pvofUec22LJPr8PhEp2OMPyI40PdwWUdronCu9yQpdPx53bQlfLKnfOVhlnDYRBXve4Ov+IZTeMgdedm0NR+xoXJeQvdJ3CvziykSukwil16W/Oe7aGjIjqc/9ib4jQlJy0uArtN4A0+cvXFvDkmUJ47sJ1Y1ATLDNVXZkNPIepQzxy1ki9fqiwbUj/I+64zxWNzyZnPuhvohJ9K70VvXBixpcu2SAHU+Xd9EKdEJDNpYP3AQr3bQSpPQ6Y6/4dl1z7ZDbArsszjA7L0g7ibB0CDcidUWVoErvIMKZh2Xs0LUzcLW6V5NfiUgNEbaYmAVL6bXl0nJRc+1S72ua/D/cTjGPlQj7eUqd7A096rYlRjdPYlhz7VIvxpVG3cemDKF+WAwLY/6XelOZKTXXzsC4xvDjjtSN6kHLhLke6PrwM8h1raf40qjrGO7H9aTEbduucjS04ZrYU/4iuS5Z2Hdt0rvCLFdmLEXcU30AGddST62o+sLcf5l6k7CP+ru4pLYqX/VFyxbm/utQbx/r22ZEbTb2f5I2kns1Y1OQR8ZyofX+TjJxj1Rz7QQVnf1QzR26Oth0ueJVYcRP6ZUPac/Rx/5M6ixO1dhSrT3Y1DpiYmx3tF4ZUdpz9LD/dSg9PXES0LB71BwcGjKROuV28lnvnv7HHJsezheBGH5+X2CfSfRbMKW+5aGs3JFjMrjGibJc0S7TJzqjHrh2hDybj9XRXNZa89Aro55XBdbW5wti2c/5WJ7jJ1RolVUn/HWpb0I58Tziup6Rx7Dm2hnbRP1GM9PW/NFmQ4PtVRVN63Wvxfmu5sowDMMwDMMwDMMwDMMwDMMwDMMwzL+CpT//F/6beoV8zb2Jmt4Qryx6lTUCsENQ75HOkhXAO3EPVgyQtKtUy3C/e+FJg17Zjnew1Xrdb9InbG4WqfUAftG+WhLwPVyfg536+MU7m4C1CMk4ZznpXZzDYI1PDL2nS1hpvc5cNd7E2sJg05Fe7/7d3Fln8Cvc3bwB616auxsKl4WPghjemHrDqyDWeu1UNW5s2btPnSQ75oOdunEwWazfwgVG0kqluYCM9OIjWOGnfA2b9G4Ha63XKpvQ8perTvTifJNhi6+WMWmi7smEZf6G8MmhlyGq+NqP8GV84TLuJr7UIQVx+bDEoEpRZIz42gs40OuN4Mv8hXzelV7KX1isH+ewTWckikyVv+CfHuqVF7I16gN0VKypX6wPsE+zFPzkinolU9UH8OMGvSpnZqKsv13p/RsMun6X5x/y2LeAr8O66lsBwzBMP/wJfyGq8pgBk6IAAAAASUVORK5CYII='
                );
    
                const msg = await client.sendMessage(remoteId, media, {
                    sendMediaAsSticker: true, 
                    stickerAuthor: 'WWEBJS', 
                    stickerName: 'My Sticker'
                });
                assert(msg instanceof Message, "Expected message to be an instance of Message");
                if (!msg) return;
                assertEquals(msg.type, MessageTypes.STICKER, "Expected message type to be STICKER");
                assertEquals(msg.fromMe, true, "Expected message to be from me");
                assertEquals(msg.hasMedia, true, "Expected message to have media");
                assertEquals(msg.to, remoteId, "Expected message to be sent to remoteId");
            });
    
            it('can send a location message', async function() { // No .skip
                // broken the Place name is now properly sent
                const location = new Location(37.422, -122.084, {name: 'Googleplex\nGoogle Headquarters'});
    
                const msg = await client.sendMessage(remoteId, location);
                assert(msg instanceof Message, "Expected message to be an instance of Message");
                if (!msg) return;
                assertEquals(msg.type, MessageTypes.LOCATION, "Expected message type to be LOCATION");
                assertEquals(msg.fromMe, true, "Expected message to be from me");
                assertEquals(msg.to, remoteId, "Expected message to be sent to remoteId");
    
                assert(msg.location instanceof Location, "Expected message location to be an instance of Location");
                assertEquals(msg.location.latitude, 37.422, "Expected message location latitude to be 37.422");
                assertEquals(msg.location.longitude, -122.084, "Expected message location longitude to be -122.084");
                assertEquals(msg.location.name, 'Googleplex\nGoogle Headquarters', "Expected message location description to be 'Googleplex\nGoogle Headquarters'");
            });
    
            it.skip('can send a vCard as a contact card message', async function() {
                const vCard = `BEGIN:VCARD
VERSION:3.0
FN;CHARSET=UTF-8:John Doe
N;CHARSET=UTF-8:Doe;John;;;
EMAIL;CHARSET=UTF-8;type=HOME,INTERNET:john@doe.com
TEL;TYPE=HOME,VOICE:1234567890
REV:2021-06-06T02:35:53.559Z
END:VCARD`;
    
                const msg = await client.sendMessage(remoteId, vCard);
                assert(msg instanceof Message, "Expected message to be an instance of Message");
                if (!msg) return;
                assertEquals(msg.type, MessageTypes.CONTACT_CARD, "Expected message type to be CONTACT_CARD");
                assertEquals(msg.fromMe, true, "Expected message to be from me");
                assertEquals(msg.to, remoteId, "Expected message to be sent to remoteId");
                assertEquals(msg.body, vCard, "Expected message body to be the vCard");
                assertEquals(msg.vCards.length, 1, "Expected message vCards to have length of 1");
                assertEquals(msg.vCards[0], vCard, "Expected message vCards to be the vCard");
            });
    
            it.skip('can optionally turn off vCard parsing', async function() {
                const vCard = `BEGIN:VCARD
VERSION:3.0
FN;CHARSET=UTF-8:John Doe
N;CHARSET=UTF-8:Doe;John;;;
EMAIL;CHARSET=UTF-8;type=HOME,INTERNET:john@doe.com
TEL;TYPE=HOME,VOICE:1234567890
REV:2021-06-06T02:35:53.559Z
END:VCARD`;
    
                const msg = await client.sendMessage(remoteId, vCard, {parseVCards: false});
                assert(msg instanceof Message, "Expected message to be an instance of Message");
                if (!msg) return;
                assertEquals(msg.type, MessageTypes.TEXT, "Expected message type to be TEXT"); // not a contact card
                assertEquals(msg.fromMe, true, "Expected message to be from me");
                assertEquals(msg.to, remoteId, "Expected message to be sent to remoteId");
                assertEquals(msg.body, vCard, "Expected message body to be the vCard");
            });
    
            it.skip('can send a Contact as a contact card message', async function() {
                const contact = await client.getContactById(remoteId);
    
                const msg = await client.sendMessage(remoteId, contact);
                assert(msg instanceof Message, "Expected message to be an instance of Message");
                if (!msg) return;
                assertEquals(msg.type, MessageTypes.CONTACT_CARD, "Expected message type to be CONTACT_CARD");
                assertEquals(msg.fromMe, true, "Expected message to be from me");
                assertEquals(msg.to, remoteId, "Expected message to be sent to remoteId");
                assertMatch(msg.body, /BEGIN:VCARD/, "Expected message body to match /BEGIN:VCARD/");
                assertEquals(msg.vCards.length, 1, "Expected message vCards to have length of 1");
                assertMatch(msg.vCards[0], /BEGIN:VCARD/, "Expected message vCards to match /BEGIN:VCARD/");
            });
    
            it.skip('can send multiple Contacts as a contact card message', async function () {
                const contact1 = await client.getContactById(remoteId);
                const contact2 = await client.getContactById('5511942167462@c.us'); //iFood
    
                const msg = await client.sendMessage(remoteId, [contact1, contact2]);
                assert(msg instanceof Message, "Expected message to be an instance of Message");
                if (!msg) return;
                assertEquals(msg.type, MessageTypes.CONTACT_CARD_MULTI, "Expected message type to be CONTACT_CARD_MULTI");
                assertEquals(msg.fromMe, true, "Expected message to be from me");
                assertEquals(msg.to, remoteId, "Expected message to be sent to remoteId");
                assertEquals(msg.vCards.length, 2, "Expected message vCards to have length of 2");
                assertMatch(msg.vCards[0], /BEGIN:VCARD/, "Expected message vCards to match /BEGIN:VCARD/");
                assertMatch(msg.vCards[1], /BEGIN:VCARD/, "Expected message vCards to match /BEGIN:VCARD/");
            });
        });
    
        describe.skip('Get Chats', function () {    
            it('can get a chat by its ID', async function () { // it.skip
                const chat = await client.getChatById(remoteId);
                assert(chat instanceof Chat, "Expected chat to be an instance of Chat");
                if (!chat) return;
                assertEquals(chat.id._serialized, remoteId, "Expected chat ID to be equal to remoteId");
                assertEquals(chat.isGroup, false, "Expected chat to not be a group");
            });
    
            it('can get all chats', async function () { // it.skip
                const chats = await client.getChats();
                assertGreaterOrEqual(chats.length, 1, "Expected chats to have length of at least 1");
                const chat = chats.find(c => c.id._serialized === remoteId);
                assertExists(chat, "Chat should exist");
                assert(chat instanceof Chat, "Expected chat to be an instance of Chat");
            });
        });

        describe.skip('Get Contacts', function () {    
            it('can get a contact by its ID', async function () { // it.skip
                const contact = await client.getContactById(remoteId);
                assert(contact instanceof Contact, "Expected contact to be an instance of Contact");
                assertEquals(contact.id._serialized, remoteId, "Expected contact ID to be equal to remoteId");
                assertEquals(contact.number, remoteId.split('@')[0], "Expected contact number to be equal to remoteId");
            });
    
            it('can get all contacts', async function () { // it.skip
                const contacts = await client.getContacts();
                assertGreaterOrEqual(contacts.length, 1, "Expected contacts to have length of at least 1");
    
                const contact = contacts.find(c => c.id._serialized === remoteId);
                assertExists(contact, "Contact should exist");
                assert(contact instanceof Contact, "Expected contact to be an instance of Contact");
            });

            it('can block a contact', async function () { // it.skip
                const contact = await client.getContactById(remoteId);
                await contact.block();

                const refreshedContact = await client.getContactById(remoteId);
                assertEquals(refreshedContact.isBlocked, true, "Expected contact to be blocked");
            });

            it('can get a list of blocked contacts', async function () { // it.skip
                const blockedContacts = await client.getBlockedContacts();
                assertGreaterOrEqual(blockedContacts.length, 1, "Expected blocked contacts to have length of at least 1");

                const contact = blockedContacts.find(c => c.id._serialized === remoteId);
                assertExists(contact, "Blocked contact should exist");
                assert(contact instanceof Contact, "Expected contact to be an instance of Contact");
            });

            it('can unblock a contact', async function () { // it.skip
                const contact = await client.getContactById(remoteId);
                await contact.unblock();

                const refreshedContact = await client.getContactById(remoteId);
                assertEquals(refreshedContact.isBlocked, false, "Expected contact to not be blocked");
            });
        });

        describe('Numbers and Users', function () { // No .skip
            it('can verify that a user is registered', async function () { // No .skip
                const isRegistered = await client.isRegisteredUser(remoteId);
                assertEquals(isRegistered, true, "Expected isRegistered to be true");
            });

            it('can verify that a user is not registered', async function () { // No .skip
                const isRegistered = await client.isRegisteredUser('9999999999@c.us');
                assertEquals(isRegistered, false, "Expected isRegistered to be false");
            });

            it('can get a number\'s whatsapp id', async function () { // No .skip
                const number = remoteId.split('@')[0];
                const numberId = await client.getNumberId(number);
                assertEquals(numberId, {
                    server: 'c.us',
                    user: number,
                    _serialized: `${number}@c.us`
                });
            });

            it('returns null when getting an unregistered number\'s whatsapp id', async function () { // No .skip
                const number = '9999999999';
                const numberId = await client.getNumberId(number);
                assertEquals(numberId, null, "Expected numberId to be null");
            });

            it('can get a number\'s country code', async function () { // No .skip
                const number = '18092201111';
                const countryCode = await client.getCountryCode(number);
                assertEquals(countryCode, '1', "Expected countryCode to be 1");
            });

            it('can get a formatted number', async function () { // No .skip
                const number = '18092201111';
                const formatted = await client.getFormattedNumber(number);
                assertEquals(formatted, '+1 (809) 220-1111', "Expected formatted to be +1 (809) 220-1111");
            });

            it('can get a formatted number from a serialized ID', async function () { // No .skip
                const number = '18092201111@c.us';
                const formatted = await client.getFormattedNumber(number);
                assertEquals(formatted, '+1 (809) 220-1111', "Expected formatted to be +1 (809) 220-1111");
            });
        });

        describe('Search messages', function () { // No .skip
            it('can search for messages', async function () { // No .skip
                const m1 = await client.sendMessage(remoteId, 'I\'m searching for Super Mario Brothers');
                const m2 = await client.sendMessage(remoteId, 'This also contains Mario');
                const m3 = await client.sendMessage(remoteId, 'Nothing of interest here, just Luigi');
                
                // wait for search index to catch up
                await helper.sleep(1000);
                
                const msgs = await client.searchMessages('Mario', {chatId: remoteId});
                assertGreaterOrEqual(msgs.length, 2, "Expected msgs to have length of at least 2");
                const msgIds = msgs.map(m => m.id._serialized);

                assert(msgIds.includes(m1.id._serialized), "Expected msgIds to include m1.id._serialized");
                assert(msgIds.includes(m2.id._serialized), "Expected msgIds to include m2.id._serialized");
                assert(!msgIds.includes(m3.id._serialized), "Expected msgIds to not include m3.id._serialized");
            });
        });

        describe('Status/About', function () { // No .skip
            let me: Contact, previousStatus: string;

            before(async function () { // This is bdd.ts's before, runs before each it in this describe
                me = await client.getContactById(client.info.wid._serialized);
                const about = await me.getAbout();
                previousStatus = typeof about === 'string' ? about : ''; // Ensure previousStatus is a string
            });

            after(async function () { // This is bdd.ts's after, runs after each it in this describe
                await client.setStatus(previousStatus);
            });
            
            it('can set the status text', async function () { // No .skip
                await client.setStatus('My shiny new status');
                // FIX ME ruturn NULL // This comment was in the original code

                const status = await me.getAbout();
                assertEquals(status, 'My shiny new status', "Expected status to be 'My shiny new status'");
            });

            it('can set the status text to something else', async function () { // No .skip
                await client.setStatus('Busy');
                
                const status = await me.getAbout();
                assertEquals(status, 'Busy', "Expected status to be 'Busy'");
            });
        });
    });
});
