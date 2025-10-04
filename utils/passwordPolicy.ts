export const passwordPolicy = {
  check: (p: string) =>
    /[A-Z]/.test(p) &&
    /[a-z]/.test(p) &&
    /\d/.test(p) &&
    /[^A-Za-z0-9]/.test(p) &&
    p.length >= 8,
  message: {
    message: "Weak password: need 8+ chars, upper/lower/digit/symbol",
  },
};
