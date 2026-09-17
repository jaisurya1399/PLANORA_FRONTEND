export const getDirectChatUsers = async (projectId) =>
  (await api.get(`/chat/direct-users/${projectId}`)).data;
import api from "./axios";
export const getDirectMessages = async (userId) =>
  (await api.get(`/chat/direct/${userId}`)).data;
export const sendDirectMessage = async (userId, content) =>
  (await api.post(`/chat/direct/${userId}`, { content })).data;
export const getProjectMessages = async (projectId) =>
  (await api.get(`/chat/project/${projectId}`)).data;
export const sendProjectMessage = async (projectId, content) =>
  (await api.post(`/chat/project/${projectId}`, { content })).data;
export const getProjectMeetings = async (projectId) =>
  (await api.get(`/meetings/project/${projectId}`)).data;
export const createProjectMeeting = async (projectId, data) =>
  (await api.post(`/meetings/project/${projectId}`, data)).data;
export const updateMeetingStatus = async (id, value) =>
  (await api.put(`/meetings/${id}/status`, null, { params: { value } })).data;
export const getMeetingMessages = async (meetingId) =>
  (await api.get(`/chat/meeting/${meetingId}`)).data;
export const sendMeetingMessage = async (meetingId, content) =>
  (await api.post(`/chat/meeting/${meetingId}`, { content })).data;
export const getMeetingDocuments = async (meetingId) =>
  (await api.get(`/meetings/${meetingId}/documents`)).data;
export const attachMeetingDocument = async (meetingId, documentId) =>
  (await api.post(`/meetings/${meetingId}/documents/${documentId}`)).data;
export const removeMeetingDocument = async (meetingId, documentId) =>
  api.delete(`/meetings/${meetingId}/documents/${documentId}`);
