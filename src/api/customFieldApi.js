import api from "./axios";

/**
 * Get all custom fields
 */
export const getCustomFields = async () => {
  const response = await api.get("/custom-fields");
  return response.data;
};

/**
 * Get only active custom fields
 */
export const getActiveCustomFields = async () => {
  const response = await api.get("/custom-fields/active");
  return response.data;
};

/**
 * Get a custom field by ID
 */
export const getCustomField = async (id) => {
  const response = await api.get(`/custom-fields/${id}`);
  return response.data;
};

/**
 * Create a custom field
 */
export const createCustomField = async (data) => {
  const response = await api.post("/custom-fields", data);
  return response.data;
};

/**
 * Update a custom field
 */
export const updateCustomField = async (id, data) => {
  const response = await api.put(`/custom-fields/${id}`, data);
  return response.data;
};

/**
 * Delete a custom field
 */
export const deleteCustomField = async (id) => {
  const response = await api.delete(`/custom-fields/${id}`);
  return response.data;
};
