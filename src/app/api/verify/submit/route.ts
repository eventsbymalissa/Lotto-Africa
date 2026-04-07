// src/app/api/verify/submit/route.ts
import { NextRequest } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { apiSuccess, apiError } from '@/lib/utils'

export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return apiError('Unauthorized', 401)

    const formData = await req.formData()
    const file = formData.get('document') as File | null
    const docType = formData.get('docType') as string

    if (!file) return apiError('No document uploaded')
    if (file.size > 10 * 1024 * 1024) return apiError('File too large (max 10MB)')

    // Store document reference (in production connect to Cloudinary or S3)
    const docUrl = `/uploads/verification/${session.userId}-${Date.now()}.${file.name.split('.').pop()}`

    await prisma.user.update({
      where: { id: session.userId },
      data: {
        verificationStatus: 'PENDING',
        idDocumentUrl: docUrl,
        idDocumentType: docType,
      },
    })

    return apiSuccess({ message: 'Document submitted for review' })
  } catch (err) {
    console.error('Verify submit error:', err)
    return apiError('Internal server error', 500)
  }
}
