import api from "./axios";

export const getSprints = async () => {
  const response = await api.get("/sprints");
  return response.data;
};

export const getSprintById = async (id) => {
  const response = await api.get(`/sprints/${id}`);
  return response.data;
};

export const getSprintsByProject = async (projectId) => {
  const response = await api.get(`/sprints/project/${projectId}`);
  return response.data;
};

export const createSprint = async (data) => {
  const response = await api.post("/sprints", data);
  return response.data;
};

export const updateSprint = async (id, data) => {
  const response = await api.put(`/sprints/${id}`, data);
  return response.data;
};

export const deleteSprint = async (id) => {
  await api.delete(`/sprints/${id}`);
};

export const startSprint = async (id) => {
  const response = await api.post(`/sprints/${id}/start`);
  return response.data;
};

export const completeSprint = async (id) => {
  const response = await api.post(`/sprints/${id}/complete`);
  return response.data;
};

export const completeSprintWithCarryOver = async (id, data) => {
  const response = await api.post(
    `/sprints/${id}/complete-with-carry-over`,
    data,
  );
  return response.data;
};

export const cancelSprint = async (id) => {
  const response = await api.post(`/sprints/${id}/cancel`);
  return response.data;
};

export const getSprintTickets = async (id) => {
  const response = await api.get(`/sprints/${id}/tickets`);
  return response.data;
};

export const getProjectBacklog = async (projectId) => {
  const response = await api.get(`/sprints/project/${projectId}/backlog`);
  return response.data;
};

export const addTicketToSprint = async (sprintId, ticketId) => {
  const response = await api.post(`/sprints/${sprintId}/tickets/${ticketId}`);
  return response.data;
};

export const removeTicketFromSprint = async (sprintId, ticketId) => {
  const response = await api.delete(`/sprints/${sprintId}/tickets/${ticketId}`);
  return response.data;
};

export const moveTicketToBacklog = async (ticketId) => {
  const response = await api.post(`/sprints/tickets/${ticketId}/backlog`);
  return response.data;
};

export const getSprintStatistics = async (id) => {
  const response = await api.get(`/sprints/${id}/statistics`);
  return response.data;
};

export const getSprintBurndown = async (id) => {
  const response = await api.get(`/sprints/${id}/burndown`);
  return response.data;
};

export const getSprintHistory = async (projectId) => {
  const response = await api.get(`/sprints/project/${projectId}/history`);
  return response.data;
};

export const getSprintVelocity = async (projectId) => {
  const response = await api.get(`/sprints/project/${projectId}/velocity`);
  return response.data;
};

export const getSprintReport = async (id) => {
  const response = await api.get(`/sprints/${id}/report`);
  return response.data;
};

export const getSprintCommitment = async (id) => {
  const response = await api.get(`/sprints/${id}/commitment`);
  return response.data;
};

export const getSprintCapacity = async (id) => {
  const response = await api.get(`/sprints/${id}/capacity`);
  return response.data;
};

export const saveSprintCapacity = async (id, data) => {
  const response = await api.put(`/sprints/${id}/capacity`, data);
  return response.data;
};
