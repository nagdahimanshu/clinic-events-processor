/**
 * Get the start and end dates of a week from a date
 */
export function getWeekDateRange(date: Date): {
  startDate: Date;
  endDate: Date;
} {
  const d = new Date(date);
  const dayNum = d.getDay() || 7; // Convert Sunday to 7 last day of week
  const diff = d.getDate() - dayNum + 1; // Get Monday of the week

  const startDate = new Date(d);
  startDate.setDate(diff);
  startDate.setHours(0, 0, 0, 0);

  const endDate = new Date(startDate);
  endDate.setDate(startDate.getDate() + 6); // Sunday
  endDate.setHours(23, 59, 59, 999);

  return { startDate, endDate };
}

export function formatWeekDateRange(date: Date): string {
  const { startDate, endDate } = getWeekDateRange(date);

  const formatDate = (d: Date): string => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const startDateStr = formatDate(startDate);
  const endDateStr = formatDate(endDate);

  return `${startDateStr} - ${endDateStr}`;
}
