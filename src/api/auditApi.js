import api from "./axios";

export const getProjectAuditEvents = async (projectId) => {
  const response = await api.get(`/projects/${projectId}/audit-events`);

  return response.data;
};

export const getTicketAuditEvents = async (ticketId) => {
  const response = await api.get(`/tickets/${ticketId}/audit-events`);

  return response.data;
};
