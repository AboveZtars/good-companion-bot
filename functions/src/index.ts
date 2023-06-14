import {onRequest} from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import TelegramBot from "node-telegram-bot-api";
import {defineString} from "firebase-functions/params";
// The Firebase Admin SDK to access Firestore.
import {getFirestore} from "firebase-admin/firestore";
import firebaseApp from "./firestore/config";
// My classes
import {Agent} from "./langchainAbstract/agents";
import {getDocIdByChatId, getReminderAppId} from "./firestore/actions";

const telegramToken = defineString("TOKEN");
// const reminderToken = defineString("REMINDERTOKEN");

const db = getFirestore(firebaseApp);

export const sendMessage = onRequest(async (request, response) => {
  logger.info("sendMessage called", {structuredData: true});
  const chatId = request.body.message.chat.id;
  const text = request.body.message.text;
  // Create a Telegram bot
  const bot = new TelegramBot(telegramToken.value());

  const docId = await getDocIdByChatId(chatId);
  const appId = await getReminderAppId();

  if (!docId) {
    // Welcome algorithm
    // TODO create function to add chatId to firestore
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
  }

  // TODO create agent to set the message: const greetingMessage = messageText.match(/message:\s*(.*)/g);
  // TODO } else if (greetingMessage) {
  // TODO  await db
  // TODO    .collection("chats")
  // TODO    .doc(docId)
  // TODO    .set({message: greetingMessage}, {merge: true});
  // TODO  bot.sendMessage(chatId, "Message set!! ^^");
  const hourMatch: string[] | undefined = text.match(
    /([0-1]?[0-9]|2[0-3]):[0-5][0-9]/g
  );
  const hour = hourMatch ? hourMatch[0] : undefined;
  const agent = new Agent();

  logger.info(
    `chatId: ${chatId}, appId: ${appId}, hour: ${hour}, docId: ${docId}`,
    {structuredData: true}
  );

  const responseChatGPT = await agent.runDefaultAgent(
    text,
    chatId,
    appId,
    hour,
    docId
  );

  bot.sendMessage(chatId, responseChatGPT);

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

export const sendScheduledMessage = onRequest(async (request, response) => {
  logger.info("sendScheduledMessage called", {structuredData: true});

  const reminderData = request.body.reminders_notified[0];
  // Create a Telegram bot
  const bot = new TelegramBot(telegramToken.value());

  const chatDocument = await db
    .collection("chats")
    .where("reminder.id", "==", reminderData.id)
    .get();
  const docData = chatDocument.docs[0].data();
  const chatId = docData.chatId;
  const message = docData.message;

  bot.sendMessage(chatId, `${message}`);
  response.send(200);
});
