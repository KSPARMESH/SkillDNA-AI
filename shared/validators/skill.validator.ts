export function validateProjectSubmission(input: {
  title?: string;
  description?: string;
  techStack?: string[];
}): { valid: boolean; errors: Array<{ field: string; message: string }> } {
  const errors: Array<{ field: string; message: string }> = [];

  if (!input.title || input.title.trim() === '') {
    errors.push({ field: 'title', message: 'Project title is required.' });
  }

  if (!input.description || input.description.length < 20) {
    errors.push({ field: 'description', message: 'Description must be at least 20 characters.' });
  }

  if (!input.techStack || input.techStack.length === 0) {
    errors.push({ field: 'techStack', message: 'At least one technology must be specified.' });
  }

  return { valid: errors.length === 0, errors };
}
