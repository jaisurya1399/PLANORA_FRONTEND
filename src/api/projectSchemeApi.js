import api from "./axios";
export const getPriorityScheme = async (id) =>
  (await api.get(`/project-priority-schemes/project/${id}`)).data;
export const savePriorityScheme = async (d) =>
  (await api.put("/project-priority-schemes", d)).data;
export const getPermissionScheme = async (id) =>
  (await api.get(`/project-permission-schemes/project/${id}`)).data;
export const savePermissionScheme = async (d) =>
  (await api.put("/project-permission-schemes", d)).data;
export const getIssueSecurityScheme = async (id) =>
  (await api.get(`/issue-security-schemes/project/${id}`)).data;
export const saveIssueSecurityScheme = async (d) =>
  (await api.put("/issue-security-schemes", d)).data;
