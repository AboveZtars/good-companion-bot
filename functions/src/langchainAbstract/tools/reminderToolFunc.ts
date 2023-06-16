import * as logger from "firebase-functions/logger";
import {defineString} from "firebase-functions/params";
import {getFirestore} from "firebase-admin/firestore";
import firebaseApp from "../../firestore/config";

const db = getFirestore(firebaseApp);
const reminderToken = defineString("REMINDERTOKEN");
const url = "https://reminders-api.com/api/";

export const createReminderApp = async () => {
  const raw = JSON.stringify({
    name: "Schedule app",
    default_reminder_time_tz: "12:00",
    webhook_url: "https://sendscheduledmessage-hpulvke3ka-uc.a.run.app",
  });

  const requestOptions = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${reminderToken.value()}`,
    },
    body: raw,
  };

  const resp = await fetch(`${url}applications/`, requestOptions);
  return resp.text();
};

export const addReminder = async (
  appId: string,
  docId: string,
  input: string
) => {
  const [hour, reminder] = input.split(",");
  logger.info(`reminder ${reminder}`, {structuredData: true});
  logger.info(`hour ${hour}`, {structuredData: true});
  logger.info(`input ${input}`, {structuredData: true});

  // Format Date
  const todayDate = new Date();
  let day: string | number = todayDate.getDate() + 1;
  let month: string | number = todayDate.getMonth() + 1;
  if (day < 10) {
    day = `0${day}`;
  }
  if (month < 10) {
    month = `0${month}`;
  }
  const year = todayDate.getFullYear();
  // Frequency
  const freq = "FREQ=DAILY;INTERVAL=1";

  const todayDateFormatted = `${year}-${month}-${day}`;
  logger.info(`Date ${todayDateFormatted}`, {structuredData: true});

  const raw = JSON.stringify({
    title: reminder,
    timezone: "America/Caracas",
    date_tz: todayDateFormatted,
    time_tz: hour,
    rrule: freq,
  });

  const requestOptions = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${reminderToken.value()}`,
    },
    body: raw,
  };

  const resp = await fetch(
    `${url}applications/${appId}/reminders/`,
    requestOptions
  );
  const text = await resp.text();
  const reminderBody = JSON.parse(text);
  await db
    .collection("chats")
    .doc(docId)
    .set({reminder: reminderBody}, {merge: true});

  return text;
};
