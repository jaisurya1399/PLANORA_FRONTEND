import api from "./axios";

export const getApplicationMetadata = async () => {
  const response = await api.get("/application-metadata");
  return response.data;
};

export const getApplicationMetadataById = async (id) => {
  const response = await api.get(`/application-metadata/${id}`);
  return response.data;
};

export const getApplicationMetadataByKey = async (key) => {
  const response = await api.get(
    `/application-metadata/key/${encodeURIComponent(key)}`,
  );
  return response.data;
};

export const applicationMetadataExists = async (key) => {
  const response = await api.get(
    `/application-metadata/exists/key/${encodeURIComponent(key)}`,
  );
  return response.data;
};

export const createApplicationMetadata = async (data) => {
  const response = await api.post("/application-metadata", data);
  return response.data;
};

export const updateApplicationMetadata = async (id, data) => {
  const response = await api.put(`/application-metadata/${id}`, data);
  return response.data;
};

export const deleteApplicationMetadata = async (id) => {
  await api.delete(`/application-metadata/${id}`);
};
