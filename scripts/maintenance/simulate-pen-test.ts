import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Injecting simulated Penetration Testing & Vulnerability Assessment logs...');

  const now = new Date();

  const logs = [
    {
      admin_id: 'UNKNOWN',
      admin_name: 'hacker_bot_01',
      action: 'LOGIN_FAILED',
      target_employee: 'SYSTEM',
      old_value: 'N/A',
      new_value: 'Invalid password (Brute Force Attempt 1)',
      timestamp: new Date(now.getTime() - 1000 * 60 * 5) // 5 mins ago
    },
    {
      admin_id: 'UNKNOWN',
      admin_name: 'hacker_bot_01',
      action: 'LOGIN_FAILED',
      target_employee: 'SYSTEM',
      old_value: 'N/A',
      new_value: 'Invalid password (Brute Force Attempt 2)',
      timestamp: new Date(now.getTime() - 1000 * 60 * 4.9)
    },
    {
      admin_id: 'UNKNOWN',
      admin_name: 'hacker_bot_01',
      action: 'LOGIN_FAILED',
      target_employee: 'SYSTEM',
      old_value: 'N/A',
      new_value: 'Invalid password (Brute Force Attempt 3)',
      timestamp: new Date(now.getTime() - 1000 * 60 * 4.8)
    },
    {
      admin_id: 'UNKNOWN',
      admin_name: 'hacker_bot_01',
      action: 'LOGIN_FAILED',
      target_employee: 'SYSTEM',
      old_value: 'N/A',
      new_value: 'Invalid password (Brute Force Attempt 4)',
      timestamp: new Date(now.getTime() - 1000 * 60 * 4.7)
    },
    {
      admin_id: 'UNKNOWN',
      admin_name: 'hacker_bot_01',
      action: 'LOGIN_FAILED',
      target_employee: 'SYSTEM',
      old_value: 'N/A',
      new_value: 'Invalid password (Brute Force Attempt 5)',
      timestamp: new Date(now.getTime() - 1000 * 60 * 4.6)
    },
    {
      admin_id: 'UNKNOWN',
      admin_name: 'hacker_bot_01',
      action: 'UNAUTHORIZED_LOGIN_ATTEMPT',
      target_employee: 'SYSTEM',
      old_value: 'N/A',
      new_value: 'RATE LIMIT TRIGGERED: Account locked due to too many failed attempts.',
      timestamp: new Date(now.getTime() - 1000 * 60 * 4.5)
    },
    {
      admin_id: 'cm5o3zxyz',
      admin_name: 'rogue_hr_manager',
      action: '403_FORBIDDEN',
      target_employee: 'Module: SYSTEM_ACCOUNTS, Action: READ',
      old_value: 'N/A',
      new_value: 'Access Denied via secureAction middleware (BOLA Attempt)',
      timestamp: new Date(now.getTime() - 1000 * 60 * 2)
    },
    {
      admin_id: 'cm5o3zxyz',
      admin_name: 'rogue_hr_manager',
      action: '403_FORBIDDEN',
      target_employee: 'Module: SYSTEM_ACCOUNTS, Action: WRITE',
      old_value: 'N/A',
      new_value: 'Access Denied via secureAction middleware (Privilege Escalation Attempt)',
      timestamp: new Date(now.getTime() - 1000 * 60 * 1.5)
    }
  ];

  for (const log of logs) {
    await prisma.auditLog.create({ data: log });
  }

  console.log('✅ Simulation logs injected successfully.');
}

main().catch(console.error).finally(() => prisma.$disconnect());
