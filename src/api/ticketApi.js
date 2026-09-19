import api, { getStoredUserId } from "./axios";

const toTicketRequest = (ticket = {}, overrides = {}) => ({
  name: overrides.name ?? ticket.name,
  content: overrides.content ?? ticket.content,
  ownerId: overrides.ownerId ?? ticket.ownerId,
  responsibleId:
    overrides.responsibleId !== undefined
      ? overrides.responsibleId
      : ticket.responsibleId,
  dueDate: overrides.dueDate !== undefined ? overrides.dueDate : ticket.dueDate,
  statusId: overrides.statusId ?? ticket.statusId,
  projectId: overrides.projectId ?? ticket.projectId,
  typeId: overrides.typeId ?? ticket.typeId,
  order: overrides.order ?? ticket.order ?? 0,
  priorityId: overrides.priorityId ?? ticket.priorityId,
  estimation: overrides.estimation ?? ticket.estimation ?? 0,
  epicId: overrides.epicId !== undefined ? overrides.epicId : ticket.epicId,
  parentId:
    overrides.parentId !== undefined ? overrides.parentId : ticket.parentId,
  sprintId:
    overrides.sprintId !== undefined ? overrides.sprintId : ticket.sprintId,
  milestoneId:
    overrides.milestoneId !== undefined
      ? overrides.milestoneId
      : ticket.milestoneId,
  labelIds:
    overrides.labelIds !== undefined ? overrides.labelIds : ticket.labelIds,
});

const hoursToValue = (data = {}) => {
  if (data.value != null) {
    return Number(data.value);
  }

  const hours = Number(data.hours || 0);
  const minutes = Number(data.minutes || 0);

  return Number((hours + minutes / 60).toFixed(2));
};

const updateTicketFields = async (id, overrides) => {
  const ticket = await getTicketById(id);

  const response = await api.put(
    `/tickets/${id}`,
    toTicketRequest(ticket, overrides),
  );

  return response.data;
};

// -----------------------------------------------------------------------------
// TICKETS
// -----------------------------------------------------------------------------

export const getTickets = async () => {
  const response = await api.get("/tickets");

  return response.data;
};

export const getActiveTickets = async () => {
  const response = await api.get("/tickets/active");

  return response.data;
};

export const getResolvedTickets = async () => {
  const response = await api.get("/tickets/resolved");

  return response.data;
};

export const getDeletedTickets = async () => {
  const response = await api.get("/tickets/deleted");

  return response.data;
};

export const getMyTickets = async () => {
  const response = await api.get("/tickets/my-tickets");

  return response.data;
};

export const getMyTicketsAll = async () => {
  const response = await api.get("/tickets/my-tickets/all");
  return response.data;
};

export const getMyResolvedTickets = async () => {
  const response = await api.get("/tickets/my-tickets/resolved");
  return response.data;
};

export const getTicketByCode = async (code) => {
  const response = await api.get(`/tickets/code/${encodeURIComponent(code)}`);

  return response.data;
};

// -----------------------------------------------------------------------------
// PROJECT TICKETS
// -----------------------------------------------------------------------------

export const getTicketsByProject = async (projectId) => {
  const response = await api.get(`/tickets/project/${projectId}`);

  return response.data;
};

export const getActiveTicketsByProject = async (projectId) => {
  const response = await api.get(`/tickets/project/${projectId}/active`);

  return response.data;
};

export const getRootTicketsByProject = async (projectId) => {
  const response = await api.get(`/tickets/project/${projectId}/root`);

  return response.data;
};

export const getProjectBoard = async (projectId) => {
  const response = await api.get(`/tickets/project/${projectId}/board`);

  return response.data;
};

// -----------------------------------------------------------------------------
// CHILD / FILTERED TICKETS
// -----------------------------------------------------------------------------

export const getChildTickets = async (ticketId) => {
  const response = await api.get(`/tickets/${ticketId}/children`);

  return response.data;
};

export const getTicketsByOwner = async (ownerId) => {
  const response = await api.get(`/tickets/owner/${ownerId}`);

  return response.data;
};

export const getTicketsByReporter = async (userId) => getTicketsByOwner(userId);

export const getTicketsByResponsible = async (responsibleId) => {
  const response = await api.get(`/tickets/responsible/${responsibleId}`);

  return response.data;
};

export const getTicketsByAssignee = async (userId) =>
  getTicketsByResponsible(userId);

export const getTicketsByStatus = async (statusId) => {
  const response = await api.get(`/tickets/status/${statusId}`);

  return response.data;
};

export const getTicketsByType = async (typeId) => {
  const response = await api.get(`/tickets/type/${typeId}`);

  return response.data;
};

export const getTicketsByPriority = async (priorityId) => {
  const response = await api.get(`/tickets/priority/${priorityId}`);

  return response.data;
};

export const getTicketsByEpic = async (epicId) => {
  const response = await api.get(`/tickets/epic/${epicId}`);

  return response.data;
};

// -----------------------------------------------------------------------------
// SEARCH / FILTER
// -----------------------------------------------------------------------------

export const searchTickets = async (query, projectId = null) => {
  const keyword =
    typeof query === "string"
      ? query.trim()
      : query?.keyword || query?.search || "";

  const params = {
    keyword,
  };

  if (projectId) {
    const response = await api.get(`/tickets/project/${projectId}/search`, {
      params,
    });

    return response.data;
  }

  const response = await api.get("/tickets/search", {
    params,
  });

  return response.data;
};

export const filterProjectTickets = async (projectId, filter = {}) => {
  const response = await api.get(`/tickets/project/${projectId}/filter`, {
    params: {
      ...filter,
    },
  });

  return response.data;
};

// -----------------------------------------------------------------------------
// SINGLE TICKET
// -----------------------------------------------------------------------------

export const getTicketById = async (id) => {
  const response = await api.get(`/tickets/${id}`);

  return response.data;
};

export const createTicket = async (ticketData) => {
  const response = await api.post("/tickets", ticketData);

  return response.data;
};

export const updateTicket = async (id, ticketData) => {
  const response = await api.put(`/tickets/${id}`, ticketData);

  return response.data;
};

// -----------------------------------------------------------------------------
// TICKET STATE / PLANNING
// -----------------------------------------------------------------------------

export const transitionTicket = async (id, statusId) => {
  const response = await api.put(`/tickets/${id}/transition`, {
    statusId: Number(statusId),
  });

  return response.data;
};

export const updateTicketStatus = async (id, statusId) =>
  transitionTicket(id, statusId);

export const planProjectTickets = async (projectId, data) => {
  const response = await api.put(`/tickets/project/${projectId}/plan`, data);

  return response.data;
};

export const restoreTicket = async (id) => {
  const response = await api.put(`/tickets/${id}/restore`);

  return response.data;
};

export const deleteTicket = async (id) => {
  await api.delete(`/tickets/${id}`);
};

export const permanentlyDeleteTicket = async (id) => {
  await api.delete(`/tickets/${id}/permanent`);
};

// -----------------------------------------------------------------------------
// SPRINT / MILESTONE
// -----------------------------------------------------------------------------

export const getTicketsBySprint = async (sprintId) => {
  const response = await api.get(`/sprints/${sprintId}/tickets`);

  return response.data;
};

export const getTicketsByMilestone = async (projectId, milestoneId) => {
  const response = await api.get(
    `/projects/${projectId}/milestones/${milestoneId}/tickets`,
  );

  return response.data;
};

export const getTicketCountByProject = async (projectId) => {
  const tickets = await getTicketsByProject(projectId);

  return Array.isArray(tickets) ? tickets.length : 0;
};

// -----------------------------------------------------------------------------
// TICKET FIELD UPDATES
// -----------------------------------------------------------------------------

export const updateTicketPriority = async (id, priorityId) =>
  updateTicketFields(id, {
    priorityId: Number(priorityId),
  });

export const updateTicketAssignee = async (id, responsibleId) =>
  updateTicketFields(id, {
    responsibleId: responsibleId ? Number(responsibleId) : null,
  });

export const updateTicketSprint = async (id, sprintId) =>
  updateTicketFields(id, {
    sprintId: sprintId ? Number(sprintId) : null,
  });

export const updateTicketMilestone = async (id, milestoneId) =>
  updateTicketFields(id, {
    milestoneId: milestoneId ? Number(milestoneId) : null,
  });

export const updateTicketEpic = async (id, epicId) =>
  updateTicketFields(id, {
    epicId: epicId ? Number(epicId) : null,
  });

export const updateTicketLabels = async (id, labelIds = []) =>
  updateTicketFields(id, {
    labelIds: Array.isArray(labelIds)
      ? labelIds.filter(Boolean).map(Number)
      : [],
  });

export const moveTicketToProject = async (id, projectId) =>
  updateTicketFields(id, {
    projectId: Number(projectId),
  });

export const updateTicketOrder = async (id, order) =>
  updateTicketFields(id, {
    order: Number(order),
  });

export const bulkUpdateTickets = async (ticketIds, updates = {}) => {
  const ids = (ticketIds || []).map(Number);
  const projectId = updates.projectId;

  if (!projectId) {
    throw new Error("projectId is required for bulk ticket planning");
  }

  return planProjectTickets(projectId, {
    ticketIds: ids,
    statusId: updates.statusId,
    sprintId: updates.sprintId,
    moveToBacklog: updates.moveToBacklog ?? false,
  });
};

// -----------------------------------------------------------------------------
// PARENT TICKET
// -----------------------------------------------------------------------------

export const getParentTicket = async (ticketId) => {
  const ticket = await getTicketById(ticketId);

  if (!ticket?.parentId) {
    return null;
  }

  return getTicketById(ticket.parentId);
};

// -----------------------------------------------------------------------------
// TICKET HOURS
// -----------------------------------------------------------------------------

export const getTicketHours = async (ticketId) => {
  const response = await api.get(`/ticket-hours/ticket/${ticketId}`);

  return response.data;
};

export const getTicketHourById = async (id) => {
  const response = await api.get(`/ticket-hours/${id}`);

  return response.data;
};

export const logTicketHours = async (ticketIdOrPayload, data = {}) => {
  let ticketId = ticketIdOrPayload;
  let payloadData = data;

  if (ticketIdOrPayload && typeof ticketIdOrPayload === "object") {
    ticketId = ticketIdOrPayload.ticketId;
    payloadData = ticketIdOrPayload;
  }

  const numericTicketId = Number(ticketId);
  const userId = payloadData.userId || getStoredUserId();
  const numericUserId = Number(userId);
  const value = hoursToValue(payloadData);

  if (!Number.isInteger(numericTicketId) || numericTicketId <= 0) {
    throw new Error("A valid ticketId is required to log time.");
  }

  if (!Number.isInteger(numericUserId) || numericUserId <= 0) {
    throw new Error("A valid userId is required to log time.");
  }

  if (!Number.isFinite(value) || value < 0.01) {
    throw new Error("Logged time must be at least 0.01 hours.");
  }

  const response = await api.post("/ticket-hours", {
    ticketId: numericTicketId,
    userId: numericUserId,
    value,
    comment: payloadData.comment ?? payloadData.description ?? "",
    activityId: payloadData.activityId ?? null,
  });

  return response.data;
};

export const updateTicketHour = async (id, data) => {
  const response = await api.put(`/ticket-hours/${id}`, data);

  return response.data;
};

export const deleteTicketHours = async (ticketId, hoursId) => {
  await api.delete(`/ticket-hours/${hoursId || ticketId}`);
};

// -----------------------------------------------------------------------------
// COMMENTS
// -----------------------------------------------------------------------------

export const getTicketComments = async (ticketId) => {
  const response = await api.get(`/ticket-comments/ticket/${ticketId}`);

  return response.data;
};

export const addTicketComment = async (ticketId, content) => {
  const response = await api.post("/ticket-comments", {
    ticketId: Number(ticketId),
    content: typeof content === "string" ? content.trim() : content?.content,
  });

  return response.data;
};

export const updateTicketComment = async (ticketId, commentId, content) => {
  const response = await api.put(`/ticket-comments/${commentId}`, {
    ticketId: Number(ticketId),
    content: typeof content === "string" ? content.trim() : content?.content,
  });

  return response.data;
};

export const deleteTicketComment = async (_ticketId, commentId) => {
  await api.delete(`/ticket-comments/${commentId || _ticketId}`);
};

export const restoreTicketComment = async (id) => {
  await api.put(`/ticket-comments/${id}/restore`);
};

// -----------------------------------------------------------------------------
// ACTIVITY / AUDIT
// -----------------------------------------------------------------------------

export const getTicketActivity = async (ticketId) => {
  const response = await api.get(`/ticket-activities/ticket/${ticketId}`);

  return response.data;
};

export const getTicketAuditEvents = async (ticketId) => {
  const response = await api.get(`/tickets/${ticketId}/audit-events`);

  return response.data;
};

// -----------------------------------------------------------------------------
// ATTACHMENTS / DOCUMENTS
// -----------------------------------------------------------------------------

export const getTicketAttachments = async (ticketId) => {
  const response = await api.get(`/ticket-attachments/ticket/${ticketId}`);

  return response.data;
};

export const uploadTicketAttachment = async (ticketId, file) => {
  const formData = new FormData();
  formData.append("file", file);

  const response = await api.post(
    `/ticket-attachments/ticket/${ticketId}`,
    formData,
  );

  return response.data;
};

export const downloadTicketAttachment = async (_ticketId, attachmentId) => {
  const response = await api.get(
    `/ticket-attachments/${attachmentId}/download`,
    {
      responseType: "blob",
    },
  );

  return response;
};

export const viewTicketAttachment = async (attachmentId) => {
  if (!attachmentId || Number(attachmentId) <= 0) {
    throw new Error("Invalid attachment ID");
  }

  // Return the complete Axios response because the viewer needs both
  // the Blob data and the server-provided Content-Type header.
  return api.get(`/ticket-attachments/${Number(attachmentId)}/view`, {
    responseType: "blob",
  });
};

export const deleteTicketAttachment = async (_ticketId, attachmentId) => {
  await api.delete(`/ticket-attachments/${attachmentId || _ticketId}`);
};

export const getTicketDocuments = getTicketAttachments;

export const uploadTicketDocument = uploadTicketAttachment;

export const deleteTicketDocument = deleteTicketAttachment;

// -----------------------------------------------------------------------------
// TICKET API OBJECT
// -----------------------------------------------------------------------------

export const ticketApi = {
  getComments: getTicketComments,
  createComment: addTicketComment,
  updateComment: updateTicketComment,
  deleteComment: deleteTicketComment,
  getAuditEvents: getTicketAuditEvents,
  getActivity: getTicketActivity,
};

export const remindTicketAssignee = async (ticketId) => {
  await api.post(`/tickets/${ticketId}/remind-assignee`);
};
