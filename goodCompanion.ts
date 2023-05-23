// import TelegramBot from "node-telegram-bot-api";

// // Create a bot that uses 'polling' to fetch new updates
// const bot = new TelegramBot(token, { polling: true });

// // Matches "/echo [whatever]"
// // bot.onText(/\/echo (.+)/, (msg, match) => {
// //   // 'msg' is the received Message from Telegram
// //   // 'match' is the result of executing the regexp above on the text content
// //   // of the message

// //   const chatId = msg.chat.id;
// //   if (match) {
// //     const resp = match[1]; // the captured "whatever"}
// //     bot.sendMessage(chatId, resp); // send back the matched "whatever" to the chat
// //   }
// // });

// // Listen for any kind of message. There are different kinds of
// // messages.
// bot.on("message", (msg) => {
//   const chatId = msg.chat.id;

//   // send a message to the chat acknowledging receipt of their message
//   bot.sendMessage(chatId, "Received your message");
// });
