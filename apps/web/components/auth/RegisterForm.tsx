"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";

import { Button } from "@/components/ui/Button";
import { TextInput } from "@/components/ui/TextInput";
import { readApiErrorMessage, readResponseJson } from "./api-error";

export function RegisterForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const payload = {
      name: String(formData.get("name") ?? ""),
      email: String(formData.get("email") ?? ""),
      password: String(formData.get("password") ?? ""),
    };

    setError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/register", {
        body: JSON.stringify(payload),
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      });
      const body = await readResponseJson(response);

      if (!response.ok) {
        setError(
          readApiErrorMessage(
            body,
            "Unable to create your account. Please try again.",
          ),
        );
        return;
      }

      router.replace("/dashboard");
      router.refresh();
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

      <TextInput
        autoComplete="name"
        disabled={isSubmitting}
        id="name"
        label="Name"
        name="name"
        placeholder="Alex Morgan"
        required
        type="text"
      />

      <TextInput
        autoComplete="email"
        disabled={isSubmitting}
        id="email"
        label="Email"
        name="email"
        placeholder="you@example.com"
        required
        type="email"
      />

      <TextInput
        autoComplete="new-password"
        disabled={isSubmitting}
        hint="Use at least 8 characters."
        id="password"
        label="Password"
        minLength={8}
        name="password"
        required
        type="password"
      />

      <Button
        className="w-full"
        isLoading={isSubmitting}
        loadingLabel="Creating account..."
        type="submit"
      >
        Create account
      </Button>
    </form>
  );
}
