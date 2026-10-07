import { describe, expect, it } from '@jest/globals';
import { ageInYears, isWithinAge } from './age';

const WORKER = { min: 13, max: 17 };
const TODAY = '2026-10-07';

describe('ageInYears', () => {
  it('counts a birthday that is today', () => {
    expect(ageInYears('2013-10-07', TODAY)).toBe(13);
  });

  it('does not count a birthday that is tomorrow', () => {
    expect(ageInYears('2013-10-08', TODAY)).toBe(12);
  });

  it('handles 29 February birthdays in non-leap years', () => {
    expect(ageInYears('2012-02-29', '2027-02-28')).toBe(14);
    expect(ageInYears('2012-02-29', '2027-03-01')).toBe(15);
  });

  it('rejects malformed input', () => {
    expect(() => ageInYears('not-a-date', TODAY)).toThrow();
  });
});

// Mirrors the server test matrix (supabase/tests/foundation_security.sql).
describe('worker age bounds (configurable, default 13–17)', () => {
  const cases: [string, string, boolean][] = [
    ['12 (13th birthday tomorrow)', '2013-10-08', false],
    ['13 (birthday today)', '2013-10-07', true],
    ['14', '2012-01-01', true],
    ['15', '2011-01-01', true],
    ['16', '2010-01-01', true],
    ['17 (18th birthday tomorrow)', '2008-10-08', true],
    ['18 (birthday today)', '2008-10-07', false],
  ];

  it.each(cases)('%s → allowed: %s', (_label, dob, allowed) => {
    expect(isWithinAge(dob, WORKER, TODAY)).toBe(allowed);
  });

  it('respects different configured bounds', () => {
    expect(isWithinAge('2011-01-01', { min: 16, max: 17 }, TODAY)).toBe(false);
  });
});
