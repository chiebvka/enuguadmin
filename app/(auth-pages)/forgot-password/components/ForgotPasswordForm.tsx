"use client";

import React, { useActionState, useEffect } from 'react';
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { forgotPasswordAction } from "@/app/actions"
import { FormMessage, type Message } from "@/components/form-message"
import { SubmitButton } from "@/components/submit-button"
import Link from "next/link"
import { toast } from 'sonner';

const initialState: Message | undefined = undefined;

export default function ForgotPasswordForm({
  className,
  ...props
}: React.ComponentProps<"form">) {
  const [state, formAction] = useActionState(forgotPasswordAction, initialState);
  
  useEffect(() => {
    if (state && "success" in state && state.success) {
      toast.success(state.success);
    }
    if (state && "error" in state && state.error) {
      toast.error(state.error);
    }
    // Potentially clear state here if desired, e.g., by calling a reset function passed from useFormState or setting a local state
  }, [state]);
  return (
    <form action={formAction} className={cn("flex flex-col gap-6", className)} {...props}>
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-2xl font-bold">Reset Password</h1>
        <p className="text-balance text-sm text-muted-foreground">
          Enter your email below to reset your password
        </p>
      </div>
      <div className="grid gap-6">
        <div className="grid gap-2">
          <Label htmlFor="email">Email</Label>
          <Input 
            id="email" 
            name="email"
            type="email" 
            placeholder="you@example.com" 
            required 
          />
        </div>
        <SubmitButton 
          className="w-full" 
          pendingText="Sending reset link..."
        >
          Reset Password
        </SubmitButton>
        <div className="relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t after:border-border">
          <span className="relative z-10 bg-background px-2 text-muted-foreground">
            Powered by 
          </span>
        </div>
        <Button variant="outline" className="w-full" asChild>
            <Link href="https://www.bexoni.com/" target="_blank" className='text-purple-600'>
                Bexoni
            </Link>
        </Button>
      </div>
      <div className="text-center text-sm">
        Remember your password?{" "}
        <Link href="/sign-in" className="underline underline-offset-4">
          Sign in
        </Link>
      </div>
    </form>
  )
} 