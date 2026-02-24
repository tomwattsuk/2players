import { Filter } from 'bad-words';

const filter = new Filter();

export function validateUsername(value: string): string | null {
  if (value.length < 3) {
    return 'Username must be at least 3 characters';
  }
  if (value.length > 20) {
    return 'Username must be less than 20 characters';
  }
  if (!/^[a-zA-Z0-9_]+$/.test(value)) {
    return 'Only letters, numbers, and underscores allowed';
  }
  if (filter.isProfane(value)) {
    return 'Username contains inappropriate language';
  }
  return null;
}
