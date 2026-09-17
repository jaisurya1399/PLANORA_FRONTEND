import api from "./axios";

export const getProjectMilestones = async (projectId) => {
  const response = await api.get(`/projects/${projectId}/milestones`);
  return response.data;
};

export const getMilestone = async (projectId, milestoneId) => {
  const response = await api.get(
    `/projects/${projectId}/milestones/${milestoneId}`,
  );
  return response.data;
};

export const createMilestone = async (projectId, data) => {
  const response = await api.post(`/projects/${projectId}/milestones`, data);
  return response.data;
};

export const updateMilestone = async (projectId, milestoneId, data) => {
  const response = await api.put(
    `/projects/${projectId}/milestones/${milestoneId}`,
    data,
  );
  return response.data;
};

export const deleteMilestone = async (projectId, milestoneId) => {
  await api.delete(`/projects/${projectId}/milestones/${milestoneId}`);
};

export const updateMilestoneStatus = async (projectId, milestoneId, status) => {
  const response = await api.patch(
    `/projects/${projectId}/milestones/${milestoneId}/status`,
    null,
    {
      params: { status },
    },
  );

  return response.data;
};

export const updateMilestoneProgress = async (
  projectId,
  milestoneId,
  progress,
) => {
  const response = await api.patch(
    `/projects/${projectId}/milestones/${milestoneId}/progress`,
    null,
    {
      params: { progress },
    },
  );

  return response.data;
};

export const assignTicketToMilestone = async (
  projectId,
  milestoneId,
  ticketId,
) => {
  const response = await api.post(
    `/projects/${projectId}/milestones/${milestoneId}/tickets/${ticketId}`,
  );

  return response.data;
};

export const removeTicketFromMilestone = async (
  projectId,
  milestoneId,
  ticketId,
) => {
  await api.delete(
    `/projects/${projectId}/milestones/${milestoneId}/tickets/${ticketId}`,
  );
};

export const getMilestoneTickets = async (projectId, milestoneId) => {
  const response = await api.get(
    `/projects/${projectId}/milestones/${milestoneId}/tickets`,
  );

  return response.data;
};

export const getMilestoneStatistics = async (projectId, milestoneId) => {
  const response = await api.get(
    `/projects/${projectId}/milestones/${milestoneId}/statistics`,
  );

  return response.data;
};
