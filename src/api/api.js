import axios from "axios";
import { toastError } from "../utils/notifyCustom";

const api = axios.create({ timeout: 120000 });

const bearerToken = () => {
  const raw = String(localStorage.getItem("token") || "").trim();
  if (!raw || raw === "null" || raw === "undefined") return "";
  return raw.replace(/^Bearer\s+/i, "").replace(/^"|"$/g, "");
};

const authHeaders = () => {
  const token = bearerToken();
  if (!token) return null;
  return {
    Authorization: `Bearer ${token}`,
    "X-Authorization": `Bearer ${token}`,
    "Content-Type": "application/json",
  };
};

/**
 * QA 14.12 — after an admin erases an account the investor "stayed logged in": the token was
 * still in localStorage, every request came back 401, and each helper below just toasted and
 * returned null. The result was an app full of empty shells the user could keep clicking
 * forever. Being returned to the login screen with the reason is the honest outcome, and it is
 * what QA asked for.
 *
 * Done once in an interceptor rather than in five catch blocks — axios is the single point every
 * helper here shares.
 *
 * Only fires for a request that actually CARRIED a bearer token. A 401 from the login form is a
 * wrong password, not a dead session, and redirecting on that would trap the user in a loop.
 */
const SESSION_GONE = /deactivated|session (invalid|revoked)|unauthenticated/i;

let ending = false;

const endSession = (message) => {
  if (ending) return;
  ending = true;

  try {
    localStorage.removeItem("token");
    localStorage.removeItem("currentAccount");
    localStorage.removeItem("accounts");
  } catch {
    // Storage can throw in private mode; the redirect still has to happen.
  }

  toastError(message);
  // A beat so the toast is readable, then replace() rather than assign(): the dead page must
  // not come back with the Back button.
  setTimeout(() => window.location.replace("/login"), 1200);
};

export const onAuthFailure = (error) => {
  const status = error?.response?.status;
  const sentToken = Boolean(error?.config?.headers?.Authorization);
  const message = error?.response?.data?.message || "";

  if (status === 401 && sentToken && SESSION_GONE.test(message)) {
    endSession(message || "Your session has ended. Please sign in again.");
    return true;
  }
  return false;
};

// Both clients: the get helpers use the `api` instance, the post helpers use bare axios.
for (const client of [api, axios]) {
  client.interceptors.response.use(
    (r) => r,
    (error) => {
      onAuthFailure(error);
      return Promise.reject(error);
    }
  );
}

export const getApi = async (url) => {
  try {
    const response = await api.get(url);
    return response.data;
  } catch (error) {
    console.error("API error:", error);
    throw error;
  }
};

export const getApiWithToken = async (url) => {
  const headers = authHeaders();
  if (!headers) {
    toastError("User not authenticated");
    return null;
  }

  try {
    const response = await api.get(url, { headers });
    return response;
  } catch (error) {
    toastError(error.response?.data?.message || "API Error");
    return null;
  }
};

export const postApi = async (url, data) => {
  try {
    const res = await axios.post(url, data, {
      headers: {
        "Content-Type": "application/json",
      },
    });

    return res?.data;
  } catch (error) {
    toastError(error.response?.data?.message || "Something went wrong");
    return null;
  }
};

export const postApiWithToken = async (url, data, { silent, throwOnError } = {}) => {
  const headers = authHeaders();
  if (!headers) {
    if (!silent) toastError("User not authenticated");
    if (throwOnError) {
      const error = new Error("User not authenticated");
      error.reason = "no_bearer_token";
      throw error;
    }
    return null;
  }

  try {
    const res = await axios.post(url, data, { headers });
    return res?.data;
  } catch (error) {
    if (!silent) {
      toastError(error.response?.data?.message || error.response?.data?.error || "API Error");
    }
    if (throwOnError) throw error;
    return null;
  }
};

export const deleteApiWithToken = async (url) => {
  const headers = authHeaders();
  if (!headers) {
    toastError("User not authenticated");
    return null;
  }

  try {
    const response = await axios.delete(url, { headers });
    return response;
  } catch (error) {
    toastError(error.response?.data?.message || "API Error");
    return null;
  }
};

export const putApiWithToken = async (url, data, { silent } = {}) => {
  const headers = authHeaders();
  if (!headers) {
    if (!silent) toastError("User not authenticated");
    return null;
  }

  try {
    const res = await axios.put(url, data, { headers });
    return res?.data;
  } catch (error) {
    if (!silent) {
      toastError(error.response?.data?.message || error.response?.data?.error || "API Error");
    }
    return null;
  }
};
