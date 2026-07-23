export function validateStrongPassword(password: string) {
  const checks = [
    { ok: password.length >= 8, message: "Minimum 8 characters" },
    { ok: /[A-Z]/.test(password), message: "At least one uppercase letter" },
    { ok: /[a-z]/.test(password), message: "At least one lowercase letter" },
    { ok: /\d/.test(password), message: "At least one number" },
    { ok: /[^A-Za-z0-9]/.test(password), message: "At least one special character" },
  ];

  return {
    valid: checks.every((check) => check.ok),
    checks,
  };
}
