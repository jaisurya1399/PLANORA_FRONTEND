import api from "./axios";

export const getTicketStatuses = async () => {
  const response = await api.get("/ticket-statuses");
  return response.data;
};

export const getActiveTicketStatuses = async () => {
  const response = await api.get("/ticket-statuses/active");
  return response.data;
};

export const getDefaultTicketStatuses = async () => {
  const response = await api.get("/ticket-statuses/default");
  return response.data;
};

export const getGlobalTicketStatuses = async () => {
  const response = await api.get("/ticket-statuses/global");
  return response.data;
};

export const getActiveGlobalTicketStatuses = async () => {
  const response = await api.get("/ticket-statuses/global/active");
  return response.data;
};

export const getTicketStatusesByProject = async (projectId) => {
  const response = await api.get(`/ticket-statuses/project/${projectId}`);
  return response.data;
};

export const getActiveTicketStatusesByProject = async (projectId) => {
  const response = await api.get(
    `/ticket-statuses/project/${projectId}/active`,
  );
  return response.data;
};

export const getDefaultTicketStatusesByProject = async (projectId) => {
  const response = await api.get(
    `/ticket-statuses/project/${projectId}/default`,
  );
  return response.data;
};

export const getTicketStatusByName = async (name) => {
  const response = await api.get(
    `/ticket-statuses/name/${encodeURIComponent(name)}`,
  );
  return response.data;
};

export const getTicketStatusByProjectAndName = async (projectId, name) => {
  const response = await api.get(
    `/ticket-statuses/project/${projectId}/name/${encodeURIComponent(name)}`,
  );
  return response.data;
};

export const getTicketStatusesByColor = async (color) => {
  const response = await api.get(
    `/ticket-statuses/color/${encodeURIComponent(color)}`,
  );
  return response.data;
};

export const getTicketStatusById = async (id) => {
  const response = await api.get(`/ticket-statuses/${id}`);
  return response.data;
};

export const createTicketStatus = async (data) => {
  const response = await api.post("/ticket-statuses", data);
  return response.data;
};

export const updateTicketStatus = async (id, data) => {
  const response = await api.put(`/ticket-statuses/${id}`, data);
  return response.data;
};

export const restoreTicketStatus = async (id) => {
  const response = await api.put(`/ticket-statuses/${id}/restore`);
  return response.data;
};

export const deleteTicketStatus = async (id) => {
  const response = await api.delete(`/ticket-statuses/${id}`);
  return response.data;
};

export const permanentlyDeleteTicketStatus = async (id) => {
  const response = await api.delete(`/ticket-statuses/${id}/permanent`);
  return response.data;
};
