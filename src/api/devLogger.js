import axios from "axios";

/** Attach current UI path to every API call so Laravel/Node terminals can show it. */
export function setupDevApiLogging() {
  if (!import.meta.env.DEV) return;

  axios.interceptors.request.use((config) => {
    config.headers["X-Client-Screen"] = window.location.pathname;
    return config;
  });
}
