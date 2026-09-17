import api from "./axios";
export const uploadProfileImage = async (userId, file) => {
  const fd = new FormData();
  fd.append("file", file);
  return (await api.post(`/users/${userId}/profile-image`, fd)).data;
};
export const deleteProfileImage = async (userId) => {
  await api.delete(`/users/${userId}/profile-image`);
};
export const getProfileImage = async (userId) => {
  const r = await api.get(`/users/${userId}/profile-image`, {
    responseType: "blob",
  });
  return URL.createObjectURL(r.data);
};
