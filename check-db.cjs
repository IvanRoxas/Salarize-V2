const Database = require('./node_modules/better-sqlite3');
const db = new Database('./prisma/dev.db');
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
console.log('Tables:', tables.map(t => t.name).join(', '));
const admins = db.prepare('SELECT id, username, role, status FROM Admin LIMIT 10').all();
console.log('Admins:', JSON.stringify(admins, null, 2));
db.close();
