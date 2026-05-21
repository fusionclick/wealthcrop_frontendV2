import React from 'react'

const orders = [
  {
    id: 1,
    symbol: "NIFTY 25 JAN 22000 CE",
    type: "BUY",
    quantity: 50,
    price: 128.5,
    status: "EXECUTED",
    time: "10:32 AM",
  },
  {
    id: 2,
    symbol: "BANKNIFTY 25 JAN 46000 PE",
    type: "SELL",
    quantity: "25",
    price: 210.0,
    status: "OPEN",
    time: "11.05 AM"
  },
  {
    id: 3,
    symbol: "RELIANCE FEB FUT",
    type: "BUY",
    quantity: "100",
    price: 2450,
    status: "CANCELLED",
    time: "12:10 PM"
  },
  {
    id: 4,
    symbol: "BANKNIFTY 8 JUN PE",
    type: "SELL",
    quantity: "12",
    price: 1270,
    status: "EXECUTED",
    time: "02:40 PM"
  },
  {
    id: 5,
    symbol: "TATA MOTORS",
    type: "BUY",
    quantity: "400",
    price: 450,
    status: "EXECUTED",
    time: "12:20 PM"
  },
  {
   id: 6,
   symbol: "ITC",
   type: "sell",
   quantity: "410",
   price: 1250,
   status: "cancelled",
   time: "02:10 pm" 
  }
];

const statusStyles = {
  OPEN: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300",
  EXECUTED: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  CANCELLED: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
};

const typeStyles = {
  BUY: "text-green-600 dark:text-green-400",
  SELL: "text-red-600 dark:text-red-400",
};

const OrdersFO = () => {
  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-6">
      {/* HEADER */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          F&O Orders
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Track all your Futures & Options orders
        </p>
      </div>

      {/* DESKTOP TABLE */}
      <div className="hidden md:block">
        <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-white/10">
          <table className="w-full text-sm">
            <thead className="bg-slate-100 dark:bg-white/5">
              <tr className="text-left text-slate-600 dark:text-slate-300">
                <th className="px-4 py-3">Symbol</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Qty</th>
                <th className="px-4 py-3">Price</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Time</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr
                  key={order.id}
                  className="border-t border-slate-200 dark:border-white/10
                             hover:bg-slate-50 dark:hover:bg-white/5 transition"
                >
                  <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">
                    {order.symbol}
                  </td>
                  <td className={`px-4 py-3 font-semibold ${typeStyles[order.type]}`}>
                    {order.type}
                  </td>
                  <td className="px-4 py-3">{order.quantity}</td>
                  <td className="px-4 py-3">₹{order.price}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold
                      ${statusStyles[order.status]}`}
                    >
                      {order.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-500 dark:text-slate-400">
                    {order.time}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MOBILE VIEW */}
      <div className="md:hidden space-y-4">
        {orders.map((order) => (
          <div
            key={order.id}
            className="rounded-2xl border border-slate-200 dark:border-white/10
                       bg-white dark:bg-[#020617] p-4 shadow-sm"
          >
            <div className="flex justify-between items-start mb-2">
              <h2 className="font-semibold text-slate-900 dark:text-white">
                {order.symbol}
              </h2>
              <span
                className={`px-3 py-1 rounded-full text-xs font-semibold
                ${statusStyles[order.status]}`}
              >
                {order.status}
              </span>
            </div>

            <div className="flex justify-between text-sm">
              <span className={`font-semibold ${typeStyles[order.type]}`}>
                {order.type}
              </span>
              <span className="text-slate-500 dark:text-slate-400">
                {order.time}
              </span>
            </div>

            <div className="mt-3 flex justify-between text-sm text-slate-700 dark:text-slate-300">
              <div>
                Qty: <span className="font-medium">{order.quantity}</span>
              </div>
              <div>
                Price: <span className="font-medium">₹{order.price}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default OrdersFO;
