import api, {
  CURRENT_USER_KEY,
  REFRESH_TOKEN_KEY,
  persistAuthTokens,
} from "./axios";

export const loginApi = async (email, password) => {
  const response = await api.post("/auth/login", {
    email,
    password,
  });

  return response.data;
};

export const signupApi = async (data) => {
  const response = await api.post("/auth/signup", data);
  return response.data;
};

export const refreshTokenApi = async (refreshToken) => {
  const response = await api.post("/auth/refresh", { refreshToken });
  persistAuthTokens(response.data);
  return response.data;
};

export const logoutApi = async (refreshToken) => {
  const token = refreshToken || sessionStorage.getItem(REFRESH_TOKEN_KEY);

  if (token) {
    await api.post("/auth/logout", { refreshToken: token });
  }
};

export const requestPasswordResetApi = async (email) => {
  const response = await api.post(
    "/auth/password-reset/request",
    { email: String(email || "").trim().toLowerCase() },
    { skipAuth: true },
  );

  return response;
};

export const confirmPasswordResetApi = async (token, newPassword) => {
  const response = await api.post(
    "/auth/password-reset/confirm",
    {
      token,
      newPassword,
    },
    { skipAuth: true },
  );

  return response;
};

export const confirmEmailVerificationApi = async (token) => {
  await api.post("/auth/email-verification/confirm", { token });
};

export const resendEmailVerificationApi = async () => {
  await api.post("/auth/email-verification/resend");
};

export const getCurrentUserApi = async () => {
  const response = await api.get("/auth/me");
  if (response.data) {
    sessionStorage.setItem(CURRENT_USER_KEY, JSON.stringify(response.data));
  }
  return response.data;
};

export const verifyMfaApi = async (mfaToken, code) => {
  const response = await api.post("/auth/mfa/verify", { mfaToken, code });
  persistAuthTokens(response.data);
  return response.data;
};
