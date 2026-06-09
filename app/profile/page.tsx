"use client"

import { useCallback, useEffect } from "react"
import Link from "next/link"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { usePortalAuth } from "@/components/providers/portal-auth-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { changePasswordRequest, updateProfileRequest } from "@/lib/auth"

type ProfileForm = {
  first_name: string
  last_name: string
  email: string
}

type PasswordForm = {
  current_password: string
  new_password: string
  new_password_confirmation: string
}

function joinName(first: string, last: string) {
  return [first, last].map((s) => s.trim()).filter(Boolean).join(" ")
}

export default function ProfilePage() {
  const { user, refresh } = usePortalAuth()
  const profileForm = useForm<ProfileForm>({
    defaultValues: { first_name: "", last_name: "", email: "" },
  })
  const passwordForm = useForm<PasswordForm>({
    defaultValues: {
      current_password: "",
      new_password: "",
      new_password_confirmation: "",
    },
  })

  const resetFromUser = useCallback(() => {
    if (!user) return
    profileForm.reset({
      first_name: user.first_name ?? "",
      last_name: user.last_name ?? "",
      email: user.email ?? "",
    })
  }, [user, profileForm])

  useEffect(() => {
    resetFromUser()
  }, [resetFromUser])

  async function onProfileSubmit(values: ProfileForm) {
    try {
      await updateProfileRequest({
        name: joinName(values.first_name, values.last_name),
        email: values.email.trim().toLowerCase(),
      })
      await refresh()
      toast.success("Profile updated")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save profile")
    }
  }

  async function onPasswordSubmit(values: PasswordForm) {
    if (values.new_password !== values.new_password_confirmation) {
      toast.error("New passwords do not match")
      return
    }
    try {
      await changePasswordRequest(values)
      passwordForm.reset()
      toast.success("Password changed")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not change password")
    }
  }

  return (
    <main className="min-h-screen text-white pt-24 pb-16 px-6">
      <div className="max-w-xl mx-auto space-y-8">
        <div>
          <Link href="/portal" className="text-green-400 hover:text-green-300 transition text-sm">
            ← Back to portal
          </Link>
          <h1 className="text-3xl font-heading font-bold uppercase tracking-wide mt-4">Profile</h1>
          <p className="text-gray-400 mt-2">Update your account details below.</p>
        </div>

        <form
          onSubmit={profileForm.handleSubmit(onProfileSubmit)}
          className="bg-black/30 backdrop-blur-sm rounded-2xl p-8 border border-white/10 space-y-4"
        >
          <h2 className="text-lg font-semibold">Account details</h2>
          <div className="space-y-2">
            <Label htmlFor="email" className="text-gray-300">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              {...profileForm.register("email", {
                required: "Email is required",
                pattern: {
                  value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                  message: "Enter a valid email address",
                },
              })}
              className="bg-black/50 border-white/20 text-white"
            />
            {profileForm.formState.errors.email && (
              <p className="text-sm text-red-400">{profileForm.formState.errors.email.message}</p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="first_name" className="text-gray-300">First name</Label>
              <Input
                id="first_name"
                {...profileForm.register("first_name")}
                className="bg-black/50 border-white/20 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="last_name" className="text-gray-300">Last name</Label>
              <Input
                id="last_name"
                {...profileForm.register("last_name")}
                className="bg-black/50 border-white/20 text-white"
              />
            </div>
          </div>
          <Button type="submit" className="bg-green-600 hover:bg-green-700">
            Save profile
          </Button>
        </form>

        <form
          onSubmit={passwordForm.handleSubmit(onPasswordSubmit)}
          className="bg-black/30 backdrop-blur-sm rounded-2xl p-8 border border-white/10 space-y-4"
        >
          <h2 className="text-lg font-semibold">Change password</h2>
          <div className="space-y-2">
            <Label htmlFor="current_password" className="text-gray-300">Current password</Label>
            <Input
              id="current_password"
              type="password"
              {...passwordForm.register("current_password", { required: true })}
              className="bg-black/50 border-white/20 text-white"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="new_password" className="text-gray-300">New password</Label>
            <Input
              id="new_password"
              type="password"
              {...passwordForm.register("new_password", { required: true, minLength: 8 })}
              className="bg-black/50 border-white/20 text-white"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="new_password_confirmation" className="text-gray-300">Confirm new password</Label>
            <Input
              id="new_password_confirmation"
              type="password"
              {...passwordForm.register("new_password_confirmation", { required: true })}
              className="bg-black/50 border-white/20 text-white"
            />
          </div>
          <Button type="submit" variant="secondary">
            Update password
          </Button>
        </form>
      </div>
    </main>
  )
}
