// Age helpers for DISPLAY and early form feedback only.
// The database (public.age_in_years) is the authority for every eligibility decision.

/** Today's date in Iceland as YYYY-MM-DD. Iceland is UTC year-round. */
export function todayInIceland(now: Date = new Date()): string {
  return now.toISOString().slice(0, 10);
}

/** Whole years between an ISO date of birth (YYYY-MM-DD) and `today` (YYYY-MM-DD). */
export function ageInYears(dobIso: string, todayIso: string = todayInIceland()): number {
  const [by, bm, bd] = dobIso.split('-').map(Number);
  const [ty, tm, td] = todayIso.split('-').map(Number);
  if (!by || !bm || !bd || !ty || !tm || !td) {
    throw new Error(`Invalid ISO date: ${dobIso} / ${todayIso}`);
  }
  let age = ty - by;
  if (tm < bm || (tm === bm && td < bd)) age -= 1;
  return age;
}

export type AgeBounds = { min: number; max: number };

export function isWithinAge(dobIso: string, bounds: AgeBounds, todayIso?: string): boolean {
  const age = ageInYears(dobIso, todayIso);
  return age >= bounds.min && age <= bounds.max;
}
