import { z } from "zod";

/**
 * Regex rules for password complexity
 */
export const PASSWORD_REGEX = {
  UPPERCASE: /[A-Z]/,
  LOWERCASE: /[a-z]/,
  SPECIAL: /[!@#$%^&*(),.?":{}|<>]/,
};

/**
 * Reusable password validation messages
 */
export const PASSWORD_MESSAGES = {
  MIN_LENGTH: "Mật khẩu phải có ít nhất 8 ký tự",
  UPPERCASE: "Mật khẩu phải chứa ít nhất một chữ cái in hoa",
  LOWERCASE: "Mật khẩu phải chứa ít nhất một chữ cái in thường",
  SPECIAL: "Mật khẩu phải chứa ít nhất một ký tự đặc biệt",
  COMPLEXITY: "Mật khẩu phải bao gồm chữ hoa, chữ thường và ký tự đặc biệt",
};

/**
 * Reusable Zod password schema
 */
export const passwordSchema = z.string()
  .min(8, PASSWORD_MESSAGES.MIN_LENGTH)
  .regex(PASSWORD_REGEX.UPPERCASE, PASSWORD_MESSAGES.UPPERCASE)
  .regex(PASSWORD_REGEX.LOWERCASE, PASSWORD_MESSAGES.LOWERCASE)
  .regex(PASSWORD_REGEX.SPECIAL, PASSWORD_MESSAGES.SPECIAL);

/**
 * Plain JS function to validate password complexity (for non-zod forms)
 */
export function validatePasswordComplexity(password: string): string | null {
  if (password.length < 8) return PASSWORD_MESSAGES.MIN_LENGTH;
  if (!PASSWORD_REGEX.UPPERCASE.test(password)) return PASSWORD_MESSAGES.UPPERCASE;
  if (!PASSWORD_REGEX.LOWERCASE.test(password)) return PASSWORD_MESSAGES.LOWERCASE;
  if (!PASSWORD_REGEX.SPECIAL.test(password)) return PASSWORD_MESSAGES.SPECIAL;
  return null;
}
