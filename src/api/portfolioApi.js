import { getApiWithToken, postApiWithToken } from "./api";

const base = import.meta.env.VITE_URL || "/api/internal";

export const fetchHoldings = (sync = false) =>
  getApiWithToken(`${base}/portfolio/stocks/holdings${sync ? "?sync=1" : ""}`);

export const fetchPositions = (sync = false) =>
  getApiWithToken(`${base}/portfolio/stocks/positions${sync ? "?sync=1" : ""}`);

export const fetchKotakStatus = () =>
  getApiWithToken(`${base}/portfolio/stocks/kotak-status`);

export const saveKotakCredentials = (mpin, totpSecret) =>
  postApiWithToken(`${base}/portfolio/stocks/kotak-credentials`, {
    mpin,
    totp_secret: totpSecret,
  });

export const syncStockPortfolio = () =>
  postApiWithToken(`${base}/portfolio/stocks/sync`, {});

export const placeStockOrder = (payload) =>
  postApiWithToken(`${base}/portfolio/stocks/order`, payload);

export const fetchStockOrders = () =>
  getApiWithToken(`${base}/portfolio/stocks/orders`);

export const cancelStockOrder = (orderId) =>
  postApiWithToken(`${base}/portfolio/stocks/order/cancel`, { order_id: orderId });
