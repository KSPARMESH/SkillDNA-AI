export function formatDateIso(date: Date | string): string {
  return new Date(date).toISOString();
}

export function isExpired(expiryDate: Date | string): boolean {
  return new Date(expiryDate).getTime() < Date.now();
}

export function getDaysDifference(startDate: Date | string, endDate: Date | string): number {
  const diffTime = Math.abs(new Date(endDate).getTime() - new Date(startDate).getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}
