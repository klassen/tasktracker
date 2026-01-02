# Custom Task Tracker App - Copilot Instructions

## Project Overview
A task tracker built with Next.js 14, TypeScript, Prisma, PostgreSQL, and Tailwind CSS.

## Critical Rules

### Date/Time Handling
🚨 **ALWAYS use local time - NEVER use UTC or ISO dates!**

All dates in the database are stored as local datetime strings (YYYY-MM-DD HH:MM:SS).

#### Client-Server Date Pattern
**CRITICAL**: Server-side code MUST NOT use `new Date()` or `getLocalDate()` for current date/time calculations because the server runs in UTC.

**CORRECT PATTERN**:
1. Client gets local date using `getLocalDate()` from dateUtils
2. Client sends local date as query parameter or request body to API
3. Server uses the client-provided date for all calculations
4. Server NEVER calls `new Date()` or `getLocalDate()` to determine "today"

**Examples**:
```typescript
// ❌ WRONG - Server API using getLocalDate():
export async function GET(request: NextRequest) {
  const today = getLocalDate(); // BAD: Returns server's date (UTC)
  // ... calculations ...
}

// ✅ CORRECT - Client sends date, server uses it:
// Client:
const localDate = getLocalDate();
await fetch(`/api/endpoint?localDate=${localDate}`);

// Server:
export async function GET(request: NextRequest) {
  const localDate = searchParams.get('localDate'); // GOOD: Uses client's date
  // ... calculations ...
}
```

#### Code Implementation Rules
```typescript
// ❌ WRONG - Never do this in API routes:
const now = new Date();
const today = getLocalDate(); // This is client-only!
const date = new Date(dateString);

// ✅ CORRECT - Always use utilities from lib/utils/dateUtils.ts:
import { getLocalDateTime, parseLocalDateTime } from '@/lib/utils/dateUtils';

// In CLIENT code (components):
const now = getLocalDateTime();
const today = getLocalDate();

// In SERVER code (API routes):
const localDate = searchParams.get('localDate'); // Get from client
const { year, month, day } = parseLocalDate(localDate); // Parse it
```

#### When Adding New Features
Before writing any date/time code, ask:
1. Is this server-side code? → Client MUST send the date
2. Does this need "today"? → Get it from the client
3. Am I comparing dates? → Ensure both are local date strings
4. Am I calculating a date range? → Start from client's local date

### Technology Stack
- Next.js 14 with App Router
- TypeScript for type safety
- Prisma ORM with PostgreSQL
- Tailwind CSS for styling
- Local datetime utilities (no UTC)

### Development Guidelines
- Always import and use dateUtils functions for any date/time operations
- Never use `new Date().toISOString()` or UTC methods
- Store all dates as strings in format: YYYY-MM-DD HH:MM:SS
- Use TypeScript strict mode
- Follow React best practices with hooks and components
