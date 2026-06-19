const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('=== RESTORING DEPARTMENT & POSITION METADATA ===\n');

  // Create missing Diplomacy Department
  await prisma.department.upsert({
    where: { name: 'Diplomacy Department' },
    update: {},
    create: {
      name: 'Diplomacy Department',
      description: 'Diplomatic Operations and Ambassadors',
      icon: 'Globe',
      color: 'amber'
    }
  });
  console.log('✅ Created Diplomacy Department');

  // Update Departments
  await prisma.department.updateMany({
    where: { name: 'IT Department' },
    data: { icon: 'Cpu', color: 'blue' }
  });
  await prisma.department.updateMany({
    where: { name: 'Marketing Department' },
    data: { icon: 'Globe', color: 'rose' }
  });
  await prisma.department.updateMany({
    where: { name: 'Finance Department' },
    data: { icon: 'Globe', color: 'emerald' }
  });
  console.log('✅ Restored Department Icons and Colors');

  // Update Positions Base Salaries
  const positionUpdates = [
    { title: 'Software Engineer', base: 55000 },
    { title: 'Marketing Specialist', base: 32000 },
    { title: 'HR Coordinator', base: 31000 },
    { title: 'Systems Administrator', base: 48000 },
    { title: 'Financial Analyst', base: 58000 },
  ];

  for (const pos of positionUpdates) {
    await prisma.position.updateMany({
      where: { title: pos.title },
      data: { base_salary: pos.base }
    });
  }
  console.log('✅ Restored Position Salaries');

  console.log('\n=== METADATA RESTORED SUCCESSFULLY ===');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
