import api from "./axios";

/**
 * Get all field configurations
 */
export const getFieldConfigurations = async () => {
  const response = await api.get("/field-configurations");
  return response.data;
};

/**
 * Get a field configuration by ID
 */
export const getFieldConfiguration = async (id) => {
  const response = await api.get(`/field-configurations/${id}`);
  return response.data;
};

/**
 * Get effective field configuration
 * for a project and issue/ticket type
 */
export const getEffectiveFieldConfiguration = async (
  projectId,
  ticketTypeId,
) => {
  const response = await api.get(
    `/field-configurations/effective/project/${projectId}/ticket-type/${ticketTypeId}`,
  );
  return response.data;
};

/**
 * Create a field configuration
 */
export const createFieldConfiguration = async (data) => {
  const response = await api.post("/field-configurations", data);
  return response.data;
};

/**
 * Update a field configuration
 */
export const updateFieldConfiguration = async (id, data) => {
  const response = await api.put(`/field-configurations/${id}`, data);
  return response.data;
};

/**
 * Delete a field configuration
 */
export const deleteFieldConfiguration = async (id) => {
  const response = await api.delete(`/field-configurations/${id}`);
  return response.data;
};

/**
 * Add a custom field to a field configuration
 */
export const addFieldToConfiguration = async (configurationId, data) => {
  const response = await api.post(
    `/field-configurations/${configurationId}/fields`,
    data,
  );
  return response.data;
};

/**
 * Update a field inside a field configuration
 */
export const updateConfigurationField = async (
  configurationId,
  fieldId,
  data,
) => {
  const response = await api.put(
    `/field-configurations/${configurationId}/fields/${fieldId}`,
    data,
  );
  return response.data;
};

/**
 * Remove a custom field from a field configuration
 */
export const removeFieldFromConfiguration = async (
  configurationId,
  fieldId,
) => {
  const response = await api.delete(
    `/field-configurations/${configurationId}/fields/${fieldId}`,
  );
  return response.data;
};
