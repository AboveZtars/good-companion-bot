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

export const addReminder = async (token: string, appId: string) => {
  const raw = JSON.stringify({
    title: "Good day reminder",
    timezone: "America/Caracas",
    date_tz: "2023-05-24",
    time_tz: "15:30",
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
