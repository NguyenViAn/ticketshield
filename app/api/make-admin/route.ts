import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({
      success: false,
      message: "Please log in first at http://localhost:3000/vi/login",
    });
  }

  // Update the user's metadata to include the admin role
  const { data, error } = await supabase.auth.updateUser({
    data: { role: "admin" },
  });

  if (error) {
    return NextResponse.json({ success: false, error: error.message });
  }

  return NextResponse.json({
    success: true,
    message: "You are now an Admin! Please go to http://localhost:3000/vi/admin",
    user: data.user,
  });
}
