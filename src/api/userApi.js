import api from "./axios";

export const getUsers = async () => {
  const response = await api.get("/users");
  return response.data;
};

export const getUserById = async (id) => {
  const response = await api.get(`/users/${id}`);
  return response.data;
};

export const getUserByEmail = async (email) => {
  const response = await api.get(`/users/email/${encodeURIComponent(email)}`);
  return response.data;
};

export const checkUserEmail = async (email) => {
  const response = await api.get(
    `/users/exists/email/${encodeURIComponent(email)}`,
  );
  return response.data;
};

export const createUser = async (data) => {
  const response = await api.post("/users", data);
  return response.data;
};

export const updateUser = async (id, data) => {
  const response = await api.put(`/users/${id}`, data);
  return response.data;
};

export const deleteUser = async (id) => {
  await api.delete(`/users/${id}`);
};
