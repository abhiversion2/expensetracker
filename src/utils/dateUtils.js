// Helper functions for date calculations, week boundaries, and formatting

/**
 * Returns the current date in YYYY-MM-DD and time in HH:mm
 */
export function getCurrentDateTime() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return {
    date: `${year}-${month}-${day}`,
    time: `${hours}:${minutes}`,
  };
}

/**
 * Calculates start and end of week for a given date.
 * startDay: 1 = Monday (default), 0 = Sunday
 */
export function getWeekBounds(dateInput, startDay = 1) {
  const d = new Date(dateInput);
  d.setHours(0, 0, 0, 0);

  const dayOfWeek = d.getDay(); // 0 is Sunday, 1 is Monday...
  // Calculate difference to startDay
  let diff = dayOfWeek - startDay;
  if (diff < 0) {
    diff += 7;
  }

  const start = new Date(d);
  start.setDate(d.getDate() - diff);
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);

  const startYear = start.getFullYear();
  const startMonth = String(start.getMonth() + 1).padStart(2, '0');
  const startD = String(start.getDate()).padStart(2, '0');

  const endYear = end.getFullYear();
  const endMonth = String(end.getMonth() + 1).padStart(2, '0');
  const endD = String(end.getDate()).padStart(2, '0');

  const weekKey = `${startYear}-${startMonth}-${startD}_to_${endYear}-${endMonth}-${endD}`;

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const formattedRange = `${start.getDate()} ${months[start.getMonth()]} – ${end.getDate()} ${months[end.getMonth()]} ${end.getFullYear()}`;

  return {
    start,
    end,
    weekKey,
    formattedRange,
    startDateStr: `${startYear}-${startMonth}-${startD}`,
    endDateStr: `${endYear}-${endMonth}-${endD}`,
  };
}

/**
 * Checks if a given expense date string is within the given week bounds
 */
export function isDateInWeek(dateStr, weekBounds) {
  if (!dateStr) return false;
  const d = new Date(dateStr + 'T00:00:00');
  return d >= weekBounds.start && d <= weekBounds.end;
}

/**
 * Format date like "25 Aug 2026, 9:30 PM"
 */
export function formatDateTimeFriendly(dateStr, timeStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr + (timeStr ? `T${timeStr}` : 'T00:00:00'));
  if (isNaN(d.getTime())) return `${dateStr} ${timeStr || ''}`;

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const day = d.getDate();
  const month = months[d.getMonth()];
  const year = d.getFullYear();

  if (!timeStr) {
    return `${day} ${month} ${year}`;
  }

  let hours = d.getHours();
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12;

  return `${day} ${month} ${year}, ${hours}:${minutes} ${ampm}`;
}

/**
 * Format short date like "25 Aug"
 */
export function formatDateShort(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  if (isNaN(d.getTime())) return dateStr;
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${d.getDate()} ${months[d.getMonth()]}`;
}

/**
 * Format month like "August 2026"
 */
export function formatMonthYear(monthKey) {
  // monthKey is "YYYY-MM"
  if (!monthKey) return '';
  const [year, month] = monthKey.split('-');
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const idx = parseInt(month, 10) - 1;
  return `${monthNames[idx] || month} ${year}`;
}

/**
 * Collects list of unique past weeks from expenses, ensuring current week is always present.
 */
export function getUniqueWeeks(expenses, startDay = 1) {
  const map = new Map();
  // Always include current week
  const currentWeek = getWeekBounds(new Date(), startDay);
  map.set(currentWeek.weekKey, currentWeek);

  expenses.forEach(exp => {
    if (exp.date) {
      const b = getWeekBounds(exp.date, startDay);
      if (!map.has(b.weekKey)) {
        map.set(b.weekKey, b);
      }
    }
  });

  return Array.from(map.values()).sort((a, b) => b.start.getTime() - a.start.getTime());
}

/**
 * Collects list of unique months from expenses, ensuring current month is present.
 */
export function getUniqueMonths(expenses) {
  const set = new Set();
  const now = new Date();
  const curMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  set.add(curMonthKey);

  expenses.forEach(exp => {
    if (exp.date && exp.date.length >= 7) {
      set.add(exp.date.substring(0, 7));
    }
  });

  return Array.from(set).sort().reverse();
}
