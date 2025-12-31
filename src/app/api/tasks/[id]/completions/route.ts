import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const taskId = parseInt(id);

  const searchParams = request.nextUrl.searchParams;
  const year = parseInt(searchParams.get('year') || '');
  const month = parseInt(searchParams.get('month') || '');
  const tenantId = searchParams.get('tenantId');

  if (isNaN(taskId) || isNaN(year) || isNaN(month) || !tenantId) {
    return NextResponse.json(
      { error: 'Invalid parameters' },
      { status: 400 }
    );
  }

  try {
    // Verify task belongs to tenant
    const task = await prisma.task.findFirst({
      where: {
        id: taskId,
        assignedTo: {
          tenantId: parseInt(tenantId),
        },
      },
    });

    if (!task) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      );
    }

    // Get all completions for this task in the specified month
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const endDay = new Date(year, month, 0).getDate();
    const endDate = `${year}-${String(month).padStart(2, '0')}-${String(endDay).padStart(2, '0')}`;

    const completions = await prisma.taskCompletion.findMany({
      where: {
        taskId,
        completedDate: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        completedDate: true,
      },
      orderBy: {
        completedDate: 'asc',
      },
    });

    return NextResponse.json({ completions });
  } catch (error) {
    console.error('Error fetching task completions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch completions' },
      { status: 500 }
    );
  }
}
