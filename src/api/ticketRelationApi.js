import api from "./axios";

export const getTicketRelations = async () => {
  const response = await api.get("/ticket-relations");
  return response.data;
};

export const getTicketRelationById = async (id) => {
  const response = await api.get(`/ticket-relations/${id}`);
  return response.data;
};

export const getTicketRelationsByTicket = async (ticketId) => {
  const response = await api.get(`/ticket-relations/ticket/${ticketId}`);
  return response.data;
};

export const getTicketRelationsByRelated = async (relationId) => {
  const response = await api.get(`/ticket-relations/relation/${relationId}`);
  return response.data;
};

export const getTicketRelationsByType = async (type) => {
  const response = await api.get(
    `/ticket-relations/type/${encodeURIComponent(type)}`,
  );
  return response.data;
};

export const getTicketRelationsByTicketAndType = async (ticketId, type) => {
  const response = await api.get(
    `/ticket-relations/ticket/${ticketId}/type/${encodeURIComponent(type)}`,
  );
  return response.data;
};

export const ticketRelationExists = async (ticketId, relationId, type) => {
  const response = await api.get("/ticket-relations/exists", {
    params: { ticketId, relationId, type },
  });
  return response.data;
};

export const countTicketRelationsByTicket = async (ticketId) => {
  const response = await api.get(`/ticket-relations/ticket/${ticketId}/count`);
  return response.data;
};

export const countTicketRelationsByRelated = async (relationId) => {
  const response = await api.get(
    `/ticket-relations/relation/${relationId}/count`,
  );
  return response.data;
};

export const createTicketRelation = async (data) => {
  const response = await api.post("/ticket-relations", data);
  return response.data;
};

export const updateTicketRelation = async (id, data) => {
  const response = await api.put(`/ticket-relations/${id}`, data);
  return response.data;
};

export const deleteTicketRelation = async (id) => {
  await api.delete(`/ticket-relations/${id}`);
};

export const deleteTicketRelationsByTicket = async (ticketId) => {
  await api.delete(`/ticket-relations/ticket/${ticketId}`);
};

export const deleteTicketRelationsByRelated = async (relationId) => {
  await api.delete(`/ticket-relations/relation/${relationId}`);
};
