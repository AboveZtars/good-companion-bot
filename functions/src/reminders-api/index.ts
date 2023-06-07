import * as logger from "firebase-functions/logger";

const url = "https://reminders-api.com/api/";

export const createReminderApp = async (token: string) => {
  const raw = JSON.stringify({
    name: "Schedule app",
    default_reminder_time_tz: "12:00",
    webhook_url: "https://sendscheduledmessage-hpulvke3ka-uc.a.run.app",
  });

  const requestOptions = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    },
    body: raw,
  };

  const resp = await fetch(`${url}applications/`, requestOptions);
  return resp.text();
};

export const addReminder = async (
  token: string,
  appId: string,
  hour: string
) => {
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
    title: "Good day reminder",
    timezone: "America/Caracas",
    date_tz: todayDateFormatted,
    time_tz: hour,
    rrule: freq,
  });

  const requestOptions = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    },
    body: raw,
  };

  const resp = await fetch(
    `${url}applications/${appId}/reminders/`,
    requestOptions
  );
  return resp.text();
};
