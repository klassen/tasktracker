import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getLocalDateTime, getLocalDate } from '@/lib/utils/dateUtils';

// POST /api/tasks/[id]/complete?tenantId=1 - Toggle task completion for today
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const taskId = parseInt(id);
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId');
    const body = await request.json().catch(() => ({}));
    // Use completedDate from client if provided, else fallback to server local date
    const completedDate = typeof body.completedDate === 'string' ? body.completedDate : getLocalDate();

    if (!tenantId) {
      return NextResponse.json(
        { error: 'tenantId is required' },
        { status: 400 }
      );
    }

    // Get task details to check if it's recurring and validate tenant
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: { assignedTo: true },
    });

    if (!task) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      );
    }

    // Validate tenant access
    if (task.assignedTo && task.assignedTo.tenantId !== parseInt(tenantId)) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // Check if already completed today
    const existing = await prisma.taskCompletion.findUnique({
      where: {
        taskId_completedDate: {
          taskId,
          completedDate,
        },
      },
    });

    if (existing) {
      // Remove completion (mark as incomplete)
      await prisma.taskCompletion.delete({
        where: { id: existing.id },
      });
      
      return NextResponse.json({ completed: false });
    } else {
      // Add completion
      await prisma.taskCompletion.create({
        data: {
          taskId,
          completedDate,
          createdAt: getLocalDateTime(),
        },
      });

      // If it's a one-off task, delete it after completion
      if (!task.isRecurring) {
        await prisma.task.delete({
          where: { id: taskId },
        });
        return NextResponse.json({ completed: true, deleted: true });
      }
      
      return NextResponse.json({ completed: true });
    }
  } catch (error) {
    console.error('Error toggling task completion:', error);
    return NextResponse.json(
      { error: 'Failed to toggle task completion' },
      { status: 500 }
    );
  }
}
