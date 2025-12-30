import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { prisma } from '@/lib/prisma';
import { getLocalDateTime } from '@/lib/utils/dateUtils';

// GET /api/calendar/callback?code=...&state=tenantId - OAuth callback handler
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const error = searchParams.get('error');
    const tenantId = searchParams.get('state'); // tenantId passed via state param

    if (error) {
      return NextResponse.redirect(new URL('/?calendar_error=' + error, request.url));
    }

    if (!code) {
      return NextResponse.redirect(new URL('/?calendar_error=no_code', request.url));
    }

    if (!tenantId) {
      return NextResponse.redirect(new URL('/?calendar_error=no_tenant', request.url));
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = process.env.GOOGLE_REDIRECT_URI || `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/calendar/callback`;

    const oauth2Client = new google.auth.OAuth2(
      clientId,
      clientSecret,
      redirectUri
    );

    const { tokens } = await oauth2Client.getToken(code);

    if (!tokens.access_token || !tokens.refresh_token) {
      return NextResponse.redirect(new URL('/?calendar_error=no_tokens', request.url));
    }

    // Calculate token expiry
    const expiryDate = new Date();
    if (tokens.expiry_date) {
      expiryDate.setTime(tokens.expiry_date);
    } else {
      // Default to 1 hour if not provided
      expiryDate.setTime(Date.now() + 3600 * 1000);
    }

    const now = getLocalDateTime();
    const expiry = getLocalDateTime(); // Will update with actual expiry calculation

    // Delete existing settings for this tenant and create new one
    await prisma.calendarSettings.deleteMany({
      where: { tenantId: parseInt(tenantId) },
    });
    await prisma.calendarSettings.create({
      data: {
        tenantId: parseInt(tenantId),
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        tokenExpiry: expiry,
        selectedCalendars: '', // Will be selected later
        createdAt: now,
        updatedAt: now,
      },
    });

    return NextResponse.redirect(new URL('/?calendar_success=true', request.url));
  } catch (error) {
    console.error('Error in OAuth callback:', error);
    return NextResponse.redirect(new URL('/?calendar_error=callback_failed', request.url));
  }
}
