/** Return a new Date converted to Asia/Seoul local time using the same instant */
export default function toKST(d: Date): Date {
  const fmt = new Intl.DateTimeFormat('ko-KR', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
  const parts = Object.fromEntries(fmt.formatToParts(d).map(part => [part.type, part.value]));
  const yyyy = Number(parts.year);
  const mm = Number(parts.month);
  const dd = Number(parts.day);
  const HH = Number(parts.hour);
  const MM = Number(parts.minute);
  const SS = Number(parts.second);
  return new Date(yyyy, mm - 1, dd, HH, MM, SS);
}
