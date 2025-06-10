import "mocha"
import * as chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import sinon from 'sinon';

import * as helper from './helper.js';
import Chat from '../src/structures/Chat.js';
import Contact from '../src/structures/Contact.js';
import Message from '../src/structures/Message.js';
import MessageMedia from '../src/structures/MessageMedia.js';
import Location from '../src/structures/Location.js';
import { MessageTypes, WAState, DefaultOptions } from '../src/util/Constants.js';

const expect = chai.expect;
chai.use(chaiAsPromised);

const remoteId = helper.remoteId;
const isMD = helper.isMD();

const TIMEOUT = 3000;
const LONG_WAIT = 500;
const SUPER_TIMEOUT = 600000;
const AUTH_TIMEOUT = 600000;

const PUPPETER_HEADLESS = { headless: false };


it('TSX environment', async function () {
    const test = () => {
        const fnc = () => {
            return 1;
        };
    }
    const str = test.toString();
    expect(str).to.not.include('__name', 'Typescript transpile configuration should not add __name in function');
});

// for debug
describe('Client', function() {
    describe('User Agent', function () {
        it.skip('should set user agent on browser', async function () {
            this.timeout(SUPER_TIMEOUT);

            const client = await helper.createClient({
                options: {
                    puppeteer: {...PUPPETER_HEADLESS}
                }
            });
            try {
                await client.initialize();

                await helper.sleep(LONG_WAIT);
    
                const browserUA = await client.pupBrowser.userAgent();
                expect(browserUA).to.equal(DefaultOptions.userAgent);
    
                const pageUA = await client.pupPage.evaluate(() => window.navigator.userAgent);
                expect(pageUA).to.equal(DefaultOptions.userAgent);
            } finally {
                await client.destroy();
            }
        });

        it.skip('should set custom user agent on browser', async function () {
            this.timeout(SUPER_TIMEOUT);
            const customUA = DefaultOptions.userAgent.replace(/Chrome\/.* /, 'Chrome/99.9.9999.999 ');

            const client = await helper.createClient({
                options: {
                    userAgent: customUA,
                    puppeteer: {...PUPPETER_HEADLESS}
                }
            });

            await client.initialize();
            await helper.sleep(LONG_WAIT);

            const browserUA = await client.pupBrowser.userAgent();
            expect(browserUA).to.equal(customUA);
            expect(browserUA.includes('Chrome/99.9.9999.999')).to.equal(true);

            const pageUA = await client.pupPage.evaluate(() => window.navigator.userAgent);
            expect(pageUA).to.equal(customUA);

            await client.destroy();
        });

        it.skip('should respect an existing user agent arg', async function () {
            this.timeout(SUPER_TIMEOUT);

            const customUA = DefaultOptions.userAgent.replace(/Chrome\/.* /, 'Chrome/99.9.9999.999 ');

            const client = await helper.createClient({
                options: {
                    puppeteer: {
                        args: [`--user-agent=${customUA}`],
                        ...PUPPETER_HEADLESS
                    }
                }
            });

            await client.initialize();
            await helper.sleep(LONG_WAIT);

            const browserUA = await client.pupBrowser.userAgent();
            expect(browserUA).to.equal(customUA);
            expect(browserUA.includes('Chrome/99.9.9999.999')).to.equal(true);

            const pageUA = await client.pupPage.evaluate(() => window.navigator.userAgent);
            expect(pageUA).to.equal(DefaultOptions.userAgent);

            await client.destroy();
        });
    });

    describe.skip('Authentication', function() {
        it('should emit QR code if not authenticated', async function() {
            this.timeout(SUPER_TIMEOUT);
            const callback = sinon.spy();

            const client = await helper.createClient({
                options: {
                    puppeteer: {...PUPPETER_HEADLESS}
                }
            });
            client.on('qr', callback);
            await client.initialize();

            await helper.sleep(LONG_WAIT);

            expect(callback.called).to.equal(true);
            expect(callback.args[0][0]).to.have.length.greaterThanOrEqual(152);

            await client.destroy();
        });

        /** 
         * TODO replace helper.sleep(60000) by a promise.
         */
        it.skip('should disconnect after reaching max qr retries', async function () {
            this.timeout(SUPER_TIMEOUT);

            let nbQrCode = 0;
            const getQrCode = (_qrCode) => nbQrCode++;
            let disconnectedReason = "";
            const disconnectedCallback = (deco_reason) => disconnectedReason = deco_reason;

            const client = await helper.createClient({options: {qrMaxRetries: 1, puppeteer: {...PUPPETER_HEADLESS} } });
            client.on('qr', getQrCode);
            client.on('disconnected', disconnectedCallback);

            await client.initialize();

            await helper.sleep(60000); // give time to whatsapp to expire the qr code
            
            expect(nbQrCode).to.be.greaterThanOrEqual(2);
            expect(disconnectedReason).to.eql('Max qrcode retries reached');
        });

        // get stuck with a QRcode.
        it.skip('should authenticate with existing session', async function() {
            this.timeout(SUPER_TIMEOUT);
            const authenticatedCallback = sinon.spy();
            const client = await helper.createClient({
                authenticated: true,
                options: {puppeteer: {...PUPPETER_HEADLESS} }
            });

            let nbQrCode = 0;
            const getQrCode = (_qrCode) => nbQrCode++;

            let nbReady = 0;
            const getReady = () => nbReady++;

            client.on('qr', getQrCode);
            client.on('authenticated', authenticatedCallback);
            client.on('ready', getReady);

            await client.initialize();

            expect(authenticatedCallback.called).to.equal(true);

            if(helper.isUsingLegacySession()) {
                const newSession = authenticatedCallback.args[0][0];
                expect(newSession).to.have.key([
                    'WABrowserId', 
                    'WASecretBundle', 
                    'WAToken1', 
                    'WAToken2'
                ] as any as string); // bypasse bad mocha typing
            }
            
            expect(nbReady).to.equal(1);
            expect(nbQrCode).to.equal(0);

            await client.destroy();
        });

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
                it('can take over if client was logged in somewhere else with takeoverOnConflict=true', async function() {
                    this.timeout(TIMEOUT + LONG_WAIT + LONG_WAIT);
    
                    const readyCallback1 = sinon.spy();
                    const readyCallback2 = sinon.spy();
                    const disconnectedCallback1 = sinon.spy();
                    const disconnectedCallback2 = sinon.spy();
    
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
                    expect(readyCallback1.called).to.equal(true);
                    expect(readyCallback2.called).to.equal(false);
                    expect(disconnectedCallback1.called).to.equal(false);
                    expect(disconnectedCallback2.called).to.equal(false);
    
                    await client2.initialize();
                    expect(readyCallback2.called).to.equal(true);
                    expect(disconnectedCallback1.called).to.equal(false);
                    expect(disconnectedCallback2.called).to.equal(false);
    
                    // wait for takeoverTimeoutMs to kick in
                    await helper.sleep(5200);
                    expect(disconnectedCallback1.called).to.equal(false);
                    expect(disconnectedCallback2.called).to.equal(true);
                    expect(disconnectedCallback2.calledWith(WAState.CONFLICT)).to.equal(true);
    
                    await client1.destroy();
                });
            }
        }); 
    });

    describe.skip('Authenticated', function() {
        // this.timeout(SUPER_TIMEOUT);
        let client;

        before(async function() {
            this.timeout(AUTH_TIMEOUT);
            client = await helper.createClient({authenticated: true, options: {puppeteer: { ...PUPPETER_HEADLESS }}});
            await client.initialize();
            console.log('Client initialized');
        });

        after(async function () {
            try {
                await client.destroy();
            } catch (error) {
                // ignore error
            }
        });

        it('can get current WhatsApp Web version', async function () {
            const version = await client.getWWebVersion();
            expect(typeof version).to.equal('string');
            console.log(`WA Version: ${version}`);
        });

        describe('Expose Store', function() {
            it('exposes the store', async function() {
                const exposed = await client.pupPage.evaluate(async () => {
                    for (let i=0; i< 50; i++) {
                        if (window.Store) {
                            return i + 1;
                        }
                        await new Promise(resolve => setTimeout(resolve, 100));
                    }
                    return -1;
                });
                expect(exposed).to.be.greaterThanOrEqual(1);
            });
    
            it.skip('exposes all required WhatsApp Web internal models 1/3', async function() {
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
              
                const loadedModules = await client.pupPage.evaluate((expectedModules) => {
                    return expectedModules.filter(m => Boolean(window.Store[m]));
                }, expectedModules);
                
                const missingModules = [];
                for (const module of expectedModules) {
                    if (!loadedModules.includes(module)) {
                        missingModules.push(module);
                    }
                }
                expect(loadedModules).to.have.members(expectedModules, `Missing modules: ${missingModules.join(', ')}`);
            });


            it.skip('exposes all required WhatsApp Web internal models 2/3', async function() {
                const expectedModules = [
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
              
                const loadedModules = await client.pupPage.evaluate((expectedModules) => {
                    return expectedModules.filter(m => Boolean(window.Store[m]));
                }, expectedModules);
                
                const missingModules = [];
                for (const module of expectedModules) {
                    if (!loadedModules.includes(module)) {
                        missingModules.push(module);
                    }
                }
                expect(loadedModules).to.have.members(expectedModules, `Missing modules: ${missingModules.join(', ')}`);
            });

            it('exposes all required WhatsApp Web internal models 3/3', async function() {
                const expectedModules = [
                    'Call',
                    'Features',
                    'Invite',
                    'InviteInfo',
                    'JoinInviteV4',
                    'MessageInfo',
                    'QueryOrder',
                    'SendClear',
                    'UploadUtils',
                ];
              
                const loadedModules = await client.pupPage.evaluate((expectedModules) => {
                    return expectedModules.filter(m => Boolean(window.Store[m]));
                }, expectedModules);
                
                const missingModules = [];
                for (const module of expectedModules) {
                    if (!loadedModules.includes(module)) {
                        missingModules.push(module);
                    }
                }
                expect(loadedModules).to.have.members(expectedModules, `Missing modules: ${missingModules.join(', ')}`);
            });


        });
    
        describe('Send Messages', function () {    
            this.timeout(15000);
            it.skip('can send a message', async function() {
                const msg = await client.sendMessage(remoteId, 'hello world');
                expect(msg).to.be.instanceOf(Message, "Expected message to be an instance of Message");
                expect(msg.type).to.equal(MessageTypes.TEXT, "Expected message type to be TEXT");
                expect(msg.fromMe).to.equal(true, "Expected message to be from me");
                expect(msg.body).to.equal('hello world', "Expected message body to be 'hello world'");
                expect(msg.to).to.equal(remoteId, "Expected message to be sent to remoteId");
            });
    
            it('can send a media message', async function() {
                const media = new MessageMedia(
                    'image/png', 
                    'iVBORw0KGgoAAAANSUhEUgAAAV4AAACWBAMAAABkyf1EAAAAG1BMVEXMzMyWlpacnJyqqqrFxcWxsbGjo6O3t7e+vr6He3KoAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAEcElEQVR4nO2aTW/bRhCGh18ij1zKknMkbbf2UXITIEeyMhIfRaF1exQLA/JRclslRykO+rs7s7s0VwytNmhJtsA8gHZEcox9PTs7uysQgGEYhmEYhmEYhmEYhmEYhmEYhmEYhmEYhmEYhmEYhmGYr2OWRK/ReIKI8Zt7Hb19wTcQ0uTkGh13bQupcw7gPOvdo12/5CzNtNR7xLUtNtT3CGBQ6g3InjY720pvofUec22LJPr8PhEp2OMPyI40PdwWUdronCu9yQpdPx53bQlfLKnfOVhlnDYRBXve4Ov+IZTeMgdedm0NR+xoXJeQvdJ3CvziykSukwil16W/Oe7aGjIjqc/9ib4jQlJy0uArtN4A0+cvXFvDkmUJ47sJ1Y1ATLDNVXZkNPIepQzxy1ki9fqiwbUj/I+64zxWNzyZnPuhvohJ9K70VvXBixpcu2SAHU+Xd9EKdEJDNpYP3AQr3bQSpPQ6Y6/4dl1z7ZDbArsszjA7L0g7ibB0CDcidUWVoErvIMKZh2Xs0LUzcLW6V5NfiUgNEbaYmAVL6bXl0nJRc+1S72ua/D/cTjGPlQj7eUqd7A096rYlRjdPYlhz7VIvxpVG3cemDKF+WAwLY/6XelOZKTXXzsC4xvDjjtSN6kHLhLke6PrwM8h1raf40qjrGO7H9aTEbduucjS04ZrYU/4iuS5Z2Hdt0rvCLFdmLEXcU30AGddST62o+sLcf5l6k7CP+ru4pLYqX/VFyxbm/utQbx/r22ZEbTb2f5I2kns1Y1OQR8ZyofX+TjJxj1Rz7QQVnf1QzR26Oth0ueJVYcRP6ZUPac/Rx/5M6ixO1dhSrT3Y1DpiYmx3tF4ZUdpz9LD/dSg9PXES0LB71BwcGjKROuV28lnvnv7HHJsezheBGH5+X2CfSfRbMKW+5aGs3JFjMrjGibJc0S7TJzqjHrh2hDybj9XRXNZa89Aro55XBdbW5wti2c/5WJ7jJ1RolVUn/HWpb0I58Tziup6Rx7Dm2hnbRP1GM9PW/NFmQ4PtVRVN63Wvxfmu5sowDMMwDMMwDMMwDMMwDMMwDMMwzL+CpT//F/6beoV8zb2Jmt4Qryx6lTUCsENQ75HOkhXAO3EPVgyQtKtUy3C/e+FJg17Zjnew1Xrdb9InbG4WqfUAftG+WhLwPVyfg536+MU7m4C1CMk4ZznpXZzDYI1PDL2nS1hpvc5cNd7E2sJg05Fe7/7d3Fln8Cvc3bwB616auxsKl4WPghjemHrDqyDWeu1UNW5s2btPnSQ75oOdunEwWazfwgVG0kqluYCM9OIjWOGnfA2b9G4Ha63XKpvQ8perTvTifJNhi6+WMWmi7smEZf6G8MmhlyGq+NqP8GV84TLuJr7UIQVx+bDEoEpRZIz42gs40OuN4Mv8hXzelV7KX1isH+ewTWckikyVv+CfHuqVF7I16gN0VKypX6wPsE+zFPzkinolU9UH8OMGvSpnZqKsv13p/RsMun6X5x/y2LeAr8O66lsBwzBMP/wJfyGq8pgBk6IAAAAASUVORK5CYII='
                );
    
                const msg = await client.sendMessage(remoteId, media, {caption: 'here\'s my media'});
                expect(msg).to.be.instanceOf(Message, "Expected message to be an instance of Message");
                expect(msg.type).to.equal(MessageTypes.IMAGE, "Expected message type to be IMAGE");
                expect(msg.fromMe).to.equal(true, "Expected message to be from me");
                expect(msg.hasMedia).to.equal(true, "Expected message to have media");
                expect(msg.body).to.equal('here\'s my media', "Expected message body to be 'here\'s my media'");
                expect(msg.to).to.equal(remoteId, "Expected message to be sent to remoteId");
            });

            it.skip('can send a media message from URL', async function() {
                const media = await MessageMedia.fromUrl('https://github.com/UrielCh/whatsapp-web.ts/blob/esm/data/350x150.jpeg?raw=true');
                // const media = await MessageMedia.fromUrl('https://www.o-immobilierdurable.fr/wp-content/uploads/2023/06/Image3-350x150.png');
                const msg = await client.sendMessage(remoteId, media);
                expect(msg).to.be.instanceOf(Message, "Expected message to be an instance of Message");
                expect(msg.type).to.equal(MessageTypes.IMAGE, "Expected message type to be IMAGE");
                expect(msg.fromMe).to.equal(true, "Expected message to be from me");
                expect(msg.hasMedia).to.equal(true, "Expected message to have media");
                expect(msg.to).to.equal(remoteId, "Expected message to be sent to remoteId");
            });
    
            it.skip('can send a media message as a document', async function() {
                const media = new MessageMedia(
                    'image/png', 
                    'iVBORw0KGgoAAAANSUhEUgAAAV4AAACWBAMAAABkyf1EAAAAG1BMVEXMzMyWlpacnJyqqqrFxcWxsbGjo6O3t7e+vr6He3KoAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAEcElEQVR4nO2aTW/bRhCGh18ij1zKknMkbbf2UXITIEeyMhIfRaF1exQLA/JRclslRykO+rs7s7s0VwytNmhJtsA8gHZEcox9PTs7uysQgGEYhmEYhmEYhmEYhmEYhmEYhmEYhmEYhmEYhmEYhmGYr2OWRK/ReIKI8Zt7Hb19wTcQ0uTkGh13bQupcw7gPOvdo12/5CzNtNR7xLUtNtT3CGBQ6g3InjY720pvofUec22LJPr8PhEp2OMPyI40PdwWUdronCu9yQpdPx53bQlfLKnfOVhlnDYRBXve4Ov+IZTeMgdedm0NR+xoXJeQvdJ3CvziykSukwil16W/Oe7aGjIjqc/9ib4jQlJy0uArtN4A0+cvXFvDkmUJ47sJ1Y1ATLDNVXZkNPIepQzxy1ki9fqiwbUj/I+64zxWNzyZnPuhvohJ9K70VvXBixpcu2SAHU+Xd9EKdEJDNpYP3AQr3bQSpPQ6Y6/4dl1z7ZDbArsszjA7L0g7ibB0CDcidUWVoErvIMKZh2Xs0LUzcLW6V5NfiUgNEbaYmAVL6bXl0nJRc+1S72ua/D/cTjGPlQj7eUqd7A096rYlRjdPYlhz7VIvxpVG3cemDKF+WAwLY/6XelOZKTXXzsC4xvDjjtSN6kHLhLke6PrwM8h1raf40qjrGO7H9aTEbduucjS04ZrYU/4iuS5Z2Hdt0rvCLFdmLEXcU30AGddST62o+sLcf5l6k7CP+ru4pLYqX/VFyxbm/utQbx/r22ZEbTb2f5I2kns1Y1OQR8ZyofX+TjJxj1Rz7QQVnf1QzR26Oth0ueJVYcRP6ZUPac/Rx/5M6ixO1dhSrT3Y1DpiYmx3tF4ZUdpz9LD/dSg9PXES0LB71BwcGjKROuV28lnvnv7HHJsezheBGH5+X2CfSfRbMKW+5aGs3JFjMrjGibJc0S7TJzqjHrh2hDybj9XRXNZa89Aro55XBdbW5wti2c/5WJ7jJ1RolVUn/HWpb0I58Tziup6Rx7Dm2hnbRP1GM9PW/NFmQ4PtVRVN63Wvxfmu5sowDMMwDMMwDMMwDMMwDMMwDMMwzL+CpT//F/6beoV8zb2Jmt4Qryx6lTUCsENQ75HOkhXAO3EPVgyQtKtUy3C/e+FJg17Zjnew1Xrdb9InbG4WqfUAftG+WhLwPVyfg536+MU7m4C1CMk4ZznpXZzDYI1PDL2nS1hpvc5cNd7E2sJg05Fe7/7d3Fln8Cvc3bwB616auxsKl4WPghjemHrDqyDWeu1UNW5s2btPnSQ75oOdunEwWazfwgVG0kqluYCM9OIjWOGnfA2b9G4Ha63XKpvQ8perTvTifJNhi6+WMWmi7smEZf6G8MmhlyGq+NqP8GV84TLuJr7UIQVx+bDEoEpRZIz42gs40OuN4Mv8hXzelV7KX1isH+ewTWckikyVv+CfHuqVF7I16gN0VKypX6wPsE+zFPzkinolU9UH8OMGvSpnZqKsv13p/RsMun6X5x/y2LeAr8O66lsBwzBMP/wJfyGq8pgBk6IAAAAASUVORK5CYII=',
                    'this is my filename.png'
                );
    
                const msg = await client.sendMessage(remoteId, media, { sendMediaAsDocument: true});
                expect(msg).to.be.instanceOf(Message, "Expected message to be an instance of Message");
                expect(msg.type).to.equal(MessageTypes.DOCUMENT, "Expected message type to be DOCUMENT");
                expect(msg.fromMe).to.equal(true, "Expected message to be from me");
                expect(msg.hasMedia).to.equal(true, "Expected message to have media");
                expect(msg.body).to.equal('this is my filename.png', "Expected message body to be 'this is my filename.png'");
                expect(msg.to).to.equal(remoteId, "Expected message to be sent to remoteId");
            });
    
            it.skip('can send a sticker message', async function() {
                const media = new MessageMedia(
                    'image/png', 
                    'iVBORw0KGgoAAAANSUhEUgAAAV4AAACWBAMAAABkyf1EAAAAG1BMVEXMzMyWlpacnJyqqqrFxcWxsbGjo6O3t7e+vr6He3KoAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAEcElEQVR4nO2aTW/bRhCGh18ij1zKknMkbbf2UXITIEeyMhIfRaF1exQLA/JRclslRykO+rs7s7s0VwytNmhJtsA8gHZEcox9PTs7uysQgGEYhmEYhmEYhmEYhmEYhmEYhmEYhmEYhmEYhmEYhmGYr2OWRK/ReIKI8Zt7Hb19wTcQ0uTkGh13bQupcw7gPOvdo12/5CzNtNR7xLUtNtT3CGBQ6g3InjY720pvofUec22LJPr8PhEp2OMPyI40PdwWUdronCu9yQpdPx53bQlfLKnfOVhlnDYRBXve4Ov+IZTeMgdedm0NR+xoXJeQvdJ3CvziykSukwil16W/Oe7aGjIjqc/9ib4jQlJy0uArtN4A0+cvXFvDkmUJ47sJ1Y1ATLDNVXZkNPIepQzxy1ki9fqiwbUj/I+64zxWNzyZnPuhvohJ9K70VvXBixpcu2SAHU+Xd9EKdEJDNpYP3AQr3bQSpPQ6Y6/4dl1z7ZDbArsszjA7L0g7ibB0CDcidUWVoErvIMKZh2Xs0LUzcLW6V5NfiUgNEbaYmAVL6bXl0nJRc+1S72ua/D/cTjGPlQj7eUqd7A096rYlRjdPYlhz7VIvxpVG3cemDKF+WAwLY/6XelOZKTXXzsC4xvDjjtSN6kHLhLke6PrwM8h1raf40qjrGO7H9aTEbduucjS04ZrYU/4iuS5Z2Hdt0rvCLFdmLEXcU30AGddST62o+sLcf5l6k7CP+ru4pLYqX/VFyxbm/utQbx/r22ZEbTb2f5I2kns1Y1OQR8ZyofX+TjJxj1Rz7QQVnf1QzR26Oth0ueJVYcRP6ZUPac/Rx/5M6ixO1dhSrT3Y1DpiYmx3tF4ZUdpz9LD/dSg9PXES0LB71BwcGjKROuV28lnvnv7HHJsezheBGH5+X2CfSfRbMKW+5aGs3JFjMrjGibJc0S7TJzqjHrh2hDybj9XRXNZa89Aro55XBdbW5wti2c/5WJ7jJ1RolVUn/HWpb0I58Tziup6Rx7Dm2hnbRP1GM9PW/NFmQ4PtVRVN63Wvxfmu5sowDMMwDMMwDMMwDMMwDMMwDMMwzL+CpT//F/6beoV8zb2Jmt4Qryx6lTUCsENQ75HOkhXAO3EPVgyQtKtUy3C/e+FJg17Zjnew1Xrdb9InbG4WqfUAftG+WhLwPVyfg536+MU7m4C1CMk4ZznpXZzDYI1PDL2nS1hpvc5cNd7E2sJg05Fe7/7d3Fln8Cvc3bwB616auxsKl4WPghjemHrDqyDWeu1UNW5s2btPnSQ75oOdunEwWazfwgVG0kqluYCM9OIjWOGnfA2b9G4Ha63XKpvQ8perTvTifJNhi6+WMWmi7smEZf6G8MmhlyGq+NqP8GV84TLuJr7UIQVx+bDEoEpRZIz42gs40OuN4Mv8hXzelV7KX1isH+ewTWckikyVv+CfHuqVF7I16gN0VKypX6wPsE+zFPzkinolU9UH8OMGvSpnZqKsv13p/RsMun6X5x/y2LeAr8O66lsBwzBMP/wJfyGq8pgBk6IAAAAASUVORK5CYII='
                );
    
                const msg = await client.sendMessage(remoteId, media, {sendMediaAsSticker: true});
                expect(msg).to.be.instanceOf(Message, "Expected message to be an instance of Message");
                expect(msg.type).to.equal(MessageTypes.STICKER, "Expected message type to be STICKER");
                expect(msg.fromMe).to.equal(true, "Expected message to be from me");
                expect(msg.hasMedia).to.equal(true, "Expected message to have media");
                expect(msg.to).to.equal(remoteId, "Expected message to be sent to remoteId");
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
                expect(msg).to.be.instanceOf(Message, "Expected message to be an instance of Message");
                expect(msg.type).to.equal(MessageTypes.STICKER, "Expected message type to be STICKER");
                expect(msg.fromMe).to.equal(true, "Expected message to be from me");
                expect(msg.hasMedia).to.equal(true, "Expected message to have media");
                expect(msg.to).to.equal(remoteId, "Expected message to be sent to remoteId");
            });
    
            it('can send a location message', async function() {
                // broken the Place name is now properly sent
                const location = new Location(37.422, -122.084, {name: 'Googleplex\nGoogle Headquarters'});
    
                const msg = await client.sendMessage(remoteId, location);
                expect(msg).to.be.instanceOf(Message, "Expected message to be an instance of Message");
                expect(msg.type).to.equal(MessageTypes.LOCATION, "Expected message type to be LOCATION");
                expect(msg.fromMe).to.equal(true, "Expected message to be from me");
                expect(msg.to).to.equal(remoteId, "Expected message to be sent to remoteId");
    
                expect(msg.location).to.be.instanceOf(Location, "Expected message location to be an instance of Location");
                expect(msg.location.latitude).to.equal(37.422, "Expected message location latitude to be 37.422");
                expect(msg.location.longitude).to.equal(-122.084, "Expected message location longitude to be -122.084");
                expect(msg.location.name).to.equal('Googleplex\nGoogle Headquarters', "Expected message location description to be 'Googleplex\nGoogle Headquarters'");
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
                expect(msg).to.be.instanceOf(Message, "Expected message to be an instance of Message");
                expect(msg.type).to.equal(MessageTypes.CONTACT_CARD, "Expected message type to be CONTACT_CARD");
                expect(msg.fromMe).to.equal(true, "Expected message to be from me");
                expect(msg.to).to.equal(remoteId, "Expected message to be sent to remoteId");
                expect(msg.body).to.equal(vCard, "Expected message body to be the vCard");
                expect(msg.vCards).to.have.lengthOf(1, "Expected message vCards to have length of 1");
                expect(msg.vCards[0]).to.equal(vCard, "Expected message vCards to be the vCard");
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
                expect(msg).to.be.instanceOf(Message, "Expected message to be an instance of Message");
                expect(msg.type).to.equal(MessageTypes.TEXT, "Expected message type to be TEXT"); // not a contact card
                expect(msg.fromMe).to.equal(true, "Expected message to be from me");
                expect(msg.to).to.equal(remoteId, "Expected message to be sent to remoteId");
                expect(msg.body).to.equal(vCard, "Expected message body to be the vCard");
            });
    
            it.skip('can send a Contact as a contact card message', async function() {
                const contact = await client.getContactById(remoteId);
    
                const msg = await client.sendMessage(remoteId, contact);
                expect(msg).to.be.instanceOf(Message, "Expected message to be an instance of Message");
                expect(msg.type).to.equal(MessageTypes.CONTACT_CARD, "Expected message type to be CONTACT_CARD");
                expect(msg.fromMe).to.equal(true, "Expected message to be from me");
                expect(msg.to).to.equal(remoteId, "Expected message to be sent to remoteId");
                expect(msg.body).to.match(/BEGIN:VCARD/, "Expected message body to match /BEGIN:VCARD/");
                expect(msg.vCards).to.have.lengthOf(1, "Expected message vCards to have length of 1");
                expect(msg.vCards[0]).to.match(/BEGIN:VCARD/, "Expected message vCards to match /BEGIN:VCARD/");
            });
    
            it.skip('can send multiple Contacts as a contact card message', async function () {
                const contact1 = await client.getContactById(remoteId);
                const contact2 = await client.getContactById('5511942167462@c.us'); //iFood
    
                const msg = await client.sendMessage(remoteId, [contact1, contact2]);
                expect(msg).to.be.instanceOf(Message, "Expected message to be an instance of Message");
                expect(msg.type).to.equal(MessageTypes.CONTACT_CARD_MULTI, "Expected message type to be CONTACT_CARD_MULTI");
                expect(msg.fromMe).to.equal(true, "Expected message to be from me");
                expect(msg.to).to.equal(remoteId, "Expected message to be sent to remoteId");
                expect(msg.vCards).to.have.lengthOf(2, "Expected message vCards to have length of 2");
                expect(msg.vCards[0]).to.match(/BEGIN:VCARD/, "Expected message vCards to match /BEGIN:VCARD/");
                expect(msg.vCards[1]).to.match(/BEGIN:VCARD/, "Expected message vCards to match /BEGIN:VCARD/");
            });
        });
    
        describe.skip('Get Chats', function () {    
            it('can get a chat by its ID', async function () {
                const chat = await client.getChatById(remoteId);
                expect(chat).to.be.instanceOf(Chat, "Expected chat to be an instance of Chat");
                expect(chat.id._serialized).to.eql(remoteId, "Expected chat ID to be equal to remoteId");
                expect(chat.isGroup).to.eql(false, "Expected chat to not be a group");
            });
    
            it('can get all chats', async function () {
                const chats = await client.getChats();
                expect(chats.length).to.be.greaterThanOrEqual(1, "Expected chats to have length of at least 1");
    
                const chat = chats.find(c => c.id._serialized === remoteId);
                expect(chat).to.exist;
                expect(chat).to.be.instanceOf(Chat, "Expected chat to be an instance of Chat");
            });
        });

        describe.skip('Get Contacts', function () {    
            it('can get a contact by its ID', async function () {
                const contact = await client.getContactById(remoteId);
                expect(contact).to.be.instanceOf(Contact, "Expected contact to be an instance of Contact");
                expect(contact.id._serialized).to.eql(remoteId, "Expected contact ID to be equal to remoteId");
                expect(contact.number).to.eql(remoteId.split('@')[0], "Expected contact number to be equal to remoteId");
            });
    
            it('can get all contacts', async function () {
                const contacts = await client.getContacts();
                expect(contacts.length).to.be.greaterThanOrEqual(1, "Expected contacts to have length of at least 1");
    
                const contact = contacts.find(c => c.id._serialized === remoteId);
                expect(contact).to.exist;
                expect(contact).to.be.instanceOf(Contact, "Expected contact to be an instance of Contact");
            });

            it('can block a contact', async function () {
                const contact = await client.getContactById(remoteId);
                await contact.block();

                const refreshedContact = await client.getContactById(remoteId);
                expect(refreshedContact.isBlocked).to.eql(true, "Expected contact to be blocked");
            });

            it('can get a list of blocked contacts', async function () {
                const blockedContacts = await client.getBlockedContacts();
                expect(blockedContacts.length).to.be.greaterThanOrEqual(1, "Expected blocked contacts to have length of at least 1");

                const contact = blockedContacts.find(c => c.id._serialized === remoteId);
                expect(contact).to.exist;
                expect(contact).to.be.instanceOf(Contact, "Expected contact to be an instance of Contact");
            });

            it('can unblock a contact', async function () {
                const contact = await client.getContactById(remoteId);
                await contact.unblock();

                const refreshedContact = await client.getContactById(remoteId);
                expect(refreshedContact.isBlocked).to.eql(false, "Expected contact to not be blocked");
            });
        });

        describe('Numbers and Users', function () {
            it('can verify that a user is registered', async function () {
                const isRegistered = await client.isRegisteredUser(remoteId);
                expect(isRegistered).to.equal(true, "Expected isRegistered to be true");
            });

            it('can verify that a user is not registered', async function () {
                const isRegistered = await client.isRegisteredUser('9999999999@c.us');
                expect(isRegistered).to.equal(false, "Expected isRegistered to be false");
            });

            it('can get a number\'s whatsapp id', async function () {
                const number = remoteId.split('@')[0];
                const numberId = await client.getNumberId(number);
                expect(numberId).to.eql({
                    server: 'c.us',
                    user: number,
                    _serialized: `${number}@c.us`
                });
            });

            it('returns null when getting an unregistered number\'s whatsapp id', async function () {
                const number = '9999999999';
                const numberId = await client.getNumberId(number);
                expect(numberId).to.eql(null, "Expected numberId to be null");
            });

            it('can get a number\'s country code', async function () {
                const number = '18092201111';
                const countryCode = await client.getCountryCode(number);
                expect(countryCode).to.eql('1', "Expected countryCode to be 1");
            });

            it('can get a formatted number', async function () {
                const number = '18092201111';
                const formatted = await client.getFormattedNumber(number);
                expect(formatted).to.eql('+1 (809) 220-1111', "Expected formatted to be +1 (809) 220-1111");
            });

            it('can get a formatted number from a serialized ID', async function () {
                const number = '18092201111@c.us';
                const formatted = await client.getFormattedNumber(number);
                expect(formatted).to.eql('+1 (809) 220-1111', "Expected formatted to be +1 (809) 220-1111");
            });
        });

        describe('Search messages', function () {
            it('can search for messages', async function () {
                const m1 = await client.sendMessage(remoteId, 'I\'m searching for Super Mario Brothers');
                const m2 = await client.sendMessage(remoteId, 'This also contains Mario');
                const m3 = await client.sendMessage(remoteId, 'Nothing of interest here, just Luigi');
                
                // wait for search index to catch up
                await helper.sleep(1000);
                
                const msgs = await client.searchMessages('Mario', {chatId: remoteId});
                expect(msgs.length).to.be.greaterThanOrEqual(2, "Expected msgs to have length of at least 2");
                const msgIds = msgs.map(m => m.id._serialized);
                expect(msgIds).to.include.members([
                    m1.id._serialized, m2.id._serialized
                ], "Expected msgIds to include m1.id._serialized and m2.id._serialized");
                expect(msgIds).to.not.include.members([m3.id._serialized], "Expected msgIds to not include m3.id._serialized");
            });
        });

        describe('Status/About', function () {
            let me, previousStatus;

            before(async function () {
                me = await client.getContactById(client.info.wid._serialized);
                previousStatus = await me.getAbout();
            });

            after(async function () {
                await client.setStatus(previousStatus);
            });
            
            it('can set the status text', async function () {
                await client.setStatus('My shiny new status');
                // FIX ME ruturn NULL

                const status = await me.getAbout();
                expect(status).to.eql('My shiny new status', "Expected status to be 'My shiny new status'");
            });

            it('can set the status text to something else', async function () {
                await client.setStatus('Busy');
                
                const status = await me.getAbout();
                expect(status).to.eql('Busy', "Expected status to be 'Busy'");
            });
        });
    });
});
