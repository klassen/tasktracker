import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Helper function to calculate possible completions for a task in a date range
function calculatePossibleCompletions(activeDays: string, startDate: string, endDate: string): number {
  const activeDayNumbers = activeDays.split(',').map(d => parseInt(d.trim()));
  let count = 0;
  
  const start = new Date(startDate + 'T00:00:00');
  const end = new Date(endDate + 'T00:00:00');
  
  for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
    const dayOfWeek = date.getDay();
    if (activeDayNumbers.includes(dayOfWeek)) {
      count++;
    }
  }
  
  return count;
}

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
    
    // For current month, use today as end date (prorated), otherwise use last day of month
    const now = new Date();
    const isCurrentMonth = yearNum === now.getFullYear() && monthNum === (now.getMonth() + 1);
    const currentDay = isCurrentMonth ? now.getDate() : lastDay;
    const endDate = `${year}-${month.padStart(2, '0')}-${currentDay.toString().padStart(2, '0')}`;

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

    // Calculate total points earned and task summaries
    let totalPoints = 0;
    let totalCompletions = 0;
    const taskSummaries: any[] = [];

    tasks.forEach(task => {
      const completionCount = task.completions.length;
      const pointsPerCompletion = task.points || 0;
      const taskTotalPoints = pointsPerCompletion * completionCount;
      
      // Calculate possible completions based on active days
      const possibleCompletions = calculatePossibleCompletions(task.activeDays, startDate, endDate);
      const percentComplete = possibleCompletions > 0 ? (completionCount / possibleCompletions) * 100 : 0;
      
      totalPoints += taskTotalPoints;
      totalCompletions += completionCount;
      
      taskSummaries.push({
        taskId: task.id,
        taskTitle: task.title,
        completionCount,
        possibleCompletions,
        percentComplete: Math.round(percentComplete), // Round to whole number
        pointsPerCompletion,
        totalPoints: taskTotalPoints,
      });
    });

    // Sort by completion count (descending)
    taskSummaries.sort((a, b) => b.completionCount - a.completionCount);

    return NextResponse.json({
      person: {
        id: person.id,
        name: person.name,
        pointGoal: person.pointGoal || 0,
      },
      year: yearNum,
      month: monthNum,
      totalPoints,
      completionCount: totalCompletions,
      taskSummaries,
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
