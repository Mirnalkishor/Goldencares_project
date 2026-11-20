export const isValidPhoneNumber = (value) => {
  const phone = value.trim();
  const digitCount = phone.replace(/\D/g, "").length;
  return /^\+?[0-9\s()-]{8,20}$/.test(phone) && digitCount >= 8 && digitCount <= 15;
};
export const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
