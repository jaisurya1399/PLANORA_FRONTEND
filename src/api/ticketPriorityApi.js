import api from "./axios";

export const getTicketPriorities = async () => {
  const response = await api.get("/ticket-priorities");
  return response.data;
};

export const getActiveTicketPriorities = async () => {
  const response = await api.get("/ticket-priorities/active");
  return response.data;
};

export const getDefaultTicketPriorities = async () => {
  const response = await api.get("/ticket-priorities/default");
  return response.data;
};

export const getTicketPriorityByName = async (name) => {
  const response = await api.get(
    `/ticket-priorities/name/${encodeURIComponent(name)}`,
  );
  return response.data;
};

export const getTicketPrioritiesByColor = async (color) => {
  const response = await api.get(
    `/ticket-priorities/color/${encodeURIComponent(color)}`,
  );
  return response.data;
};

export const getTicketPriorityById = async (id) => {
  const response = await api.get(`/ticket-priorities/${id}`);
  return response.data;
};

export const createTicketPriority = async (data) => {
  const response = await api.post("/ticket-priorities", data);
  return response.data;
};

export const updateTicketPriority = async (id, data) => {
  const response = await api.put(`/ticket-priorities/${id}`, data);
  return response.data;
};

export const restoreTicketPriority = async (id) => {
  const response = await api.put(`/ticket-priorities/${id}/restore`);
  return response.data;
};

export const deleteTicketPriority = async (id) => {
  const response = await api.delete(`/ticket-priorities/${id}`);
  return response.data;
};

export const permanentlyDeleteTicketPriority = async (id) => {
  const response = await api.delete(`/ticket-priorities/${id}/permanent`);
  return response.data;
};

export const reorderTicketPriorities = async (ids) => {
  const response = await api.put("/ticket-priorities/reorder", ids);
  return response.data;
};
