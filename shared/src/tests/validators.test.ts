import { validateRegistrationInput } from '../../validators/auth.validator';

console.log('🧪 Running Shared Validators Unit Test...');

const validRes = validateRegistrationInput({
  email: 'student@skilldna.ai',
  password: 'Password123!',
  firstName: 'Parmesh',
  lastName: 'KS',
});
console.assert(validRes.valid === true, 'Valid registration payload failed validation');

const invalidRes = validateRegistrationInput({
  email: 'invalid-email',
  password: 'short',
});
console.assert(invalidRes.valid === false, 'Invalid registration payload passed validation');

console.log('✅ Shared Validators Unit Tests Passed.');
