import { getPreference } from '../state/store';
export const ThemeToggle = () => {
  const size = getPreference('fontSize');
  return size;
};
