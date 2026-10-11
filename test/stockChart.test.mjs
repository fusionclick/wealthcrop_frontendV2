import test from "node:test";
import assert from "node:assert/strict";
import { quoteCandle } from "../src/utils/stockChart.js";

const sec = (s) => Date.parse(s) / 1000;
const friday = { time: sec("2026-10-09T03:45:00Z"), open: 1300, high: 1310, low: 1290, close: 1303.7 };

test("latest trading session uses the header quote, including after close and weekends", () => {
  const candle = quoteCandle(friday, { lastPrice: 1178, lastTradeTime: sec("2026-10-09T10:00:00Z") });
  assert.equal(candle.close, 1178);
  assert.equal(candle.time, friday.time);
  assert.equal(candle.low, 1178);
  assert.equal(friday.close, 1303.7, "published history is not mutated");
  assert.deepEqual(quoteCandle(friday, { lastPrice: 1178, lastTradeTime: sec("2026-10-09T10:00:00Z"), open: 1170, intraDayHighLow: { min: 1160.2, max: 1179 } }), {
    time: friday.time, open: 1170, high: 1179, low: 1160.2, close: 1178,
  }, "the latest candle's OHLC all use the quote feed when available");
});

test("a quote older than the latest chart session cannot overwrite it", () => {
  assert.equal(quoteCandle(friday, { lastPrice: 1178, lastTradeTime: sec("2026-10-08T10:00:00Z") }), null);
  assert.equal(quoteCandle(friday, { lastPrice: 1178, lastTradeTime: null }), null);
  assert.equal(quoteCandle(friday, { lastPrice: 0, lastTradeTime: friday.time }), null);
});

test("a new trading session appends a quote candle rather than changing Friday", () => {
  const time = sec("2026-10-12T04:00:00Z");
  const candle = quoteCandle(friday, { lastPrice: 1400, lastTradeTime: time, open: 1380, intraDayHighLow: { max: 1410, min: 1370 } });
  assert.deepEqual(candle, { time: sec("2026-10-12T03:45:00Z"), open: 1380, high: 1410, low: 1370, close: 1400 });
  assert.equal(quoteCandle(candle, { lastPrice: 1401, lastTradeTime: time + 5 }).time, candle.time, "polls do not append another daily candle");
});
