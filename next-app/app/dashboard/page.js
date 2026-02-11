import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { ProfileCard } from "@/components/dashboard/profile-card";
import { TaskTable } from "@/components/dashboard/task-table";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/auth/login");
  }

  return (
    <div className="min-h-screen bg-hero px-6 py-12">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        <DashboardHeader name={session.user.name} email={session.user.email} />
        <div className="grid gap-6 lg:grid-cols-[1.1fr_1.9fr]">
          <ProfileCard name={session.user.name} email={session.user.email} />
          <TaskTable />
        </div>
      </div>
    </div>
  );
}
