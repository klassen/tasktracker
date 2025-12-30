import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// PATCH /api/people/[id]/goal - Update person's point goal
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const personId = parseInt(id);
    
    if (isNaN(personId)) {
      return NextResponse.json(
        { error: 'Invalid person ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { pointGoal } = body;

    if (typeof pointGoal !== 'number' || pointGoal < 0) {
      return NextResponse.json(
        { error: 'Point goal must be a non-negative number' },
        { status: 400 }
      );
    }

    const person = await prisma.person.update({
      where: { id: personId },
      data: { pointGoal },
    });

    return NextResponse.json(person);
  } catch (error) {
    console.error('Error updating point goal:', error);
    return NextResponse.json(
      { error: 'Failed to update point goal' },
      { status: 500 }
    );
  }
}
