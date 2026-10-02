import test from 'node:test';
import assert from 'node:assert/strict';
import { stockTradeOrders } from '../src/utils/stockTrades.js';
import { matchLots } from '../src/utils/taxlots.js';

test('delivery capital gains match real shares, net of charges, separately for each broker', () => {
  const common = { broker: 'kotak', exchange: 'NSE', symbol: 'RELIANCE' };
  const orders = stockTradeOrders([
    { ...common, id: 1, side: 'BUY', quantity: 10, price: 100, charges: 10, traded_at: '2025-01-01T10:00:00Z' },
    { ...common, id: 2, side: 'SELL', quantity: 5, price: 150, charges: 5, traded_at: '2026-02-01T10:00:00Z' },
    { ...common, broker: 'zerodha', id: 3, side: 'SELL', quantity: 1, price: 200, charges: 1, traded_at: '2026-02-01T10:00:00Z' },
  ]);
  const result = matchLots(orders, { categories: { 'kotak:NSE:RELIANCE': 'Equity' } });
  assert.equal(result.realised[0].gain, 240);
  assert.equal(result.realised[0].term, 'long');
  assert.equal(result.openLots[0].units, 5);
  assert.equal(result.unmatched.length, 1);
});
