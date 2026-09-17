import api from "./axios";

export const getRoles = async () => {
  const response = await api.get("/roles");
  return response.data;
};

export const getRoleById = async (id) => {
  const response = await api.get(`/roles/${id}`);
  return response.data;
};

export const getRoleByName = async (name) => {
  const response = await api.get(`/roles/name/${encodeURIComponent(name)}`);
  return response.data;
};

export const getRolesByGuard = async (guardName) => {
  const response = await api.get(
    `/roles/guard/${encodeURIComponent(guardName)}`,
  );
  return response.data;
};

export const createRole = async (data) => {
  const response = await api.post("/roles", data);
  return response.data;
};

export const updateRole = async (id, data) => {
  const response = await api.put(`/roles/${id}`, data);
  return response.data;
};

export const deleteRole = async (id) => {
  const response = await api.delete(`/roles/${id}`);
  return response.data;
};
