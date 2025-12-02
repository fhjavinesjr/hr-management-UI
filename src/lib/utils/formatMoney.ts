
export const formatMoneyInput = (value: string | null | undefined) => {
  if (!value) {
    return "";
  }
  const numericValue = String(value).replace(/[^\d]/g, "");

  if (!numericValue) {
    return "";
  }

  return Number(numericValue).toLocaleString();
};
