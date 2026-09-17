import api from "./axios";

export const getTimeTrackingSummary = async (ticketId) =>
  (await api.get(`/time-tracking/ticket/${ticketId}/summary`)).data;

export const getActiveTimer = async () =>
  (await api.get("/time-tracking/timer")).data;

export const startTimer = async (ticketId, description = "") =>
  (
    await api.post(`/time-tracking/timer/start/${ticketId}`, null, {
      params: { description },
    })
  ).data;

export const stopTimer = async () =>
  (await api.post("/time-tracking/timer/stop")).data;

export const getTimeTrackingReport = async (params = {}) =>
  (await api.get("/time-tracking/reports", { params })).data;
