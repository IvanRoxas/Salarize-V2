/**
 * Salarize V2 — STRIDE/DREAD Security Screenshot Script
 * Uses JWT injection to bypass login + 2FA and screenshot every role's dashboard.
 */
import { chromium } from 'playwright';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { SignJWT } from 'jose';
import Database from 'better-sqlite3';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, 'security-screenshots');
if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });

const JWT_SECRET = 'super_secret_jwt_key_salarize_v2_secure_env';
const key = new TextEncoder().encode(JWT_SECRET);

const db = new Database('./prisma/dev.db');
const admins = db.prepare("SELECT id, username, role, status FROM Admin WHERE status='APPROVED'").all();
db.close();

console.log('Found accounts:', admins.map(a => `${a.username}(${a.role})`).join(', '));

async function makeJWT(admin) {
  return new SignJWT({ id: admin.id, username: admin.username, role: admin.role })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('2h')
    .sign(key);
}

const browser = await chromium.launch({ headless: true });

const shot = async (page, name) => {
  const filePath = path.join(OUT, `${name}.png`);
  await page.screenshot({ path: filePath, fullPage: false });
  console.log(`  ✓ ${name}.png  [${page.url()}]`);
  return filePath;
};

// ── Screenshot pages for SUPER_ADMIN (sees everything) ───────────────────────
const superAdmin = admins.find(a => a.role === 'SUPER_ADMIN');
const hrManager  = admins.find(a => a.role === 'HR_MANAGER');
const auditor    = admins.find(a => a.role === 'AUDITOR');
const admin      = admins.find(a => a.role === 'ADMIN');

async function screenshotRole(account, pageList, prefix) {
  const jwt = await makeJWT(account);
  const ctx = await browser.newContext({ viewport: { width: 1400, height: 900 } });
  await ctx.addCookies([{
    name: 'salarize_session',
    value: jwt,
    domain: 'localhost',
    path: '/',
    httpOnly: true,
    secure: false,
    sameSite: 'Lax',
    expires: Math.floor(Date.now() / 1000) + 7200
  }]);
  const page = await ctx.newPage();
  
  console.log(`\n=== ${account.role}: ${account.username} ===`);
  for (const p of pageList) {
    try {
      await page.goto(`http://localhost:3000${p.path}`, { waitUntil: 'domcontentloaded', timeout: 12000 });
      await page.waitForTimeout(2000);
      const finalUrl = page.url();
      const redirected = finalUrl.includes('/login');
      const suffix = redirected ? '_REDIRECTED' : '';
      await shot(page, `${prefix}${p.name}${suffix}`);
    } catch (e) {
      console.log(`  ✗ ${p.name}: ${e.message.split('\n')[0]}`);
    }
  }
  await ctx.close();
}

const mainPages = [
  { path: '/',                 name: 'dashboard'         },
  { path: '/admins',           name: 'admins'            },
  { path: '/employees',        name: 'employees'         },
  { path: '/departments',      name: 'departments'       },
  { path: '/salary',           name: 'salary'            },
  { path: '/audit-logs',       name: 'audit_logs'        },
  { path: '/archives',         name: 'archives'          },
  { path: '/activity-history', name: 'activity_history'  },
];

// Screenshot all pages as SUPER_ADMIN
await screenshotRole(superAdmin, mainPages, 'SA__');

// Screenshot key pages as HR_MANAGER
await screenshotRole(hrManager, [
  { path: '/',       name: 'dashboard' },
  { path: '/salary', name: 'salary'    },
  { path: '/admins', name: 'admins'    }, // should redirect — RBAC test
], 'HR__');

// Screenshot key pages as AUDITOR
await screenshotRole(auditor, [
  { path: '/',                 name: 'dashboard'      },
  { path: '/audit-logs',       name: 'audit_logs'     },
  { path: '/archives',         name: 'archives'       },
  { path: '/admins',           name: 'admins'         }, // RBAC test
  { path: '/salary',           name: 'salary'         }, // RBAC test
], 'AU__');

// Screenshot key pages as ADMIN
await screenshotRole(admin, [
  { path: '/',          name: 'dashboard'   },
  { path: '/admins',    name: 'admins'      }, // should redirect
  { path: '/departments', name: 'departments' },
], 'AD__');

await browser.close();

console.log(`\n✅ All screenshots saved to: ${OUT}`);
console.log('Files:', fs.readdirSync(OUT).sort().join('\n       '));
