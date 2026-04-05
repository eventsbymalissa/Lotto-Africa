// src/app/api/verify/submit/route.ts
import { NextRequest } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { apiSuccess, apiError } from '@/lib/utils'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'

export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return apiError('Unauthorized', 401)

    const formData = await req.formData()
    const file = formData.get('document') as File | null
    const docType = formData.get('docType') as string

    if (!file) return apiError('No document uploaded')
    if (file.size > 10 * 1024 * 1024) return apiError('File too large (max 10MB)')

    // Save file locally (in production, use S3/Cloudinary)
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'verification')
    await mkdir(uploadDir, { recursive: true })

    const ext = file.name.split('.').pop() ?? 'jpg'
    const filename = `${uuidv4()}.${ext}`
    const filepath = path.join(uploadDir, filename)
    const buffer = Buffer.from(await file.arrayBuffer())
    await writeFile(filepath, buffer)

    const docUrl = `/uploads/verification/${filename}`

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
