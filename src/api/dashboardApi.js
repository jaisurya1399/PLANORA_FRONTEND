import api from "./axios";

export const getDeveloperDashboard = async () => {
  const response = await api.get("/dashboard/developer");
  return response.data;
};

export const getProjectAnalytics = async (projectId) => {
  const response = await api.get(`/projects/${projectId}/analytics`);
  return response.data;
};
