# Custom Task Tracker App - Copilot Instructions

## Project Overview
A task tracker built with Next.js 14, TypeScript, Prisma, PostgreSQL, and Tailwind CSS.

## Critical Rules

### Date/Time Handling
🚨 **ALWAYS use local time - NEVER use UTC or ISO dates!**

All dates in the database are stored as local datetime strings (YYYY-MM-DD HH:MM:SS).

```typescript
// ❌ WRONG - Never do this:
const now = new Date().toISOString();
const date = new Date(dateString);

// ✅ CORRECT - Always use utilities from lib/utils/dateUtils.ts:
import { getLocalDateTime, parseLocalDateTime } from '@/lib/utils/dateUtils';
const now = getLocalDateTime();
const date = parseLocalDateTime(dateString);
```

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
