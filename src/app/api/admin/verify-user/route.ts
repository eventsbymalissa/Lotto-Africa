// src/app/api/admin/verify-user/route.ts
import { NextRequest } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { apiSuccess, apiError } from '@/lib/utils'

export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'ADMIN') return apiError('Unauthorized', 401)

    const { userId, action, note } = await req.json()
    if (!userId || !action) return apiError('userId and action required')
    if (!['approve', 'reject'].includes(action)) return apiError('Invalid action')

    const newStatus = action === 'approve' ? 'VERIFIED' : 'REJECTED'

    await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: { verificationStatus: newStatus },
      }),
      ...(note ? [
        prisma.verificationNote.create({
          data: { userId, note, adminId: session.userId },
        }),
      ] : []),
    ])

    return apiSuccess({ status: newStatus })
  } catch (err) {
    console.error('Admin verify error:', err)
    return apiError('Internal server error', 500)
  }
}
