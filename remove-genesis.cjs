const db = require('./node_modules/better-sqlite3')('./prisma/dev.db');
db.exec('DROP TRIGGER IF EXISTS prevent_audit_log_delete');
const result = db.prepare("DELETE FROM AuditLog WHERE action = 'GENESIS ACCOUNT CREATED'").run();
console.log('Deleted', result.changes, 'record(s)');
db.exec("CREATE TRIGGER prevent_audit_log_delete BEFORE DELETE ON AuditLog BEGIN SELECT RAISE(ABORT, 'AuditLog records are immutable and cannot be deleted.'); END;");
console.log('Immutability triggers re-applied.');
db.close();
