import api from "./axios";

export const getProjectAvailability = async (projectId, startDate, endDate) => {
  const response = await api.get(`/projects/${projectId}/member-availability`, {
    params: { startDate, endDate },
  });

  return response.data;
};

export const getUserAvailability = async (
  projectId,
  userId,
  startDate,
  endDate,
) => {
  const response = await api.get(
    `/projects/${projectId}/member-availability/user/${userId}`,
    { params: { startDate, endDate } },
  );

  return response.data;
};

export const createMemberAvailability = async (projectId, data) => {
  const response = await api.post(
    `/projects/${projectId}/member-availability`,
    data,
  );

  return response.data;
};

export const updateMemberAvailability = async (projectId, id, data) => {
  const response = await api.put(
    `/projects/${projectId}/member-availability/${id}`,
    data,
  );

  return response.data;
};

export const deleteMemberAvailability = async (projectId, id) => {
  await api.delete(`/projects/${projectId}/member-availability/${id}`);
};

const memberAvailabilityApi = {
  getProjectAvailability,
  getUserAvailability,
  createMemberAvailability,
  updateMemberAvailability,
  deleteMemberAvailability,
};

export default memberAvailabilityApi;

export const getProjectWorkingHours = async (projectId) => {
  const response = await api.get(`/projects/${projectId}/working-hours`);
  return response.data;
};

export const saveProjectWorkingHours = async (projectId, data) => {
  const response = await api.put(`/projects/${projectId}/working-hours`, data);
  return response.data;
};
