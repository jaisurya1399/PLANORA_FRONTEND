import api from "./axios";

export const getActivities = async () => {
  const response = await api.get("/activities");
  return response.data;
};

export const getActiveActivities = async () => {
  const response = await api.get("/activities/active");
  return response.data;
};

export const getDefaultActivities = async () => {
  const response = await api.get("/activities/default");
  return response.data;
};

export const getActivityById = async (id) => {
  const response = await api.get(`/activities/${id}`);
  return response.data;
};

export const createActivity = async (data) => {
  const response = await api.post("/activities", data);
  return response.data;
};

export const updateActivity = async (id, data) => {
  const response = await api.put(`/activities/${id}`, data);
  return response.data;
};

export const restoreActivity = async (id) => {
  const response = await api.put(`/activities/${id}/restore`);
  return response.data;
};

export const deleteActivity = async (id) => {
  const response = await api.delete(`/activities/${id}`);
  return response.data;
};

export const permanentlyDeleteActivity = async (id) => {
  const response = await api.delete(`/activities/${id}/permanent`);
  return response.data;
};
