import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json(
    {
      success: false,
      message: "This demo endpoint is disabled. Admin access is determined only by user.user_metadata.role.",
    },
    { status: 410 },
  );
}
