import api from "./axios";

export const getProjectTemplates = async () => {
  const response = await api.get("/project-templates");
  return response.data;
};

export const createProjectTemplate = async (data) => {
  const response = await api.post("/project-templates", data);
  return response.data;
};

export const createProjectFromTemplate = async (id, data) => {
  const response = await api.post(
    `/project-templates/${id}/create-project`,
    data,
  );
  return response.data;
};

export const deleteProjectTemplate = async (id) => {
  await api.delete(`/project-templates/${id}`);
};
