import api from "./axios";

/**
 * Get project users.
 */
export const getProjectUsers = async (projectId) => {
  const response = await api.get(`/project-users/project/${projectId}`);

  return response.data;
};

/**
 * Get all project-user assignments.
 */
export const getAllProjectUsers = async () => {
  const response = await api.get("/project-users");

  return response.data;
};

/**
 * Get project-user assignment by ID.
 */
export const getProjectUserById = async (id) => {
  const response = await api.get(`/project-users/${id}`);

  return response.data;
};

/**
 * Get all project assignments for a user.
 */
export const getProjectUsersByUser = async (userId) => {
  const response = await api.get(`/project-users/user/${userId}`);

  return response.data;
};

/**
 * Get project users by project and role.
 */
export const getProjectUsersByRole = async (projectId, role) => {
  const response = await api.get(
    `/project-users/project/${projectId}/role/${encodeURIComponent(role)}`,
  );

  return response.data;
};

/**
 * Check whether a user is assigned to a project.
 */
export const checkProjectUserAssignment = async (projectId, userId) => {
  const response = await api.get("/project-users/check", {
    params: {
      projectId,
      userId,
    },
  });

  return response.data;
};

/**
 * Create project-user assignment.
 */
export const createProjectUser = async (data) => {
  const response = await api.post("/project-users", data);
  return response.data;
};

/**
 * Update project-user assignment.
 */
export const updateProjectUser = async (id, data) => {
  const response = await api.put(`/project-users/${id}`, data);
  return response.data;
};

/**
 * Delete project-user assignment.
 */
export const deleteProjectUser = async (id) => {
  await api.delete(`/project-users/${id}`);
};

/**
 * Delete all users assigned to a project.
 */
export const deleteProjectUsersByProject = async (projectId) => {
  await api.delete(`/project-users/project/${projectId}`);
};

/**
 * Delete a user's project assignments.
 */
export const deleteProjectUsersByUser = async (userId) => {
  await api.delete(`/project-users/user/${userId}`);
};

/**
 * Count users assigned to a project.
 */
export const countUsersByProject = async (projectId) => {
  const response = await api.get(`/project-users/project/${projectId}/count`);

  return response.data;
};

/**
 * Count projects assigned to a user.
 */
export const countProjectsByUser = async (userId) => {
  const response = await api.get(`/project-users/user/${userId}/count`);

  return response.data;
};


/** Open or close self-service availability submission for a project member. */
export const setAvailabilitySelfUpdate = async (projectUserId, enabled) => {
  const response = await api.put(
    `/project-users/${projectUserId}/availability-self-update`,
    { enabled },
  );
  return response.data;
};
