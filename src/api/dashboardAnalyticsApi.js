import api from "./axios";

export const getProjectDashboardAnalytics = async (projectId, days = 30) => {
  const response = await api.get(`/projects/${projectId}/dashboard-analytics`, {
    params: { days },
  });
  return response.data;
};

export const getCustomDashboards = async () =>
  (await api.get("/custom-dashboards")).data;
export const createCustomDashboard = async (payload) =>
  (await api.post("/custom-dashboards", payload)).data;
export const updateCustomDashboard = async (id, payload) =>
  (await api.put(`/custom-dashboards/${id}`, payload)).data;
export const deleteCustomDashboard = async (id) =>
  api.delete(`/custom-dashboards/${id}`);

export const getMemberAnalytics = async (projectId, userId, days = 30) => {
  const response = await api.get(
    `/projects/${projectId}/member-analytics/${userId}`,
    { params: { days } },
  );
  return response.data;
};
