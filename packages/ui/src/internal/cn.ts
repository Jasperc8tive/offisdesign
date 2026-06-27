/** Local class-name composer. Mirrors @offisdesign/utils cn, kept inside ui so
 *  emit stays within rootDir. */
export function cn(...values: Array<string | false | null | undefined>): string {
  return values.filter(Boolean).join(' ');
}
