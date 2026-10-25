const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  await prisma.admin.update({
    where: { username: 'superadmin' },
    data: { email: 'netstartcapstone@gmail.com' }
  });
  console.log('✅ Super Admin email safely changed to: netstartcapstone@gmail.com');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
