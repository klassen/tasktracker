import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getLocalDateTime } from '@/lib/utils/dateUtils';

// PATCH /api/tasks/reorder - Update task display order
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { taskOrders, tenantId } = body;

    if (!taskOrders || !Array.isArray(taskOrders)) {
      return NextResponse.json(
        { error: 'taskOrders array is required' },
        { status: 400 }
      );
    }

    if (!tenantId) {
      return NextResponse.json(
        { error: 'tenantId is required' },
        { status: 400 }
      );
    }

    // Validate all tasks belong to the tenant before updating
    const taskIds = taskOrders.map(t => t.id);
    const tasks = await prisma.task.findMany({
      where: {
        id: { in: taskIds },
      },
      include: {
        assignedTo: true,
      },
    });

    // Check if all tasks belong to the requesting tenant
    const allBelongToTenant = tasks.every(
      task => task.assignedTo && task.assignedTo.tenantId === parseInt(tenantId)
    );

    if (!allBelongToTenant) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // Update display order for each task
    const now = getLocalDateTime();
    const updates = taskOrders.map(({ id, displayOrder }) =>
      prisma.task.update({
        where: { id },
        data: {
          displayOrder,
          updatedAt: now,
        },
      })
    );

    await prisma.$transaction(updates);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error reordering tasks:', error);
    return NextResponse.json(
      { error: 'Failed to reorder tasks' },
      { status: 500 }
    );
  }
}
