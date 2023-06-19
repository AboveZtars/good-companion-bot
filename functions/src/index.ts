import {onRequest} from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import TelegramBot from "node-telegram-bot-api";
import {defineString} from "firebase-functions/params";
// The Firebase Admin SDK to access Firestore.
import {getFirestore} from "firebase-admin/firestore";
import firebaseApp from "./firestore/config";
// My classes
import {Agent} from "./langchainAbstract/agents";
import {getDocIdByChatId /* getReminderAppId */} from "./firestore/actions";

const telegramToken = defineString("TOKEN");
// const reminderToken = defineString("REMINDERTOKEN");

const db = getFirestore(firebaseApp);

export const sendMessages = onRequest(async (request, response) => {
  logger.info("sendMessage called", {structuredData: true});
  const chatId: string = request.body.message.chat.id;
  const text = request.body.message.text;
  // Create a Telegram bot
  const bot = new TelegramBot(telegramToken.value());

  const docId = await getDocIdByChatId(chatId);

  if (!docId) {
    // Welcome algorithm
    // TODO create function to add chatId to firestore
    const result = await db.collection("chats").add({chatId: chatId});
    logger.info(`Chat Id saved in doc: ${result.id}`, {structuredData: true});
  }
  const agent = new Agent();

  const responseChatGPT = await agent.runDefaultAgent(text, chatId);

  if (responseChatGPT === "Agent stopped due to max iterations.") {
    bot.sendMessage(chatId, "Se estableció tu recordatorio");
  } else {
    bot.sendMessage(chatId, responseChatGPT);
  }

  response.sendStatus(200);
});

export const sendScheduledMessage = onRequest(async (request, response) => {
  logger.info("sendScheduledMessage called", {structuredData: true});

  const reminderData = request.body.reminders_notified[0];
  const [, /* docId */ chatId] = reminderData.notes.split(",");
  // Create a Telegram bot
  const bot = new TelegramBot(telegramToken.value());

  const prompt = `Create a friendly message for the user to remember about the task: 
    ${reminderData.title},
   use the language of the task to create the message.`;

  const agent = new Agent();
  const responseChatGPT = await agent.runDefaultAgent(prompt, chatId);

  bot.sendMessage(chatId, responseChatGPT);
  response.send(200);
});
