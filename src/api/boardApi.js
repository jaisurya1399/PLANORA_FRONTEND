import api from "./axios";

export const getBoardConfig = async (projectId) =>
  (await api.get(`/boards/project/${projectId}/config`)).data;
export const updateBoardConfig = async (projectId, data) =>
  (await api.put(`/boards/project/${projectId}/config`, data)).data;
export const getBoardColumns = async (projectId) =>
  (await api.get(`/boards/project/${projectId}/columns`)).data;
export const updateBoardColumns = async (projectId, data) =>
  (await api.put(`/boards/project/${projectId}/columns`, data)).data;
export const getCumulativeFlow = async (projectId, days = 30) =>
  (
    await api.get(`/boards/project/${projectId}/cumulative-flow`, {
      params: { days },
    })
  ).data;

export const getBoardHistory = async (projectId, days = 30) =>
  (await api.get(`/boards/project/${projectId}/history`, { params: { days } }))
    .data;
