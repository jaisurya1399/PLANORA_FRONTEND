import api from "./axios";

export const getTicketSavedViews = async (projectId) => {
  const response = await api.get(`/projects/${projectId}/ticket-views`);
  return response.data;
};

export const createTicketSavedView = async (projectId, data) => {
  const response = await api.post(`/projects/${projectId}/ticket-views`, data);
  return response.data;
};

export const updateTicketSavedView = async (projectId, id, data) => {
  const response = await api.put(
    `/projects/${projectId}/ticket-views/${id}`,
    data,
  );
  return response.data;
};

export const deleteTicketSavedView = async (projectId, id) => {
  await api.delete(`/projects/${projectId}/ticket-views/${id}`);
};
