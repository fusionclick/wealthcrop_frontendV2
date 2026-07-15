import { getApi } from "./api";

const base = import.meta.env.VITE_URL || "/api/internal";

export const fetchMarketIndices = () =>
  getApi(`${base}/market/indices`);

export const fetchStockList = (index = "NIFTY 50", limit, { quick = false } = {}) => {
  const params = new URLSearchParams({ index });
  if (limit) params.set("limit", String(limit));
  if (quick) params.set("quick", "1");
  return getApi(`${base}/market/stock-list?${params}`);
};

export const fetchStockDetails = (symbol) =>
  getApi(`${base}/market/stock-details/${encodeURIComponent(symbol)}`);

export const fetchStockQuote = (symbol) =>
  getApi(`${base}/market/quote/${encodeURIComponent(symbol)}`);

export const fetchStockChart = (symbol, range = "6mo", interval = "1d") =>
  getApi(
    `${base}/market/chart/${encodeURIComponent(symbol)}?range=${range}&interval=${interval}`
  );

export const searchStocks = (query) =>
  getApi(`${base}/market/search?q=${encodeURIComponent(query)}`);

export const fetchMarketMovers = (type = "gainers", index = "NIFTY 100") =>
  getApi(`${base}/market/movers?type=${type}&index=${encodeURIComponent(index)}`);

export const fetchMarketProducts = () =>
  getApi(`${base}/market/products`);

export const fetchEtfs = () =>
  getApi(`${base}/market/etfs`);

export const fetchBlogs = () =>
  getApi(`${base}/content/blogs`);

export const fetchBlog = (id) =>
  getApi(`${base}/content/blogs/${id}`);

export const fetchIpos = () =>
  getApi(`${base}/content/ipos`);

export const fetchIpo = (id) =>
  getApi(`${base}/content/ipos/${id}`);

export const fetchFno = (type = "top-traded", category = "equity") =>
  getApi(`${base}/market/fno?type=${encodeURIComponent(type)}&category=${encodeURIComponent(category)}`);
