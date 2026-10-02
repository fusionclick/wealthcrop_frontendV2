/** Adapt delivery trades to the existing tax-lot matcher; never treat open orders as fills. */
export function stockTradeOrders(trades = []) {
  return trades.map((trade) => {
    const quantity = Number(trade.quantity);
    const gross = quantity * Number(trade.price);
    const amount = gross + (trade.side === 'BUY' ? 1 : -1) * Number(trade.charges || 0);
    return {
      id: String(trade.id), date: trade.traded_at, type: trade.side === 'BUY' ? 'p' : 'r',
      status: 'Executed', units: quantity, nav: amount / quantity, amount,
      scheme_bse_code: `${trade.broker}:${trade.exchange}:${trade.symbol}`,
      scheme_name: trade.symbol,
    };
  });
}
