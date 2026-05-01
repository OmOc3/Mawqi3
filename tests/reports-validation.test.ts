import test from "node:test";
import assert from "node:assert/strict";
import { submitReportSchema } from "../lib/validation/reports.ts";

test("submitReportSchema accepts a valid report payload", () => {
  const result = submitReportSchema.safeParse({
    notes: "تم الفحص",
    stationId: "station-1",
    status: ["station_ok"],
    pestTypes: ["rodents"],
  });

  assert.equal(result.success, true);
});

test("submitReportSchema requires at least one status", () => {
  const result = submitReportSchema.safeParse({
    stationId: "station-1",
    status: [],
    pestTypes: ["others"],
  });

  assert.equal(result.success, false);
});

test("submitReportSchema requires at least one pest type", () => {
  const result = submitReportSchema.safeParse({
    stationId: "station-1",
    status: ["station_ok"],
    pestTypes: [],
  });

  assert.equal(result.success, false);
});
