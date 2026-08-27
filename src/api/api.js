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
