import api from "./axios";

const BASE_URL = "/project-statuses";

export const getProjectStatuses = async () => {
  const response = await api.get(BASE_URL);

  return response.data;
};

export const getActiveProjectStatuses = async () => {
  const response = await api.get(`${BASE_URL}/active`);

  return response.data;
};

export const getDefaultProjectStatuses = async () => {
  const response = await api.get(`${BASE_URL}/default`);

  return response.data;
};

export const getProjectStatusById = async (id) => {
  const response = await api.get(`${BASE_URL}/${id}`);

  return response.data;
};

export const getProjectStatusByName = async (name) => {
  const response = await api.get(
    `${BASE_URL}/name/${encodeURIComponent(name)}`,
  );

  return response.data;
};

export const createProjectStatus = async (status) => {
  const response = await api.post(BASE_URL, status);

  return response.data;
};

export const updateProjectStatus = async (id, status) => {
  const response = await api.put(`${BASE_URL}/${id}`, status);

  return response.data;
};

export const restoreProjectStatus = async (id) => {
  const response = await api.put(`${BASE_URL}/${id}/restore`);

  return response.data;
};

export const deleteProjectStatus = async (id) => {
  const response = await api.delete(`${BASE_URL}/${id}`);

  return response.data;
};

export const permanentlyDeleteProjectStatus = async (id) => {
  const response = await api.delete(`${BASE_URL}/${id}/permanent`);

  return response.data;
};
