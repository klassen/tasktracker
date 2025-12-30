# Custom Task Tracker App

A modern task tracking application built with Next.js 14, TypeScript, Prisma, and PostgreSQL.

## Features

- ✅ Create, read, update, and delete tasks
- 🏷️ Task status management (Pending, In Progress, Completed)
- 🎯 Priority levels (Low, Medium, High)
- 🔍 Filter tasks by status and priority
- 📅 Track creation and due dates
- 🌙 Dark mode support
- 📱 Responsive design with Tailwind CSS

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Styling**: Tailwind CSS
- **Date Handling**: Custom local datetime utilities

## Critical: Date/Time Handling

🚨 **This project uses local time exclusively - NEVER use UTC or ISO dates!**

All dates in the database are stored as local datetime strings in the format: `YYYY-MM-DD HH:MM:SS`

Always use the utilities from `src/lib/utils/dateUtils.ts`:

```typescript
// ❌ WRONG - Never do this:
const now = new Date().toISOString();
const date = new Date(dateString);

// ✅ CORRECT - Always use utilities:
import { getLocalDateTime, parseLocalDateTime } from '@/lib/utils/dateUtils';
const now = getLocalDateTime();
const date = parseLocalDateTime(dateString);
```

## Getting Started

### Prerequisites

- Node.js 18+ 
- PostgreSQL database
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd customtaskapp-react
```

2. Install dependencies:
```bash
npm install
```

3. Set up your database:
   - Create a PostgreSQL database
   - Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
   - Update the `DATABASE_URL` in `.env` with your database credentials:
   ```
   DATABASE_URL="postgresql://username:password@localhost:5432/tasktracker?schema=public"
   ```

4. Run Prisma migrations:
```bash
npx prisma migrate dev --name init
```

5. (Optional) Seed the database:
```bash
npx prisma db seed
```

6. Start the development server:
```bash
npm run dev
```

7. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

```
customtaskapp-react/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   └── tasks/          # API routes for task CRUD
│   │   ├── layout.tsx          # Root layout
│   │   ├── page.tsx            # Home page
│   │   └── globals.css         # Global styles
│   ├── components/
│   │   ├── TaskList.tsx        # Main task list component
│   │   ├── TaskItem.tsx        # Individual task display
│   │   ├── TaskForm.tsx        # Task creation form
│   │   └── TaskFilters.tsx     # Filtering controls
│   ├── lib/
│   │   ├── prisma.ts           # Prisma client instance
│   │   └── utils/
│   │       └── dateUtils.ts    # Date/time utilities
│   └── types/
│       └── task.ts             # TypeScript types
├── prisma/
│   └── schema.prisma           # Database schema
├── .github/
│   └── copilot-instructions.md # Copilot guidelines
└── package.json
```

## Database Schema

```prisma
model Task {
  id          Int      @id @default(autoincrement())
  title       String
  description String?
  status      Status   @default(PENDING)
  priority    Priority @default(MEDIUM)
  createdAt   String   // YYYY-MM-DD HH:MM:SS
  updatedAt   String   // YYYY-MM-DD HH:MM:SS
  dueDate     String?  // YYYY-MM-DD HH:MM:SS
}

enum Status {
  PENDING
  IN_PROGRESS
  COMPLETED
}

enum Priority {
  LOW
  MEDIUM
  HIGH
}
```

## API Routes

- `GET /api/tasks` - Get all tasks
- `POST /api/tasks` - Create a new task
- `GET /api/tasks/[id]` - Get a specific task
- `PATCH /api/tasks/[id]` - Update a task
- `DELETE /api/tasks/[id]` - Delete a task

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint

## Prisma Commands

- `npx prisma migrate dev` - Create and apply migrations
- `npx prisma generate` - Generate Prisma Client
- `npx prisma studio` - Open Prisma Studio (database GUI)
- `npx prisma db push` - Push schema changes without migrations

## Development Guidelines

1. **Always use local datetime utilities** - Never use `Date.toISOString()` or UTC methods
2. **Follow TypeScript strict mode** - All code uses strict type checking
3. **Use React best practices** - Proper hooks usage and component structure
4. **Maintain responsive design** - All components work on mobile and desktop
5. **Keep API routes RESTful** - Follow REST conventions for endpoints

## License

MIT

## Contributing

Contributions are welcome! Please follow the existing code style and ensure all dates use local time utilities.
