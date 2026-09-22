import { getApiWithToken, postApiWithToken, deleteApiWithToken } from "./api";

/**
 * SRS FR 6.1 — one client for the notification feed and the alerts that write to it.
 *
 * Kept apart from the page so the header bell and the notifications screen ask the same
 * question the same way; two callers building the same URL is how one of them ends up
 * pointing at a route that moved.
 */
const url = (path) => `${import.meta.env.VITE_URL}${path}`;

export const fetchNotifications = async () => {
  const res = await getApiWithToken(url("/notifications"));
  return res?.data ?? { data: [], unread: 0 };
};

export const fetchUnreadCount = async () => {
  const res = await getApiWithToken(url("/notifications/unread-count"));
  return Number(res?.data?.unread ?? 0);
};

export const markAllRead = () => postApiWithToken(url("/notifications/read"), {}, { silent: true });

export const markRead = (id) => postApiWithToken(url(`/notifications/${id}/read`), {}, { silent: true });

export const deleteNotification = (id) => deleteApiWithToken(url(`/notifications/${id}`));

export const fetchAlerts = async () => {
  const res = await getApiWithToken(url("/alerts"));
  return res?.data?.data ?? [];
};

export const createAlert = (payload) => postApiWithToken(url("/alerts"), payload);

export const toggleAlert = (id) => postApiWithToken(url(`/alerts/${id}/toggle`), {}, { silent: true });

export const deleteAlert = (id) => deleteApiWithToken(url(`/alerts/${id}`));
