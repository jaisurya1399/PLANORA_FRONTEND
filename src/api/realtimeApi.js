import { ACCESS_TOKEN_KEY } from "./axios";
import appConfig from "../config/appConfig";

const API_BASE_URL = appConfig.apiBaseUrl;

const parseEventBlock = (block, handlers) => {
  if (!block.trim()) return;
  let eventName = "message";
  const data = [];
  for (const line of block.split(/\r?\n/)) {
    if (line.startsWith("event:")) eventName = line.slice(6).trim();
    if (line.startsWith("data:")) data.push(line.slice(5).trimStart());
  }
  const raw = data.join("\n");
  if (!raw) return;
  let payload = raw;
  try { payload = JSON.parse(raw); } catch { /* plain text SSE payload */ }
  if (eventName === "notification") handlers.onNotification?.(payload);
  else if (eventName === "connected") handlers.onConnected?.(payload);
  else handlers.onMessage?.(payload);
};

const createSource = (path, handlers = {}) => {
  const controller = new AbortController();
  let closed = false;

  const start = async () => {
    try {
      const token = sessionStorage.getItem(ACCESS_TOKEN_KEY);
      if (!token) return;
      const response = await fetch(`${API_BASE_URL}${path}`, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}`, Accept: "text/event-stream" },
        cache: "no-store",
        signal: controller.signal,
      });
      if (!response.ok || !response.body) throw new Error(`Realtime connection failed (${response.status})`);

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      while (!closed) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const blocks = buffer.split(/\n\n/);
        buffer = blocks.pop() || "";
        for (const block of blocks) parseEventBlock(block, handlers);
      }
    } catch (error) {
      if (!closed && error?.name !== "AbortError") handlers.onError?.(error);
    }
  };

  start();
  return { close: () => { closed = true; controller.abort(); } };
};

export const subscribeProjectRealtime = (projectId, handlers) =>
  createSource(`/chat/realtime/project/${projectId}`, handlers);

export const subscribeNotificationRealtime = ({ onNotification, onConnected, onError } = {}) =>
  createSource("/chat/realtime/user", { onNotification, onConnected, onError });
