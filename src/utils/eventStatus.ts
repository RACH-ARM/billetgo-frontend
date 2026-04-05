export function isEventLive(eventDate: string, doorsOpenAt: string | null, endDate: string | null): boolean {
  const now = Date.now();
  const start = doorsOpenAt ? new Date(doorsOpenAt).getTime() : new Date(eventDate).getTime();
  const end = endDate
    ? new Date(endDate).getTime()
    : start + 4 * 60 * 60 * 1000;
  return now >= start && now <= end;
}

export function isEventComingSoon(eventDate: string, doorsOpenAt: string | null): boolean {
  if (!doorsOpenAt) return false;
  const now = Date.now();
  const eventStart = new Date(eventDate).getTime();
  const doors = new Date(doorsOpenAt).getTime();
  return now >= eventStart && now < doors;
}
