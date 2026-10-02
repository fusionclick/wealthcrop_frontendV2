import test from "node:test";
import assert from "node:assert/strict";
import { isFundSuitable } from "../src/utils/nodeApi.js";

// An unrated scheme (risk null) used to throw inside the checkout gate, so Invest did nothing.
test("an unrated fund is judged, not thrown on", () => {
  assert.doesNotThrow(() => isFundSuitable("Moderate", null, "Large Cap"));
  assert.equal(isFundSuitable("Aggressive", null, "Large Cap"), true);
  assert.equal(isFundSuitable("Conservative", null, "Liquid"), true);
});
