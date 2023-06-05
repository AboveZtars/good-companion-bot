import {onRequest} from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import TelegramBot from "node-telegram-bot-api";
import {defineString} from "firebase-functions/params";
// The Firebase Admin SDK to access Firestore.
import {initializeApp} from "firebase-admin/app";
import {getFirestore} from "firebase-admin/firestore";
import {addReminder, createReminderApp} from "./reminders-api";

initializeApp();
const telegramToken = defineString("TOKEN");
const reminderToken = defineString("REMINDERTOKEN");

const db = getFirestore();

export const sendMessage = onRequest(async (request, response) => {
  logger.info("sendMessage called", {structuredData: true});
  const chatId = request.body.message.chat.id;
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
      Right now I'm not very smart that's why I need you to tell me 
      the hour and days you want me to give you 
      the good morning and good nights 
      Like this: hour: 09:00, days: alldays`
    );
  } else {
    // Extract frequency and hour of reminder
    const messageText: string = request.body.message.text;
    const hour = messageText.match(/([0-1]?[0-9]|2[0-3]):[0-5][0-9]/g);

    if (hour) {
      logger.info(`Hour: ${hour[0]}`, {structuredData: true});
    }

    if (messageText) {
      // Order in this please
      const docId = chatDocument.docs[0].id;
      const raw = JSON.stringify({
        chatId: chatId,
        docId: docId,
        hour: hour![0],
      });
      const requestOptions = {
        method: "POST",
        body: raw,
      };
      fetch("https://createreminder-hpulvke3ka-uc.a.run.app", requestOptions); // Call createScheduleApp url
    }

    bot.sendMessage(chatId, "Good day message scheduled!! ^^");
  }

  response.send(200);
});

export const createScheduleApp = onRequest(async (request, response) => {
  logger.info("createScheduleApp called", {structuredData: true});

  const reminderRes = await createReminderApp(reminderToken.value());
  const reminderBody = JSON.parse(reminderRes);
  const body = JSON.parse(request.body);
  const docId = body.docId;
  // const chatId = body.chatId;
  // const bot = new TelegramBot(telegramToken.value());
  // bot.sendMessage(chatId, `Hey ${docId}`);
  // bot.sendMessage(chatId, `Hey ${chatId}`);

  await db
    .collection("chats")
    .doc(docId)
    .set({reminderApp: reminderBody}, {merge: true});

  logger.info(`result saved in doc: ${docId}`, {structuredData: true});

  response.send(200);
});

export const createReminder = onRequest(async (request, response) => {
  logger.info("createReminder called", {structuredData: true});

  const reminderAppDocuments = await db.collection("reminderapp").get();
  const reminderAppId = reminderAppDocuments.docs[0].data().id;
  const body = JSON.parse(request.body);
  const {hour} = body;
  const docId = body.docId;

  const reminderRes = await addReminder(
    reminderToken.value(),
    reminderAppId,
    hour
  );
  const reminderBody = JSON.parse(reminderRes);
  // const chatId = body.chatId;
  // const bot = new TelegramBot(telegramToken.value());
  // bot.sendMessage(chatId, `Hey ${docId}`);
  // bot.sendMessage(chatId, `Hey ${chatId}`);

  await db
    .collection("chats")
    .doc(docId)
    .set({reminder: reminderBody}, {merge: true});

  logger.info(`result saved in doc: ${docId}`, {structuredData: true});

  response.send(200);
});

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

  bot.sendMessage(chatId, "Hello this is a schedule message ^^");
  response.send(200);
});
