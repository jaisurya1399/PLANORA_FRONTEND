import api from "./axios";

export const getTicketTypes = async () => {
  const response = await api.get("/ticket-types");
  return response.data;
};

export const getActiveTicketTypes = async () => {
  const response = await api.get("/ticket-types/active");
  return response.data;
};

export const getDefaultTicketTypes = async () => {
  const response = await api.get("/ticket-types/default");
  return response.data;
};

export const getTicketTypeById = async (id) => {
  const response = await api.get(`/ticket-types/${id}`);
  return response.data;
};

export const getTicketTypeByName = async (name) => {
  const response = await api.get(
    `/ticket-types/name/${encodeURIComponent(name)}`,
  );
  return response.data;
};

export const getTicketTypesByIcon = async (icon) => {
  const response = await api.get(
    `/ticket-types/icon/${encodeURIComponent(icon)}`,
  );
  return response.data;
};

export const getTicketTypesByColor = async (color) => {
  const response = await api.get(
    `/ticket-types/color/${encodeURIComponent(color)}`,
  );
  return response.data;
};

export const createTicketType = async (data) => {
  const response = await api.post("/ticket-types", data);
  return response.data;
};

export const updateTicketType = async (id, data) => {
  const response = await api.put(`/ticket-types/${id}`, data);
  return response.data;
};

export const restoreTicketType = async (id) => {
  const response = await api.put(`/ticket-types/${id}/restore`);
  return response.data;
};

export const deleteTicketType = async (id) => {
  const response = await api.delete(`/ticket-types/${id}`);
  return response.data;
};

export const permanentlyDeleteTicketType = async (id) => {
  const response = await api.delete(`/ticket-types/${id}/permanent`);
  return response.data;
};
