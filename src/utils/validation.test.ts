import { describe, expect, it } from '@jest/globals';
import { parseDateOfBirth, validateEmail, validateFirstName, validateOtp } from './validation';

const TODAY = '2026-10-07';

describe('parseDateOfBirth', () => {
  it('builds an ISO date', () => {
    expect(parseDateOfBirth('7', '3', '2011', TODAY)).toEqual({ ok: true, value: '2011-03-07' });
  });

  it('rejects impossible dates', () => {
    expect(parseDateOfBirth('31', '2', '2011', TODAY).ok).toBe(false);
    expect(parseDateOfBirth('29', '2', '2011', TODAY).ok).toBe(false);
    expect(parseDateOfBirth('29', '2', '2012', TODAY).ok).toBe(true);
  });

  it('rejects future dates and short years', () => {
    expect(parseDateOfBirth('8', '10', '2026', TODAY).ok).toBe(false);
    expect(parseDateOfBirth('1', '1', '11', TODAY).ok).toBe(false);
  });

  it('rejects empty input', () => {
    expect(parseDateOfBirth('', '', '', TODAY).ok).toBe(false);
  });
});

describe('simple validators', () => {
  it('normalises email', () => {
    expect(validateEmail('  Dagur@Example.IS ')).toEqual({ ok: true, value: 'dagur@example.is' });
    expect(validateEmail('dagur@').ok).toBe(false);
  });

  it('accepts 6–8 digit codes', () => {
    expect(validateOtp('123 456').ok).toBe(true);
    expect(validateOtp('12345678').ok).toBe(true);
    expect(validateOtp('12345').ok).toBe(false);
    expect(validateOtp('12a456').ok).toBe(false);
  });

  it('trims and limits first names', () => {
    expect(validateFirstName('  Alexander ')).toEqual({ ok: true, value: 'Alexander' });
    expect(validateFirstName('   ').ok).toBe(false);
    expect(validateFirstName('x'.repeat(41)).ok).toBe(false);
  });
});
