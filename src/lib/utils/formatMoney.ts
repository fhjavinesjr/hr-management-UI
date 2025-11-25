
export const formatMoneyInput = (value: string) => {
  // Remove all non-digit characters
  const numericValue = value.replace(/[^\d]/g, "");

  if (!numericValue) return "";

  // Format with commas
  return new Intl.NumberFormat("en-US").format(Number(numericValue));
};
