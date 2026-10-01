import React from "react";
import toast from "react-hot-toast";
import { FiInfo, FiAlertTriangle } from "react-icons/fi";

// ponytail: look/feel lives on <Toaster/> in App.jsx so there is one place to tune it.
// This file is only the API surface the rest of the app already imports.
const icon = (Cmp, color) => React.createElement(Cmp, { size: 18, color });

export const toastSuccess = (msg) => toast.success(msg || "Done");

// Single error slot: a new error replaces the old one instead of stacking.
//
// QA 7.1 — except after holdError(). A session that has just ended takes every request still
// in flight down with it, and each failure toasted into this same slot, so the real reason
// ("This account has been deactivated…") lost to whichever "User not authenticated" landed
// last. Nothing releases the hold: the page reloads to /login, which starts fresh.
let held = false;

export const toastError = (msg) =>
  held ? undefined : toast.error(msg || "Something went wrong", { id: "app-error" });

export const holdError = (msg) => {
  toast.error(msg, { id: "app-error" });
  held = true;
};

export const toastInfo = (msg) =>
  toast(msg, { icon: icon(FiInfo, "#3b82f6") });

export const toastWarn = (msg) =>
  toast(msg, { icon: icon(FiAlertTriangle, "#f59e0b") });

// Route changes only need to drop the sticky error slot. Dismissing *everything* here
// swallowed success toasts fired right before a navigate() (signup -> /verify-otp etc).
export const clearToasts = () => toast.dismiss("app-error");
