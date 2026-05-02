import type { ShiftSalaryStatus, TechnicianWorkSchedule } from "@/types";

const shiftTimePattern = /^([01]\d|2[0-3]):([0-5]\d)$/;

export const shiftSalaryStatuses = ["pending", "paid", "unpaid"] as const satisfies readonly ShiftSalaryStatus[];

export function isShiftSalaryStatus(value: unknown): value is ShiftSalaryStatus {
  return typeof value === "string" && shiftSalaryStatuses.includes(value as ShiftSalaryStatus);
}

export function isValidShiftTime(value: string): boolean {
  return shiftTimePattern.test(value);
}

export function normalizeWorkDays(workDays: number[]): number[] {
  return Array.from(
    new Set(workDays.filter((day) => Number.isInteger(day) && day >= 0 && day <= 6)),
  ).sort((a, b) => a - b);
}

function minutesFromTime(value: string): number {
  const match = shiftTimePattern.exec(value);

  if (!match) {
    return Number.NaN;
  }

  return Number(match[1]) * 60 + Number(match[2]);
}

interface ScheduleWindowCheckOptions {
  graceAfterMinutes?: number;
  graceBeforeMinutes?: number;
}

interface ScheduleWindowCheckResult {
  allowed: boolean;
  warning?: string;
}

export function isWithinScheduleWindow(
  schedule: Pick<TechnicianWorkSchedule, "shiftEndTime" | "shiftStartTime" | "workDays">,
  at = new Date(),
  options: ScheduleWindowCheckOptions = {},
): ScheduleWindowCheckResult {
  const startMinutes = minutesFromTime(schedule.shiftStartTime);
  const endMinutes = minutesFromTime(schedule.shiftEndTime);

  if (!Number.isFinite(startMinutes) || !Number.isFinite(endMinutes)) {
    return { allowed: false, warning: "توقيتات الشيفت غير صالحة. راجع جدول العمل مع المدير." };
  }

  const graceBeforeMinutes = options.graceBeforeMinutes ?? 30;
  const graceAfterMinutes = options.graceAfterMinutes ?? 30;
  const currentDay = at.getDay();
  const previousDay = (currentDay + 6) % 7;
  const currentMinutes = at.getHours() * 60 + at.getMinutes();
  const crossesMidnight = endMinutes <= startMinutes;
  const workDays = new Set(schedule.workDays);

  const candidates: Array<{ end: number; now: number; start: number; startsToday: boolean }> = [];

  if (workDays.has(currentDay)) {
    candidates.push({
      end: crossesMidnight ? endMinutes + 1440 : endMinutes,
      now: currentMinutes,
      start: startMinutes,
      startsToday: true,
    });
  }

  if (crossesMidnight && workDays.has(previousDay)) {
    candidates.push({
      end: endMinutes + 1440,
      now: currentMinutes + 1440,
      start: startMinutes,
      startsToday: false,
    });
  }

  for (const candidate of candidates) {
    if (
      candidate.now >= candidate.start - graceBeforeMinutes &&
      candidate.now <= candidate.end + graceAfterMinutes
    ) {
      return { allowed: true };
    }
  }

  const todayCandidate = candidates.find((candidate) => candidate.startsToday);
  if (todayCandidate && todayCandidate.now < todayCandidate.start - graceBeforeMinutes) {
    return {
      allowed: false,
      warning: `وقت بدء الشيفت هو ${schedule.shiftStartTime}. لا يمكن تسجيل الحضور مبكراً بأكثر من 30 دقيقة.`,
    };
  }

  const latestCandidate = candidates.reduce<(typeof candidates)[number] | undefined>(
    (latest, candidate) => (!latest || candidate.end > latest.end ? candidate : latest),
    undefined,
  );
  if (latestCandidate && latestCandidate.now > latestCandidate.end + graceAfterMinutes) {
    return {
      allowed: false,
      warning: `انتهى وقت الشيفت (${schedule.shiftEndTime}). تواصل مع المشرف لتسجيل حضور متأخر.`,
    };
  }

  return { allowed: false, warning: "هذا اليوم ليس ضمن أيام عملك المحددة." };
}
