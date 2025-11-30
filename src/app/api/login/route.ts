import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { cookies } from 'next/headers'
import { checkRateLimit, resetRateLimit } from '@/lib/rateLimiter'

export async function POST(req: NextRequest) {
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    'unknown'

  const rate = checkRateLimit(ip)
  if (!rate.allowed) {
    const retry = rate.retryAfter ?? 60 // fallback
    return NextResponse.json(
      { error: `Too many attempts. Try again in ${Math.ceil(retry)}s.` },
      { status: 429 }
    )
  }

  const { password } = await req.json()

  if (!password || password !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Wrong password' }, { status: 401 })
  }

  resetRateLimit(ip)

  const token = jwt.sign({ role: 'admin' }, process.env.JWT_SECRET as string, {
    // expiresIn: '365d',
  })

  ;(await cookies()).set('auth', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
  })

  return NextResponse.json({ success: true })
}
