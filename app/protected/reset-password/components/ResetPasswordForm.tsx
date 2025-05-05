"use client";

import React, { useState } from 'react';
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { resetPasswordAction } from "@/app/actions"
import { FormMessage, type Message } from "@/components/form-message"
import { SubmitButton } from "@/components/submit-button"

interface ResetPasswordFormProps extends React.ComponentPropsWithoutRef<"form"> {
  message?: Message;
}

export default function ResetPasswordForm({
    className,
    message,
    ...props
  }: ResetPasswordFormProps) {
  const [showPassword, setShowPassword] = useState<boolean>(false)

  return (
    <form className={cn("flex flex-col gap-6", className)} {...props}>
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-2xl font-bold">Reset Password</h1>
        <p className="text-balance text-sm text-muted-foreground">
          Please enter your new password below
        </p>
      </div>
      <div className="grid gap-6">
        <div className="grid gap-2">
          <Label htmlFor="password">New Password</Label>
          <Input 
            id="password" 
            name="password"
            type={showPassword ? "text" : "password"}
            placeholder="Enter new password"
            required 
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="confirmPassword">Confirm Password</Label>
          <Input 
            id="confirmPassword" 
            name="confirmPassword"
            type={showPassword ? "text" : "password"}
            placeholder="Confirm new password"
            required 
          />
        </div>
        <div onClick={() => setShowPassword(!showPassword)} className="cursor-pointer hover:underline">
            <p className='text-xs'>Show password</p>
        </div>
        <SubmitButton 
          className="w-full" 
          pendingText="Resetting password..."
          formAction={resetPasswordAction}
        >
          Reset Password
        </SubmitButton>
      </div>
      {message && <FormMessage message={message} />}
    </form>
  )
} 