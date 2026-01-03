import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { prisma } from '@/lib/prisma';
import { getLocalDate } from '@/lib/utils/dateUtils';

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

  return { auth: oauth2Client, settings };
}

// GET /api/calendar/events?tenantId=1 - Get today's events from selected calendars
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId');
    const localDate = searchParams.get('localDate');
    const timeZone = searchParams.get('timeZone') || 'America/Chicago'; // Default to CST

    if (!tenantId) {
      return NextResponse.json(
        { error: 'tenantId is required' },
        { status: 400 }
      );
    }

    const result = await getOAuth2Client(parseInt(tenantId));
    
    if (!result) {
      return NextResponse.json({ events: [], authenticated: false });
    }

    const { auth, settings } = result;

    if (!settings.selectedCalendars) {
      return NextResponse.json({ events: [], authenticated: true });
    }

    const calendarIds = settings.selectedCalendars.split(',').filter((id: string) => id.trim());
    
    if (calendarIds.length === 0) {
      return NextResponse.json({ events: [], authenticated: true });
    }

    const calendar = google.calendar({ version: 'v3', auth });
    

    // Use the user's local date if provided, else fallback to server local date
    const dateStr = localDate || (await import('@/lib/utils/dateUtils')).getLocalDate();
    
    console.log('[Calendar API] ==================== CALENDAR EVENT FETCH ====================');
    console.log('[Calendar API] Client provided localDate:', localDate);
    console.log('[Calendar API] Client provided timeZone:', timeZone);
    console.log('[Calendar API] Using dateStr:', dateStr);
    console.log('[Calendar API] Server Date object:', new Date().toString());
    console.log('[Calendar API] Server timezone offset (minutes):', new Date().getTimezoneOffset());
    
    // Create date boundaries in the user's timezone
    // Google Calendar API will interpret these as local times in the specified timezone
    const timeMin = `${dateStr}T00:00:00`;
    const timeMax = `${dateStr}T23:59:59`;
    
    console.log('[Calendar API] timeMin (sent to Google):', timeMin);
    console.log('[Calendar API] timeMax (sent to Google):', timeMax);
    console.log('[Calendar API] timeZone (sent to Google):', timeZone);

    const allEvents: any[] = [];

    // First, fetch calendar details to get colors from calendarList
    const calendarColors: { [key: string]: string } = {};
    for (const calendarId of calendarIds) {
      try {
        const calendarInfo = await calendar.calendarList.get({ calendarId });
        calendarColors[calendarId] = calendarInfo.data.backgroundColor || '#3b82f6';
      } catch (error) {
        console.error(`Error fetching calendar info for ${calendarId}:`, error);
        calendarColors[calendarId] = '#3b82f6'; // Default blue
      }
    }

    // Fetch events from each selected calendar
    for (const calendarId of calendarIds) {
      try {
        console.log(`[Calendar API] Fetching events from calendar: ${calendarId}`);
        const response = await calendar.events.list({
          calendarId,
          timeMin,
          timeMax,
          timeZone, // Tell Google to interpret times in user's timezone
          singleEvents: true,
          orderBy: 'startTime',
        });

        console.log(`[Calendar API] Calendar ${calendarId} returned ${response.data.items?.length || 0} events`);
        if (response.data.items && response.data.items.length > 0) {
          console.log(`[Calendar API] First event:`, response.data.items[0]);
        }

        const events = response.data.items?.map((event: any) => ({
          id: event.id,
          summary: event.summary,
          description: event.description,
          start: event.start?.dateTime || event.start?.date,
          end: event.end?.dateTime || event.end?.date,
          location: event.location,
          htmlLink: event.htmlLink,
          calendarId,
          color: event.colorId ? undefined : calendarColors[calendarId], // Use event color if set, otherwise calendar color
          eventColorId: event.colorId, // Store event-specific color ID if it exists
        })) || [];

        allEvents.push(...events);
      } catch (error) {
        console.error(`[Calendar API] Error fetching events from calendar ${calendarId}:`, error);
        // Continue with other calendars
      }
    }

    // Sort all events by start time
    allEvents.sort((a, b) => {
      const aTime = new Date(a.start).getTime();
      const bTime = new Date(b.start).getTime();
      return aTime - bTime;
    });

    console.log(`[Calendar API] Total events returned: ${allEvents.length}`);
    console.log('[Calendar API] ==================== END CALENDAR FETCH ====================');

    return NextResponse.json({ events: allEvents, authenticated: true });
  } catch (error: any) {
    console.error('Error fetching events:', error);
    
    if (error.code === 401) {
      return NextResponse.json(
        { events: [], authenticated: false },
        { status: 200 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to fetch events' },
      { status: 500 }
    );
  }
}
