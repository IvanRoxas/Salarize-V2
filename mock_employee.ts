import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const pos = await prisma.position.findFirst();
  if (pos) {
    await prisma.employee.create({
      data: {
        first_name: 'Mock',
        last_name: 'Onboarding',
        email: 'mock@example.com',
        gender: 'Female',
        position_id: pos.id,
        actual_salary: 50000,
        status: 'ONBOARDING'
      }
    });
    console.log('Mock Onboarding employee created!');
  }
}
main().catch(console.error).finally(() => prisma.$disconnect());
