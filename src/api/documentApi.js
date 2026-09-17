import api from "./axios";

export const getDocuments = async () => {
  const response = await api.get("/documents");
  return response.data;
};

export const getDocumentById = async (id) => {
  const response = await api.get(`/documents/${id}`);
  return response.data;
};

export const searchDocuments = async (name) => {
  const response = await api.get("/documents/search", {
    params: { name },
  });
  return response.data;
};

export const getDocumentsByContentType = async (contentType) => {
  const response = await api.get("/documents/content-type", {
    params: { contentType },
  });
  return response.data;
};

export const downloadDocument = async (id) => {
  const response = await api.get(`/documents/${id}/download`, {
    responseType: "blob",
  });
  return response;
};

export const viewDocument = async (id) => {
  if (!id || Number(id) <= 0) {
    throw new Error("Invalid document ID");
  }

  return api.get(`/documents/${Number(id)}/view`, {
    responseType: "blob",
  });
};

export const createDocument = async (name, file) => {
  const formData = new FormData();
  formData.append("file", file);

  const response = await api.post("/documents", formData, {
    params: { name },
  });
  return response.data;
};

export const updateDocument = async (id, name, file) => {
  const formData = new FormData();
  if (file) {
    formData.append("file", file);
  }

  const response = await api.put(`/documents/${id}`, formData, {
    params: { name },
  });
  return response.data;
};

export const deleteDocument = async (id) => {
  await api.delete(`/documents/${id}`);
};
