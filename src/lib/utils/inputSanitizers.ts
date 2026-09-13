// Removes angle brackets, normalizes spaces, and limits general text.
export const sanitizeText = (value: string, maxLength = 100) =>
  value
    .replace(/[<>]/g, "")
    .replace(/\s+/g, " ")
    .trimStart()
    .slice(0, maxLength);

// Allows letters, spaces, periods, apostrophes, and hyphens.
export const sanitizeName = (value: string, maxLength = 100) =>
  value
    .replace(/[^a-zA-ZÀ-ÿ\s.'-]/g, "")
    .replace(/\s+/g, " ")
    .trimStart()
    .slice(0, maxLength);

export const sanitizeShortName = (value: string, maxLength = 30) =>
  value
    .replace(/[^a-zA-ZÀ-ÿ0-9\s.'-]/g, "")
    .replace(/\s+/g, " ")
    .trimStart()
    .slice(0, maxLength);

export const sanitizeCity = (value: string, maxLength = 100) =>
  value
    .replace(/[^a-zA-ZÀ-ÿ\s.'-]/g, "")
    .replace(/\s+/g, " ")
    .trimStart()
    .slice(0, maxLength);

// Allows common address characters and limits the result length.
export const sanitizeAddress = (value: string, maxLength = 200) =>
  value
    .replace(/[^a-zA-Z0-9À-ÿ\s#.,'\/-]/g, "")
    .replace(/\s+/g, " ")
    .trimStart()
    .slice(0, maxLength);

// Keeps digits only and limits the result length.
export const sanitizeNumbers = (value: string, maxLength = 30) =>
  value.replace(/\D/g, "").slice(0, maxLength);

export const sanitizeZipCode = (value: string) =>
  sanitizeNumbers(value, 4);

export const sanitizeDate = (value: string) =>
  /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : "";

// Keeps a non-negative decimal value with up to two decimal places.
export const sanitizeAmount = (value: string) => {
  const sanitized = value
    .replace(/,/g, "")
    .replace(/[^\d.]/g, "")
    .replace(/(\..*)\./g, "$1");
  const [whole, decimal] = sanitized.split(".");
  return whole + (decimal !== undefined ? `.${decimal.slice(0, 2)}` : "");
};

// Keeps a numeric value with one optional decimal point.
export const sanitizeDecimal = (value: string, maxLength = 20) =>
  value
    .replace(/[^\d.]/g, "")
    .replace(/(\..*)\./g, "$1")
    .slice(0, maxLength);

// Removes whitespace and limits an email address.
export const sanitizeEmail = (value: string) =>
  value.replace(/\s/g, "").slice(0, 254);
