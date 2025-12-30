import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { prisma } from '@/lib/prisma';

async function getOAuth2Client(tenantId: number) {
  const settings = await prisma.calendarSettings.findUnique({
    where: { tenantId },
  });
  
  if (!settings) {
    return null;
  }

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI || `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/calendar/callback`
  );

  oauth2Client.setCredentials({
    access_token: settings.accessToken,
    refresh_token: settings.refreshToken,
  });

  return oauth2Client;
}

// GET /api/calendar/calendars?tenantId=1 - Get list of available calendars
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

    const auth = await getOAuth2Client(parseInt(tenantId));
    
    if (!auth) {
      return NextResponse.json(
        { error: 'Not authenticated with Google Calendar' },
        { status: 401 }
      );
    }

    const calendar = google.calendar({ version: 'v3', auth });
    const response = await calendar.calendarList.list();

    const calendars = response.data.items?.map(cal => ({
      id: cal.id,
      summary: cal.summary,
      description: cal.description,
      primary: cal.primary,
      backgroundColor: cal.backgroundColor,
    })) || [];

    return NextResponse.json({ calendars });
  } catch (error: any) {
    console.error('Error fetching calendars:', error);
    
    if (error.code === 401) {
      return NextResponse.json(
        { error: 'Authentication expired. Please reconnect your Google Calendar.' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to fetch calendars' },
      { status: 500 }
    );
  }
}

// POST /api/calendar/calendars - Update selected calendars
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { calendarIds, tenantId } = body;

    if (!Array.isArray(calendarIds)) {
      return NextResponse.json(
        { error: 'calendarIds must be an array' },
        { status: 400 }
      );
    }

    if (!tenantId) {
      return NextResponse.json(
        { error: 'tenantId is required' },
        { status: 400 }
      );
    }

    const settings = await prisma.calendarSettings.findUnique({
      where: { tenantId: parseInt(tenantId) },
    });
    
    if (!settings) {
      return NextResponse.json(
        { error: 'Not authenticated with Google Calendar' },
        { status: 401 }
      );
    }

    await prisma.calendarSettings.update({
      where: { id: settings.id },
      data: {
        selectedCalendars: calendarIds.join(','),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating selected calendars:', error);
    return NextResponse.json(
      { error: 'Failed to update selected calendars' },
      { status: 500 }
    );
  }
}
