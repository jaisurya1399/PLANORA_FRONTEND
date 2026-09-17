import api from "./axios";
export const analyzeProjectWithAiPm = async (projectId) =>
  (await api.get(`/ai-pm/project/${projectId}/analysis`)).data;
