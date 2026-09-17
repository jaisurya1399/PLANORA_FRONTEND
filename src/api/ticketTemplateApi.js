import api from "./axios";
export const getTicketTemplates = async () =>
  (await api.get("/ticket-templates")).data;
export const getProjectTicketTemplates = async (id) =>
  (await api.get(`/ticket-templates/project/${id}`)).data;
export const createTicketTemplate = async (d) =>
  (await api.post("/ticket-templates", d)).data;
export const updateTicketTemplate = async (id, d) =>
  (await api.put(`/ticket-templates/${id}`, d)).data;
export const deleteTicketTemplate = async (id) =>
  api.delete(`/ticket-templates/${id}`);
export const applyTicketTemplate = async (id, d) =>
  (await api.post(`/ticket-templates/${id}/apply`, d)).data;
