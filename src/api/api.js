import axios from "axios";
import { toastError } from "../utils/notifyCustom";

export const getApi = async (url) => {
  try {
    const response = await axios.get(url);
    return response.data;
  } catch (error) {
    console.error("API error:", error);
    throw error;
  }
};

export const getApiWithToken = async (url) => {
  const token = localStorage.getItem("token");

  if (!token) {
    toastError("User not authenticated");
    return null;
  }

  try {
    const response = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    // console.log("from get api",response);
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

export const postApiWithToken = async (url, data) => {
  const token = localStorage.getItem("token");
  // console.log("Token", token);

  if (!token) {
    toastError("User not authenticated");
    return null;
  }

  try {
    const res = await axios.post(url, data, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    return res?.data;
  } catch (error) {
    toastError(error.response?.data?.message || "API Error");
    return null;
  }
};

export const deleteApiWithToken = async (url) => {
  const token = localStorage.getItem("token");

  if (!token) {
    toastError("User not authenticated");
    return null;
  }

  try {
    const response = await axios.delete(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    // console.log("from get api",response);
    return response;
  } catch (error) {
    toastError(error.response?.data?.message || "API Error");
    return null;
  }
};