import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getLocalDate } from '@/lib/utils/dateUtils';

// GET /api/people?tenantId=1 - Get all people for a tenant
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId');

    if (!tenantId) {
      return NextResponse.json(
        { error: 'Tenant ID is required' },
        { status: 400 }
      );
    }

    const people = await prisma.person.findMany({
      where: { tenantId: parseInt(tenantId) },
      orderBy: { name: 'asc' },
    });

    // Calculate current month points using local date
    const today = getLocalDate(); // YYYY-MM-DD
    const [year, month] = today.split('-').map(Number);
    const startDate = `${year}-${month.toString().padStart(2, '0')}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const endDate = `${year}-${month.toString().padStart(2, '0')}-${lastDay.toString().padStart(2, '0')}`;

    const peopleWithProgress = await Promise.all(
      people.map(async (person) => {
        const tasks = await prisma.task.findMany({
          where: {
            assignedToId: person.id,
          },
          include: {
            completions: {
              where: {
                completedDate: {
                  gte: startDate,
                  lte: endDate,
                },
              },
            },
          },
        });

        let currentMonthPoints = 0;
        tasks.forEach((task) => {
          task.completions.forEach(() => {
            currentMonthPoints += task.points || 0;
          });
        });

        return {
          ...person,
          currentMonthPoints,
        };
      })
    );

    return NextResponse.json(peopleWithProgress);
  } catch (error) {
    console.error('Error fetching people:', error);
    return NextResponse.json(
      { error: 'Failed to fetch people' },
      { status: 500 }
    );
  }
}

// POST /api/people - Create a new person
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, color, tenantId } = body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      );
    }

    if (!tenantId || typeof tenantId !== 'number') {
      return NextResponse.json(
        { error: 'Tenant ID is required' },
        { status: 400 }
      );
    }

    const person = await prisma.person.create({
      data: {
        name: name.trim(),
        color: color || null,
        pointGoal: null,
        tenantId,
        createdAt: getLocalDateTime(),
      },
    });

    return NextResponse.json(person, { status: 201 });
  } catch (error: any) {
    console.error('Error creating person:', error);
    
    // Handle unique constraint violation
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'A person with this name already exists' },
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to create person' },
      { status: 500 }
    );
  }
}
