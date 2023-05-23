import {onRequest} from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import TelegramBot from "node-telegram-bot-api";
import {defineString} from "firebase-functions/params";

const telegramToken = defineString("TOKEN");

export const sendMessage = onRequest((request, response) => {
  logger.info("Hello logs!", {structuredData: true});
  // Create a bot that uses 'polling' to fetch new updates
  const bot = new TelegramBot(telegramToken.value());
  const chatId = request.body.message.chat.id;

  bot.sendMessage(chatId, "Surprise it worked");
  response.send(200);
});
