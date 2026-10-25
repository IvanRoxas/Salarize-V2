import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Applying SQLite triggers for AuditLog immutability...');

  try {
    // Drop existing triggers if any
    await prisma.$executeRawUnsafe(`DROP TRIGGER IF EXISTS prevent_audit_log_update;`);
    await prisma.$executeRawUnsafe(`DROP TRIGGER IF EXISTS prevent_audit_log_delete;`);

    // Create trigger to prevent UPDATE on AuditLog
    await prisma.$executeRawUnsafe(`
      CREATE TRIGGER prevent_audit_log_update
      BEFORE UPDATE ON AuditLog
      BEGIN
        SELECT RAISE(ABORT, 'AuditLog records are immutable and cannot be updated.');
      END;
    `);

    // Create trigger to prevent DELETE on AuditLog
    await prisma.$executeRawUnsafe(`
      CREATE TRIGGER prevent_audit_log_delete
      BEFORE DELETE ON AuditLog
      BEGIN
        SELECT RAISE(ABORT, 'AuditLog records are immutable and cannot be deleted.');
      END;
    `);

    console.log('✅ Successfully applied immutability triggers to AuditLog.');
  } catch (error) {
    console.error('❌ Failed to apply triggers:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
