export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validateRegistrationInput(input: {
  email?: string;
  password?: string;
  firstName?: string;
  lastName?: string;
}): { valid: boolean; errors: Array<{ field: string; message: string }> } {
  const errors: Array<{ field: string; message: string }> = [];

  if (!input.email || !isValidEmail(input.email)) {
    errors.push({ field: 'email', message: 'Valid email address is required.' });
  }

  if (!input.password || input.password.length < 8) {
    errors.push({ field: 'password', message: 'Password must be at least 8 characters long.' });
  }

  if (!input.firstName || input.firstName.trim() === '') {
    errors.push({ field: 'firstName', message: 'First name is required.' });
  }

  if (!input.lastName || input.lastName.trim() === '') {
    errors.push({ field: 'lastName', message: 'Last name is required.' });
  }

  return { valid: errors.length === 0, errors };
}
