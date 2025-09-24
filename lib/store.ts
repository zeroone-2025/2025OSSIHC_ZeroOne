import type { SessionState } from './state';
import { Pref, Visit } from './types';

interface PendingReview { placeId: string; decidedAt: number }

const PREF_KEY = 'pref';
const LEGACY_PREF_KEY = 'settings';
const VISITS_KEY = 'visits';
const PENDING_REVIEW_KEY = 'pendingReview';
const SESSION_KEY = 'session';

const defaultPreferences: Pref = {
  allergies: [],
  dislikes: [],
  weather: true,
};

function migrateLegacyPreferences(): Pref | null {
  if (typeof window === 'undefined') return null;

  try {
    const legacyRaw = localStorage.getItem(LEGACY_PREF_KEY);
    if (!legacyRaw) return null;
    const legacy = JSON.parse(legacyRaw);
    const migrated: Pref = {
      allergies: Array.isArray(legacy?.allergies) ? legacy.allergies : [],
      dislikes: Array.isArray(legacy?.dislikes) ? legacy.dislikes : [],
      weather: typeof legacy?.weather === 'boolean' ? legacy.weather : true,
    };
    if (legacy?.mode) migrated.mode = legacy.mode;
    if (legacy?.groupSize) migrated.groupSize = Number(legacy.groupSize) || undefined;
    localStorage.setItem(PREF_KEY, JSON.stringify(migrated));
    localStorage.removeItem(LEGACY_PREF_KEY);
    return migrated;
  } catch {
    return null;
  }
}

export function getPreferences(): Pref {
  if (typeof window === 'undefined') return defaultPreferences;

  try {
    const stored = localStorage.getItem(PREF_KEY);
    if (!stored) {
      return migrateLegacyPreferences() ?? defaultPreferences;
    }
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

export function getStoredSession(): SessionState | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.state ?? null;
  } catch {
    return null;
  }
}

export function setStoredSession(state: SessionState): void {
  if (typeof window === 'undefined') return;
  try {
    const payload = {
      savedAt: Date.now(),
      state,
    };
    localStorage.setItem(SESSION_KEY, JSON.stringify(payload));
  } catch {
    /* ignore */
  }
}

export function clearStoredSession(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(SESSION_KEY);
  } catch {
    /* ignore */
  }
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

export function getPendingReview(): PendingReview | null {
  if (typeof window === 'undefined') return null;
  try {
    const stored = localStorage.getItem(PENDING_REVIEW_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

export function setPendingReview(pending: PendingReview): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(PENDING_REVIEW_KEY, JSON.stringify(pending));
  } catch { /* ignore */ }
}

export function clearPendingReview(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(PENDING_REVIEW_KEY);
  } catch { /* ignore */ }
}
