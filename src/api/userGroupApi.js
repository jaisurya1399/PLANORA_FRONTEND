import api from "./axios";
export const getUserGroups = async () => (await api.get("/user-groups")).data;
export const getUserGroupById = async (id) =>
  (await api.get(`/user-groups/${id}`)).data;
export const createUserGroup = async (data) =>
  (await api.post("/user-groups", data)).data;
export const updateUserGroup = async (id, data) =>
  (await api.put(`/user-groups/${id}`, data)).data;
export const deleteUserGroup = async (id) => {
  await api.delete(`/user-groups/${id}`);
};
export const addUserToGroup = async (groupId, userId) =>
  (await api.post(`/user-groups/${groupId}/members/${userId}`)).data;
export const removeUserFromGroup = async (groupId, userId) =>
  (await api.delete(`/user-groups/${groupId}/members/${userId}`)).data;
