import api from "./axios";
export const getScrumMeetings = async () =>
  (await api.get("/daily-scrum-meetings")).data;
export const getScrumMeetingByProject = async (projectId) =>
  (await api.get(`/daily-scrum-meetings/project/${projectId}`)).data;
export const saveScrumMeeting = async (data) =>
  (await api.put("/daily-scrum-meetings", data)).data;
export const deleteScrumMeeting = async (id) => {
  await api.delete(`/daily-scrum-meetings/${id}`);
};
