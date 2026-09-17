import api from "./axios";

export const getMentionSuggestions = async (ticketId, q = "") =>
  (
    await api.get(`/ticket-comments/ticket/${ticketId}/mentions`, {
      params: { q },
    })
  ).data;
export const getCommentAttachments = async (commentId) =>
  (await api.get(`/ticket-attachments/comment/${commentId}`)).data;
export const uploadCommentAttachment = async (commentId, file) => {
  const form = new FormData();
  form.append("file", file);
  return (await api.post(`/ticket-attachments/comment/${commentId}`, form))
    .data;
};
