import assert from "node:assert/strict";
import test from "node:test";

import { displayDate, isoDate } from "../src/filters/date-filters.js";

test("date filters handle missing and invalid values explicitly", () => {
  assert.equal(displayDate(), "");
  assert.equal(isoDate(null), "");
  assert.throws(() => isoDate("not-a-date"), /Invalid editorial date/);
});

test("date filters use UTC for date-only editorial values", () => {
  assert.equal(displayDate("2025-01-01"), "1 January 2025");
  assert.equal(isoDate(new Date("2025-01-01T23:30:00-08:00")), "2025-01-02");

  const originalTimezone = process.env.TZ;
  try {
    for (const timezone of ["Pacific/Honolulu", "Pacific/Kiritimati"]) {
      process.env.TZ = timezone;
      assert.equal(displayDate("2025-01-01"), "1 January 2025");
      assert.equal(isoDate("2025-01-01"), "2025-01-01");
    }
  } finally {
    process.env.TZ = originalTimezone;
  }
});
