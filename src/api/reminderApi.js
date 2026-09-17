import api from "./axios";
export const getReminders = async () => (await api.get("/reminders")).data;
export const createReminder = async (data) =>
  (await api.post("/reminders", data)).data;
export const cancelReminder = async (id) =>
  (await api.post(`/reminders/${id}/cancel`)).data;
export const snoozeReminder = async (id, remindAt) =>
  (await api.post(`/reminders/${id}/snooze`, null, { params: { remindAt } }))
    .data;
