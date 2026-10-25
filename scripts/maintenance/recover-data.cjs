/**
 * SQLite Forensic Recovery Script
 * 
 * Scans the raw bytes of the dev.db file for text remnants of deleted records.
 * SQLite marks freed pages but doesn't always zero them out, so old strings
 * (names, emails, departments) may still be readable in the binary.
 */

const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'prisma', 'dev.db');

// Known seed data — we'll filter these OUT so we only see custom/deleted data
const KNOWN_SEED_NAMES = [
  'Alice', 'Bob', 'Charlie', 'Diana', 'Ethan', 'Fiona', 'George',
  'Hannah', 'Ian', 'Julia', 'Kevin', 'Laura', 'Michael', 'Nina', 'Oscar',
  'Johnson', 'Smith', 'Davis', 'Miller', 'Wilson', 'Moore', 'Taylor',
  'Anderson', 'Thomas', 'Jackson', 'White', 'Harris', 'Martin', 'Thompson', 'Garcia',
  'superadmin', 'hrmanager', 'auditor', 'hacker_bot_01', 'rogue_hr_manager',
  'IT Department', 'Marketing Department', 'HR Department', 'Finance Department',
  'Software Engineer', 'Marketing Specialist', 'HR Coordinator', 'Systems Administrator', 'Financial Analyst',
];

const KNOWN_SEED_EMAILS = [
  'alice.j@example.com', 'bob.s@example.com', 'charlie.d@example.com',
  'diana.m@example.com', 'ethan.w@example.com', 'fiona.m@example.com',
  'george.t@example.com', 'hannah.a@example.com', 'ian.t@example.com',
  'julia.j@example.com', 'kevin.w@example.com', 'laura.h@example.com',
  'michael.m@example.com', 'nina.t@example.com', 'oscar.g@example.com',
  'mock@example.com'
];

const KNOWN_SET = new Set([...KNOWN_SEED_NAMES, ...KNOWN_SEED_EMAILS].map(s => s.toLowerCase()));

// Read raw binary
const raw = fs.readFileSync(DB_PATH);
const text = raw.toString('utf-8', 0, raw.length);

console.log(`\n=== SQLite Forensic Recovery ===`);
console.log(`Database size: ${raw.length} bytes\n`);

// --- Strategy 1: Find email-like strings (very distinctive) ---
console.log('--- Recovered Email Addresses (non-seed) ---');
const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
const foundEmails = new Set();
let match;
while ((match = emailRegex.exec(text)) !== null) {
  const email = match[0];
  if (!KNOWN_SET.has(email.toLowerCase())) {
    foundEmails.add(email);
  }
}
if (foundEmails.size === 0) {
  console.log('  (none found)');
} else {
  foundEmails.forEach(e => console.log(`  ✓ ${e}`));
}

// --- Strategy 2: Scan for readable ASCII strings of 4+ chars in freed pages ---
console.log('\n--- Recovered Readable Strings (potential names/departments) ---');
const stringRegex = /[\x20-\x7E]{4,60}/g;
const foundStrings = new Set();
const NOISE = new Set([
  'sqlite', 'table', 'index', 'create', 'text', 'real', 'integer', 'blob',
  'null', 'primary', 'autoincrement', 'unique', 'default', 'foreign',
  'references', 'constraint', 'from', 'where', 'select', 'insert',
  'update', 'delete', 'values', 'into', 'order', 'group', 'having',
  'limit', 'offset', 'join', 'left', 'right', 'inner', 'outer',
  'uuid', 'boolean', 'datetime', 'varchar', 'true', 'false',
  'prisma', 'client', 'migration', 'model', 'field',
  'active', 'standby', 'off-duty', 'terminated', 'onboarding',
  'male', 'female', 'non-binary',
  '_prisma_migrations', 'applied_steps_count', 'checksum', 'finished_at',
  'migration_name', 'rolled_back_at', 'started_at', 'logs',
]);

while ((match = stringRegex.exec(text)) !== null) {
  const str = match[0].trim();
  if (str.length < 4) continue;
  if (KNOWN_SET.has(str.toLowerCase())) continue;
  if (NOISE.has(str.toLowerCase())) continue;
  // Filter out hex strings, UUIDs, and obvious SQLite internals
  if (/^[0-9a-f-]{20,}$/i.test(str)) continue;
  if (/^[\d.]+$/.test(str)) continue;
  if (/CREATE |ALTER |DROP |BEGIN |COMMIT |ROLLBACK /i.test(str)) continue;
  if (/^\s*$/.test(str)) continue;
  // Look for things that look like names or department-like strings
  // Capital first letter, contains letters
  if (/[A-Z][a-z]/.test(str) && /[a-zA-Z]{3,}/.test(str)) {
    foundStrings.add(str);
  }
}

if (foundStrings.size === 0) {
  console.log('  (none found — freed pages may have been overwritten)');
} else {
  // Sort and display
  const sorted = [...foundStrings].sort();
  sorted.forEach(s => console.log(`  ✓ "${s}"`));
}

// --- Strategy 3: Specifically search for user-mentioned data ---
console.log('\n--- Targeted Search ---');
const targets = ['Maria', 'Jaduday', 'Diplomacy', 'diplomacy'];
for (const target of targets) {
  const idx = raw.indexOf(Buffer.from(target, 'utf-8'));
  if (idx >= 0) {
    // Try to extract surrounding context (100 bytes each side)
    const start = Math.max(0, idx - 80);
    const end = Math.min(raw.length, idx + target.length + 80);
    const context = raw.toString('utf-8', start, end).replace(/[^\x20-\x7E]/g, '·');
    console.log(`  ✓ FOUND "${target}" at byte offset ${idx}`);
    console.log(`    Context: ...${context}...`);
  } else {
    console.log(`  ✗ "${target}" NOT found in raw bytes — page was overwritten`);
  }
}

console.log('\n=== Scan Complete ===\n');
