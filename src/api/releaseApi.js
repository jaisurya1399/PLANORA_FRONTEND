import api from "./axios";

export const getReleases = async (projectId) =>
  (await api.get(`/projects/${projectId}/releases`)).data;
export const getRelease = async (projectId, releaseId) =>
  (await api.get(`/projects/${projectId}/releases/${releaseId}`)).data;
export const createRelease = async (projectId, data) =>
  (await api.post(`/projects/${projectId}/releases`, data)).data;
export const updateRelease = async (projectId, releaseId, data) =>
  (await api.put(`/projects/${projectId}/releases/${releaseId}`, data)).data;
export const deleteRelease = async (projectId, releaseId) =>
  api.delete(`/projects/${projectId}/releases/${releaseId}`);
export const updateReleaseStatus = async (projectId, releaseId, status) =>
  (
    await api.patch(
      `/projects/${projectId}/releases/${releaseId}/status`,
      null,
      { params: { status } },
    )
  ).data;
export const getReleaseProgress = async (projectId, releaseId) =>
  (await api.get(`/projects/${projectId}/releases/${releaseId}/progress`)).data;
export const getReleaseBurndown = async (projectId, releaseId) =>
  (await api.get(`/projects/${projectId}/releases/${releaseId}/burndown`)).data;
export const getReleaseTickets = async (projectId, releaseId) =>
  (await api.get(`/projects/${projectId}/releases/${releaseId}/tickets`)).data;
export const assignTicketToRelease = async (projectId, releaseId, ticketId) =>
  api.post(`/projects/${projectId}/releases/${releaseId}/tickets/${ticketId}`);
export const removeTicketFromRelease = async (projectId, releaseId, ticketId) =>
  api.delete(
    `/projects/${projectId}/releases/${releaseId}/tickets/${ticketId}`,
  );
