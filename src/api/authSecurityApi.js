import api, { REFRESH_TOKEN_KEY } from "./axios";

export const setupMfaApi = async () => (await api.post("/auth/mfa/setup")).data;
export const confirmMfaApi = async (code) =>
  (await api.post("/auth/mfa/confirm", { code })).data;
export const disableMfaApi = async (code) =>
  api.post("/auth/mfa/disable", { code });
export const getMfaStatusApi = async () =>
  (await api.get("/auth/mfa/status")).data;

export const getSessionsApi = async () => {
  const refreshToken = sessionStorage.getItem(REFRESH_TOKEN_KEY);
  const response = await api.get("/auth/sessions", {
    headers: refreshToken ? { "X-Refresh-Token": refreshToken } : {},
  });
  return response.data;
};

export const revokeSessionApi = async (id) =>
  api.delete(`/auth/sessions/${id}`);
export const revokeAllSessionsApi = async () =>
  api.post("/auth/sessions/revoke-all");
