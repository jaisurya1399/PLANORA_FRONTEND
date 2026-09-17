import api from "./axios";
export const getProjectTeams = async (id) =>
  (await api.get(`/project-teams/project/${id}`)).data;
export const createProjectTeam = async (d) =>
  (await api.post("/project-teams", d)).data;
export const updateProjectTeam = async (id, d) =>
  (await api.put(`/project-teams/${id}`, d)).data;
export const deleteProjectTeam = async (id) =>
  api.delete(`/project-teams/${id}`);
export const addTeamMember = async (id, userId) =>
  (await api.post(`/project-teams/${id}/members`, { userId })).data;
export const removeTeamMember = async (id, userId) =>
  (await api.delete(`/project-teams/${id}/members/${userId}`)).data;
