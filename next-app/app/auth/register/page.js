import Link from "next/link";
import { RegisterForm } from "@/components/auth/register-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-hero px-6 py-16">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-10 lg:flex-row lg:items-center">
        <div className="flex-1 space-y-4">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-ink/50">
            Marketing workflow
          </p>
          <h1 className="text-4xl font-semibold text-ink sm:text-5xl">
            Build a smarter content pipeline in minutes.
          </h1>
          <p className="max-w-xl text-base text-ink/70">
            Create a shared view of campaigns, deadlines, and copy tasks so your
            team never misses a publish window.
          </p>
        </div>
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Create your account</CardTitle>
          </CardHeader>
          <CardContent>
            <RegisterForm />
            <p className="mt-6 text-sm text-ink/60">
              Already have an account?{" "}
              <Link className="font-semibold text-ink" href="/auth/login">
                Sign in
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
