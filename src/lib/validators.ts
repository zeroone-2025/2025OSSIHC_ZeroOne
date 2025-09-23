const ALLOWED_SOURCES = new Set([
  'weather',
  'eta',
  'novelty',
  'history',
  'trend',
  'allergy',
  'nutrition',
  'group',
  'situation',
  'pref',
  'category',
])

const FORBIDDEN_PATTERNS = [
  /(리뷰|후기|평점|별점)/i,
  /(혼잡|대기|줄\s*서|만석|웨이팅)/i,
  /(최고|최악|완벽|완전\s*최고|환상적)/i,
]

export interface ReasonDetailPayload {
  badge: string
  detail: string
  source: string
}

export interface ReasonsPayload {
  reasons: ReasonDetailPayload[]
}

export function isValidReasons(candidate: unknown): candidate is ReasonsPayload {
  if (!candidate || typeof candidate !== 'object') {
    return false
  }

  const payload = candidate as Record<string, unknown>
  if (!Array.isArray(payload.reasons) || payload.reasons.length === 0) {
    return false
  }

  for (const item of payload.reasons) {
    if (!item || typeof item !== 'object') {
      return false
    }

    const badge = typeof item.badge === 'string' ? item.badge.trim() : ''
    const detail = typeof item.detail === 'string' ? item.detail.trim() : ''
    const source = typeof item.source === 'string' ? item.source.trim().toLowerCase() : ''

    if (!badge || badge.length > 18) {
      return false
    }
    if (!detail || detail.length < 4) {
      return false
    }
    if (!source || !ALLOWED_SOURCES.has(source)) {
      return false
    }

    if (FORBIDDEN_PATTERNS.some((pattern) => pattern.test(badge) || pattern.test(detail))) {
      return false
    }
  }

  return true
}
