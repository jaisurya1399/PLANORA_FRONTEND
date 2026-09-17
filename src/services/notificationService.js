import api from "../api/axios";

const notificationService = {
  getUserNotifications: async (notifiableType, notifiableId) => {
    const response = await api.get("/notifications/user", {
      params: { notifiableType, notifiableId },
    });
    return response.data;
  },

  getUnreadNotifications: async (notifiableType, notifiableId) => {
    const response = await api.get("/notifications/user/unread", {
      params: { notifiableType, notifiableId },
    });
    return response.data;
  },

  getReadNotifications: async (notifiableType, notifiableId) => {
    const response = await api.get("/notifications/user/read", {
      params: { notifiableType, notifiableId },
    });
    return response.data;
  },

  getCount: async (notifiableType, notifiableId) => {
    const response = await api.get("/notifications/user/count", {
      params: { notifiableType, notifiableId },
    });
    return response.data;
  },

  getUnreadCount: async (notifiableType, notifiableId) => {
    const response = await api.get("/notifications/user/unread-count", {
      params: { notifiableType, notifiableId },
    });
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/notifications/${id}`);
    return response.data;
  },

  create: async (notification) => {
    const response = await api.post("/notifications", notification);
    return response.data;
  },

  markAsRead: async (id) => {
    const response = await api.put(`/notifications/${id}/read`);
    return response.data;
  },

  markAsUnread: async (id) => {
    const response = await api.put(`/notifications/${id}/unread`);
    return response.data;
  },

  delete: async (id) => {
    await api.delete(`/notifications/${id}`);
  },

  deleteByUser: async (notifiableType, notifiableId) => {
    await api.delete("/notifications/user", {
      params: { notifiableType, notifiableId },
    });
  },
};

export default notificationService;
