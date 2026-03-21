/**
 * Groq console selectors - multiple fallbacks for robustness
 * If one changes (id/class/text), others may still find the element
 */

export const LOGIN_BUTTON = [
  'a[href="https://console.groq.com/login"]',
  'a[href*="/login"]',
  'a:has-text("Log In")',
  'a:has-text("Login")',
  'button:has-text("Log in")',
  'button:has-text("Sign in")',
  '[data-testid="login"]',
];

export const EMAIL_INPUT = [
  'input#email-input',
  'input[name="email"]',
  'input[type="email"]',
  'input[placeholder="example@email.com"]',
  'input[placeholder*="email"]',
  'input[autocomplete="email"]',
];

export const CONTINUE_EMAIL_BUTTON = [
  'button:has-text("Continue with email")',
  'button[type="submit"]:has-text("Continue")',
  'button[type="submit"]',
  'button:has-text("Continue")',
  'button:has-text("Next")',
  'input[type="submit"]',
];

export const CREATE_API_KEY_BUTTON = [
  'button:has-text("Create API key")',
  'button:has-text("Create API Key")',
  'a:has-text("Create API key")',
  'button:has-text("Create")',
  '[data-testid="create-api-key"]',
];

export const API_KEY_NAME_INPUT = [
  'input[name="name"]',
  'input#name',
  'input[placeholder*="name"]',
  'input[placeholder*="Name"]',
  'input[type="text"]:not([type="search"])',
];

export const NO_EXPIRATION_OPTION = [
  'input[value="never"]',
  'input[value="no_expiration"]',
  'label:has-text("No expiration")',
  'label:has-text("Never")',
  '[data-value="never"]',
  'input[type="radio"][value*="never"]',
];

export const CREATE_SUBMIT_BUTTON = [
  'button:has-text("Create API key")',
  'button:has-text("Create")',
  'button[type="submit"]',
  '[data-testid="create-key-submit"]',
];

export const API_KEY_DISPLAY = [
  'code',
  '[data-testid="api-key"]',
  'input[readonly]',
  'pre',
  '[class*="api-key"]',
];

/** Selectors for error messages on Groq login/registration page */
export const PAGE_ERROR_SELECTORS = [
  '[role="alert"]',
  '[role="status"][aria-live="assertive"]',
  '[class*="error"]',
  '[class*="Error"]',
  '[class*="alert"]',
  '[data-testid*="error"]',
  '.Toastify__toast--error',
  'p[class*="error"]',
  'div[class*="error"]',
  '[id*="error"]',
];
