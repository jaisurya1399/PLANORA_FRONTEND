import api from "./axios";

export const getTicketSubscribers = async () => {
  const response = await api.get("/ticket-subscribers");
  return response.data;
};

export const getTicketSubscriberById = async (id) => {
  const response = await api.get(`/ticket-subscribers/${id}`);
  return response.data;
};

export const getTicketSubscribersByTicket = async (ticketId) => {
  const response = await api.get(`/ticket-subscribers/ticket/${ticketId}`);
  return response.data;
};

export const getTicketSubscribersByUser = async (userId) => {
  const response = await api.get(`/ticket-subscribers/user/${userId}`);
  return response.data;
};

export const getTicketSubscriber = async (ticketId, userId) => {
  const response = await api.get(
    `/ticket-subscribers/ticket/${ticketId}/user/${userId}`,
  );
  return response.data;
};

export const ticketSubscriberExists = async (ticketId, userId) => {
  const response = await api.get(
    `/ticket-subscribers/ticket/${ticketId}/user/${userId}/exists`,
  );
  return response.data;
};

export const countTicketSubscribers = async (ticketId) => {
  const response = await api.get(
    `/ticket-subscribers/ticket/${ticketId}/count`,
  );
  return response.data;
};

export const countSubscriptionsByUser = async (userId) => {
  const response = await api.get(`/ticket-subscribers/user/${userId}/count`);
  return response.data;
};

export const subscribeToTicket = async (data) => {
  const response = await api.post("/ticket-subscribers", data);
  return response.data;
};

export const deleteTicketSubscriber = async (id) => {
  await api.delete(`/ticket-subscribers/${id}`);
};

export const unsubscribeFromTicket = async (ticketId, userId) => {
  await api.delete(`/ticket-subscribers/ticket/${ticketId}/user/${userId}`);
};

export const deleteTicketSubscribersByTicket = async (ticketId) => {
  await api.delete(`/ticket-subscribers/ticket/${ticketId}`);
};

export const deleteTicketSubscribersByUser = async (userId) => {
  await api.delete(`/ticket-subscribers/user/${userId}`);
};
