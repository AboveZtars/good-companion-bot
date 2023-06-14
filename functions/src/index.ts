import {onRequest} from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import TelegramBot from "node-telegram-bot-api";
import {defineString} from "firebase-functions/params";
// The Firebase Admin SDK to access Firestore.
// import {initializeApp} from "firebase-admin/app";
import {getFirestore} from "firebase-admin/firestore";
import firebaseApp from "./firestore/config";
// Reminders API
// import {createReminderApp} from "./reminders-api";
// My classes
import {Agent} from "./langchainAbstract/agents";

const telegramToken = defineString("TOKEN");
// const reminderToken = defineString("REMINDERTOKEN");

const db = getFirestore(firebaseApp);

export const sendMessage = onRequest(async (request, response) => {
  logger.info("sendMessage called", {structuredData: true});
  const chatId = request.body.message.chat.id;
  const text = request.body.message.text;
  // Create a Telegram bot
  const bot = new TelegramBot(telegramToken.value());

  const chatDocument = await db
    .collection("chats")
    .where("chatId", "==", chatId)
    .get();

  if (chatDocument.empty) {
    // Welcome algorithm
    const result = await db.collection("chats").add({chatId: chatId});
    logger.info(`Chat Id saved in doc: ${result.id}`, {structuredData: true});

    bot.sendMessage(
      chatId,
      `Hello I'm your good companion, you can call me MEI.
      Right now I'm kinda smart that's why I need you to tell me 
      the hour you want me to send you 
      a message every day. 
      Like this: hour: 09:00`
    );

    const agent = new Agent();
    const responseChatGPT = await agent.runDefaultAgent(text);

    bot.sendMessage(chatId, responseChatGPT);
  } else {
    // Extract frequency and hour of reminder
    const messageText: string = request.body.message.text;
    const hour = messageText.match(/([0-1]?[0-9]|2[0-3]):[0-5][0-9]/g);
    // const greetingMessage = messageText.match(/message:\s*(.*)/g);
    const docId = chatDocument.docs[0].id;
    if (hour) {
      logger.info(`Hour: ${hour[0]}`, {structuredData: true});
      // Order in this please
      const raw = JSON.stringify({
        chatId: chatId,
        docId: docId,
        hour: hour[0],
      });
      const requestOptions = {
        method: "POST",
        body: raw,
      };

      fetch("https://createreminder-hpulvke3ka-uc.a.run.app", requestOptions); // Call createScheduleApp url
      const agent = new Agent();
      const responseChatGPT = await agent.runDefaultAgent(text);
      bot.sendMessage(chatId, responseChatGPT);
      // bot.sendMessage(
      //   chatId,
      //   `Message Scheduled!! ^^
      //   Now send me the message you want me to send you every day.
      //   Like this: message: Hello, have a good day!`
      // );
    } else {
      // Send message to OpenAI using chain
      const agent = new Agent();
      const responseChatGPT = await agent.runDefaultAgent(text, chatId);
      logger.info(`text: ${text}`, {structuredData: true});

      logger.info(`Response: ${responseChatGPT}`, {structuredData: true});

      bot.sendMessage(chatId, responseChatGPT);
    }
  }
  // } else if (greetingMessage) {
  //   await db
  //     .collection("chats")
  //     .doc(docId)
  //     .set({message: greetingMessage}, {merge: true});
  //   bot.sendMessage(chatId, "Message set!! ^^");

  response.sendStatus(200);
});

// export const createScheduleApp = onRequest(async (request, response) => {
//   logger.info("createScheduleApp called", {structuredData: true});

//   const reminderRes = await createReminderApp(reminderToken.value());
//   const reminderBody = JSON.parse(reminderRes);
//   const body = JSON.parse(request.body);
//   const docId = body.docId;
//   // const chatId = body.chatId;
//   // const bot = new TelegramBot(telegramToken.value());
//   // bot.sendMessage(chatId, `Hey ${docId}`);
//   // bot.sendMessage(chatId, `Hey ${chatId}`);

//   await db
//     .collection("chats")
//     .doc(docId)
//     .set({reminderApp: reminderBody}, {merge: true});

//   logger.info(`result saved in doc: ${docId}`, {structuredData: true});

//   response.send(200);
// });

// export const createReminder = onRequest(async (request, response) => {
//   logger.info("createReminder called", {structuredData: true});

//   const reminderAppDocuments = await db.collection("reminderapp").get();
//   const reminderAppId = reminderAppDocuments.docs[0].data().id;
//   const body = JSON.parse(request.body);
//   const {hour} = body;
//   const {docId} = body;

//   // const reminderRes = await addReminder(
//   //   reminderToken.value(),
//   //   reminderAppId,
//   //   hour
//   // );
//   //logger.info(`reminder agent res: ${reminderRes}`, {structuredData: true});

//   // const chatId = body.chatId;
//   // const bot = new TelegramBot(telegramToken.value());
//   // bot.sendMessage(chatId, `Hey ${docId}`);
//   // bot.sendMessage(chatId, `Hey ${chatId}`);

//   logger.info(`result saved in doc: ${docId}`, {structuredData: true});

//   response.send(200);
// });

// export const sendScheduledMessage = onRequest(async (request, response) => {
//   logger.info("sendScheduledMessage called", {structuredData: true});

//   const reminderData = request.body.reminders_notified[0];
//   // Create a Telegram bot
//   const bot = new TelegramBot(telegramToken.value());

//   const chatDocument = await db
//     .collection("chats")
//     .where("reminder.id", "==", reminderData.id)
//     .get();
//   const docData = chatDocument.docs[0].data();
//   const chatId = docData.chatId;
//   const message = docData.message;

//   bot.sendMessage(chatId, `${message}`);
//   response.send(200);
// });
