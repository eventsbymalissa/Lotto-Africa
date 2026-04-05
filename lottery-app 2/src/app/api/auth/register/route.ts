// src/app/api/auth/register/route.ts
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createSession, setSessionCookie } from '@/lib/auth'
import { apiSuccess, apiError } from '@/lib/utils'
import bcrypt from 'bcryptjs'

export async function POST(req: NextRequest) {
  try {
    const { firstName, lastName, email, phone, password } = await req.json()

    if (!firstName || !lastName || !email || !password)
      return apiError('All required fields must be filled')

    if (password.length < 8)
      return apiError('Password must be at least 8 characters')

    const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } })
    if (existing) return apiError('An account with this email already exists', 409)

    const passwordHash = await bcrypt.hash(password, 12)

    const user = await prisma.user.create({
      data: {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.toLowerCase().trim(),
        phone: phone?.trim() || null,
        passwordHash,
        role: 'PLAYER',
        verificationStatus: 'UNVERIFIED',
        tokenBalance: 0,
      },
    })

    const token = await createSession({
      userId: user.id,
      email: user.email,
      role: user.role,
      verificationStatus: user.verificationStatus,
    })

    setSessionCookie(token)

    return apiSuccess({ userId: user.id, verificationStatus: user.verificationStatus }, 201)
  } catch (err) {
    console.error('Register error:', err)
    return apiError('Internal server error', 500)
  }
}
