import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const accounts = [
    { username: 'superadmin', password: 'SuperAdmin@2026', role: 'SUPER_ADMIN' },
    { username: 'hrmanager', password: 'HrManager@2026', role: 'HR_MANAGER' },
    { username: 'auditor', password: 'Auditor@2026', role: 'AUDITOR' }
  ];

  for (const acc of accounts) {
    const password_hash = await bcrypt.hash(acc.password, 10);
    
    const user = await prisma.admin.findUnique({ where: { username: acc.username } });
    if (user) {
      await prisma.admin.update({
        where: { username: acc.username },
        data: {
          password_hash,
          role: acc.role,
          status: 'APPROVED'
        }
      });
      console.log(`Updated and approved ${acc.username}`);
    } else {
      await prisma.admin.create({
        data: {
          username: acc.username,
          email: `${acc.username}@salarize.com`,
          password_hash,
          role: acc.role,
          status: 'APPROVED'
        }
      });
      console.log(`Created and approved ${acc.username}`);
    }
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
