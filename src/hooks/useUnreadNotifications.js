import { useEffect, useState } from "react";
import { fetchUnreadCount } from "../api/notifications";

/**
 * The number on the header bell.
 *
 * Polls rather than streams: the feed is written by a half-hourly job and an order
 * callback, so a websocket would be a connection held open to learn nothing. Refreshes on
 * focus, and on the `wc:notifications-changed` event the notifications page fires after it
 * marks something read — otherwise the badge keeps its old number until the next poll.
 */
export default function useUnreadNotifications(enabled = true, intervalMs = 60000) {
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    if (!enabled) {
      setUnread(0);
      return;
    }

    let alive = true;
    const read = async () => {
      const n = await fetchUnreadCount();
      if (alive) setUnread(n);
    };

    read();
    const timer = setInterval(read, intervalMs);
    window.addEventListener("focus", read);
    window.addEventListener("wc:notifications-changed", read);

    return () => {
      alive = false;
      clearInterval(timer);
      window.removeEventListener("focus", read);
      window.removeEventListener("wc:notifications-changed", read);
    };
  }, [enabled, intervalMs]);

  return unread;
}
