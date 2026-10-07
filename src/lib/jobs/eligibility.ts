// DISPLAY-ONLY mirror of public.worker_can_take_job(), used to tell a customer
// who will be able to take their job. The database decides; if the two ever
// disagree, the database wins and this should be fixed to match.

export type EligibilitySettings = {
  worker_min_age: number;
  worker_max_age: number;
  child_max_age: number;
  earliest_start: string; // "06:00:00"
  child_latest_end: string; // "20:00:00"
  adolescent_latest_end: string; // "22:00:00"
  school_term_active: boolean;
  child_max_minutes_school_term: number;
  child_max_minutes_holiday: number;
  adolescent_max_minutes: number;
};

export type CategoryAges = { minimum_age: number; maximum_age: number };

/** "HH:MM[:SS]" -> minutes after midnight */
export function timeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

/** Can a worker of `age` take a job starting at `startMinutes` (local) lasting `duration`? */
export function ageCanTake(
  age: number,
  minAge: number,
  category: CategoryAges,
  startMinutes: number,
  durationMinutes: number,
  s: EligibilitySettings,
): boolean {
  if (age < Math.max(s.worker_min_age, category.minimum_age, minAge)) return false;
  if (age > Math.min(s.worker_max_age, category.maximum_age)) return false;

  const end = startMinutes + durationMinutes;
  const isChild = age <= s.child_max_age;
  const latestEnd = timeToMinutes(isChild ? s.child_latest_end : s.adolescent_latest_end);
  const maxMinutes = isChild
    ? s.school_term_active
      ? s.child_max_minutes_school_term
      : s.child_max_minutes_holiday
    : s.adolescent_max_minutes;

  return (
    end < 24 * 60 &&
    startMinutes >= timeToMinutes(s.earliest_start) &&
    end <= latestEnd &&
    durationMinutes <= maxMinutes
  );
}

/** Ages (sorted) that could take the job, e.g. [13,14,15,16,17] or [16,17] or []. */
export function eligibleAges(
  minAge: number,
  category: CategoryAges,
  startMinutes: number,
  durationMinutes: number,
  s: EligibilitySettings,
): number[] {
  const ages: number[] = [];
  for (let age = s.worker_min_age; age <= s.worker_max_age; age++) {
    if (ageCanTake(age, minAge, category, startMinutes, durationMinutes, s)) ages.push(age);
  }
  return ages;
}
