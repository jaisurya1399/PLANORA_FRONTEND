import api from "./axios";
export const getAutomationRules = async (projectId) =>
  (await api.get(`/automation/project/${projectId}`)).data;
export const createAutomationRule = async (data) =>
  (await api.post("/automation", data)).data;
export const toggleAutomationRule = async (id) =>
  (await api.post(`/automation/${id}/toggle`)).data;
export const runAutomationRule = async (id) =>
  (await api.post(`/automation/${id}/run`)).data;
export const getNotificationScheme = async (projectId) =>
  (await api.get(`/notification-schemes/project/${projectId}`)).data;
export const saveNotificationScheme = async (data) =>
  (await api.post("/notification-schemes", data)).data;
export const addNotificationRule = async (id, data) =>
  (await api.post(`/notification-schemes/${id}/rules`, data)).data;
export const getSlaPolicies = async (projectId) =>
  (await api.get(`/sla/project/${projectId}/policies`)).data;
export const saveSlaPolicy = async (data) =>
  (await api.post("/sla/policies", data)).data;
export const evaluateSla = async (projectId) =>
  (await api.get(`/sla/project/${projectId}/evaluate`)).data;
export const getWikiPages = async (projectId) =>
  (await api.get(`/wiki/project/${projectId}`)).data;
export const saveWikiPage = async (data, id) =>
  (
    await api.request({
      url: id ? `/wiki/${id}` : "/wiki",
      method: id ? "put" : "post",
      data,
    })
  ).data;
export const deleteWikiPage = async (id) => api.delete(`/wiki/${id}`);
export const getPortfolios = async () => (await api.get("/portfolios")).data;
export const createPortfolio = async (data) =>
  (await api.post("/portfolios", data)).data;
export const addPortfolioProject = async (id, data) =>
  (await api.post(`/portfolios/${id}/projects`, data)).data;
export const getRisks = async (projectId) =>
  (await api.get(`/risks/project/${projectId}`)).data;
export const saveRisk = async (data) => (await api.post("/risks", data)).data;
export const getHealth = async (projectId) =>
  (await api.get(`/risks/project/${projectId}/health`)).data;
export const getDependencies = async (projectId) =>
  (await api.get(`/dependencies/project/${projectId}`)).data;
export const saveDependency = async (data) =>
  (await api.post("/dependencies", data)).data;
export const deleteDependency = async (id) => api.delete(`/dependencies/${id}`);
export const getEnterpriseReport = async (projectId) =>
  (await api.get(`/enterprise-reports/project/${projectId}`)).data;
