import type { Metadata } from "next";
import Link from "next/link";

import { AuthCard } from "@/components/AuthCard";
import { PublicHeader } from "@/components/PublicHeader";
import { AuthShowcase } from "@/components/auth/AuthShowcase";
import { RegisterForm } from "@/components/auth/RegisterForm";

export const metadata: Metadata = {
  title: "Register | TaskFlow",
};

export default function RegisterPage() {
  return (
    <main className="min-h-screen px-5 py-5 sm:px-8 lg:px-10">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-5">
        <PublicHeader currentPage="register" />
        <section className="grid min-h-[calc(100vh-7.75rem)] gap-5 lg:grid-cols-[minmax(0,1fr)_460px] lg:items-center">
          <AuthShowcase />
          <div className="flex items-center justify-center lg:justify-end">
            <AuthCard
              footer={
                <p>
                  Already have an account?{" "}
                  <Link
                    className="font-semibold text-mint hover:text-ink"
                    href="/login"
                  >
                    Sign in
                  </Link>
                </p>
              }
              subtitle="Create your TaskFlow account and wait for a project assignment."
              title="Start your workspace"
            >
              <RegisterForm />
            </AuthCard>
          </div>
        </section>
      </div>
    </main>
  );
}
