export function sanitizeSearchInput(input: string): string {
  return input.replace(/[^\w\s-]/gi, '').trim();
}
