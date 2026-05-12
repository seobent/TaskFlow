import type { Metadata } from "next";
import Link from "next/link";

import { AuthCard } from "@/components/AuthCard";
import { PublicHeader } from "@/components/PublicHeader";
import { AuthShowcase } from "@/components/auth/AuthShowcase";
import { LoginForm } from "@/components/auth/LoginForm";

export const metadata: Metadata = {
  title: "Login | TaskFlow",
};

export default function LoginPage() {
  return (
    <main className="min-h-screen px-5 py-5 sm:px-8 lg:px-10">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-5">
        <PublicHeader currentPage="login" />
        <section className="grid min-h-[calc(100vh-7.75rem)] gap-5 lg:grid-cols-[minmax(0,1fr)_460px] lg:items-center">
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
        </section>
      </div>
    </main>
  );
}
