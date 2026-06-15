export function calculateNetPay(grossSalary: number) {
  // Mock standard PH Corporate Deductions
  const sss = 1350; // Mock Max SSS contribution
  const philHealth = grossSalary * 0.05 * 0.5; // 5% total, 2.5% employee share
  const pagIbig = 200; // Standard max

  const totalStandardDeductions = sss + philHealth + pagIbig;
  const taxableIncome = grossSalary - totalStandardDeductions;

  // Mock Withholding Tax (simplified 20% over 20,833)
  let tax = 0;
  if (taxableIncome > 20833) {
    tax = (taxableIncome - 20833) * 0.20;
  }

  const netPay = grossSalary - totalStandardDeductions - tax;

  return {
    gross: grossSalary,
    sss,
    philHealth,
    pagIbig,
    tax,
    totalDeductions: totalStandardDeductions + tax,
    net: netPay
  };
}
