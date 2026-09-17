const getEnv = (key, fallback = "") => {
  const value = import.meta.env[key];

  if (value === undefined || value === null || value === "") {
    return fallback;
  }

  return value.trim();
};

const getBooleanEnv = (key, fallback = false) => {
  const value = getEnv(key, String(fallback)).toLowerCase();
  return value === "true" || value === "1";
};

const apiBaseUrl = getEnv("VITE_API_BASE_URL");

if (!apiBaseUrl) {
  throw new Error(
    "VITE_API_BASE_URL is missing. Set it in the frontend .env file.",
  );
}

const appConfig = {
  apiBaseUrl: apiBaseUrl.replace(/\/$/, ""),
  environment: getEnv("VITE_APP_ENV", "development"),
  features: {
    ticketRelations: getBooleanEnv("VITE_FEATURE_TICKET_RELATIONS", true),
    ticketSubscribers: getBooleanEnv("VITE_FEATURE_TICKET_SUBSCRIBERS", true),
    savedViews: getBooleanEnv("VITE_FEATURE_SAVED_VIEWS", true),
    webPush: getBooleanEnv("VITE_FEATURE_WEB_PUSH", false),
    analytics: getBooleanEnv("VITE_FEATURE_ANALYTICS", false),
    documents: getBooleanEnv("VITE_FEATURE_DOCUMENTS", false),
    realtime: getBooleanEnv("VITE_FEATURE_REALTIME", false),
    settings: getBooleanEnv("VITE_FEATURE_SETTINGS", false),
  },
};

export const isFeatureEnabled = (featureName) =>
  Boolean(appConfig.features[featureName]);

export default appConfig;
