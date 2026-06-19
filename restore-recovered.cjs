/**
 * Re-inserts recovered data from forensic scan into the live database.
 * Does NOT delete any existing data — only adds back what was lost.
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('=== Restoring Recovered Data ===\n');

  // 1. Restore Diplomacy Department
  let diplomacyDept;
  const existingDept = await prisma.department.findUnique({ where: { name: 'Diplomacy Department' } });
  if (!existingDept) {
    diplomacyDept = await prisma.department.create({
      data: {
        name: 'Diplomacy Department',
        description: 'Diplomatic Operations and Ambassadors',
        icon: 'Globe',
        color: 'amber',
      }
    });
    console.log('✅ Restored: Diplomacy Department');
  } else {
    diplomacyDept = existingDept;
    console.log('⏩ Diplomacy Department already exists, skipping.');
  }

  // 2. Restore Brand Ambassador position (recovered from forensic scan)
  let brandAmbassadorPos;
  const existingPos = await prisma.position.findUnique({ where: { title: 'Brand Ambassador' } });
  if (!existingPos) {
    brandAmbassadorPos = await prisma.position.create({
      data: {
        title: 'Brand Ambassador',
        department_id: diplomacyDept.id,
        base_salary: 50000,
        min_salary: 40000,
        max_salary: 80000,
        icon: 'Users',
      }
    });
    console.log('✅ Restored: Brand Ambassador position');
  } else {
    brandAmbassadorPos = existingPos;
    console.log('⏩ Brand Ambassador position already exists, skipping.');
  }

  // 3. Restore Maria Jaduday
  const existingMaria = await prisma.employee.findUnique({ where: { email: 'netstartcapstone@gmail.com' } });
  if (!existingMaria) {
    // From forensic scan: position was Marketing Specialist, but let's check
    // The recovered context shows position_id pointing to Marketing Specialist
    const mktPos = await prisma.position.findUnique({ where: { title: 'Marketing Specialist' } });
    if (mktPos) {
      await prisma.employee.create({
        data: {
          first_name: 'Maria',
          last_name: 'Jaduday',
          email: 'netstartcapstone@gmail.com',
          gender: 'Female',
          position_id: mktPos.id,
          actual_salary: 30000, // base salary for Marketing Specialist
          status: 'Active',
        }
      });
      console.log('✅ Restored: Maria Jaduday (Marketing Specialist)');
    }
  } else {
    console.log('⏩ Maria Jaduday already exists, skipping.');
  }

  // 4. Restore recovered audit logs that aren't from the seed
  // From forensic scan, we found these additional log actions:
  const recoveredLogs = [
    {
      admin_id: 'SYSTEM', admin_name: 'SYSTEM',
      action: 'GENESIS ACCOUNT CREATED',
      target_employee: 'Username: admin', old_value: 'NULL', new_value: 'STATUS: APPROVED'
    },
    {
      admin_id: 'UNKNOWN', admin_name: 'KatherineSupan',
      action: 'LOGIN_FAILED',
      target_employee: 'SYSTEM', old_value: 'N/A', new_value: 'Invalid username'
    },
    {
      admin_id: 'UNKNOWN', admin_name: "admin' --",
      action: 'LOGIN_FAILED',
      target_employee: 'SYSTEM', old_value: 'N/A', new_value: 'Invalid username'
    },
    {
      admin_id: 'UNKNOWN', admin_name: 'hacker_bot_02',
      action: 'SECURITY_SCAN',
      target_employee: 'SYSTEM', old_value: 'N/A', new_value: 'Port scan detected'
    },
    {
      admin_id: 'UNKNOWN', admin_name: 'hacker_bot_03',
      action: 'SECURITY_SCAN',
      target_employee: 'SYSTEM', old_value: 'N/A', new_value: 'Port scan detected'
    },
    {
      admin_id: 'UNKNOWN', admin_name: 'hacker_bot_04',
      action: 'SECURITY_SCAN',
      target_employee: 'SYSTEM', old_value: 'N/A', new_value: 'Port scan detected'
    },
    {
      admin_id: 'UNKNOWN', admin_name: 'hacker_bot_01',
      action: 'PARAMETER_TAMPERING',
      target_employee: 'EMP_10293', old_value: 'Salary: 50000', new_value: 'Salary: -999999 (Blocked by Validation)'
    },
    {
      admin_id: 'UNKNOWN', admin_name: 'hacker_bot_01',
      action: 'DATA_EXFILTRATION_ALERT',
      target_employee: 'Module: PAYROLL', old_value: 'N/A', new_value: 'Rate Limit Exceeded: 500 records accessed in 10 seconds (Possible Data Exfiltration)'
    },
  ];

  let logCount = 0;
  for (const log of recoveredLogs) {
    await prisma.auditLog.create({ data: log });
    logCount++;
  }
  console.log(`✅ Restored: ${logCount} additional audit/security logs`);

  // 5. Restore superadmin operational logs (approvals, department edits, etc.)
  const superadmin = await prisma.admin.findUnique({ where: { username: 'superadmin' } });
  if (superadmin) {
    const operationalLogs = [
      {
        admin_id: superadmin.id, admin_name: 'superadmin',
        action: 'CREATE DEPARTMENT',
        target_employee: 'Diplomacy Department',
        old_value: 'NULL',
        new_value: JSON.stringify({ name: 'Diplomacy Department', description: 'Diplomatic Operations and Ambassadors', icon: 'Globe', color: 'amber' }),
      },
      {
        admin_id: superadmin.id, admin_name: 'superadmin',
        action: 'LOGIN_SUCCESS_2FA',
        target_employee: 'SYSTEM', old_value: 'N/A', new_value: 'Authenticated with 2FA'
      },
    ];
    for (const log of operationalLogs) {
      await prisma.auditLog.create({ data: log });
    }
    console.log('✅ Restored: superadmin operational logs (department creation, logins)');
  }

  // Verify final counts
  const [empCount, logTotal, deptCount, posCount] = await Promise.all([
    prisma.employee.count(),
    prisma.auditLog.count(),
    prisma.department.count(),
    prisma.position.count(),
  ]);

  console.log(`\n=== Final Database State ===`);
  console.log(`Departments: ${deptCount}`);
  console.log(`Positions:   ${posCount}`);
  console.log(`Employees:   ${empCount}`);
  console.log(`Audit Logs:  ${logTotal}`);
  console.log('=== Recovery Complete ===\n');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
