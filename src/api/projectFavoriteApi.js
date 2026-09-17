import api from "./axios";

export const getProjectFavorites = async () => {
  const response = await api.get("/project-favorites");
  return response.data;
};

export const getProjectFavoriteById = async (id) => {
  const response = await api.get(`/project-favorites/${id}`);
  return response.data;
};

export const getProjectFavoritesByUser = async (userId) => {
  const response = await api.get(`/project-favorites/user/${userId}`);
  return response.data;
};

export const getProjectFavoritesByProject = async (projectId) => {
  const response = await api.get(`/project-favorites/project/${projectId}`);
  return response.data;
};

export const checkProjectFavorite = async (userId, projectId) => {
  const response = await api.get("/project-favorites/check", {
    params: { userId, projectId },
  });
  return response.data;
};

export const getProjectFavoriteByUserAndProject = async (userId, projectId) => {
  const response = await api.get("/project-favorites/user-project", {
    params: { userId, projectId },
  });
  return response.data;
};

export const countProjectFavoritesByUser = async (userId) => {
  const response = await api.get(`/project-favorites/user/${userId}/count`);
  return response.data;
};

export const countProjectFavoritesByProject = async (projectId) => {
  const response = await api.get(
    `/project-favorites/project/${projectId}/count`,
  );
  return response.data;
};

export const createProjectFavorite = async (data) => {
  const response = await api.post("/project-favorites", data);
  return response.data;
};

export const deleteProjectFavorite = async (id) => {
  await api.delete(`/project-favorites/${id}`);
};

export const deleteProjectFavoriteByUserAndProject = async (
  userId,
  projectId,
) => {
  await api.delete("/project-favorites/user-project", {
    params: { userId, projectId },
  });
};

export const deleteProjectFavoritesByUser = async (userId) => {
  await api.delete(`/project-favorites/user/${userId}`);
};

export const deleteProjectFavoritesByProject = async (projectId) => {
  await api.delete(`/project-favorites/project/${projectId}`);
};
