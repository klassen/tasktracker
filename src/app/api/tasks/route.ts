import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getLocalDateTime, getLocalDate } from '@/lib/utils/dateUtils';

// GET /api/tasks?tenantId=1 - Get all tasks for a tenant
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId');
    const personId = searchParams.get('personId');

    if (!tenantId) {
      return NextResponse.json(
        { error: 'tenantId is required' },
        { status: 400 }
      );
    }

    const tasks = await prisma.task.findMany({
      where: {
        assignedTo: {
          tenantId: parseInt(tenantId),
        },
        ...(personId
          ? { assignedToId: parseInt(personId) }
          : {}),
      },
      include: {
        assignedTo: true,
        completions: true,
      },
      orderBy: { displayOrder: 'asc' }
    });
    return NextResponse.json(tasks);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tasks' },
      { status: 500 }
    );
  }
}

// POST /api/tasks - Create a new task
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, description, isRecurring, activeDays, points, money, assignedToId, tenantId } = body;

    if (!title) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      );
    }

    if (!activeDays) {
      return NextResponse.json(
        { error: 'Active days are required' },
        { status: 400 }
      );
    }

    if (!tenantId) {
      return NextResponse.json(
        { error: 'tenantId is required' },
        { status: 400 }
      );
    }

    // Validate that assignedToId belongs to the correct tenant
    if (assignedToId) {
      const person = await prisma.person.findUnique({
        where: { id: assignedToId },
      });

      if (!person || person.tenantId !== parseInt(tenantId)) {
        return NextResponse.json(
          { error: 'Invalid assignedToId for this tenant' },
          { status: 400 }
        );
      }
    }

    const now = getLocalDateTime();
    const task = await prisma.task.create({
      data: {
        title,
        description: description || null,
        isRecurring: isRecurring !== undefined ? isRecurring : true,
        activeDays,
        createdAt: now,
        updatedAt: now,
        points: points || null,
        money: money || null,
        assignedToId: assignedToId || null,
      },
      include: {
        assignedTo: true,
        completions: true,
      },
    });

    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    console.error('Error creating task:', error);
    return NextResponse.json(
      { error: 'Failed to create task' },
      { status: 500 }
    );
  }
}
