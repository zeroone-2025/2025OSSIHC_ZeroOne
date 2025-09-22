import { Pref, Visit } from './types';

const PREF_KEY = 'pref';
const VISITS_KEY = 'visits';

const defaultPreferences: Pref = {
  mode: 'light',
  allergies: [],
  dislikes: [],
  groupSize: 1,
  weather: true,
};

export function getPreferences(): Pref {
  if (typeof window === 'undefined') return defaultPreferences;

  try {
    const stored = localStorage.getItem(PREF_KEY);
    if (!stored) return defaultPreferences;
    return { ...defaultPreferences, ...JSON.parse(stored) };
  } catch {
    return defaultPreferences;
  }
}

export function setPreferences(pref: Partial<Pref>): void {
  if (typeof window === 'undefined') return;

  const current = getPreferences();
  const updated = { ...current, ...pref };
  localStorage.setItem(PREF_KEY, JSON.stringify(updated));
}

export function getVisits(): Visit[] {
  if (typeof window === 'undefined') return [];

  try {
    const stored = localStorage.getItem(VISITS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function addVisit(visit: Visit): void {
  if (typeof window === 'undefined') return;

  const visits = getVisits();
  visits.push(visit);
  localStorage.setItem(VISITS_KEY, JSON.stringify(visits));
}

export function getRecentRestaurantIds(days: number = 7): string[] {
  const visits = getVisits();
  const cutoff = Date.now() - (days * 24 * 60 * 60 * 1000);
  return visits
    .filter(v => v.timestamp > cutoff)
    .map(v => v.restaurantId);
}
