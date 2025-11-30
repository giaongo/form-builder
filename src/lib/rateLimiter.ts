// simple in-memory store
const attempts = new Map<string, { count: number; lastAttempt: number }>()

const WINDOW = 75 * 1000 // 75 seconds
const LIMIT = 5

export function checkRateLimit(ip: string) {
  const now = Date.now()
  const entry = attempts.get(ip)

  if (!entry) {
    attempts.set(ip, { count: 1, lastAttempt: now })
    console.log(`[RATE LIMIT] First attempt from ${ip}`)
    return { allowed: true }
  }

  const { count, lastAttempt } = entry

  // if time window passed → reset
  if (now - lastAttempt > WINDOW) {
    attempts.set(ip, { count: 1, lastAttempt: now })
    return { allowed: true }
  }

  if (count >= LIMIT) {
    console.warn(`[RATE LIMIT] BLOCKED ${ip} – too many attempts`)
    return {
      allowed: false,
      retryAfter: (WINDOW - (now - lastAttempt)) / 1000, // seconds
    }
  }

  attempts.set(ip, { count: count + 1, lastAttempt: now })
  return { allowed: true }
}

export function resetRateLimit(ip: string) {
  attempts.delete(ip)
}
