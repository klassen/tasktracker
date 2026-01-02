/**
 * Date/Time Utilities for Task Tracker
 * 
 * 🚨 CRITICAL: Always use local time, NEVER UTC or ISO dates!
 * All dates in the database are stored as local datetime strings (YYYY-MM-DD HH:MM:SS).
 * 
 * ⚠️ SERVER-SIDE USAGE WARNING:
 * Do NOT use getLocalDate() or getLocalDateTime() in API routes for business logic
 * that depends on "today" or current date/time, because:
 * - Development server runs in your local timezone
 * - Production server (Vercel) runs in UTC timezone
 * - This causes date mismatches (e.g., Jan 1 locally vs Jan 2 in UTC)
 * 
 * CORRECT PATTERN for APIs:
 * 1. Client calls getLocalDate() to get their local date
 * 2. Client sends localDate as query param or request body
 * 3. Server uses the client-provided date for all calculations
 * 
 * ACCEPTABLE SERVER-SIDE USES:
 * - Record timestamps (createdAt, updatedAt) - these are metadata, not business logic
 * - Backward compatibility fallbacks (with comments explaining why)
 * 
 * Examples of APIs fixed to use this pattern:
 * - /api/calendar/events - requires localDate param
 * - /api/tasks/[id]/complete - requires completedDate in body
 * - /api/reports/[personId] - requires localDate param
 * - /api/people - requires localDate param
 */

/**
 * Get current local datetime as string
 * @returns Local datetime string in format: YYYY-MM-DD HH:MM:SS
 */
export function getLocalDateTime(): string {
  const now = new Date();
  return formatLocalDateTime(now);
}

/**
 * Format a Date object to local datetime string
 * @param date - JavaScript Date object
 * @returns Local datetime string in format: YYYY-MM-DD HH:MM:SS
 */
export function formatLocalDateTime(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

/**
 * Parse a local datetime string to Date object
 * @param dateString - Local datetime string in format: YYYY-MM-DD HH:MM:SS
 * @returns JavaScript Date object
 */
export function parseLocalDateTime(dateString: string): Date {
  // Replace space with 'T' and add local timezone indicator
  const isoLike = dateString.replace(' ', 'T');
  return new Date(isoLike);
}

/**
 * Get local date string (without time)
 * @returns Local date string in format: YYYY-MM-DD
 */
export function getLocalDate(): string {
  const now = new Date();
  return formatLocalDate(now);
}

/**
 * Format a Date object to local date string (without time)
 * @param date - JavaScript Date object
 * @returns Local date string in format: YYYY-MM-DD
 */
export function formatLocalDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
}

/**
 * Format datetime string for display
 * @param dateString - Local datetime string
 * @returns Human-readable date string
 */
export function formatDisplayDate(dateString: string): string {
  const date = parseLocalDateTime(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Format datetime string for display with time
 * @param dateString - Local datetime string
 * @returns Human-readable datetime string
 */
export function formatDisplayDateTime(dateString: string): string {
  const date = parseLocalDateTime(dateString);
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Get day of week for today (0 = Sunday, 6 = Saturday)
 * @returns Day of week as number
 */
export function getTodayDayOfWeek(): number {
  const now = new Date();
  return now.getDay();
}

/**
 * Check if a task is active today based on activeDays
 * @param activeDays - Comma-separated days: "0,1,2,3,4,5,6"
 * @returns true if task is active today
 */
export function isTaskActiveToday(activeDays: string): boolean {
  const today = getTodayDayOfWeek();
  const days = activeDays.split(',').map(d => parseInt(d.trim()));
  return days.includes(today);
}

/**
 * Get an array of the last N days as date strings
 * @param days - Number of days to include (including today)
 * @returns Array of date strings in format YYYY-MM-DD, from oldest to newest
 */
export function getLastNDays(days: number): string[] {
  const dates: string[] = [];
  const today = new Date();
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    dates.push(formatLocalDate(date));
  }
  
  return dates;
}
