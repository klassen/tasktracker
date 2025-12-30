import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/calendar/status?tenantId=1 - Check if calendar is connected
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId');

    if (!tenantId) {
      return NextResponse.json(
        { error: 'tenantId is required' },
        { status: 400 }
      );
    }

    const settings = await prisma.calendarSettings.findUnique({
      where: { tenantId: parseInt(tenantId) },
    });
    
    return NextResponse.json({
      connected: !!settings,
      hasSelectedCalendars: settings?.selectedCalendars ? settings.selectedCalendars.length > 0 : false,
      selectedCalendars: settings?.selectedCalendars || '',
    });
  } catch (error) {
    console.error('Error checking calendar status:', error);
    return NextResponse.json(
      { error: 'Failed to check calendar status' },
      { status: 500 }
    );
  }
}

// DELETE /api/calendar/status?tenantId=1 - Disconnect calendar
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId');

    if (!tenantId) {
      return NextResponse.json(
        { error: 'tenantId is required' },
        { status: 400 }
      );
    }

    await prisma.calendarSettings.deleteMany({
      where: { tenantId: parseInt(tenantId) },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error disconnecting calendar:', error);
    return NextResponse.json(
      { error: 'Failed to disconnect calendar' },
      { status: 500 }
    );
  }
}
