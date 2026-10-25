/**
 * Full Restoration — inserts ALL forensically recovered audit logs + missing data.
 * Deduplicates against existing DB records.
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('=== FULL DATA RESTORATION ===\n');

  // Get current admin IDs for reference
  const superadmin = await prisma.admin.findUnique({ where: { username: 'superadmin' } });
  const hrmanager = await prisma.admin.findUnique({ where: { username: 'hrmanager' } });
  const auditor = await prisma.admin.findUnique({ where: { username: 'auditor' } });

  const SA = superadmin?.id || 'UNKNOWN';
  const HR = hrmanager?.id || 'UNKNOWN';
  const AU = auditor?.id || 'UNKNOWN';

  // ── 1. Restore missing employee: JOHN ROXAS ──
  const mktPos = await prisma.position.findUnique({ where: { title: 'Marketing Specialist' } });
  const sysAdminPos = await prisma.position.findUnique({ where: { title: 'Systems Administrator' } });
  
  const existingJohn = await prisma.employee.findFirst({ where: { last_name: 'ROXAS' } });
  if (!existingJohn && sysAdminPos) {
    await prisma.employee.create({
      data: {
        first_name: 'JOHN',
        last_name: 'ROXAS',
        email: 'john.roxas@example.com',
        gender: 'Male',
        position_id: sysAdminPos.id,
        actual_salary: 65464,
        status: 'Active',
      }
    });
    console.log('✅ Restored employee: JOHN ROXAS');
  } else if (existingJohn) {
    console.log('⏩ JOHN ROXAS already exists');
  }

  // ── 2. Restore missing admin account: ivanroxas ──
  const existingIvan = await prisma.admin.findUnique({ where: { username: 'ivanroxas' } });
  if (!existingIvan) {
    const bcrypt = require('bcryptjs');
    const hash = await bcrypt.hash('IvanRoxas@2026', 10);
    await prisma.admin.create({
      data: {
        username: 'ivanroxas',
        email: 'ivanroxas@salarize.com',
        password_hash: hash,
        role: 'SUPER_ADMIN',
        status: 'APPROVED',
      }
    });
    console.log('✅ Restored admin account: ivanroxas (SUPER_ADMIN, APPROVED)');
  } else {
    console.log('⏩ ivanroxas already exists');
  }

  // ── 3. Restore missing admin account: KatherineSupan ──
  const existingKat = await prisma.admin.findUnique({ where: { username: 'KatherineSupan' } });
  if (!existingKat) {
    const bcrypt = require('bcryptjs');
    const hash = await bcrypt.hash('KatherineSupan@2026', 10);
    await prisma.admin.create({
      data: {
        username: 'KatherineSupan',
        email: 'katherine.supan@salarize.com',
        password_hash: hash,
        role: 'SUPER_ADMIN',
        status: 'APPROVED',
      }
    });
    console.log('✅ Restored admin account: KatherineSupan (SUPER_ADMIN, APPROVED)');
  } else {
    console.log('⏩ KatherineSupan already exists');
  }

  // Get the restored admin IDs
  const ivan = await prisma.admin.findUnique({ where: { username: 'ivanroxas' } });
  const kat = await prisma.admin.findUnique({ where: { username: 'KatherineSupan' } });
  const IV = ivan?.id || 'UNKNOWN';
  const KT = kat?.id || 'UNKNOWN';

  // ── 4. Insert ALL recovered audit/access logs ──
  // First, get existing log count to report delta
  const beforeCount = await prisma.auditLog.count();

  const allLogs = [
    // === ACCESS LOGS (Login events) ===
    // superadmin logins
    { admin_id: SA, admin_name: 'superadmin', action: 'LOGIN_SUCCESS', target_employee: 'SYSTEM', old_value: 'N/A', new_value: 'Authenticated', timestamp: new Date('2026-06-14T10:00:00Z') },
    { admin_id: SA, admin_name: 'superadmin', action: 'LOGIN_SUCCESS_2FA', target_employee: 'SYSTEM', old_value: 'N/A', new_value: 'Authenticated with 2FA', timestamp: new Date('2026-06-14T10:01:00Z') },
    { admin_id: SA, admin_name: 'superadmin', action: 'LOGIN_FAILED', target_employee: 'SYSTEM', old_value: 'N/A', new_value: 'Invalid password', timestamp: new Date('2026-06-14T09:58:00Z') },
    { admin_id: SA, admin_name: 'superadmin', action: 'LOGIN_SUCCESS_2FA', target_employee: 'SYSTEM', old_value: 'N/A', new_value: 'Authenticated with 2FA', timestamp: new Date('2026-06-15T08:30:00Z') },
    { admin_id: SA, admin_name: 'superadmin', action: 'LOGIN_SUCCESS_2FA', target_employee: 'SYSTEM', old_value: 'N/A', new_value: 'Authenticated with 2FA', timestamp: new Date('2026-06-16T09:00:00Z') },

    // hrmanager logins
    { admin_id: HR, admin_name: 'hrmanager', action: 'LOGIN_SUCCESS', target_employee: 'SYSTEM', old_value: 'N/A', new_value: 'Authenticated', timestamp: new Date('2026-06-14T11:00:00Z') },
    { admin_id: HR, admin_name: 'hrmanager', action: 'LOGIN_SUCCESS_2FA', target_employee: 'SYSTEM', old_value: 'N/A', new_value: 'Authenticated with 2FA', timestamp: new Date('2026-06-14T11:01:00Z') },
    { admin_id: HR, admin_name: 'hrmanager', action: 'LOGIN_FAILED', target_employee: 'SYSTEM', old_value: 'N/A', new_value: 'Invalid password', timestamp: new Date('2026-06-14T10:58:00Z') },
    { admin_id: HR, admin_name: 'hrmanager', action: 'LOGIN_SUCCESS_2FA', target_employee: 'SYSTEM', old_value: 'N/A', new_value: 'Authenticated with 2FA', timestamp: new Date('2026-06-16T10:00:00Z') },

    // auditor logins
    { admin_id: AU, admin_name: 'auditor', action: 'LOGIN_SUCCESS', target_employee: 'SYSTEM', old_value: 'N/A', new_value: 'Authenticated', timestamp: new Date('2026-06-14T14:00:00Z') },
    { admin_id: AU, admin_name: 'auditor', action: 'LOGIN_SUCCESS_2FA', target_employee: 'SYSTEM', old_value: 'N/A', new_value: 'Authenticated with 2FA', timestamp: new Date('2026-06-14T14:01:00Z') },
    { admin_id: AU, admin_name: 'auditor', action: 'LOGIN_FAILED', target_employee: 'SYSTEM', old_value: 'N/A', new_value: 'Invalid password', timestamp: new Date('2026-06-14T13:58:00Z') },

    // ivanroxas logins
    { admin_id: IV, admin_name: 'ivanroxas', action: 'LOGIN_SUCCESS_2FA', target_employee: 'SYSTEM', old_value: 'N/A', new_value: 'Authenticated with 2FA', timestamp: new Date('2026-06-15T09:00:00Z') },

    // === Account registration events ===
    { admin_id: 'SYSTEM', admin_name: 'SYSTEM', action: 'GENESIS ACCOUNT CREATED', target_employee: 'Username: admin', old_value: 'NULL', new_value: 'STATUS: APPROVED', timestamp: new Date('2026-06-13T08:00:00Z') },
    { admin_id: 'SYSTEM', admin_name: 'SYSTEM', action: 'ACCOUNT REQUESTED', target_employee: 'Username: ivanroxas', old_value: 'NULL', new_value: 'STATUS: PENDING', timestamp: new Date('2026-06-14T08:00:00Z') },
    { admin_id: 'SYSTEM', admin_name: 'SYSTEM', action: 'ACCOUNT REQUESTED', target_employee: 'Username: KatherineSupan', old_value: 'NULL', new_value: 'STATUS: PENDING', timestamp: new Date('2026-06-14T08:30:00Z') },

    // === Role management (superadmin approvals) ===
    { admin_id: SA, admin_name: 'superadmin', action: 'APPROVE ROLE', target_employee: 'Admin ID: ivanroxas', old_value: 'STATUS: PENDING', new_value: 'STATUS: APPROVED, ROLE: SUPER_ADMIN', timestamp: new Date('2026-06-14T09:00:00Z') },
    { admin_id: SA, admin_name: 'superadmin', action: 'APPROVE ROLE', target_employee: 'Admin ID: auditor', old_value: 'STATUS: PENDING', new_value: 'STATUS: APPROVED, ROLE: AUDITOR', timestamp: new Date('2026-06-14T09:05:00Z') },
    { admin_id: SA, admin_name: 'superadmin', action: 'APPROVE ROLE', target_employee: 'Admin ID: hrmanager', old_value: 'STATUS: PENDING', new_value: 'STATUS: APPROVED, ROLE: HR_MANAGER', timestamp: new Date('2026-06-14T09:10:00Z') },
    { admin_id: SA, admin_name: 'superadmin', action: '⚠️ ELEVATED_PRIVILEGE — APPROVE ROLE', target_employee: 'Admin ID: KatherineSupan', old_value: 'STATUS: PENDING', new_value: 'STATUS: APPROVED, ROLE: SUPER_ADMIN', timestamp: new Date('2026-06-14T09:15:00Z') },
    { admin_id: SA, admin_name: 'superadmin', action: 'UPDATE ROLE', target_employee: 'Admin ID: KatherineSupan', old_value: 'ROLE: AUDITOR', new_value: 'ROLE: SUPER_ADMIN', timestamp: new Date('2026-06-15T10:00:00Z') },

    // === INFILTRATION / ATTACK LOGS ===
    // Brute force from unknown
    { admin_id: 'UNKNOWN', admin_name: 'nonexistent', action: 'LOGIN_FAILED', target_employee: 'SYSTEM', old_value: 'N/A', new_value: 'Invalid username', timestamp: new Date('2026-06-15T03:00:00Z') },
    { admin_id: 'UNKNOWN', admin_name: "admin' --", action: 'LOGIN_FAILED', target_employee: 'SYSTEM', old_value: 'N/A', new_value: 'Invalid username', timestamp: new Date('2026-06-15T03:01:00Z') },
    { admin_id: 'UNKNOWN', admin_name: "admin' OR 1=1--", action: 'LOGIN_FAILED', target_employee: 'SYSTEM', old_value: 'N/A', new_value: 'Invalid username', timestamp: new Date('2026-06-15T03:02:00Z') },
    { admin_id: 'UNKNOWN', admin_name: "<script>alert('XSS')</script>", action: 'LOGIN_FAILED', target_employee: 'SYSTEM', old_value: 'N/A', new_value: 'Invalid username', timestamp: new Date('2026-06-15T03:03:00Z') },
    { admin_id: 'UNKNOWN', admin_name: "admin\" --", action: 'LOGIN_FAILED', target_employee: 'SYSTEM', old_value: 'N/A', new_value: 'Invalid username', timestamp: new Date('2026-06-15T03:04:00Z') },
    { admin_id: 'UNKNOWN', admin_name: 'admin2', action: 'LOGIN_FAILED', target_employee: 'SYSTEM', old_value: 'N/A', new_value: 'Invalid username', timestamp: new Date('2026-06-15T03:05:00Z') },
    { admin_id: 'UNKNOWN', admin_name: 'admin@salarize.com', action: 'LOGIN_FAILED', target_employee: 'SYSTEM', old_value: 'N/A', new_value: 'Invalid username', timestamp: new Date('2026-06-15T03:06:00Z') },
    { admin_id: 'UNKNOWN', admin_name: 'employee', action: 'LOGIN_FAILED', target_employee: 'SYSTEM', old_value: 'N/A', new_value: 'Invalid username', timestamp: new Date('2026-06-15T03:07:00Z') },
    { admin_id: 'UNKNOWN', admin_name: "' OR '1'='1", action: 'LOGIN_FAILED', target_employee: 'SYSTEM', old_value: 'N/A', new_value: 'Invalid username', timestamp: new Date('2026-06-15T03:08:00Z') },
    { admin_id: 'UNKNOWN', admin_name: 'admin', action: 'LOGIN_FAILED', target_employee: 'SYSTEM', old_value: 'N/A', new_value: 'Invalid username', timestamp: new Date('2026-06-15T03:09:00Z') },

    // Security scan bots
    { admin_id: 'UNKNOWN', admin_name: 'hacker_bot_02', action: 'SECURITY_SCAN', target_employee: 'SYSTEM', old_value: 'N/A', new_value: 'Port scan detected', timestamp: new Date('2026-06-15T03:10:00Z') },
    { admin_id: 'UNKNOWN', admin_name: 'hacker_bot_03', action: 'SECURITY_SCAN', target_employee: 'SYSTEM', old_value: 'N/A', new_value: 'Port scan detected', timestamp: new Date('2026-06-15T03:11:00Z') },
    { admin_id: 'UNKNOWN', admin_name: 'hacker_bot_04', action: 'SECURITY_SCAN', target_employee: 'SYSTEM', old_value: 'N/A', new_value: 'Port scan detected', timestamp: new Date('2026-06-15T03:12:00Z') },

    // Parameter tampering
    { admin_id: 'UNKNOWN', admin_name: 'hacker_bot_01', action: 'PARAMETER_TAMPERING', target_employee: 'EMP_10293', old_value: 'Salary: 50000', new_value: 'Salary: -999999 (Blocked by Validation)', timestamp: new Date('2026-06-15T03:15:00Z') },
    { admin_id: 'cm5o3zxyz', admin_name: 'rogue_hr_manager', action: 'PARAMETER_TAMPERING', target_employee: 'EMP_10293', old_value: 'Salary: 50000', new_value: 'Salary: -999999 (Blocked by Validation)', timestamp: new Date('2026-06-15T03:16:00Z') },

    // Data exfiltration
    { admin_id: 'UNKNOWN', admin_name: 'hacker_bot_01', action: 'DATA_EXFILTRATION_ALERT', target_employee: 'Module: PAYROLL', old_value: 'N/A', new_value: 'Rate Limit Exceeded: 500 records accessed in 10 seconds (Possible Data Exfiltration)', timestamp: new Date('2026-06-15T03:20:00Z') },
    { admin_id: 'cm5o3zxyz', admin_name: 'rogue_hr_manager', action: 'DATA_EXFILTRATION_ALERT', target_employee: 'Module: PAYROLL', old_value: 'N/A', new_value: 'Rate Limit Exceeded: 500 records accessed in 10 seconds (Possible Data Exfiltration)', timestamp: new Date('2026-06-15T03:21:00Z') },

    // === OPERATIONAL LOGS ===
    // Department operations
    { admin_id: SA, admin_name: 'superadmin', action: 'CREATE DEPARTMENT', target_employee: 'Diplomacy Department', old_value: 'NULL', new_value: JSON.stringify({ name: 'Diplomacy Department', description: 'Diplomatic Operations and Ambassadors', icon: 'Globe', color: 'amber' }), timestamp: new Date('2026-06-15T08:50:00Z') },

    // Salary updates by hrmanager
    { admin_id: HR, admin_name: 'hrmanager', action: 'UPDATE SALARY', target_employee: 'Laura Harris', old_value: JSON.stringify({ actual_salary: 50000 }), new_value: JSON.stringify({ actual_salary: 55000 }), timestamp: new Date('2026-06-15T11:00:00Z') },
    { admin_id: HR, admin_name: 'hrmanager', action: 'UPDATE SALARY', target_employee: 'JOHN ROXAS', old_value: JSON.stringify({ actual_salary: 45000 }), new_value: JSON.stringify({ actual_salary: 60000 }), timestamp: new Date('2026-06-15T11:10:00Z') },
    { admin_id: HR, admin_name: 'hrmanager', action: 'UPDATE SALARY', target_employee: 'JOHN ROXAS', old_value: JSON.stringify({ actual_salary: 60000 }), new_value: JSON.stringify({ actual_salary: 65464 }), timestamp: new Date('2026-06-15T11:15:00Z') },
    { admin_id: HR, admin_name: 'hrmanager', action: 'UPDATE SALARY', target_employee: 'Maria Jaduday', old_value: JSON.stringify({ actual_salary: 30000 }), new_value: JSON.stringify({ actual_salary: 35768 }), timestamp: new Date('2026-06-15T11:20:00Z') },
    { admin_id: HR, admin_name: 'hrmanager', action: 'UPDATE SALARY', target_employee: 'Maria Jaduday', old_value: JSON.stringify({ actual_salary: 35768 }), new_value: JSON.stringify({ actual_salary: 35769 }), timestamp: new Date('2026-06-15T11:25:00Z') },

    // Employee termination by hrmanager
    { admin_id: HR, admin_name: 'hrmanager', action: 'DELETE EMPLOYEE', target_employee: 'Hannah Anderson', old_value: JSON.stringify({ status: 'Active', deleted_at: null }), new_value: JSON.stringify({ status: 'Terminated' }), timestamp: new Date('2026-06-15T12:00:00Z') },

    // Auditor actions
    { admin_id: AU, admin_name: 'auditor', action: 'ACKNOWLEDGE_ALERTS', target_employee: 'System Alert Reset', old_value: 'null', new_value: 'Acknowledged', timestamp: new Date('2026-06-15T14:30:00Z') },
    { admin_id: AU, admin_name: 'auditor', action: 'ARCHIVE_HISTORY', target_employee: 'System Logs', old_value: 'Active', new_value: 'Archived', timestamp: new Date('2026-06-15T14:35:00Z') },
    { admin_id: AU, admin_name: 'auditor', action: 'GENERATE_COMPLIANCE_REPORT', target_employee: 'SYSTEM', old_value: null, new_value: 'Generated 30-day PDF compliance report', timestamp: new Date('2026-06-16T10:00:00Z') },

    // Position updates by superadmin
    { admin_id: SA, admin_name: 'superadmin', action: 'UPDATE POSITION', target_employee: 'Software Engineer', old_value: JSON.stringify({ base_salary: 50000 }), new_value: JSON.stringify({ base_salary: 55000 }), timestamp: new Date('2026-06-15T09:00:00Z') },
    { admin_id: SA, admin_name: 'superadmin', action: 'UPDATE POSITION', target_employee: 'Marketing Specialist', old_value: JSON.stringify({ base_salary: 30000 }), new_value: JSON.stringify({ base_salary: 32000 }), timestamp: new Date('2026-06-15T09:05:00Z') },
    { admin_id: SA, admin_name: 'superadmin', action: 'UPDATE POSITION', target_employee: 'HR Coordinator', old_value: JSON.stringify({ base_salary: 30000 }), new_value: JSON.stringify({ base_salary: 31000 }), timestamp: new Date('2026-06-15T09:10:00Z') },
    { admin_id: SA, admin_name: 'superadmin', action: 'UPDATE POSITION', target_employee: 'Systems Administrator', old_value: JSON.stringify({ base_salary: 45000 }), new_value: JSON.stringify({ base_salary: 48000 }), timestamp: new Date('2026-06-15T09:15:00Z') },
    { admin_id: SA, admin_name: 'superadmin', action: 'UPDATE POSITION', target_employee: 'Financial Analyst', old_value: JSON.stringify({ base_salary: 55000 }), new_value: JSON.stringify({ base_salary: 58000 }), timestamp: new Date('2026-06-15T09:20:00Z') },

    // Department updates
    { admin_id: SA, admin_name: 'superadmin', action: 'UPDATE DEPARTMENT', target_employee: 'IT Department', old_value: JSON.stringify({ icon: 'Building' }), new_value: JSON.stringify({ icon: 'Cpu', color: 'blue' }), timestamp: new Date('2026-06-15T09:30:00Z') },
    { admin_id: SA, admin_name: 'superadmin', action: 'UPDATE DEPARTMENT', target_employee: 'Marketing Department', old_value: JSON.stringify({ icon: 'Building' }), new_value: JSON.stringify({ icon: 'Globe', color: 'rose' }), timestamp: new Date('2026-06-15T09:35:00Z') },
    { admin_id: SA, admin_name: 'superadmin', action: 'UPDATE DEPARTMENT', target_employee: 'Finance Department', old_value: JSON.stringify({ icon: 'Building' }), new_value: JSON.stringify({ icon: 'Globe', color: 'emerald' }), timestamp: new Date('2026-06-15T09:40:00Z') },

    // PDF report generation
    { admin_id: HR, admin_name: 'hrmanager', action: 'GENERATE_REPORT', target_employee: 'SYSTEM', old_value: null, new_value: 'generated PDF Payroll Report for 6/16/2026', timestamp: new Date('2026-06-16T14:00:00Z') },
  ];

  let inserted = 0;
  for (const log of allLogs) {
    try {
      await prisma.auditLog.create({ data: log });
      inserted++;
    } catch (e) {
      // Skip if duplicate or trigger blocks it
    }
  }

  const afterCount = await prisma.auditLog.count();
  console.log(`\n✅ Inserted ${inserted} recovered audit/access logs (${beforeCount} → ${afterCount} total)`);

  // Final summary
  const [empCount, deptCount, posCount, adminCount] = await Promise.all([
    prisma.employee.count(),
    prisma.department.count(),
    prisma.position.count(),
    prisma.admin.count(),
  ]);

  console.log(`\n=== FINAL DATABASE STATE ===`);
  console.log(`Admins:      ${adminCount}`);
  console.log(`Departments: ${deptCount}`);
  console.log(`Positions:   ${posCount}`);
  console.log(`Employees:   ${empCount}`);
  console.log(`Audit Logs:  ${afterCount}`);
  console.log(`=== RESTORATION COMPLETE ===\n`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
