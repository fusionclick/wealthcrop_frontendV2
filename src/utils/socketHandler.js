import { useEffect } from "react";
import { useDispatch } from "react-redux";
import socket from "./socket";
import { setStocks } from "../redux/stockSlice";

const SocketHandler = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    const fetchStockList = () => {
      socket.emit("get_stock_list");
    };

    socket.on("stock_list", (data) => {
      console.log("Stock List", data);
      dispatch(setStocks(data?.data));
    });

    const interval = setInterval(fetchStockList, 1000);

    fetchStockList();

    return () => {
      clearInterval(interval);
      socket.off("stock_list");
    };
  }, [dispatch]);

  return null;
};

export default SocketHandler;