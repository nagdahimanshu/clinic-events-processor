/**
 * Get the start and end dates of a week from a date
 */
export function getWeekDateRange(date: Date): { start: Date; end: Date } {
  const d = new Date(date);
  const dayNum = d.getDay() || 7; // Convert Sunday to 7 last day of week
  const diff = d.getDate() - dayNum + 1; // Get Monday of the week

  const start = new Date(d);
  start.setDate(diff);
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(start.getDate() + 6); // Sunday
  end.setHours(23, 59, 59, 999);

  return { start, end };
}

export function formatWeekDateRange(date: Date): string {
  const { start, end } = getWeekDateRange(date);

  const formatDate = (d: Date): string => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const startStr = formatDate(start);
  const endStr = formatDate(end);

  return `${startStr} - ${endStr}`;
}
