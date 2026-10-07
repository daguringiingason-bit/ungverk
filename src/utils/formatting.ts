// Icelandic display formatting. Iceland is UTC year-round, so UTC getters give local time.

const WEEKDAYS = ['Sunnudagur', 'Mánudagur', 'Þriðjudagur', 'Miðvikudagur', 'Fimmtudagur', 'Föstudagur', 'Laugardagur'];
const WEEKDAYS_SHORT = ['Sun', 'Mán', 'Þri', 'Mið', 'Fim', 'Fös', 'Lau'];
const MONTHS = ['jan.', 'feb.', 'mars', 'apríl', 'maí', 'júní', 'júlí', 'ágúst', 'sept.', 'okt.', 'nóv.', 'des.'];

/** 8000 -> "8.000 kr." */
export function formatIsk(amount: number): string {
  const grouped = Math.round(amount)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${grouped} kr.`;
}

const pad = (n: number) => n.toString().padStart(2, '0');

/** "13:00" */
export function formatTime(date: Date): string {
  return `${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}`;
}

/** "Laugardagur 11. okt." */
export function formatDay(date: Date): string {
  return `${WEEKDAYS[date.getUTCDay()]} ${date.getUTCDate()}. ${MONTHS[date.getUTCMonth()]}`;
}

/** Short chip label: "Lau 11." */
export function formatDayShort(date: Date): string {
  return `${WEEKDAYS_SHORT[date.getUTCDay()]} ${date.getUTCDate()}.`;
}

/** "13:00–15:00" */
export function formatTimeRange(start: Date, durationMinutes: number): string {
  const end = new Date(start.getTime() + durationMinutes * 60_000);
  return `${formatTime(start)}–${formatTime(end)}`;
}

/** 90 -> "1½ klst.", 30 -> "30 mín." */
export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} mín.`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (rest === 0) return `${hours} klst.`;
  if (rest === 30) return `${hours}½ klst.`;
  return `${hours} klst. ${rest} mín.`;
}
