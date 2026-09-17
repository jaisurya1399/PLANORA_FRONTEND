import api from "./axios";

export const getTimeSheetCells = async () => {
  const response = await api.get("/time-sheet-cells");
  return response.data;
};

export const getTimeSheetCellById = async (id) => {
  const response = await api.get(`/time-sheet-cells/${id}`);
  return response.data;
};

export const getTimeSheetCellsByTimeSheet = async (timeSheetId) => {
  const response = await api.get(`/time-sheet-cells/time-sheet/${timeSheetId}`);
  return response.data;
};

export const getTimeSheetCellsByTimeSheetDesc = async (timeSheetId) => {
  const response = await api.get(
    `/time-sheet-cells/time-sheet/${timeSheetId}/desc`,
  );
  return response.data;
};

export const getTimeSheetCellByDate = async (timeSheetId, date) => {
  const response = await api.get(
    `/time-sheet-cells/time-sheet/${timeSheetId}/date`,
    { params: { date } },
  );
  return response.data;
};

export const getTimeSheetCellsByDate = async (date) => {
  const response = await api.get("/time-sheet-cells/date", {
    params: { date },
  });
  return response.data;
};

export const getTripTimeSheetCells = async () => {
  const response = await api.get("/time-sheet-cells/trips");
  return response.data;
};

export const countTimeSheetCells = async (timeSheetId) => {
  const response = await api.get(
    `/time-sheet-cells/time-sheet/${timeSheetId}/count`,
  );
  return response.data;
};

export const countTripTimeSheetCells = async (timeSheetId) => {
  const response = await api.get(
    `/time-sheet-cells/time-sheet/${timeSheetId}/trip-count`,
  );
  return response.data;
};

export const createTimeSheetCell = async (data) => {
  const response = await api.post("/time-sheet-cells", data);
  return response.data;
};

export const updateTimeSheetCell = async (id, data) => {
  const response = await api.put(`/time-sheet-cells/${id}`, data);
  return response.data;
};

export const deleteTimeSheetCell = async (id) => {
  await api.delete(`/time-sheet-cells/${id}`);
};

export const deleteTimeSheetCellsByTimeSheet = async (timeSheetId) => {
  await api.delete(`/time-sheet-cells/time-sheet/${timeSheetId}`);
};
