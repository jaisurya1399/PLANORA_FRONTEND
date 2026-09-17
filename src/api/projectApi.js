import api from "./axios";

export const getProjects = async () => {
  const response = await api.get("/projects");

  return response.data;
};

export const getActiveProjects = async () => {
  const response = await api.get("/projects/active");

  return response.data;
};

export const getProjectById = async (id) => {
  const response = await api.get(`/projects/${id}`);

  return response.data;
};

export const getProjectsByOwner = async (ownerId) => {
  const response = await api.get(`/projects/owner/${ownerId}`);

  return response.data;
};

export const getActiveProjectsByOwner = async (ownerId) => {
  const response = await api.get(`/projects/owner/${ownerId}/active`);

  return response.data;
};

export const getProjectsByStatus = async (statusId) => {
  const response = await api.get(`/projects/status/${statusId}`);

  return response.data;
};

export const getActiveProjectsByStatus = async (statusId) => {
  const response = await api.get(`/projects/status/${statusId}/active`);

  return response.data;
};

export const getProjectByName = async (name) => {
  const response = await api.get(`/projects/name/${encodeURIComponent(name)}`);

  return response.data;
};

export const createProject = async (data) => {
  const response = await api.post("/projects", data);

  return response.data;
};

export const updateProject = async (id, data) => {
  const response = await api.put(`/projects/${id}`, data);

  return response.data;
};

export const deleteProject = async (id) => {
  await api.delete(`/projects/${id}`);
};

export const restoreProject = async (id) => {
  await api.put(`/projects/${id}/restore`);
};

export const permanentlyDeleteProject = async (id) => {
  await api.delete(`/projects/${id}/permanent`);
};

export const getProjectSettings = async (id) => {
  const response = await api.get(`/projects/${id}/settings`);
  return response.data;
};

export const archiveProject = async (id) => {
  const response = await api.put(`/projects/${id}/archive`);
  return response.data;
};

export const unarchiveProject = async (id) => {
  const response = await api.put(`/projects/${id}/unarchive`);
  return response.data;
};

export const getArchivedProjects = async () => {
  const response = await api.get("/projects/archived");
  return response.data;
};

export const cloneProject = async (id, data) => {
  const response = await api.post(`/projects/${id}/clone`, data);
  return response.data;
};

export const getProjectAnalytics = async (projectId) => {
  const response = await api.get(`/projects/${projectId}/analytics`);

  return response.data;
};

export const getProjectAuditEvents = async (projectId) => {
  const response = await api.get(`/projects/${projectId}/audit-events`);

  return response.data;
};

export const getCurrentProjectAccess = async (id) => {
  const response = await api.get(`/projects/${id}/access`);
  return response.data;
};

const projectApi = {
  getProjects,
  getActiveProjects,
  getProjectById,
  getProjectsByOwner,
  getActiveProjectsByOwner,
  getProjectsByStatus,
  getActiveProjectsByStatus,
  getProjectByName,
  createProject,
  updateProject,
  deleteProject,
  restoreProject,
  permanentlyDeleteProject,
  getProjectSettings,
  archiveProject,
  unarchiveProject,
  getArchivedProjects,
  cloneProject,
  getProjectAnalytics,
  getProjectAuditEvents,
  getCurrentProjectAccess,
};

export default projectApi;
