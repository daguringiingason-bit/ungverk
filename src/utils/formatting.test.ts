import { describe, expect, it } from '@jest/globals';

import { formatDay, formatDuration, formatIsk, formatTimeRange } from './formatting';

describe('formatting', () => {
  it('formats ISK with dot grouping', () => {
    expect(formatIsk(8000)).toBe('8.000 kr.');
    expect(formatIsk(500)).toBe('500 kr.');
    expect(formatIsk(125000)).toBe('125.000 kr.');
  });

  it('formats Icelandic days and time ranges', () => {
    const d = new Date(Date.UTC(2026, 9, 10, 13, 0)); // Saturday 10 Oct 2026, 13:00
    expect(formatDay(d)).toBe('Laugardagur 10. okt.');
    expect(formatTimeRange(d, 120)).toBe('13:00–15:00');
  });

  it('formats durations', () => {
    expect(formatDuration(30)).toBe('30 mín.');
    expect(formatDuration(60)).toBe('1 klst.');
    expect(formatDuration(90)).toBe('1½ klst.');
    expect(formatDuration(135)).toBe('2 klst. 15 mín.');
  });
});
