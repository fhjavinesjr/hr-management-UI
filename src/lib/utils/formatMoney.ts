
export const formatMoneyInput = (value: string | null | undefined) => {
  if (!value) {
    return "";
  }
  const str = String(value);
  const [intPart, decPart] = str.split(".");
  const cleanInt = intPart.replace(/[^\d]/g, "");

  if (!cleanInt) {
    return "";
  }

  const formatted = Number(cleanInt).toLocaleString();
  return decPart !== undefined ? `${formatted}.${decPart}` : formatted;
};
