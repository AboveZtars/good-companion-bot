import {getFirestore} from "firebase-admin/firestore";

import firebaseApp from "../config";

const db = getFirestore(firebaseApp);

export const getDocIdByChatId = async (chatId: string) => {
  const chatDocument = await db
    .collection("chats")
    .where("chatId", "==", chatId)
    .get();
  if (chatDocument.empty) {
    return undefined;
  } else {
    return chatDocument.docs[0].id;
  }
};

export const getReminderAppId = async () => {
  const reminderAppDocuments = await db.collection("reminderapp").get();
  const reminderAppId: string | undefined =
    reminderAppDocuments.docs[0].data().id;
  return reminderAppId;
};
