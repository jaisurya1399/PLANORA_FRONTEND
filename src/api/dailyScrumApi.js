import api, { getStoredUserId } from "./axios";

export const getAllDailyScrums = async () => {
  const response = await api.get("/daily-scrums");
  return response.data;
};

export const getDailyScrumById = async (id) => {
  const response = await api.get(`/daily-scrums/${id}`);
  return response.data;
};

export const getMyDailyScrums = async () => {
  const userId = getStoredUserId();
  if (!userId) {
    throw new Error("Logged-in user id is required");
  }
  return getDailyScrumsByUser(userId);
};

export const getDailyScrumsByUser = async (userId) => {
  const response = await api.get(`/daily-scrums/user/${userId}`);
  return response.data;
};

export const getDailyScrumsByUserAndRange = async (
  userId,
  startDate,
  endDate,
) => {
  const response = await api.get(`/daily-scrums/user/${userId}/range`, {
    params: { startDate, endDate },
  });
  return response.data;
};

export const getDailyScrumsByDateRange = async (startDate, endDate) => {
  const response = await api.get("/daily-scrums/range", {
    params: { startDate, endDate },
  });
  return response.data;
};

export const getDailyScrumsByProjectAndRange = async (
  projectId,
  startDate,
  endDate,
) => {
  const response = await api.get(`/daily-scrums/project/${projectId}/range`, {
    params: { startDate, endDate },
  });
  return response.data;
};

export const createDailyScrum = async (data) => {
  const response = await api.post("/daily-scrums", data);
  return response.data;
};

export const updateDailyScrum = async (id, data) => {
  const response = await api.put(`/daily-scrums/${id}`, data);
  return response.data;
};

export const deleteDailyScrum = async (id) => {
  await api.delete(`/daily-scrums/${id}`);
};
