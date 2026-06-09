
export const formatMMDDYYYY = (date: Date) => {
  const d = new Date(date);

  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const yyyy = d.getFullYear();

  return toDateInputValue(`${mm}-${dd}-${yyyy}`);
};

/**
 * Converts a date string from "MM-dd-yyyy HH:mm:ss" to "yyyy-MM-dd"
 * (Used to populate HTML date input fields)
 */
export const toDateInputValue = (customFormat: string): string => {
  if (!customFormat) return "";
  const first = String(customFormat).split(" ")[0]; // take MM-dd-yyyy part
  const parts = first.split("-");
  if (parts.length !== 3) return "";
  const [p1, p2, p3] = parts;
  // Validate numeric parts
  const isNumeric = (s: string) => /^\d+$/.test(s);
  if (!isNumeric(p1) || !isNumeric(p2) || !isNumeric(p3)) return "";

  // If format is yyyy-MM-dd
  if (p1.length === 4) {
    const year = p1.padStart(4, "0");
    const month = p2.padStart(2, "0");
    const day = p3.padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  // Assume MM-dd-yyyy
  const month = p1.padStart(2, "0");
  const day = p2.padStart(2, "0");
  const year = p3.padStart(4, "0");
  return `${year}-${month}-${day}`;
};

export const toDateInputValueExplicit = (customFormat: string): string => {
  // Handle both MM-DD-YYYY and YYYY-MM-DD
  const parts = customFormat.split("-");
  const  month = parseInt(parts[0], 10);
  const  day = parseInt(parts[1], 10);
  const  year = parseInt(parts[2], 10);

  // Pad with leading zeros to always match input[type="date"]
  const mm = String(month).padStart(2, "0");
  const dd = String(day).padStart(2, "0");
  
  console.log(`${year}-${mm}-${dd}`);
  return `${year}-${mm}-${dd}`;
};

/**
 * Converts a date string from "yyyy-MM-dd" to "MM-dd-yyyy HH:mm:ss"
 * - isStart: true => time = 00:00:00
 * - isStart: false => time = 23:59:59
 */
export const toCustomFormat = (inputValue: string, isStart: boolean): string => {
  if (!inputValue) return "";
  const parts = String(inputValue).split("-");
  if (parts.length !== 3) return "";
  const [yearStr, monthStr, dayStr] = parts;
  // Validate numeric components
  if (!/^\d{4}$/.test(yearStr) || !/^\d{1,2}$/.test(monthStr) || !/^\d{1,2}$/.test(dayStr)) return "";
  const year = yearStr;
  const month = String(Number(monthStr)).padStart(2, "0");
  const day = String(Number(dayStr)).padStart(2, "0");
  const time = isStart ? "00:00:00" : "23:59:59";
  return `${month}-${day}-${year} ${time}`;
};

/**
 * Convert a backend custom datetime string like "MM-dd-yyyy HH:mm:ss"
 * into a short, user-friendly display string (e.g. "Dec 19, 2025").
 * If parsing fails, returns the date part (MM-dd-yyyy) or an empty string.
 */
export const customToLocaleDate = (customFormat: string): string => {
  if (!customFormat) return "";
  const datePart = String(customFormat).split(" ")[0]; // MM-dd-yyyy
  const [monthStr, dayStr, yearStr] = datePart.split("-");
  const month = Number(monthStr);
  const day = Number(dayStr);
  const year = Number(yearStr);
  if (!month || !day || !year) return datePart;
  const d = new Date(year, month - 1, day);
  try {
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return datePart;
  }
};

/**
 * Get only the date portion (MM-dd-yyyy) from the custom format.
 */
export const stripTimeFromCustomFormat = (customFormat: string): string => {
  if (!customFormat) return "";
  return String(customFormat).split(" ")[0];
};

/**
 * Get the first date of month
 * Accepting numbers e.g month(1,2,3,4,5,6,7,8,9,10,11,12) and year(2025)
 */
export const getFirstDateOfMonth = (month: number, year: number): string => {
  const monthStart = `${year}-${String(month).padStart(2, "0")}-01`;
  return `${toCustomFormat(monthStart, true)}`;
};

/**
 * Get the last date of month
 * Accepting numbers e.g month(1,2,3,4,5,6,7,8,9,10,11,12) and year(2025)
 */
export const getLastDateOfMonth = (month: number, year: number): string => {
  const monthEnd = new Date(year, month, 0); // last day of the month
  const monthEndStr = `${year}-${String(month).padStart(2, "0")}-${String(
    monthEnd.getDate()
  ).padStart(2, "0")}`;
  return `${toCustomFormat(monthEndStr, false)}`;
};