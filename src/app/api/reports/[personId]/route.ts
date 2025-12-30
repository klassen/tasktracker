import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/reports/[personId]?year=2025&month=12&tenantId=1
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ personId: string }> }
) {
  try {
    const { personId } = await params;
    const personIdNum = parseInt(personId);
    
    if (isNaN(personIdNum)) {
      return NextResponse.json(
        { error: 'Invalid person ID' },
        { status: 400 }
      );
    }

    const { searchParams } = new URL(request.url);
    const year = searchParams.get('year');
    const month = searchParams.get('month');
    const tenantId = searchParams.get('tenantId');

    if (!year || !month) {
      return NextResponse.json(
        { error: 'Year and month are required' },
        { status: 400 }
      );
    }

    if (!tenantId) {
      return NextResponse.json(
        { error: 'tenantId is required' },
        { status: 400 }
      );
    }

    // Get person with their point goal
    const person = await prisma.person.findUnique({
      where: { id: personIdNum },
    });

    if (!person) {
      return NextResponse.json(
        { error: 'Person not found' },
        { status: 404 }
      );
    }

    // Validate that the person belongs to the requesting tenant
    if (person.tenantId !== parseInt(tenantId)) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // Calculate date range for the month
    const yearNum = parseInt(year);
    const monthNum = parseInt(month);
    const startDate = `${year}-${month.padStart(2, '0')}-01`;
    const lastDay = new Date(yearNum, monthNum, 0).getDate();
    const endDate = `${year}-${month.padStart(2, '0')}-${lastDay.toString().padStart(2, '0')}`;

    // Get all tasks assigned to this person with their completions for the month
    const tasks = await prisma.task.findMany({
      where: {
        assignedToId: personIdNum,
      },
      include: {
        completions: {
          where: {
            completedDate: {
              gte: startDate,
              lte: endDate,
            },
          },
          orderBy: {
            completedDate: 'asc',
          },
        },
      },
    });

    // Calculate total points earned
    let totalPoints = 0;
    const completionDetails: any[] = [];

    tasks.forEach(task => {
      task.completions.forEach(completion => {
        const points = task.points || 0;
        totalPoints += points;
        completionDetails.push({
          taskId: task.id,
          taskTitle: task.title,
          completedDate: completion.completedDate,
          points: points,
          money: task.money || 0,
        });
      });
    });

    // Sort completions by date
    completionDetails.sort((a, b) => a.completedDate.localeCompare(b.completedDate));

    return NextResponse.json({
      person: {
        id: person.id,
        name: person.name,
        pointGoal: person.pointGoal || 0,
      },
      year: yearNum,
      month: monthNum,
      totalPoints,
      completionCount: completionDetails.length,
      completions: completionDetails,
      progress: person.pointGoal ? (totalPoints / person.pointGoal) * 100 : 0,
    });
  } catch (error) {
    console.error('Error fetching report:', error);
    return NextResponse.json(
      { error: 'Failed to fetch report' },
      { status: 500 }
    );
  }
}
