import Link from "next/link";
import { LoginForm } from "@/components/auth/login-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-hero px-6 py-16">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-10 lg:flex-row lg:items-center">
        <div className="flex-1 space-y-4">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-ink/50">
            Digital marketers
          </p>
          <h1 className="text-4xl font-semibold text-ink sm:text-5xl">
            Welcome back to your campaign command center.
          </h1>
          <p className="max-w-xl text-base text-ink/70">
            Track every content milestone, coordinate blog drafts, and keep
            deadlines visible across your pipeline.
          </p>
        </div>
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Sign in</CardTitle>
          </CardHeader>
          <CardContent>
            <LoginForm />
            <p className="mt-6 text-sm text-ink/60">
              New here?{" "}
              <Link className="font-semibold text-ink" href="/auth/register">
                Create an account
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
