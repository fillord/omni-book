import { NextRequest, NextResponse } from "next/server"
import { promises as fs } from "fs"
import path from "path"
import { getServerSession } from "next-auth"
import { authConfig } from "@/lib/auth/config"

export const runtime = "nodejs"

export async function POST(req: NextRequest) {
  const session = await getServerSession(authConfig)
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const formData = await req.formData()
  const file = formData.get("file")

  if (!(file instanceof Blob)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 })
  }

  const buffer = Buffer.from(await file.arrayBuffer())
  const uploadDir = path.join(process.cwd(), "public", "uploads", "logos")

  await fs.mkdir(uploadDir, { recursive: true })

  const fileExt = (file.type && file.type.split("/")[1]) || "png"
  const fileName = `${session.user.id}-${Date.now()}.${fileExt}`
  const filePath = path.join(uploadDir, fileName)

  await fs.writeFile(filePath, buffer)

  const publicUrl = `/uploads/logos/${fileName}`

  return NextResponse.json({ url: publicUrl })
}

