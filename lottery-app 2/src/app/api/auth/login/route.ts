// src/app/api/auth/login/route.ts
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createSession, setSessionCookie } from '@/lib/auth'
import { apiSuccess, apiError } from '@/lib/utils'
import bcrypt from 'bcryptjs'

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json()
    if (!email || !password) return apiError('Email and password are required')

    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } })
    if (!user) return apiError('Invalid email or password', 401)

    const valid = await bcrypt.compare(password, user.passwordHash)
    if (!valid) return apiError('Invalid email or password', 401)

    const token = await createSession({
      userId: user.id,
      email: user.email,
      role: user.role,
      verificationStatus: user.verificationStatus,
    })

    setSessionCookie(token)

    return apiSuccess({
      role: user.role,
      verificationStatus: user.verificationStatus,
      firstName: user.firstName,
    })
  } catch (err) {
    console.error('Login error:', err)
    return apiError('Internal server error', 500)
  }
}
