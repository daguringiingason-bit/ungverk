import { describe, expect, it } from '@jest/globals';

import { eligibleAges, type EligibilitySettings } from './eligibility';

// Defaults from platform_settings (reglugerð 426/1999).
const S: EligibilitySettings = {
  worker_min_age: 13,
  worker_max_age: 17,
  child_max_age: 15,
  earliest_start: '06:00:00',
  child_latest_end: '20:00:00',
  adolescent_latest_end: '22:00:00',
  school_term_active: true,
  child_max_minutes_school_term: 120,
  child_max_minutes_holiday: 420,
  adolescent_max_minutes: 480,
};
const LIGHT = { minimum_age: 13, maximum_age: 17 }; // e.g. Garðvinna
const MOWING = { minimum_age: 16, maximum_age: 17 }; // Garðsláttur
const h = (hh: number, mm = 0) => hh * 60 + mm;

describe('eligibleAges (mirror of worker_can_take_job)', () => {
  it('light job in the afternoon: 13–17', () => {
    expect(eligibleAges(13, LIGHT, h(14), 60, S)).toEqual([13, 14, 15, 16, 17]);
  });

  it('category minimum wins over a lower customer request', () => {
    expect(eligibleAges(13, MOWING, h(14), 60, S)).toEqual([16, 17]);
  });

  it('customer can ask for older workers', () => {
    expect(eligibleAges(15, LIGHT, h(14), 60, S)).toEqual([15, 16, 17]);
  });

  it('children may not work past 20:00, 16+ until 22:00', () => {
    expect(eligibleAges(13, LIGHT, h(19, 30), 60, S)).toEqual([16, 17]);
    expect(eligibleAges(13, LIGHT, h(21, 30), 60, S)).toEqual([]);
  });

  it('nobody before 06:00', () => {
    expect(eligibleAges(13, LIGHT, h(5, 30), 60, S)).toEqual([]);
  });

  it('school term: children max 2 h; holiday: 7 h', () => {
    expect(eligibleAges(13, LIGHT, h(10), 180, S)).toEqual([16, 17]);
    expect(eligibleAges(13, LIGHT, h(10), 180, { ...S, school_term_active: false })).toEqual([13, 14, 15, 16, 17]);
  });
});
