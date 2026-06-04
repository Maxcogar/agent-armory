export interface Preferences { fontSize: number }
export function getPreference<K extends keyof Preferences>(k: K): Preferences[K] {
  return ({ fontSize: 14 } as Preferences)[k];
}
