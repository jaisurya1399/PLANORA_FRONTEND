import api from "./axios";
export const getNotificationPreferences = async (userId) =>
  (await api.get(`/notification-preferences/user/${userId}`)).data;
export const saveNotificationPreference = async (userId, data) =>
  (await api.put(`/notification-preferences/user/${userId}`, data)).data;
