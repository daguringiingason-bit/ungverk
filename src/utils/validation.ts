// Client-side validation for good UX. The server re-validates everything.

export type ValidationResult<T> = { ok: true; value: T } | { ok: false; error: string };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateEmail(raw: string): ValidationResult<string> {
  const email = raw.trim().toLowerCase();
  if (!EMAIL_RE.test(email)) return { ok: false, error: 'Sláðu inn gilt netfang.' };
  return { ok: true, value: email };
}

/** Supabase email codes are 6–8 digits depending on project settings. */
export function validateOtp(raw: string): ValidationResult<string> {
  const code = raw.replace(/\s/g, '');
  if (!/^\d{6,8}$/.test(code)) return { ok: false, error: 'Kóðinn er 6–8 tölustafir.' };
  return { ok: true, value: code };
}

export function validateFirstName(raw: string): ValidationResult<string> {
  const name = raw.trim();
  if (name.length === 0) return { ok: false, error: 'Skráðu fornafn.' };
  if (name.length > 40) return { ok: false, error: 'Fornafn má vera að hámarki 40 stafir.' };
  return { ok: true, value: name };
}

/**
 * Builds an ISO date (YYYY-MM-DD) from day / month / year text fields and rejects
 * impossible dates (e.g. 31.02) and dates in the future.
 */
export function parseDateOfBirth(
  day: string,
  month: string,
  year: string,
  todayIso: string,
): ValidationResult<string> {
  const d = Number(day);
  const m = Number(month);
  const y = Number(year);
  if (!Number.isInteger(d) || !Number.isInteger(m) || !Number.isInteger(y) || year.trim().length !== 4) {
    return { ok: false, error: 'Skráðu fæðingardag sem dd / mm / áááá.' };
  }
  const date = new Date(Date.UTC(y, m - 1, d));
  if (date.getUTCFullYear() !== y || date.getUTCMonth() !== m - 1 || date.getUTCDate() !== d || y < 1901) {
    return { ok: false, error: 'Þessi dagsetning er ekki til.' };
  }
  const iso = date.toISOString().slice(0, 10);
  if (iso > todayIso) return { ok: false, error: 'Fæðingardagur getur ekki verið í framtíðinni.' };
  return { ok: true, value: iso };
}
