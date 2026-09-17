import api from "./axios";

export const getPermissions = async () => {
  const response = await api.get("/permissions");
  return response.data;
};

export const getPermissionById = async (id) => {
  const response = await api.get(`/permissions/${id}`);
  return response.data;
};

export const getPermissionByName = async (name) => {
  const response = await api.get(
    `/permissions/name/${encodeURIComponent(name)}`,
  );
  return response.data;
};

export const checkPermissionExists = async (name) => {
  const response = await api.get(
    `/permissions/exists/name/${encodeURIComponent(name)}`,
  );
  return response.data;
};

export const createPermission = async (data) => {
  const response = await api.post("/permissions", data);
  return response.data;
};

export const updatePermission = async (id, data) => {
  const response = await api.put(`/permissions/${id}`, data);
  return response.data;
};

export const deletePermission = async (id) => {
  const response = await api.delete(`/permissions/${id}`);
  return response.data;
};
