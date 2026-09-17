import api from "../api/axios";

/**
 * User-facing error handling.
 *
 * The API may return technical details for server-side diagnostics. Those
 * details are intentionally converted here into concise messages that make
 * sense to the person using the application.
 */

const TECHNICAL_MESSAGE_PATTERNS = [
  /nullpointerexception/i,
  /referenceerror/i,
  /typeerror/i,
  /syntaxerror/i,
  /java\./i,
  /org\.springframework/i,
  /hibernate/i,
  /\bjdbc\b/i,
  /\bsql\b/i,
  /stack\s*trace/i,
  /\bat\s+com\./i,
  /could not execute/i,
  /constraint\s*\[/i,
  /database error/i,
  /internal server error/i,
];

const isTechnicalMessage = (message = "") =>
  TECHNICAL_MESSAGE_PATTERNS.some((pattern) => pattern.test(message));

const humanizeField = (field = "") => {
  const name = field
    .split(".")
    .pop()
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[_-]/g, " ")
    .trim();

  if (!name) return "Field";
  return name.charAt(0).toUpperCase() + name.slice(1);
};

const friendlyStatusMessage = (status) => {
  switch (status) {
    case 400:
      return "Please check the information entered and try again.";
    case 401:
      return "Your session has expired. Please sign in again.";
    case 403:
      return "You do not have permission to perform this action.";
    case 404:
      return "The requested information could not be found.";
    case 409:
      return "This change conflicts with existing information. Please review it and try again.";
    case 422:
      return "Some of the information is not valid. Please review it and try again.";
    case 429:
      return "Too many requests were made. Please wait a moment and try again.";
    case 500:
    case 502:
    case 503:
    case 504:
      return "The service is temporarily unavailable. Please try again in a moment.";
    default:
      return "Something went wrong. Please try again.";
  }
};

const getValidationMessage = (errors) => {
  if (!errors || typeof errors !== "object") return null;

  const entries = Object.entries(errors).filter(([, value]) => value);
  if (!entries.length) return null;

  const messages = entries.slice(0, 4).map(([field, value]) => {
    const text = String(value);
    return isTechnicalMessage(text)
      ? `${humanizeField(field)}: Please enter a valid value.`
      : `${humanizeField(field)}: ${text}`;
  });

  const remaining = entries.length - messages.length;
  if (remaining > 0) {
    messages.push(
      `Please review ${remaining} more field${remaining === 1 ? "" : "s"}.`,
    );
  }

  return messages.join(" ");
};

/**
 * Converts any Axios/network/application error into a stable object.
 *
 * Callers can safely display `message` without exposing implementation
 * details. The original error is retained only in memory for local debugging.
 */
export const normalizeApiError = (error) => {
  if (!error) {
    return {
      message: "Something went wrong. Please try again.",
      status: null,
      data: null,
      originalError: null,
    };
  }

  const response = error.response;
  const status = response?.status ?? null;
  const data = response?.data;

  const validationMessage = getValidationMessage(data?.errors);
  let message = validationMessage;

  if (!message && data && typeof data === "object") {
    const serverMessage =
      data.message ||
      data.detail ||
      (typeof data.error === "string" ? data.error : null);

    if (serverMessage && !isTechnicalMessage(String(serverMessage))) {
      message = String(serverMessage).trim();
    }
  }

  if (!message && typeof data === "string" && !isTechnicalMessage(data)) {
    message = data.trim();
  }

  if (!message && error.message && !isTechnicalMessage(error.message)) {
    const networkError =
      !response &&
      /network|timeout|failed to fetch|fetch failed|connection/i.test(
        error.message,
      );

    if (networkError) {
      message =
        "We could not reach the service. Please check your connection and try again.";
    }
  }

  if (!message) {
    message = friendlyStatusMessage(status);
  }

  return {
    message,
    status,
    data: data ?? null,
    originalError: error,
  };
};

const execute = async (request) => {
  try {
    const response = await request();
    return response.data;
  } catch (error) {
    throw normalizeApiError(error);
  }
};

export const get = (url, config = {}) => execute(() => api.get(url, config));

export const post = (url, data = {}, config = {}) =>
  execute(() => api.post(url, data, config));

export const put = (url, data = {}, config = {}) =>
  execute(() => api.put(url, data, config));

export const patch = (url, data = {}, config = {}) =>
  execute(() => api.patch(url, data, config));

export const remove = (url, config = {}) =>
  execute(() => api.delete(url, config));

export const upload = (url, formData, config = {}) =>
  execute(() =>
    api.post(url, formData, {
      ...config,
      headers: {
        ...(config.headers || {}),
        "Content-Type": "multipart/form-data",
      },
    }),
  );

const apiService = {
  get,
  post,
  put,
  patch,
  delete: remove,
  upload,
  normalizeApiError,
};

export default apiService;
