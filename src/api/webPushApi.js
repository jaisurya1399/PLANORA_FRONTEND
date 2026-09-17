import api from "./axios";

export const getVapidPublicKey = async () => {
  const response = await api.get("/web-push/vapid-public-key");
  return response.data;
};

export const subscribeWebPush = async (data) => {
  await api.post("/web-push-subscriptions", data);
};

export const unsubscribeWebPush = async (endpoint) => {
  await api.delete("/web-push-subscriptions", {
    params: { endpoint },
  });
};
