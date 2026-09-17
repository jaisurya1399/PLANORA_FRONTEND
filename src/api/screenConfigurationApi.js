import api from "./axios";

/**
 * Get all screen configurations
 */
export const getScreenConfigurations = async () => {
  const response = await api.get("/screen-configurations");
  return response.data;
};

/**
 * Get effective screen configurations
 * for a particular project and issue/ticket type
 */
export const getEffectiveScreenConfigurations = async (
  projectId,
  ticketTypeId,
) => {
  const response = await api.get(
    `/screen-configurations/effective/project/${projectId}/ticket-type/${ticketTypeId}`,
  );
  return response.data;
};

/**
 * Create a new screen configuration
 */
export const createScreenConfiguration = async (data) => {
  const response = await api.post("/screen-configurations", data);
  return response.data;
};

/**
 * Update an existing screen configuration
 */
export const updateScreenConfiguration = async (id, data) => {
  const response = await api.put(`/screen-configurations/${id}`, data);
  return response.data;
};

/**
 * Delete a screen configuration
 */
export const deleteScreenConfiguration = async (id) => {
  const response = await api.delete(`/screen-configurations/${id}`);
  return response.data;
};

/**
 * Add a custom field to a screen
 *
 * data example:
 * {
 *   fieldId: 1,
 *   displayOrder: 0,
 *   visible: true
 * }
 */
export const addScreenField = async (screenId, data) => {
  const response = await api.post(
    `/screen-configurations/${screenId}/fields`,
    data,
  );
  return response.data;
};

/**
 * Update a field already attached to a screen
 */
export const updateScreenField = async (screenId, fieldId, data) => {
  const response = await api.put(
    `/screen-configurations/${screenId}/fields/${fieldId}`,
    data,
  );
  return response.data;
};

/**
 * Remove a custom field from a screen
 */
export const removeScreenField = async (screenId, fieldId) => {
  const response = await api.delete(
    `/screen-configurations/${screenId}/fields/${fieldId}`,
  );
  return response.data;
};
