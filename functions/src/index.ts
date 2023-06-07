import {onRequest} from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import TelegramBot from "node-telegram-bot-api";
import {defineString} from "firebase-functions/params";
// The Firebase Admin SDK to access Firestore.
import {initializeApp} from "firebase-admin/app";
import {getFirestore} from "firebase-admin/firestore";
import {addReminder, createReminderApp} from "./reminders-api";
import {ChatOpenAI} from "langchain/chat_models/openai";
import {
  SystemMessagePromptTemplate,
  HumanMessagePromptTemplate,
  ChatPromptTemplate,
} from "langchain/prompts";
import {LLMChain} from "langchain/chains";

initializeApp();
const telegramToken = defineString("TOKEN");
const reminderToken = defineString("REMINDERTOKEN");
const openAIApiKey = defineString("OPENAI_API_KEY");

const db = getFirestore();

export const sendMessage = onRequest(async (request, response) => {
  logger.info("sendMessage called", {structuredData: true});
  const chatId = request.body.message.chat.id;
  // Create a Telegram bot
  const bot = new TelegramBot(telegramToken.value());
  const chat = new ChatOpenAI({
    temperature: 0.9,
    openAIApiKey: openAIApiKey.value(),
  });

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

    // Send message to OpenAI using chain
    const userPrompt = ChatPromptTemplate.fromPromptMessages([
      SystemMessagePromptTemplate.fromTemplate(
        `You are MEI:
        Mindful Encouragement Interface: MEI is a companion bot 
        that's focused on promoting mindfulness and well-being, 
        it is also a very friendly bot. 
        Whether you're feeling stressed, anxious, or just 
        need some motivation, MEI can help you stay on track and achieve 
        your goals.`
      ),
      HumanMessagePromptTemplate.fromTemplate("{text}"),
    ]);
    const chain = new LLMChain({
      prompt: userPrompt,
      llm: chat,
    });
    const responseChatGPT = await chain.run(request.body.message.text);

    bot.sendMessage(chatId, responseChatGPT);
  } else {
    // Extract frequency and hour of reminder
    const messageText: string = request.body.message.text;
    const hour = messageText.match(/([0-1]?[0-9]|2[0-3]):[0-5][0-9]/g);
    const greetingMessage = messageText.match(/message:\s*(.*)/g);
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
      bot.sendMessage(
        chatId,
        `Message Scheduled!! ^^
        Now send me the message you want me to send you every day.
        Like this: message: Hello, have a good day!`
      );
    } else if (greetingMessage) {
      await db
        .collection("chats")
        .doc(docId)
        .set({message: greetingMessage}, {merge: true});
      bot.sendMessage(chatId, "Message set!! ^^");
    } else {
      // Send message to OpenAI using chain
      const userPrompt = ChatPromptTemplate.fromPromptMessages([
        SystemMessagePromptTemplate.fromTemplate(
          `You are MEI:
        Mindful Encouragement Interface: MEI is a companion bot 
        that's focused on promoting mindfulness and well-being, 
        it is also a very friendly bot. 
        Whether you're feeling stressed, anxious, or just 
        need some motivation, MEI can help you stay on track and achieve 
        your goals.`
        ),
        HumanMessagePromptTemplate.fromTemplate("{text}"),
      ]);
      const chain = new LLMChain({
        prompt: userPrompt,
        llm: chat,
      });
      const responseChatGPT = await chain.run(messageText);

      bot.sendMessage(chatId, responseChatGPT);
    }
  }

  response.sendStatus(200);
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
  const {docId} = body;

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
  const message = docData.message;

  bot.sendMessage(chatId, `${message}`);
  response.send(200);
});
