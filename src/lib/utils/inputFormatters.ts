// Formats a Pag-IBIG MID number as 4-4-4 digits.
export const formatPagibigNo = (value: string) => {
  const numbers = value.replace(/\D/g, "").slice(0, 12);
  return numbers.replace(/(\d{4})(?=\d)/g, "$1-");
};

// Formats a PhilHealth PIN as 2-9-1 digits.
export const formatPhilhealthNo = (value: string) => {
  const numbers = value.replace(/\D/g, "").slice(0, 12);
  if (numbers.length <= 2) return numbers;
  if (numbers.length <= 11) return `${numbers.slice(0, 2)}-${numbers.slice(2)}`;
  return `${numbers.slice(0, 2)}-${numbers.slice(2, 11)}-${numbers.slice(11)}`;
};

// Formats a TIN as 3-3-3-4 digits.
export const formatTinNo = (value: string) => {
  const numbers = value.replace(/\D/g, "").slice(0, 13);
  if (numbers.length <= 3) return numbers;
  if (numbers.length <= 6) return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
  if (numbers.length <= 9) return `${numbers.slice(0, 3)}-${numbers.slice(3, 6)}-${numbers.slice(6)}`;
  return `${numbers.slice(0, 3)}-${numbers.slice(3, 6)}-${numbers.slice(6, 9)}-${numbers.slice(9)}`;
};

// GSIS BP number: numeric identifier limited to 11 digits.
export const formatGsisNo = (value: string) =>
  value.replace(/\D/g, "").slice(0, 11);

// Formats a Philippine mobile number as 4-3-4 digits.
export const formatPhoneNo = (value: string) => {
  const numbers = value.replace(/\D/g, "").slice(0, 11);
  if (numbers.length <= 4) return numbers;
  if (numbers.length <= 7) return `${numbers.slice(0, 4)}-${numbers.slice(4)}`;
  return `${numbers.slice(0, 4)}-${numbers.slice(4, 7)}-${numbers.slice(7)}`;
};

// Formats a telephone number as (02) 8123-4567.
export const formatTelephoneNo = (value: string) => {
  const numbers = value.replace(/\D/g, "").slice(0, 10);
  if (numbers.length <= 2) return numbers;
  if (numbers.length <= 6) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
  return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 6)}-${numbers.slice(6)}`;
};
