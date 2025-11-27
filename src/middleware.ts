import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'

export const runtime = 'nodejs' // force Node.js runtime (edge runtime does not support Node.js 'crypto' module)

export async function middleware(req: NextRequest) {
  const cookieStore = await cookies()
  const token = cookieStore.get('auth')?.value
  const path = req.nextUrl.pathname

  const isProtected =
    path === '/' ||
    path === '/forms' ||
    /^\/forms\/[^/]+\/submissions$/.test(path)

  if (!isProtected) {
    return NextResponse.next()
  }

  if (!token) {
    return NextResponse.redirect(new URL('/home', req.url))
  }

  try {
    jwt.verify(token, process.env.JWT_SECRET as string)
    return NextResponse.next()
  } catch (err) {
    console.error('JWT verification failed:', err)
    return NextResponse.redirect(new URL('/home', req.url))
  }
}

export const config = {
  matcher: ['/', '/forms', '/forms/:path*/submissions'],
}
