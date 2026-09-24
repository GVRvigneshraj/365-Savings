import { addDays, localDateKey } from './money';

export interface StreakInput {
  date: string;
  slotsCompleted: number;
}

export interface StreakResult {
  current: number;
  longest: number;
}

function dayDifference(aKey: string, bKey: string): number {
  const a = new Date(`${aKey}T00:00:00`);
  const b = new Date(`${bKey}T00:00:00`);
  return Math.round((a.getTime() - b.getTime()) / 86400000);
}

/**
 * Streaks are derived purely from payment activity (payments that completed at
 * least one new savings slot). Calendar dates never create progress on their own.
 */
export function computeStreaks(payments: StreakInput[]): StreakResult {
  const activeDays = [
    ...new Set(
      payments
        .filter((payment) => payment.slotsCompleted > 0)
        .map((payment) => localDateKey(payment.date)),
    ),
  ].sort();

  if (activeDays.length === 0) return { current: 0, longest: 0 };

  let longest = 1;
  let run = 1;
  for (let i = 1; i < activeDays.length; i++) {
    const gap = dayDifference(activeDays[i], activeDays[i - 1]);
    run = gap === 1 ? run + 1 : 1;
    longest = Math.max(longest, run);
  }

  const today = localDateKey(new Date());
  const yesterday = localDateKey(addDays(new Date(), -1));
  const latest = activeDays[activeDays.length - 1];

  if (latest !== today && latest !== yesterday) return { current: 0, longest };

  let current = 1;
  for (let i = activeDays.length - 1; i > 0; i--) {
    if (dayDifference(activeDays[i], activeDays[i - 1]) === 1) current++;
    else break;
  }

  return { current, longest };
}
