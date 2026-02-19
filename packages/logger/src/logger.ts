/**
 * Environment detection: Vite/Astro replaces `import.meta.env.DEV` at build time
 * (tree-shakeable). Falls back to `process.env.NODE_ENV` for Node.js contexts (tests, scripts).
 */
const isDev: boolean =
  import.meta.env?.DEV ?? (typeof process !== 'undefined' && process.env.NODE_ENV !== 'production');

/**
 * Log an error message. Always outputs regardless of environment.
 * Use for real errors that need production visibility.
 */
export function logError(msg: string, ...args: unknown[]): void {
  console.error(msg, ...args);
}

/**
 * Log a warning message. Always outputs regardless of environment.
 * Use for potential problems that need production visibility.
 */
export function logWarn(msg: string, ...args: unknown[]): void {
  console.warn(msg, ...args);
}

/**
 * Log an informational message. Suppressed in production builds.
 * Use for general informational output during development.
 */
export function logInfo(msg: string, ...args: unknown[]): void {
  if (isDev) {
    console.info(msg, ...args);
  }
}

/**
 * Log a debug message. Suppressed in production builds.
 * Use for verbose debugging output during development.
 */
export function logDebug(msg: string, ...args: unknown[]): void {
  if (isDev) {
    console.debug(msg, ...args);
  }
}
