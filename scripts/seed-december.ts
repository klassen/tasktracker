import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function seedDecember() {
  console.log('Starting December 2025 seed...');

  try {
    // Get all tenants
    const tenants = await prisma.tenant.findMany({
      include: {
        people: {
          include: {
            tasks: true,
          },
        },
      },
    });

    if (tenants.length === 0) {
      console.log('No tenants found. Please create a tenant and some tasks first.');
      return;
    }

    console.log(`Found ${tenants.length} tenant(s)`);

    for (const tenant of tenants) {
      console.log(`\nProcessing tenant: ${tenant.name}`);

      for (const person of tenant.people) {
        console.log(`  Person: ${person.name} with ${person.tasks.length} tasks`);

        for (const task of person.tasks) {
          console.log(`    Task: ${task.title}`);

          // Parse active days
          const activeDays = task.activeDays.split(',').map(d => parseInt(d.trim()));

          // Generate completions for December 2025
          const completions: Array<{ taskId: number; completedDate: string; createdAt: string }> = [];

          for (let day = 1; day <= 31; day++) {
            const date = new Date(2025, 11, day); // December 2025 (month is 0-indexed)
            const dayOfWeek = date.getDay();

            // Only create completion if task is active on this day
            if (activeDays.includes(dayOfWeek)) {
              // Randomly decide if task was completed (80% chance)
              if (Math.random() < 0.8) {
                const dateStr = `2025-12-${String(day).padStart(2, '0')}`;
                const createdAt = `2025-12-${String(day).padStart(2, '0')} ${String(Math.floor(Math.random() * 12 + 8)).padStart(2, '0')}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}:00`;

                completions.push({
                  taskId: task.id,
                  completedDate: dateStr,
                  createdAt: createdAt,
                });
              }
            }
          }

          console.log(`      Creating ${completions.length} completions`);

          // Bulk create completions (skip duplicates)
          for (const completion of completions) {
            try {
              await prisma.taskCompletion.upsert({
                where: {
                  taskId_completedDate: {
                    taskId: completion.taskId,
                    completedDate: completion.completedDate,
                  },
                },
                update: {},
                create: completion,
              });
            } catch (error) {
              // Skip if already exists
            }
          }
        }
      }
    }

    console.log('\n✅ December 2025 seed completed successfully!');
  } catch (error) {
    console.error('Error seeding December data:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

seedDecember()
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exit(1);
  });
