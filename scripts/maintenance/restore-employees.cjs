const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('=== RESTORING EMPLOYEE RECORDS ===\n');

  // Update Laura Harris
  await prisma.employee.updateMany({
    where: { first_name: 'Laura', last_name: 'Harris' },
    data: { actual_salary: 55000 }
  });
  console.log('✅ Updated Laura Harris salary to 55000');

  // Terminate Hannah Anderson
  await prisma.employee.updateMany({
    where: { first_name: 'Hannah', last_name: 'Anderson' },
    data: { status: 'Terminated', deleted_at: new Date() }
  });
  console.log('✅ Updated Hannah Anderson status to Terminated');

  // Check and restore Maria Jaduday
  const hrPos = await prisma.position.findUnique({ where: { title: 'HR Coordinator' } });
  
  const maria = await prisma.employee.findFirst({
    where: { first_name: 'Maria', last_name: 'Jaduday' }
  });

  if (!maria && hrPos) {
    await prisma.employee.create({
      data: {
        first_name: 'Maria',
        last_name: 'Jaduday',
        gender: 'Female',
        email: 'maria.j@salarize.com',
        position_id: hrPos.id,
        status: 'Active',
        actual_salary: 35769
      }
    });
    console.log('✅ Restored missing employee: Maria Jaduday (Salary: 35769)');
  } else if (maria) {
    await prisma.employee.update({
      where: { id: maria.id },
      data: { actual_salary: 35769 }
    });
    console.log('✅ Updated Maria Jaduday salary to 35769');
  }

  console.log('\n=== EMPLOYEE DATA RESTORED SUCCESSFULLY ===');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
