/** Cheap unique identifier for demo records — NOT a security/global id. */
export function makeId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}