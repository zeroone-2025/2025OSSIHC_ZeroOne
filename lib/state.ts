import { setStoredSession, getStoredSession, clearStoredSession } from './store'
import { WeatherSnapshot, Restaurant } from './types'
import type { TimePressure } from '../src/lib/mapping'

export type Step = 'boot' | 'qa' | 'recommend' | 'wait_review' | 'done'

export interface Answer {
  qId: string
  intent: string
  option: string
  collectedAt: number
}

export interface PendingReview {
  placeId: string
  decidedAt: number
}

export interface SessionState {
  sessionId: string
  createdAt: number
  version: number
  user?: { lat: number; lng: number }
  weather?: WeatherSnapshot
  places: Restaurant[]
  pool: Restaurant[]
  answers: Answer[]
  step: Step
  freeTimeMins?: number
  pendingReview?: PendingReview
  error?: string
  // New session parameters
  maxPrice?: number
  timePressure?: TimePressure
  mealFeel?: string[]
}

export type Event =
  | { type: 'BOOT_INIT' }
  | { type: 'POOL_SEEDED'; places: Restaurant[]; weather?: WeatherSnapshot; user?: { lat: number; lng: number } }
  | { type: 'ASK_NEXT' }
  | { type: 'ANSWER_COMMIT'; answer: Omit<Answer, 'collectedAt'> }
  | { type: 'SET_FREE_TIME'; minutes?: number }
  | { type: 'SET_BUDGET'; maxPrice: number }
  | { type: 'SET_TIME_PRESSURE'; timePressure: TimePressure }
  | { type: 'SET_MEAL_FEEL'; mealFeel: string[] }
  | { type: 'QNA_DONE' }
  | { type: 'RECOMMEND_READY'; pool: Restaurant[] }
  | { type: 'DECIDE'; placeId: string }
  | { type: 'WAIT_REVIEW' }
  | { type: 'REVIEW_SUBMIT' }
  | { type: 'DONE' }
  | { type: 'ERROR'; message: string }
  | { type: 'RESET' }

const SESSION_VERSION = 3

function createSessionId(): string {
  return `sess-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

export function createInitialState(): SessionState {
  return {
    sessionId: createSessionId(),
    createdAt: Date.now(),
    version: SESSION_VERSION,
    places: [],
    pool: [],
    answers: [],
    step: 'boot',
  }
}

export const initialState: SessionState = createInitialState()

export function reducer(state: SessionState, event: Event): SessionState {
  switch (event.type) {
    case 'BOOT_INIT':
      return {
        ...state,
        step: 'boot',
        answers: [],
        pool: [],
        places: [],
        weather: undefined,
        freeTimeMins: undefined,
        maxPrice: undefined,
        timePressure: undefined,
        mealFeel: undefined,
        error: undefined,
      }
    case 'POOL_SEEDED':
      return {
        ...state,
        step: 'qa',
        places: event.places,
        pool: event.places,
        weather: event.weather ?? state.weather,
        user: event.user ?? state.user,
      }
    case 'ASK_NEXT':
      return { ...state, step: 'qa' }
    case 'ANSWER_COMMIT': {
      const answer: Answer = { ...event.answer, collectedAt: Date.now() }
      const answers = [...state.answers, answer]
      return { ...state, answers }
    }
    case 'QNA_DONE':
      return { ...state, step: 'recommend' }
    case 'RECOMMEND_READY':
      return { ...state, step: 'recommend', pool: event.pool }
    case 'SET_FREE_TIME':
      return { ...state, freeTimeMins: typeof event.minutes === 'number' ? event.minutes : undefined }
    case 'SET_BUDGET':
      return { ...state, maxPrice: event.maxPrice }
    case 'SET_TIME_PRESSURE':
      return { ...state, timePressure: event.timePressure }
    case 'SET_MEAL_FEEL':
      return { ...state, mealFeel: event.mealFeel }
    case 'DECIDE':
      return {
        ...state,
        step: 'wait_review',
        pendingReview: { placeId: event.placeId, decidedAt: Date.now() },
      }
    case 'WAIT_REVIEW':
      return { ...state, step: 'wait_review' }
    case 'REVIEW_SUBMIT':
      return { ...state, step: 'done', pendingReview: undefined }
    case 'DONE':
      return { ...state, step: 'done' }
    case 'ERROR':
      return { ...state, error: event.message }
    case 'RESET':
      return createInitialState()
    default:
      return state
  }
}

function isValidStep(step: any): step is Step {
  return ['boot', 'qa', 'recommend', 'wait_review', 'done'].includes(step)
}

function ensureArrays(state: SessionState): SessionState {
  return {
    ...state,
    places: Array.isArray(state.places) ? state.places : [],
    pool: Array.isArray(state.pool) ? state.pool : [],
    answers: Array.isArray(state.answers) ? state.answers : [],
  }
}

function reconcileStep(state: SessionState): SessionState {
  if (!isValidStep(state.step)) {
    return { ...state, step: 'boot', answers: [], pool: [], places: [] }
  }

  if (state.step !== 'boot' && state.pool.length === 0) {
    return { ...state, step: 'boot', answers: [], pool: [], places: [] }
  }

  return state
}

export function persistSession(state: SessionState): void {
  setStoredSession({ ...state, version: SESSION_VERSION })
}

export function restoreSession(): SessionState | null {
  const stored = getStoredSession()
  if (!stored) return null

  if ((stored as any).version !== SESSION_VERSION) {
    return resetSession()
  }

  const sanitized = reconcileStep(
    ensureArrays({
      ...createInitialState(),
      ...stored,
      sessionId: stored.sessionId || createSessionId(),
      createdAt: stored.createdAt || Date.now(),
      version: SESSION_VERSION,
    })
  )

  if (sanitized.step !== 'boot' && sanitized.pool.length === 0) {
    return resetSession()
  }

  return sanitized
}

export function resetSession(): SessionState {
  const fresh = createInitialState()
  clearStoredSession()
  setStoredSession(fresh)
  return fresh
}
