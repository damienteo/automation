import test from "node:test";
import assert from "node:assert";
import { isUpcomingWednesdayLastOfMonth } from "./automation.ts";

test("Returns true when upcoming Wednesday is the last Wednesday of the month", () => {
  // Saturday, Oct 24, 2026 -> Upcoming Wednesday is Oct 28, 2026 (last Wed of Oct)
  const mockSaturday = new Date("2026-10-24T00:00:00Z");
  const result = isUpcomingWednesdayLastOfMonth(mockSaturday);
  assert.strictEqual(result, true);
});

test("Returns false when upcoming Wednesday is NOT the last Wednesday of the month", () => {
  // Saturday, Oct 17, 2026 -> Upcoming Wednesday is Oct 21, 2026 (not the last Wed)
  const mockSaturday = new Date("2026-10-17T00:00:00Z");
  const result = isUpcomingWednesdayLastOfMonth(mockSaturday);
  assert.strictEqual(result, false);
});
