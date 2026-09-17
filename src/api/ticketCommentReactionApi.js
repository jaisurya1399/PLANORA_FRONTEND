import api from "./axios";

export const getCommentReactions = async (commentId) =>
  (await api.get(`/ticket-comment-reactions/comment/${commentId}`)).data;
export const toggleCommentReaction = async (commentId, reaction) => {
  const response = await api.post(
    `/ticket-comment-reactions/comment/${commentId}/toggle`,
    { reaction },
  );
  return response.status === 204 ? null : response.data;
};
