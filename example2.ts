import { Client, LocalAuth } from "./index.ts";
import qrcode from "npm:qrcode-terminal";

const clientId = "cli1";
const authStrategy = new LocalAuth({ clientId });
const client = new Client({ authStrategy, puppeteer: { headless: false } });

await new Promise((resolve, reject) => {
  client.once("ready", () => {
    console.log("Client is ready!");
    resolve(client);
  });
  client.on("qr", (qr) => {
    qrcode.generate(qr, { small: true });
  });
  client.on("message_create", (message) => {
    console.log(message.from, message.body);
    if (message.body === "ping") {
      // send back "pong" to the chat the message was sent in
      client.sendMessage(message.from, "pong");
    }
  });
  client.on(
    "remote_session_saved",
    () => console.log("Remote session saved"),
  );
  client.initialize().then(() => console.log("client.initialize return"));
});

await client.sendMessage("33611306069@c.us", "WhatsApp is ready to send messages!");
