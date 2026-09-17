import api from "./axios";
export const getWorkflows = async () => (await api.get("/workflows")).data;
export const getProjectWorkflows = async (id) =>
  (await api.get(`/workflows/project/${id}`)).data;
export const createWorkflow = async (d) =>
  (await api.post("/workflows", d)).data;
export const updateWorkflow = async (id, d) =>
  (await api.put(`/workflows/${id}`, d)).data;
export const deleteWorkflow = async (id) => api.delete(`/workflows/${id}`);
