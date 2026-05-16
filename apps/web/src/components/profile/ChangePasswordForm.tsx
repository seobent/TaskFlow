"use client";

import { type FormEvent, useState } from "react";

import { Button } from "@/components/ui/Button";
import { TextInput } from "@/components/ui/TextInput";
import { readApiErrorMessage, readResponseJson } from "@/lib/api-client";

export function ChangePasswordForm() {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = event.currentTarget;
    const formData = new FormData(form);
    const payload = {
      currentPassword: String(formData.get("currentPassword") ?? ""),
      newPassword: String(formData.get("newPassword") ?? ""),
      confirmPassword: String(formData.get("confirmPassword") ?? ""),
    };

    setError(null);
    setSuccess(null);

    if (payload.newPassword.length < 8) {
      setError("New password must be at least 8 characters.");
      return;
    }

    if (payload.newPassword !== payload.confirmPassword) {
      setError("New passwords must match.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/password", {
        body: JSON.stringify(payload),
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        method: "PATCH",
      });
      const body = await readResponseJson(response);

      if (!response.ok) {
        setError(
          readApiErrorMessage(body, "Unable to update password. Please try again."),
        );
        return;
      }

      form.reset();
      setSuccess("Password updated.");
    } catch {
      setError("Unable to reach TaskFlow. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      {error ? (
        <div
          className="rounded-md border border-berry/25 bg-berry/10 px-3 py-2 text-sm font-medium text-berry"
          role="alert"
        >
          {error}
        </div>
      ) : null}

      {success ? (
        <div
          className="rounded-md border border-mint/25 bg-mint/10 px-3 py-2 text-sm font-medium text-mint"
          role="status"
        >
          {success}
        </div>
      ) : null}

      <TextInput
        autoComplete="current-password"
        disabled={isSubmitting}
        id="currentPassword"
        label="Current password"
        name="currentPassword"
        required
        type="password"
      />

      <TextInput
        autoComplete="new-password"
        disabled={isSubmitting}
        hint="Use at least 8 characters."
        id="newPassword"
        label="New password"
        minLength={8}
        name="newPassword"
        required
        type="password"
      />

      <TextInput
        autoComplete="new-password"
        disabled={isSubmitting}
        id="confirmPassword"
        label="Confirm new password"
        minLength={8}
        name="confirmPassword"
        required
        type="password"
      />

      <Button
        isLoading={isSubmitting}
        loadingLabel="Updating..."
        type="submit"
      >
        Update password
      </Button>
    </form>
  );
}
