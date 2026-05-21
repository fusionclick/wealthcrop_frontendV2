import { toast } from "react-toastify";
import { Bounce } from "react-toastify";
import { FaCheckCircle, FaTimesCircle, FaInfoCircle, FaExclamationTriangle } from "react-icons/fa";
import React from "react";

// Reusable function to create content without JSX
const renderToastContent = (IconComponent, msg) => {
  return React.createElement(
    "div",
    {
      style: {
        display: "flex",
        alignItems: "center",
        gap: "10px",
        color: "white",
      },
    },
    React.createElement(IconComponent, {
      color: "white",
      size: 20, // Bigger size
      style: {
        padding: 0,
        margin: 0,
        border: "none",
      },
    }),
    msg
  );
};

export const toastSuccess = (msg) =>
  toast(renderToastContent(FaCheckCircle, msg), {
    position: "top-right",
    autoClose: 3000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    progress: undefined,
    theme: "dark",
    transition: Bounce,
    icon: false,
    className: "toast-success-custom",
  });

export const toastError = (msg) =>
  toast(renderToastContent(FaTimesCircle, msg), {
    position: "top-right",
    autoClose: 3000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    progress: undefined,
    theme: "dark",
    transition: Bounce,
    icon: false,
    className: "toast-error-custom",
  });

export const toastInfo = (msg) =>
  toast(renderToastContent(FaInfoCircle, msg), {
    position: "top-right",
    autoClose: 3000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    progress: undefined,
    theme: "dark",
    transition: Bounce,
    icon: false,
    className: "toast-info-custom",
  });

export const toastWarn = (msg) =>
  toast(renderToastContent(FaExclamationTriangle, msg), {
    position: "top-right",
    autoClose: 3000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    progress: undefined,
    theme: "dark",
    transition: Bounce,
    icon: false,
    className: "toast-warn-custom",
  });


// different 

//   export const toastSuccess = (msg) =>
//   toast.success(`✔️ ${msg}`, {
//     position: "top-right",
//     autoClose: 5000,
//     hideProgressBar: false,
//     closeOnClick: true,
//     pauseOnHover: true,
//     draggable: true,
//     progress: undefined,
//     theme: "dark",
//     transition: Bounce,
//     icon: false, // disable built-in icon
//     className: "toast-success-custom",
//   });

// export const toastError = (msg) =>
//   toast.error(`❌ ${msg}`, {
//     position: "top-right",
//     autoClose: 5000,
//     hideProgressBar: false,
//     closeOnClick: true,
//     pauseOnHover: true,
//     draggable: true,
//     progress: undefined,
//     theme: "dark",
//     transition: Bounce,
//     icon: false,
//     className: "toast-error-custom",
//   });

// export const toastInfo = (msg) =>
//   toast.info(`ℹ️ ${msg}`, {
//     position: "top-right",
//     autoClose: 5000,
//     hideProgressBar: false,
//     closeOnClick: true,
//     pauseOnHover: true,
//     draggable: true,
//     progress: undefined,
//     theme: "dark",
//     transition: Bounce,
//     icon: false,
//     className: "toast-info-custom",
//   });

// export const toastWarn = (msg) =>
//   toast.warn(`⚠️ ${msg}`, {
//     position: "top-right",
//     autoClose: 5000,
//     hideProgressBar: false,
//     closeOnClick: true,
//     pauseOnHover: true,
//     draggable: true,
//     progress: undefined,
//     theme: "dark",
//     transition: Bounce,
//     icon: false,
//     className: "toast-warn-custom",
//   });


  // old


    // toast.success(msg, {
  //   position: "top-right",
  //   autoClose: false,
  //   hideProgressBar: false,
  //   closeOnClick: true,
  //   pauseOnHover: true,
  //   draggable: true,
  //   progress: undefined,
  //   theme: "dark",
  //   transition: Bounce,
  // });