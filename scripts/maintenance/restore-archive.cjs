const fs = require('fs');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const data = JSON.parse(fs.readFileSync('recovered-logs.json', 'utf8'));
  console.log(`Found ${data.length} logs in JSON.`);
  
  let inserted = 0;
  for (const log of data) {
    try {
      await prisma.auditLog.create({
        data: {
          admin_id: log.admin_id.substring(0, 255),
          admin_name: log.admin_name.substring(0, 255),
          action: log.action.substring(0, 255),
          target_employee: log.target_employee ? log.target_employee.substring(0, 255) : null,
          new_value: log.raw_context ? log.raw_context.substring(0, 255) : null,
          is_archived: true
        }
      });
      inserted++;
    } catch (e) {
      console.error(e);
    }
  }
  console.log(`Inserted ${inserted} archive logs.`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
