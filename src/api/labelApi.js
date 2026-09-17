import api from "./axios";

export const getProjectLabels = async (projectId) => {
  const response = await api.get(`/projects/${projectId}/labels`);

  return response.data;
};

export const getLabel = async (projectId, labelId) => {
  const response = await api.get(`/projects/${projectId}/labels/${labelId}`);

  return response.data;
};

export const createLabel = async (projectId, data) => {
  const response = await api.post(`/projects/${projectId}/labels`, data);

  return response.data;
};

export const updateLabel = async (projectId, labelId, data) => {
  const response = await api.put(
    `/projects/${projectId}/labels/${labelId}`,
    data,
  );

  return response.data;
};

export const deleteLabel = async (projectId, labelId) => {
  await api.delete(`/projects/${projectId}/labels/${labelId}`);
};

export const addLabelToTicket = async (projectId, ticketId, labelId) => {
  const response = await api.post(
    `/projects/${projectId}/tickets/${ticketId}/labels/${labelId}`,
  );

  return response.data;
};

export const removeLabelFromTicket = async (projectId, ticketId, labelId) => {
  await api.delete(
    `/projects/${projectId}/tickets/${ticketId}/labels/${labelId}`,
  );
};

export const getTicketLabels = async (projectId, ticketId) => {
  const response = await api.get(
    `/projects/${projectId}/tickets/${ticketId}/labels`,
  );

  return response.data;
};

export const getTicketsByLabel = async (projectId, labelId) => {
  const response = await api.get(
    `/projects/${projectId}/labels/${labelId}/tickets`,
  );

  return response.data;
};
