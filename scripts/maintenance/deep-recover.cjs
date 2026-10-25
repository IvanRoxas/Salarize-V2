/**
 * Deep Forensic Recovery — extracts ALL audit log records from raw SQLite bytes.
 * Parses UUID patterns followed by field data to reconstruct complete records.
 */

const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'prisma', 'dev.db');
const raw = fs.readFileSync(DB_PATH);
const text = raw.toString('utf-8');

console.log('=== DEEP FORENSIC SCAN ===\n');
console.log(`Scanning ${raw.length} bytes...\n`);

// UUID pattern
const UUID = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi;

// Strategy: Find all UUID clusters that look like AuditLog rows.
// AuditLog schema: id(UUID), admin_id(string), admin_name(string), action(string),
//                  target_employee(string?), old_value(string?), new_value(string?),
//                  timestamp(datetime), is_archived(bool)

// Known audit log actions from the codebase
const KNOWN_ACTIONS = [
  'LOGIN_SUCCESS', 'LOGIN_FAILED', 'LOGIN_SUCCESS_2FA',
  '403_FORBIDDEN', 'UNAUTHORIZED_LOGIN_ATTEMPT', 'UNAUTHORIZED',
  'RATE_LIMITED', 'ACCOUNT REQUESTED', 'GENESIS ACCOUNT CREATED',
  'CREATE_EMPLOYEE', 'CREATE EMPLOYEE', 'DELETE EMPLOYEE', 'ARCHIVE_EMPLOYEE',
  'UPDATE_EMPLOYEE', 'UPDATE EMPLOYEE', 'UPDATE SALARY', 'UPDATE STATUS',
  'CREATE_POSITION', 'CREATE POSITION', 'DELETE_POSITION', 'DELETE POSITION',
  'UPDATE POSITION', 'UPDATE_POSITION',
  'CREATE DEPARTMENT', 'UPDATE DEPARTMENT', 'DELETE DEPARTMENT',
  'CREATE ROLE', 'REVOKE ROLE', 'APPROVE ROLE', 'UPDATE ROLE',
  'SUSPEND ROLE', 'RESTORE ROLE',
  'ACKNOWLEDGE_ALERTS', 'ARCHIVE_HISTORY',
  'SECURITY_SCAN', 'PARAMETER_TAMPERING', 'DATA_EXFILTRATION_ALERT',
  'GENERATE_REPORT', 'GENERATE_COMPLIANCE_REPORT',
  '⚠️ ELEVATED_PRIVILEGE — APPROVE ROLE',
  '⚠️ ELEVATED_PRIVILEGE — UPDATE ROLE',
];

// Scan for action strings in the raw binary and extract surrounding context
const foundRecords = [];
const seen = new Set();

for (const action of KNOWN_ACTIONS) {
  let searchIdx = 0;
  while (true) {
    const idx = text.indexOf(action, searchIdx);
    if (idx === -1) break;
    searchIdx = idx + action.length;
    
    // Extract a wide window around the match
    const start = Math.max(0, idx - 200);
    const end = Math.min(text.length, idx + action.length + 300);
    const window = text.substring(start, end);
    
    // Try to find the admin_name right before the action
    // Pattern: ...UUID...admin_name...ACTION...target...
    const cleanWindow = window.replace(/[^\x20-\x7E]/g, '\x00');
    
    // Find UUIDs in window
    const uuids = [...cleanWindow.matchAll(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi)];
    
    // Try to extract the admin name (appears between a UUID and the action)
    const actionPos = cleanWindow.indexOf(action);
    if (actionPos === -1) continue;
    
    // Look for the nearest UUID before the action
    let adminName = null;
    let adminId = null;
    let nearestUuidEnd = -1;
    
    for (const u of uuids) {
      const uEnd = u.index + u[0].length;
      if (uEnd < actionPos && uEnd > nearestUuidEnd) {
        nearestUuidEnd = uEnd;
        adminId = u[0];
      }
    }
    
    if (nearestUuidEnd > 0) {
      // Text between UUID end and action start is the admin_name
      const namePart = cleanWindow.substring(nearestUuidEnd, actionPos).replace(/\x00/g, '').trim();
      if (namePart.length > 0 && namePart.length < 50) {
        adminName = namePart;
      }
    }
    
    // Also check for UNKNOWN or SYSTEM as admin_id
    if (!adminName) {
      const beforeAction = cleanWindow.substring(Math.max(0, actionPos - 60), actionPos);
      if (beforeAction.includes('UNKNOWN')) {
        adminId = 'UNKNOWN';
        const afterUnknown = beforeAction.substring(beforeAction.indexOf('UNKNOWN') + 7).replace(/\x00/g, '').trim();
        adminName = afterUnknown || 'unknown';
      } else if (beforeAction.includes('SYSTEM')) {
        adminId = 'SYSTEM';
        adminName = 'SYSTEM';
      }
    }
    
    // Extract target_employee (text right after the action)
    const afterAction = cleanWindow.substring(actionPos + action.length);
    const targetParts = afterAction.split('\x00').filter(s => s.trim().length > 0);
    const target = targetParts[0]?.trim() || null;
    
    // Build a dedup key
    const key = `${adminName}|${action}|${target}`;
    if (seen.has(key)) continue;
    seen.add(key);
    
    if (adminName || adminId) {
      foundRecords.push({
        admin_id: adminId || 'UNKNOWN',
        admin_name: adminName || 'unknown',
        action: action,
        target_employee: target && target.length < 200 ? target : null,
        raw_context: cleanWindow.replace(/\x00+/g, ' | ').substring(0, 300).trim(),
      });
    }
  }
}

console.log(`Found ${foundRecords.length} distinct audit log entries in raw bytes:\n`);

// Group by action type for readability
const byAction = {};
for (const r of foundRecords) {
  if (!byAction[r.action]) byAction[r.action] = [];
  byAction[r.action].push(r);
}

for (const [action, records] of Object.entries(byAction)) {
  console.log(`--- ${action} (${records.length}) ---`);
  for (const r of records) {
    console.log(`  admin: ${r.admin_name.substring(0, 30).padEnd(30)} target: ${(r.target_employee || '-').substring(0, 50)}`);
  }
  console.log('');
}

// Write recoverable records to a JSON file for the restore script
const outputPath = path.join(__dirname, 'recovered-logs.json');
fs.writeFileSync(outputPath, JSON.stringify(foundRecords, null, 2));
console.log(`\nFull records saved to: recovered-logs.json`);
console.log('=== SCAN COMPLETE ===\n');
