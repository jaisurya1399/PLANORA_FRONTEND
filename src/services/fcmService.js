/**
 * Native Android FCM registration for the Capacitor build.
 *
 * The web application itself does not poll notifications. The device gets
 * an FCM token and registers it once with the authenticated backend.
 */
import { Capacitor } from "@capacitor/core";
import { PushNotifications } from "@capacitor/push-notifications";

import api from "../api/axios";

const FCM_TOKEN_KEY = "fcmDeviceToken";
let initialized = false;

const isNative = () => Capacitor.isNativePlatform();

export const initializeFcm = async () => {
  if (!isNative()) {
    return;
  }

  if (initialized) {
    return;
  }

  initialized = true;

  try {
    let permission = await PushNotifications.checkPermissions();

    if (permission.receive === "prompt") {
      permission = await PushNotifications.requestPermissions();
    }

    if (permission.receive !== "granted") {
      console.warn("FCM push permission was not granted.");
      return;
    }

    // Avoid re-registering the same device token on every route change.
    const registrationListener = await PushNotifications.addListener(
      "registration",
      async (token) => {
        const value = token?.value?.trim();
        if (!value) return;

        const previous = localStorage.getItem(FCM_TOKEN_KEY);
        if (previous === value) return;

        try {
          await api.post("/notifications/fcm/register", {
            token: value,
            platform: Capacitor.getPlatform(),
          });

          localStorage.setItem(FCM_TOKEN_KEY, value);
        } catch (error) {
          console.error("Failed to register FCM token:", error);
        }
      },
    );

    await PushNotifications.addListener("registrationError", (error) => {
      console.error("FCM registration error:", error);
    });

    await PushNotifications.addListener(
      "pushNotificationReceived",
      (notification) => {
        // Android handles the native notification tray. This event is useful
        // for refreshing local UI when the app is currently open.
        window.dispatchEvent(
          new CustomEvent("fcm-notification", {
            detail: notification,
          }),
        );
      },
    );

    await PushNotifications.addListener(
      "pushNotificationActionPerformed",
      (action) => {
        const data = action?.notification?.data || {};
        window.dispatchEvent(
          new CustomEvent("fcm-notification-action", {
            detail: data,
          }),
        );
      },
    );

    await PushNotifications.register();

    return () => {
      registrationListener?.remove?.();
    };
  } catch (error) {
    initialized = false;
    console.error("Failed to initialize FCM:", error);
  }
};

export const unregisterFcmToken = async () => {
  if (!isNative()) return;

  const token = localStorage.getItem(FCM_TOKEN_KEY);
  if (!token) return;

  try {
    await api.delete("/notifications/fcm/unregister", {
      data: { token },
    });
  } catch (error) {
    console.warn("Failed to unregister FCM token:", error);
  } finally {
    localStorage.removeItem(FCM_TOKEN_KEY);
  }
};

export default initializeFcm;
