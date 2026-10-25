import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  await prisma.employee.updateMany({
    where: { status: 'ONBOARDING' },
    data: { status: 'Onboarding' }
  });
  console.log('Fixed Mock Employee casing!');
}
main().catch(console.error).finally(() => prisma.$disconnect());
