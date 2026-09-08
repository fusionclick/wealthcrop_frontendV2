import { getApiWithToken, postApiWithToken } from "./api";

const base = import.meta.env.VITE_URL || "/api/internal";

export const fetchHoldings = (sync = false) =>
  getApiWithToken(`${base}/portfolio/stocks/holdings${sync ? "?sync=1" : ""}`);

export const fetchPositions = (sync = false) =>
  getApiWithToken(`${base}/portfolio/stocks/positions${sync ? "?sync=1" : ""}`);

export const fetchKotakStatus = () =>
  getApiWithToken(`${base}/portfolio/stocks/kotak-status`);

// { access_token, ucc, mobile?, mpin?, totp_secret? } — access token and UCC are required,
// they are what identify the investor's own Kotak account.
export const saveKotakCredentials = (payload) =>
  postApiWithToken(`${base}/portfolio/stocks/kotak-credentials`, payload);

export const syncStockPortfolio = () =>
  postApiWithToken(`${base}/portfolio/stocks/sync`, {});

export const placeStockOrder = (payload) =>
  postApiWithToken(`${base}/portfolio/stocks/order`, payload);

export const fetchStockOrders = () =>
  getApiWithToken(`${base}/portfolio/stocks/orders`);

export const cancelStockOrder = (orderId) =>
  postApiWithToken(`${base}/portfolio/stocks/order/cancel`, { order_id: orderId });

export const fetchFnoPositions = () =>
  getApiWithToken(`${base}/portfolio/fno/positions`);

export const fetchFnoOrders = () =>
  getApiWithToken(`${base}/portfolio/fno/orders`);

export const placeFnoOrder = (payload) =>
  postApiWithToken(`${base}/portfolio/fno/order`, payload);
