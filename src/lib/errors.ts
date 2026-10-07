// Turns technical errors into short, human Icelandic messages.
// Technical details are logged for developers and never shown to users.

const KNOWN: Record<string, string> = {
  worker_age_not_allowed: 'Til að vinna í gegnum ungVERK þarftu að vera á aldrinum sem leyfður er fyrir verkafólk.',
  customer_age_not_allowed: 'Til að óska eftir aðstoð þarftu að vera fullorðinn (18 ára eða eldri).',
  invalid_role: 'Veldu hvort þú viljir vinna eða fá aðstoð.',
  profile_exists: 'Þú ert nú þegar með prófíl.',
  invalid_first_name: 'Skráðu fornafn.',
  invalid_date_of_birth: 'Fæðingardagurinn er ekki gildur.',
  invalid_municipality: 'Veldu sveitarfélag.',
  not_authenticated: 'Þú þarft að skrá þig inn aftur.',
};

export const GENERIC_ERROR = 'Eitthvað fór úrskeiðis. Reyndu aftur.';
export const NETWORK_ERROR = 'Netið virðist vera niðri. Athugaðu tenginguna og reyndu aftur.';

type ErrorLike = { message?: unknown; code?: unknown; status?: unknown; name?: unknown };

function isNetworkError(err: ErrorLike): boolean {
  const msg = typeof err.message === 'string' ? err.message : '';
  return (
    err.name === 'AuthRetryableFetchError' ||
    /network request failed|failed to fetch|fetch failed|load failed/i.test(msg)
  );
}

export function toUserMessage(error: unknown, context?: string): string {
  if (__DEV__) {
    console.warn(`[ungVERK]${context ? ` ${context}` : ''}`, error);
  }
  if (!error || typeof error !== 'object') return GENERIC_ERROR;
  const err = error as ErrorLike;
  if (isNetworkError(err)) return NETWORK_ERROR;

  const msg = typeof err.message === 'string' ? err.message : '';
  const known = KNOWN[msg];
  if (known) return known;

  if (err.code === 'otp_expired' || /token has expired or is invalid/i.test(msg)) {
    return 'Kóðinn er rangur eða útrunninn. Prófaðu aftur eða biddu um nýjan.';
  }
  if (err.status === 429 || err.code === 'over_email_send_rate_limit') {
    return 'Of margar tilraunir í einu. Bíddu aðeins og reyndu svo aftur.';
  }
  return GENERIC_ERROR;
}
