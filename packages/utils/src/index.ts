/**
 * Framework-free, side-effect-free utility helpers.
 * Populated as stages require; kept pure and 100% unit-tested.
 */

/** Compose class name strings, ignoring falsy values. */
export function cn(...values: Array<string | false | null | undefined>): string {
  return values.filter(Boolean).join(' ');
}
