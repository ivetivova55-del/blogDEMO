import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tasks = await prisma.task.findMany({
    where: { userId: session.user.id },
    orderBy: { deadline: "asc" },
  });

  return NextResponse.json({ tasks });
}

export async function POST(request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const allowedStatuses = ["IDEAS", "IN_PROGRESS", "FOR_REVIEW", "DONE"];
    const allowedPriorities = ["LOW", "MEDIUM", "HIGH"];
    const payload = await request.json();
    const { title, description, deadline } = payload;

    if (!title || !description || !deadline) {
      return NextResponse.json(
        { error: "Title, description, and deadline are required." },
        { status: 400 }
      );
    }

    const status = allowedStatuses.includes(payload.status)
      ? payload.status
      : "IDEAS";
    const priority = allowedPriorities.includes(payload.priority)
      ? payload.priority
      : "MEDIUM";

    const task = await prisma.task.create({
      data: {
        title,
        description,
        deadline: new Date(deadline),
        status,
        priority,
        tags: Array.isArray(payload.tags) ? payload.tags : [],
        checklist: Array.isArray(payload.checklist) ? payload.checklist : [],
        userId: session.user.id,
      },
    });

    return NextResponse.json({ task }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Unable to create task." },
      { status: 500 }
    );
  }
}
