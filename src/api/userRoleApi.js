import api from "./axios";

export const getUserRoles = async () => {
  const response = await api.get("/user-roles");
  return response.data;
};

export const getUserRolesByUser = async (userId) => {
  const response = await api.get(`/user-roles/user/${userId}`);
  return response.data;
};

export const getUserRolesByRole = async (roleId) => {
  const response = await api.get(`/user-roles/role/${roleId}`);
  return response.data;
};

export const getUserRole = async (userId, roleId) => {
  const response = await api.get(`/user-roles/${userId}/${roleId}`);
  return response.data;
};

export const assignUserRole = async (data) => {
  const response = await api.post("/user-roles", data);
  return response.data;
};

export const removeUserRole = async (userId, roleId) => {
  await api.delete(`/user-roles/${userId}/${roleId}`);
};

export const removeAllUserRoles = async (userId) => {
  await api.delete(`/user-roles/user/${userId}`);
};

export const countUserRolesByUser = async (userId) => {
  const response = await api.get(`/user-roles/user/${userId}/count`);
  return response.data;
};

export const countUserRolesByRole = async (roleId) => {
  const response = await api.get(`/user-roles/role/${roleId}/count`);
  return response.data;
};
