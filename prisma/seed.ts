import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  await prisma.auditLog.deleteMany();
  await prisma.employee.deleteMany();
  await prisma.position.deleteMany();
  await prisma.admin.deleteMany();

  const hashSuperAdmin = await bcrypt.hash('SuperAdmin@2026', 10);
  const hashHrManager = await bcrypt.hash('HrManager@2026', 10);
  const hashAuditor = await bcrypt.hash('Auditor@2026', 10);

  const adminsData = [
    { username: 'superadmin', role: 'SUPER_ADMIN', password_hash: hashSuperAdmin },
    { username: 'hrmanager', role: 'HR_MANAGER', password_hash: hashHrManager },
    { username: 'auditor', role: 'AUDITOR', password_hash: hashAuditor },
  ];

  const createdAdmins = [];
  for (const admin of adminsData) {
    const created = await prisma.admin.create({ data: admin });
    createdAdmins.push(created);
  }
  console.log('Admins seeded.');

  await prisma.department.deleteMany();

  const departmentsData = [
    { name: 'IT Department', description: 'Information Technology and Systems' },
    { name: 'Marketing Department', description: 'Marketing and Public Relations' },
    { name: 'HR Department', description: 'Human Resources and Operations' },
    { name: 'Finance Department', description: 'Finance and Accounting' },
  ];

  const createdDepartments = [];
  for (const dept of departmentsData) {
    const created = await prisma.department.create({ data: dept });
    createdDepartments.push(created);
  }

  const itDeptId = createdDepartments.find(d => d.name === 'IT Department')!.id;
  const hrDeptId = createdDepartments.find(d => d.name === 'HR Department')!.id;
  const mktDeptId = createdDepartments.find(d => d.name === 'Marketing Department')!.id;
  const finDeptId = createdDepartments.find(d => d.name === 'Finance Department')!.id;

  const positionsData = [
    { title: 'Software Engineer', department_id: itDeptId, base_salary: 50000, min_salary: 40000, max_salary: 90000 },
    { title: 'Marketing Specialist', department_id: mktDeptId, base_salary: 30000, min_salary: 25000, max_salary: 50000 },
    { title: 'HR Coordinator', department_id: hrDeptId, base_salary: 30000, min_salary: 25000, max_salary: 45000 },
    { title: 'Systems Administrator', department_id: itDeptId, base_salary: 45000, min_salary: 35000, max_salary: 75000 },
    { title: 'Financial Analyst', department_id: finDeptId, base_salary: 55000, min_salary: 45000, max_salary: 85000 },
  ];

  const createdPositions = [];
  for (const pos of positionsData) {
    const created = await prisma.position.create({ data: pos });
    createdPositions.push(created);
  }
  console.log('Positions seeded.');

  const employeesData = [
    { first_name: 'Alice', last_name: 'Johnson', gender: 'Female', email: 'alice.j@example.com', status: 'Active', actual_salary: 60000, position_id: createdPositions[0].id },
    { first_name: 'Bob', last_name: 'Smith', gender: 'Male', email: 'bob.s@example.com', status: 'Active', actual_salary: 85000, position_id: createdPositions[0].id },
    { first_name: 'Charlie', last_name: 'Davis', gender: 'Male', email: 'charlie.d@example.com', status: 'Standby', actual_salary: 42000, position_id: createdPositions[0].id },
    { first_name: 'Diana', last_name: 'Miller', gender: 'Female', email: 'diana.m@example.com', status: 'Active', actual_salary: 35000, position_id: createdPositions[1].id },
    { first_name: 'Ethan', last_name: 'Wilson', gender: 'Male', email: 'ethan.w@example.com', status: 'Active', actual_salary: 48000, position_id: createdPositions[1].id },
    { first_name: 'Fiona', last_name: 'Moore', gender: 'Female', email: 'fiona.m@example.com', status: 'Active', actual_salary: 30000, position_id: createdPositions[2].id },
    { first_name: 'George', last_name: 'Taylor', gender: 'Male', email: 'george.t@example.com', status: 'Standby', actual_salary: 40000, position_id: createdPositions[2].id },
    { first_name: 'Hannah', last_name: 'Anderson', gender: 'Female', email: 'hannah.a@example.com', status: 'Active', actual_salary: 60000, position_id: createdPositions[3].id },
    { first_name: 'Ian', last_name: 'Thomas', gender: 'Male', email: 'ian.t@example.com', status: 'Active', actual_salary: 70000, position_id: createdPositions[3].id },
    { first_name: 'Julia', last_name: 'Jackson', gender: 'Female', email: 'julia.j@example.com', status: 'Active', actual_salary: 55000, position_id: createdPositions[4].id },
    { first_name: 'Kevin', last_name: 'White', gender: 'Male', email: 'kevin.w@example.com', status: 'Active', actual_salary: 80000, position_id: createdPositions[4].id },
    { first_name: 'Laura', last_name: 'Harris', gender: 'Female', email: 'laura.h@example.com', status: 'Standby', actual_salary: 50000, position_id: createdPositions[4].id },
    
    { first_name: 'Michael', last_name: 'Martin', gender: 'Male', email: 'michael.m@example.com', status: 'Off-duty', actual_salary: 45000, position_id: createdPositions[0].id, deleted_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
    { first_name: 'Nina', last_name: 'Thompson', gender: 'Female', email: 'nina.t@example.com', status: 'Off-duty', actual_salary: 26000, position_id: createdPositions[2].id, deleted_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000) },
    { first_name: 'Oscar', last_name: 'Garcia', gender: 'Male', email: 'oscar.g@example.com', status: 'Off-duty', actual_salary: 65000, position_id: createdPositions[3].id, deleted_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) },
  ];

  for (const emp of employeesData) {
    await prisma.employee.create({ data: emp });
  }
  console.log('Employees seeded.');

  const superadminId = createdAdmins[0].id;
  const hrId = createdAdmins[1].id;

  const auditLogsData = [
    { admin_id: superadminId, admin_name: 'superadmin', action: 'UPDATE SALARY', target_employee: 'Bob Smith', old_value: JSON.stringify({ actual_salary: 80000 }), new_value: JSON.stringify({ actual_salary: 85000 }), timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    { admin_id: hrId, admin_name: 'hrmanager', action: 'UPDATE STATUS', target_employee: 'Charlie Davis', old_value: JSON.stringify({ status: 'Active' }), new_value: JSON.stringify({ status: 'Standby' }), timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000) },
    { admin_id: superadminId, admin_name: 'superadmin', action: 'CREATE EMPLOYEE', target_employee: 'Ethan Wilson', old_value: null, new_value: JSON.stringify({ status: 'Active', actual_salary: 48000 }), timestamp: new Date(Date.now() - 48 * 60 * 60 * 1000) },
    { admin_id: superadminId, admin_name: 'superadmin', action: 'DELETE EMPLOYEE', target_employee: 'Oscar Garcia', old_value: JSON.stringify({ status: 'Active' }), new_value: JSON.stringify({ status: 'Off-duty', deleted_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) }), timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) },
    { admin_id: hrId, admin_name: 'hrmanager', action: 'UPDATE STATUS', target_employee: 'Laura Harris', old_value: JSON.stringify({ status: 'Active' }), new_value: JSON.stringify({ status: 'Standby' }), timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000) },
  ];

  for (const log of auditLogsData) {
    await prisma.auditLog.create({ data: log });
  }
  console.log('Audit Logs seeded.');

  console.log('Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
