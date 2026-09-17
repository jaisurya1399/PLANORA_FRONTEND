import axios from "axios";
import appConfig from "../config/appConfig";

const API_BASE_URL = appConfig.apiBaseUrl;

export const ACCESS_TOKEN_KEY = "accessToken";
export const REFRESH_TOKEN_KEY = "refreshToken";
export const CURRENT_USER_KEY = "currentUser";

const tokenStorage = window.sessionStorage;

export const getStoredUserId = () => {
  try {
    const raw = tokenStorage.getItem(CURRENT_USER_KEY);
    if (!raw) return null;

    const user = JSON.parse(raw);
    const userId =
      user?.id ??
      user?.userId ??
      user?.sub ??
      user?.user?.id ??
      user?.user?.userId ??
      user?.data?.id ??
      user?.data?.userId;

    const numericId = Number(userId);
    return Number.isInteger(numericId) && numericId > 0 ? numericId : null;
  } catch {
    return null;
  }
};

export const persistAuthTokens = (data = {}) => {
  if (data.accessToken)
    tokenStorage.setItem(ACCESS_TOKEN_KEY, data.accessToken);
  if (data.refreshToken)
    tokenStorage.setItem(REFRESH_TOKEN_KEY, data.refreshToken);
};

export const clearAuthStorage = () => {
  tokenStorage.removeItem(ACCESS_TOKEN_KEY);
  tokenStorage.removeItem(REFRESH_TOKEN_KEY);
  tokenStorage.removeItem(CURRENT_USER_KEY);
};

const api = axios.create({
  baseURL: API_BASE_URL,
});

const isAuthUrl = (url = "") =>
  url.includes("/auth/login") ||
  url.includes("/auth/refresh") ||
  url.includes("/auth/signup") ||
  url.includes("/auth/logout") ||
  url.includes("/auth/password-reset");

api.interceptors.request.use(
  (config) => {
    const token = tokenStorage.getItem(ACCESS_TOKEN_KEY);

    if (token && !config.skipAuth) {
      config.headers.Authorization = `Bearer ${token}`;
    } else if (config.skipAuth && config.headers?.Authorization) {
      delete config.headers.Authorization;
    }

    if (config.skipAuth) {
      delete config.skipAuth;
    }

    if (config.data instanceof FormData) {
      delete config.headers["Content-Type"];
    } else if (config.data !== undefined && config.data !== null) {
      config.headers["Content-Type"] = "application/json";
    }

    return config;
  },
  (error) => Promise.reject(error),
);

let refreshPromise = null;

const refreshAccessToken = async () => {
  const refreshToken = tokenStorage.getItem(REFRESH_TOKEN_KEY);

  if (!refreshToken) throw new Error("No refresh token");

  const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
    refreshToken,
  });

  persistAuthTokens(response.data);
  return response.data.accessToken;
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    const status = error.response?.status;
    const url = original?.url || "";

    if (status === 401 && original && !original._retry && !isAuthUrl(url)) {
      original._retry = true;

      try {
        if (!refreshPromise) {
          refreshPromise = refreshAccessToken().finally(() => {
            refreshPromise = null;
          });
        }

        const token = await refreshPromise;
        original.headers = original.headers || {};
        original.headers.Authorization = `Bearer ${token}`;
        return api(original);
      } catch {
        clearAuthStorage();

        if (window.location.pathname !== "/login") {
          // Keep the SPA alive when a session expires. The old implementation
          // used window.location.href, which caused a full browser reload.
          window.dispatchEvent(new CustomEvent("planora:session-expired"));
        }
      }
    }

    return Promise.reject(error);
  },
);

export default api;
