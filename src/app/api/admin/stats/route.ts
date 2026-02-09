import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

function getMonthRange(localDate: string) {
  const parts = localDate.split('-').map((value) => parseInt(value, 10));
  if (parts.length !== 3 || parts.some((value) => Number.isNaN(value))) {
    return null;
  }

  const [year, month] = parts;
  if (year < 1970 || month < 1 || month > 12) {
    return null;
  }

  const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
  const endDay = new Date(year, month, 0).getDate();
  const endDate = `${year}-${String(month).padStart(2, '0')}-${String(endDay).padStart(2, '0')}`;

  return { startDate, endDate };
}

// GET /api/admin/stats?localDate=YYYY-MM-DD - Get per-account activity summary
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const localDate = searchParams.get('localDate');

    if (!localDate) {
      return NextResponse.json(
        { error: 'localDate is required' },
        { status: 400 }
      );
    }

    const monthRange = getMonthRange(localDate);
    if (!monthRange) {
      return NextResponse.json(
        { error: 'Invalid localDate format. Expected YYYY-MM-DD' },
        { status: 400 }
      );
    }

    const tenants = await prisma.tenant.findMany({
      select: {
        id: true,
        name: true,
      },
      orderBy: { name: 'asc' },
    });

    const stats = await Promise.all(
      tenants.map(async (tenant) => {
        const [peopleCount, taskCount, usageDays] = await Promise.all([
          prisma.person.count({ where: { tenantId: tenant.id } }),
          prisma.task.count({
            where: {
              assignedTo: {
                tenantId: tenant.id,
              },
            },
          }),
          prisma.taskCompletion.findMany({
            where: {
              completedDate: {
                gte: monthRange.startDate,
                lte: monthRange.endDate,
              },
              task: {
                assignedTo: {
                  tenantId: tenant.id,
                },
              },
            },
            select: {
              completedDate: true,
            },
            distinct: ['completedDate'],
          }),
        ]);

        return {
          tenantId: tenant.id,
          tenantName: tenant.name,
          peopleCount,
          taskCount,
          usageDaysInMonth: usageDays.length,
        };
      })
    );

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch admin stats' },
      { status: 500 }
    );
  }
}
