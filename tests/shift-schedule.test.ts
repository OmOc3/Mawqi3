import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { isValidShiftTime, isWithinScheduleWindow, normalizeWorkDays } from "@/lib/shifts/schedule";

const monday = new Date(2026, 4, 4, 0, 0, 0, 0);
const tuesday = new Date(2026, 4, 5, 0, 0, 0, 0);

function at(base: Date, hours: number, minutes: number): Date {
  const value = new Date(base);
  value.setHours(hours, minutes, 0, 0);
  return value;
}

describe("shift schedule helpers", () => {
  it("validates 24-hour HH:MM values", () => {
    assert.equal(isValidShiftTime("08:00"), true);
    assert.equal(isValidShiftTime("23:59"), true);
    assert.equal(isValidShiftTime("24:00"), false);
    assert.equal(isValidShiftTime("12:70"), false);
  });

  it("normalizes work days", () => {
    assert.deepEqual(normalizeWorkDays([6, 1, 1, -1, 3, 7, 0]), [0, 1, 3, 6]);
  });

  it("allows a same-day shift inside the grace window only", () => {
    const schedule = { workDays: [1], shiftStartTime: "08:00", shiftEndTime: "17:00" };

    assert.equal(isWithinScheduleWindow(schedule, at(monday, 7, 45)).allowed, true);
    assert.equal(isWithinScheduleWindow(schedule, at(monday, 17, 30)).allowed, true);
    assert.equal(isWithinScheduleWindow(schedule, at(monday, 7, 20)).allowed, false);
    assert.equal(isWithinScheduleWindow(schedule, at(monday, 17, 31)).allowed, false);
    assert.equal(isWithinScheduleWindow(schedule, at(tuesday, 8, 0)).allowed, false);
  });

  it("supports overnight shifts that end on the next day", () => {
    const schedule = { workDays: [1], shiftStartTime: "22:00", shiftEndTime: "06:00" };

    assert.equal(isWithinScheduleWindow(schedule, at(monday, 21, 45)).allowed, true);
    assert.equal(isWithinScheduleWindow(schedule, at(tuesday, 2, 0)).allowed, true);
    assert.equal(isWithinScheduleWindow(schedule, at(tuesday, 6, 30)).allowed, true);
    assert.equal(isWithinScheduleWindow(schedule, at(monday, 21, 20)).allowed, false);
    assert.equal(isWithinScheduleWindow(schedule, at(tuesday, 6, 31)).allowed, false);
  });
});
