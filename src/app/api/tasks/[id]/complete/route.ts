import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getLocalDateTime, getLocalDate } from '@/lib/utils/dateUtils';

// POST /api/tasks/[id]/complete?tenantId=1 - Toggle or update task completion status for a specific date
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
    // CRITICAL: Client MUST send completedDate to avoid timezone issues
    // Fallback to getLocalDate() only for backward compatibility
    const completedDate = typeof body.completedDate === 'string' ? body.completedDate : getLocalDate();
    const status = body.status === 'excluded' ? 'excluded' : 'completed'; // Default to 'completed'

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
      // If same status, remove completion (toggle off)
      // If different status, update to new status
      if (existing.status === status) {
        await prisma.taskCompletion.delete({
          where: { id: existing.id },
        });
        return NextResponse.json({ completed: false, status: null });
      } else {
        await prisma.taskCompletion.update({
          where: { id: existing.id },
          data: { status },
        });
        return NextResponse.json({ completed: true, status });
      }
    } else {
      // Add completion with specified status
      await prisma.taskCompletion.create({
        data: {
          taskId,
          completedDate,
          status,
          createdAt: getLocalDateTime(), // Record timestamp - not used for business logic
        },
      });

      // If it's a one-off task, delete it after completion
      if (!task.isRecurring) {
        await prisma.task.delete({
          where: { id: taskId },
        });
        return NextResponse.json({ completed: true, status, deleted: true });
      }
      
      return NextResponse.json({ completed: true, status });
    }
  } catch (error) {
    console.error('Error toggling task completion:', error);
    return NextResponse.json(
      { error: 'Failed to toggle task completion' },
      { status: 500 }
    );
  }
}
