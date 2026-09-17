import api from "./axios";

export const getTimeSheets = async () => {
  const response = await api.get("/time-sheets");
  return response.data;
};

export const getActiveTimeSheets = async () => {
  const response = await api.get("/time-sheets/active");
  return response.data;
};

export const getTimeSheetById = async (id) => {
  const response = await api.get(`/time-sheets/${id}`);
  return response.data;
};

export const getTimeSheetsByUser = async (userId) => {
  const response = await api.get(`/time-sheets/user/${userId}`);
  return response.data;
};

export const getTimeSheetsByProject = async (projectId) => {
  const response = await api.get(`/time-sheets/project/${projectId}`);
  return response.data;
};

export const getTimeSheetsByUserAndProject = async (userId, projectId) => {
  const response = await api.get(
    `/time-sheets/user/${userId}/project/${projectId}`,
  );
  return response.data;
};

export const searchTimeSheets = async (task) => {
  const response = await api.get("/time-sheets/search", {
    params: { task },
  });
  return response.data;
};

export const countTimeSheetsByUser = async (userId) => {
  const response = await api.get(`/time-sheets/user/${userId}/count`);
  return response.data;
};

export const countTimeSheetsByProject = async (projectId) => {
  const response = await api.get(`/time-sheets/project/${projectId}/count`);
  return response.data;
};

export const countTimeSheetsByUserAndProject = async (userId, projectId) => {
  const response = await api.get(
    `/time-sheets/user/${userId}/project/${projectId}/count`,
  );
  return response.data;
};

export const createTimeSheet = async (data) => {
  const response = await api.post("/time-sheets", data);
  return response.data;
};

export const updateTimeSheet = async (id, data) => {
  const response = await api.put(`/time-sheets/${id}`, data);
  return response.data;
};

export const deleteTimeSheet = async (id) => {
  await api.delete(`/time-sheets/${id}`);
};

export const restoreTimeSheet = async (id) => {
  await api.put(`/time-sheets/${id}/restore`);
};

export const permanentlyDeleteTimeSheet = async (id) => {
  await api.delete(`/time-sheets/${id}/permanent`);
};

export const deleteTimeSheetsByUser = async (userId) => {
  await api.delete(`/time-sheets/user/${userId}`);
};

export const deleteTimeSheetsByProject = async (projectId) => {
  await api.delete(`/time-sheets/project/${projectId}`);
};
