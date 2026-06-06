"use server"

import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"

const TEST_USER = {
  email: "test@test.com",
  password: "test",
  id: "test-user-123",
}

export async function loginWithTestAccount(email: string, password: string) {
  console.log("[v0] loginWithTestAccount called with:", email)
  
  if (email === TEST_USER.email && password === TEST_USER.password) {
    const cookieStore = await cookies()
    cookieStore.set("mock_auth_session", TEST_USER.id, {
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      httpOnly: false,
      secure: false, // Allow on localhost
      sameSite: "lax",
    })
    
    console.log("[v0] Cookie set successfully")
    
    // Revalidate all paths to ensure server components see the new cookie
    revalidatePath("/", "layout")
    
    return { success: true }
  }
  return { success: false, error: "Invalid credentials" }
}

export async function logoutMockSession() {
  const cookieStore = await cookies()
  cookieStore.delete("mock_auth_session")
  revalidatePath("/", "layout")
  redirect("/")
}
