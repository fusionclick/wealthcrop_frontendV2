import { login } from "../redux/authenticationSlice";

/**
 * Persist a successful auth response the same way the password login in Login.jsx does:
 * the multi-account list, the current account, and the PIN gate's timers.
 * The `login` reducer is what actually writes localStorage.token, which api.js reads.
 */
export const saveSession = (res, dispatch) => {
  const account = {
    userId: res?.data?.id,
    name: res?.data?.name,
    email: res?.data?.email,
    token: res?.token,
  };

  let accounts = [];
  try {
    accounts = JSON.parse(localStorage.getItem("accounts")) || [];
  } catch {
    accounts = [];
  }

  const existing = accounts.findIndex((acc) => acc.userId === account.userId);
  if (existing !== -1) accounts[existing] = account;
  else accounts.push(account);

  localStorage.setItem("accounts", JSON.stringify(accounts));
  localStorage.setItem("currentAccount", JSON.stringify(account));
  localStorage.setItem("pin_set", res?.pin_set ? "true" : "false");
  localStorage.setItem("pin_expiry", Date.now() + 30 * 60 * 1000);

  dispatch(login(account.token));
  window.dispatchEvent(new Event("storage"));
};
