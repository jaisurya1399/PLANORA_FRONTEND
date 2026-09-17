import api from "./axios";

// ============================================================
// GET ALL EPICS
// ============================================================

export const getEpics = async () => {
  const response = await api.get("/epics");
  return response.data;
};

// ============================================================
// GET ACTIVE EPICS
// ============================================================

export const getActiveEpics = async () => {
  const response = await api.get("/epics/active");
  return response.data;
};

// ============================================================
// GET EPIC BY ID
// ============================================================

export const getEpicById = async (id) => {
  const response = await api.get(`/epics/${id}`);
  return response.data;
};

// ============================================================
// GET EPICS BY PROJECT
// ============================================================

export const getEpicsByProject = async (projectId) => {
  const response = await api.get(`/epics/project/${projectId}`);
  return response.data;
};

// ============================================================
// GET ACTIVE EPICS BY PROJECT
// ============================================================

export const getActiveEpicsByProject = async (projectId) => {
  const response = await api.get(`/epics/project/${projectId}/active`);

  return response.data;
};

// ============================================================
// GET ROOT EPICS
// ============================================================

export const getRootEpicsByProject = async (projectId) => {
  const response = await api.get(`/epics/project/${projectId}/root`);

  return response.data;
};

// ============================================================
// GET CHILD EPICS
// ============================================================

export const getChildEpics = async (parentId) => {
  const response = await api.get(`/epics/${parentId}/children`);

  return response.data;
};

// ============================================================
// GET ACTIVE CHILD EPICS
// ============================================================

export const getActiveChildEpics = async (parentId) => {
  const response = await api.get(`/epics/${parentId}/children/active`);

  return response.data;
};

// ============================================================
// GET EPICS BY PROJECT + PARENT
// ============================================================

export const getEpicsByProjectAndParent = async (projectId, parentId) => {
  const response = await api.get(
    `/epics/project/${projectId}/parent/${parentId}`,
  );

  return response.data;
};

// ============================================================
// GET EPIC BY PROJECT + NAME
// ============================================================

export const getEpicByProjectAndName = async (projectId, name) => {
  const response = await api.get(
    `/epics/project/${projectId}/name/${encodeURIComponent(name)}`,
  );

  return response.data;
};

// ============================================================
// CREATE EPIC
// ============================================================

export const createEpic = async (data) => {
  const response = await api.post("/epics", data);
  return response.data;
};

// ============================================================
// UPDATE EPIC
// ============================================================

export const updateEpic = async (id, data) => {
  const response = await api.put(`/epics/${id}`, data);
  return response.data;
};

// ============================================================
// RESTORE EPIC
// ============================================================

export const restoreEpic = async (id) => {
  const response = await api.put(`/epics/${id}/restore`);
  return response.data;
};

// ============================================================
// SOFT DELETE EPIC
// ============================================================

export const deleteEpic = async (id) => {
  await api.delete(`/epics/${id}`);
};

// ============================================================
// PERMANENT DELETE EPIC
// ============================================================

export const permanentlyDeleteEpic = async (id) => {
  await api.delete(`/epics/${id}/permanent`);
};

// ============================================================
// COUNT BY PROJECT
// ============================================================

export const countEpicsByProject = async (projectId) => {
  const response = await api.get(`/epics/project/${projectId}/count`);

  return response.data;
};

// ============================================================
// COUNT CHILD EPICS
// ============================================================

export const countChildEpics = async (parentId) => {
  const response = await api.get(`/epics/${parentId}/children/count`);

  return response.data;
};

// ============================================================
// EPIC PROGRESS
// ============================================================

export const getEpicProgress = async (epicId) => {
  const response = await api.get(`/epics/${epicId}/progress`);
  return response.data;
};

// ============================================================
// EPIC BURNDOWN
// ============================================================

export const getEpicBurndown = async (epicId) => {
  const response = await api.get(`/epics/${epicId}/burndown`);
  return response.data;
};

// ============================================================
// EPIC REPORT
// ============================================================

export const getEpicReport = async (epicId) => {
  const response = await api.get(`/epics/${epicId}/report`);
  return response.data;
};
