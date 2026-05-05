import type { Metadata } from "next";
import Link from "next/link";

import { AuthCard } from "@/components/AuthCard";
import { AuthShowcase } from "@/components/auth/AuthShowcase";
import { LoginForm } from "@/components/auth/LoginForm";

export const metadata: Metadata = {
  title: "Login | TaskFlow",
};

export default function LoginPage() {
  return (
    <main className="min-h-screen px-5 py-8 sm:px-8 lg:px-10">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] w-full max-w-6xl gap-10 lg:grid-cols-[1fr_460px] lg:items-center">
        <AuthShowcase />
        <div className="flex items-center justify-center lg:justify-end">
          <AuthCard
            footer={
              <p>
                New to TaskFlow?{" "}
                <Link
                  className="font-semibold text-mint hover:text-ink"
                  href="/register"
                >
                  Create an account
                </Link>
              </p>
            }
            subtitle="Sign in to return to your workspace."
            title="Welcome back"
          >
            <LoginForm />
          </AuthCard>
        </div>
      </div>
    </main>
  );
}
