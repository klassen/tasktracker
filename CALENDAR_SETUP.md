# Google Calendar Integration Setup

## 1. Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google Calendar API:
   - Go to "APIs & Services" > "Library"
   - Search for "Google Calendar API"
   - Click "Enable"

## 2. Create OAuth 2.0 Credentials

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth client ID"
3. If prompted, configure the OAuth consent screen:
   - User Type: External (for testing) or Internal (for organization)
   - App name: Task Tracker
   - User support email: your email
   - Developer contact: your email
   - Scopes: Add the Google Calendar API read-only scope
   - Test users: Add your Gmail account
4. Create OAuth Client ID:
   - Application type: Web application
   - Name: Task Tracker Web Client
   - Authorized redirect URIs: 
     - `http://localhost:3000/api/calendar/callback` (for development)
     - Add your production URL when deploying
5. Copy the Client ID and Client Secret

## 3. Update Environment Variables

Add to your `.env` file:

```env
GOOGLE_CLIENT_ID=your_client_id_here.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_client_secret_here
GOOGLE_REDIRECT_URI=http://localhost:3000/api/calendar/callback
```

## 4. Using the Integration

1. Start your development server: `npm run dev`
2. Switch to Admin Mode
3. Click "Calendar Setup"
4. Click "Connect Google Calendar"
5. Sign in with your Google account
6. Grant calendar read permissions
7. Select which calendars you want to display
8. Click "Save Selection"

## 5. Viewing Events

Switch back to View Only mode to see today's events from your selected calendars displayed on the main dashboard.

## Troubleshooting

- **"redirect_uri_mismatch" error**: Make sure the redirect URI in Google Cloud Console exactly matches `http://localhost:3000/api/calendar/callback`
- **"Access blocked" error**: Make sure you've added your email as a test user in the OAuth consent screen
- **No events showing**: Check that you've selected at least one calendar and that calendar has events today
