import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const ALLOWED_STATUSES = ["IDEAS", "IN_PROGRESS", "FOR_REVIEW", "DONE"];
const ALLOWED_PRIORITIES = ["LOW", "MEDIUM", "HIGH"];

export async function PATCH(request, { params }) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const payload = await request.json();
    const data = {};

    if (payload.status) {
      if (!ALLOWED_STATUSES.includes(payload.status)) {
        return NextResponse.json(
          { error: "Invalid status value." },
          { status: 400 }
        );
      }
      data.status = payload.status;
    }

    if (payload.priority) {
      if (!ALLOWED_PRIORITIES.includes(payload.priority)) {
        return NextResponse.json(
          { error: "Invalid priority value." },
          { status: 400 }
        );
      }
      data.priority = payload.priority;
    }

    if (payload.title !== undefined) {
      data.title = payload.title;
    }

    if (payload.description !== undefined) {
      data.description = payload.description;
    }

    if (payload.deadline !== undefined) {
      data.deadline = new Date(payload.deadline);
    }

    if (Array.isArray(payload.tags)) {
      data.tags = payload.tags;
    }

    if (Array.isArray(payload.checklist)) {
      data.checklist = payload.checklist;
    }

    const task = await prisma.task.updateMany({
      where: {
        id: params.id,
        userId: session.user.id,
      },
      data,
    });

    if (task.count === 0) {
      return NextResponse.json({ error: "Task not found." }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Unable to update task." },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const task = await prisma.task.deleteMany({
      where: {
        id: params.id,
        userId: session.user.id,
      },
    });

    if (task.count === 0) {
      return NextResponse.json({ error: "Task not found." }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Unable to delete task." },
      { status: 500 }
    );
  }
}
