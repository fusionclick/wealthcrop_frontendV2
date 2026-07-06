import { getApi } from "./api";

const base = import.meta.env.VITE_URL;

export const fetchMarketIndices = () =>
  getApi(`${base}/market/indices`);

export const fetchStockList = (index = "NIFTY 50") =>
  getApi(`${base}/market/stock-list?index=${encodeURIComponent(index)}`);

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
