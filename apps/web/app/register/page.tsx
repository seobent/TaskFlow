import type { Metadata } from "next";
import Link from "next/link";

import { AuthCard } from "@/components/AuthCard";
import { AuthShowcase } from "@/components/auth/AuthShowcase";
import { RegisterForm } from "@/components/auth/RegisterForm";

export const metadata: Metadata = {
  title: "Register | TaskFlow",
};

export default function RegisterPage() {
  return (
    <main className="min-h-screen px-5 py-8 sm:px-8 lg:px-10">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] w-full max-w-6xl gap-10 lg:grid-cols-[1fr_460px] lg:items-center">
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
            subtitle="Create your TaskFlow account and open the dashboard."
            title="Start your workspace"
          >
            <RegisterForm />
          </AuthCard>
        </div>
      </div>
    </main>
  );
}
