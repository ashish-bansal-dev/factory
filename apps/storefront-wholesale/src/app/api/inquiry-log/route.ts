import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    // Log inquiry event on server
    console.log(`[WHATSAPP_INQUIRY_EVENT] Phone: ${body.phone}, URL: ${body.url}, Title: ${body.title}, Timestamp: ${body.timestamp}`)

    return NextResponse.json({ success: true, logged: true })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message }, { status: 400 })
  }
}
