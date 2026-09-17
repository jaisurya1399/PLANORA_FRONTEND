import api from "./axios";

export const getSettings = async () => {
  const response = await api.get("/settings");
  return response.data;
};

export const getSettingById = async (id) => {
  const response = await api.get(`/settings/${id}`);
  return response.data;
};

export const getSettingsByGroup = async (group) => {
  const response = await api.get("/settings/group", {
    params: { group },
  });
  return response.data;
};

export const getSettingByGroupAndName = async (group, name) => {
  const response = await api.get("/settings/group/name", {
    params: { group, name },
  });
  return response.data;
};

export const getSettingByName = async (name) => {
  const response = await api.get("/settings/name", {
    params: { name },
  });
  return response.data;
};

export const getSettingsByLocked = async (locked) => {
  const response = await api.get("/settings/locked", {
    params: { locked },
  });
  return response.data;
};

export const getSettingsByGroupAndLocked = async (group, locked) => {
  const response = await api.get("/settings/group/locked", {
    params: { group, locked },
  });
  return response.data;
};

export const countSettingsByGroup = async (group) => {
  const response = await api.get("/settings/group/count", {
    params: { group },
  });
  return response.data;
};

export const countSettingsByLocked = async (locked) => {
  const response = await api.get("/settings/locked/count", {
    params: { locked },
  });
  return response.data;
};

export const createSetting = async (data) => {
  const response = await api.post("/settings", data);
  return response.data;
};

export const updateSetting = async (id, data) => {
  const response = await api.put(`/settings/${id}`, data);
  return response.data;
};

export const deleteSetting = async (id) => {
  await api.delete(`/settings/${id}`);
};

export const lockSetting = async (id) => {
  const response = await api.put(`/settings/${id}/lock`);
  return response.data;
};

export const unlockSetting = async (id) => {
  const response = await api.put(`/settings/${id}/unlock`);
  return response.data;
};
