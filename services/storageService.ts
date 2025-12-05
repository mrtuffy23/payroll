
import { Employee, AttendanceRecord, PerformanceRecord, SalarySlip, JobHistoryRecord, SalaryConfig } from '../types';
import { MOCK_EMPLOYEES_INIT, SALARY_RULES } from '../constants';

// Keys
const K_EMPLOYEES = 'hrm_employees';
const K_ATTENDANCE = 'hrm_attendance';
const K_PERFORMANCE = 'hrm_performance';
const K_SALARY = 'hrm_salary';
const K_HISTORY = 'hrm_job_history';
const K_CONFIG_SALARY = 'hrm_config_salary';

// Initialize
const init = () => {
  if (!localStorage.getItem(K_EMPLOYEES)) {
    // Add default positionAllowance to mock data if missing
    const seeded = MOCK_EMPLOYEES_INIT.map(e => ({...e, positionAllowance: 500000}));
    localStorage.setItem(K_EMPLOYEES, JSON.stringify(seeded));
  }
  if (!localStorage.getItem(K_CONFIG_SALARY)) {
    localStorage.setItem(K_CONFIG_SALARY, JSON.stringify(SALARY_RULES));
  }
};
init();

// --- Database Utilities (New) ---
export const getDatabaseStats = () => {
  return {
    employees: (JSON.parse(localStorage.getItem(K_EMPLOYEES) || '[]')).length,
    attendance: (JSON.parse(localStorage.getItem(K_ATTENDANCE) || '[]')).length,
    performance: (JSON.parse(localStorage.getItem(K_PERFORMANCE) || '[]')).length,
    salarySlips: (JSON.parse(localStorage.getItem(K_SALARY) || '[]')).length,
    history: (JSON.parse(localStorage.getItem(K_HISTORY) || '[]')).length,
  };
};

export const exportDatabase = () => {
  const data = {
    employees: JSON.parse(localStorage.getItem(K_EMPLOYEES) || '[]'),
    attendance: JSON.parse(localStorage.getItem(K_ATTENDANCE) || '[]'),
    performance: JSON.parse(localStorage.getItem(K_PERFORMANCE) || '[]'),
    salarySlips: JSON.parse(localStorage.getItem(K_SALARY) || '[]'),
    history: JSON.parse(localStorage.getItem(K_HISTORY) || '[]'),
    config: JSON.parse(localStorage.getItem(K_CONFIG_SALARY) || '{}'),
    exportedAt: new Date().toISOString()
  };
  return JSON.stringify(data, null, 2);
};

export const resetDatabase = () => {
  localStorage.clear();
  init(); // Re-seed initial data
};

// --- Salary Configuration ---
export const getSalaryConfig = (): SalaryConfig => {
  return JSON.parse(localStorage.getItem(K_CONFIG_SALARY) || JSON.stringify(SALARY_RULES));
};

export const saveSalaryConfig = (config: SalaryConfig) => {
  localStorage.setItem(K_CONFIG_SALARY, JSON.stringify(config));
};

// --- Employees ---
export const getEmployees = (): Employee[] => {
  const list = JSON.parse(localStorage.getItem(K_EMPLOYEES) || '[]');
  // Ensure positionAllowance exists for older records
  return list.map((e: any) => ({ ...e, positionAllowance: e.positionAllowance || 0 }));
};

export const saveEmployee = (emp: Employee) => {
  const list = getEmployees();
  const index = list.findIndex(e => e.id === emp.id);
  if (index >= 0) {
    list[index] = emp;
  } else {
    list.push(emp);
  }
  localStorage.setItem(K_EMPLOYEES, JSON.stringify(list));
};

export const deleteEmployee = (id: string) => {
  const list = getEmployees().filter(e => e.id !== id);
  localStorage.setItem(K_EMPLOYEES, JSON.stringify(list));
};

// --- Job History (Riwayat Jabatan) ---
export const getJobHistory = (employeeId: string): JobHistoryRecord[] => {
  const all = JSON.parse(localStorage.getItem(K_HISTORY) || '[]') as JobHistoryRecord[];
  return all.filter(h => h.employeeId === employeeId).sort((a, b) => b.effectiveDate.localeCompare(a.effectiveDate));
};

export const addJobHistory = (record: JobHistoryRecord) => {
  // 1. Save History Record
  const all = JSON.parse(localStorage.getItem(K_HISTORY) || '[]') as JobHistoryRecord[];
  all.push(record);
  localStorage.setItem(K_HISTORY, JSON.stringify(all));

  // 2. Update Master Employee Data if Promosi/Demosi/Mutasi
  if (record.type !== 'SANKSI') {
    const employees = getEmployees();
    const empIndex = employees.findIndex(e => e.id === record.employeeId);
    if (empIndex >= 0) {
      employees[empIndex].position = record.newPosition;
      employees[empIndex].baseSalary = record.newSalary;
      // Note: positionAllowance logic could be added here if history supported it, keeping simple for now
      localStorage.setItem(K_EMPLOYEES, JSON.stringify(employees));
    }
  }
};

// --- Attendance (Fingerspot Simulation) ---
export const getAttendance = (period: string): AttendanceRecord[] => {
  // period format "YYYY-MM"
  const all = JSON.parse(localStorage.getItem(K_ATTENDANCE) || '[]') as AttendanceRecord[];
  return all.filter(a => a.date.startsWith(period));
};

export const simulateFingerspotImport = (period: string) => {
  // Simulates importing raw data from machine and processing it
  const employees = getEmployees();
  const [year, month] = period.split('-').map(Number);
  const daysInMonth = new Date(year, month, 0).getDate();
  
  const newRecords: AttendanceRecord[] = [];
  const existingRecords = JSON.parse(localStorage.getItem(K_ATTENDANCE) || '[]') as AttendanceRecord[];
  
  // Remove existing for this period to allow re-import
  const filteredExisting = existingRecords.filter(r => !r.date.startsWith(period));

  // Shift Configurations
  const SHIFTS = [
    { name: 'PAGI', startHour: 7, startMin: 0 },   // 07:00 - 15:00
    { name: 'SIANG', startHour: 15, startMin: 0 }, // 15:00 - 23:00
    { name: 'MALAM', startHour: 23, startMin: 0 }  // 23:00 - 07:00 (Cross Day)
  ];

  employees.forEach(emp => {
    // Randomize attendance for the month
    for (let day = 1; day <= daysInMonth; day++) {
       const dateObj = new Date(year, month - 1, day);
       const dayOfWeek = dateObj.getDay();
       
       // Skip weekends (0 = Sun, 6 = Sat) for simplicity, though shifts often rotate
       if (dayOfWeek === 0 || dayOfWeek === 6) continue;

       // 90% chance to attend
       if (Math.random() > 0.1) {
         // 1. Assign Random Shift
         const shiftConfig = SHIFTS[Math.floor(Math.random() * SHIFTS.length)];
         
         // 2. Generate Check In Time (Target ± 15 mins jitter)
         const checkInDate = new Date(dateObj);
         checkInDate.setHours(shiftConfig.startHour, shiftConfig.startMin + (Math.random() * 30 - 15));
         
         // 3. Generate Work Duration (8 hours + random overtime 0-3 hours)
         // We calculate using timestamps to handle cross-day (Night Shift) correctly
         const workDurationHours = 8 + (Math.random() > 0.6 ? Math.random() * 3 : 0); 
         const durationMs = workDurationHours * 60 * 60 * 1000;
         
         const checkOutDate = new Date(checkInDate.getTime() + durationMs);

         // 4. Calculate Stats
         const totalHours = Number(workDurationHours.toFixed(2));
         // Overtime is anything > 8 hours
         const overtimeHours = Math.max(0, totalHours - 8);

         newRecords.push({
           id: `${emp.id}-${dateObj.toISOString().split('T')[0]}`,
           employeeId: emp.id,
           date: dateObj.toISOString().split('T')[0],
           checkIn: `${checkInDate.getHours().toString().padStart(2,'0')}:${checkInDate.getMinutes().toString().padStart(2,'0')}`,
           checkOut: `${checkOutDate.getHours().toString().padStart(2,'0')}:${checkOutDate.getMinutes().toString().padStart(2,'0')}`,
           totalHours: totalHours,
           overtimeHours: Number(overtimeHours.toFixed(2)),
           shift: shiftConfig.name as 'PAGI' | 'SIANG' | 'MALAM'
         });
       }
    }
  });

  localStorage.setItem(K_ATTENDANCE, JSON.stringify([...filteredExisting, ...newRecords]));
  return newRecords.length;
};

// --- Performance ---
export const getPerformance = (period: string): PerformanceRecord[] => {
  const all = JSON.parse(localStorage.getItem(K_PERFORMANCE) || '[]') as PerformanceRecord[];
  return all.filter(p => p.period === period);
};

export const savePerformance = (record: PerformanceRecord) => {
  const all = JSON.parse(localStorage.getItem(K_PERFORMANCE) || '[]') as PerformanceRecord[];
  const index = all.findIndex(p => p.id === record.id);
  if (index >= 0) all[index] = record;
  else all.push(record);
  localStorage.setItem(K_PERFORMANCE, JSON.stringify(all));
};

// --- NEW: Sync Performance from Attendance ---
const getBusinessDaysCount = (period: string): number => {
  const [year, month] = period.split('-').map(Number);
  const daysInMonth = new Date(year, month, 0).getDate();
  let count = 0;
  for(let i=1; i<=daysInMonth; i++) {
    const day = new Date(year, month-1, i).getDay();
    if(day !== 0 && day !== 6) count++; // Count Mon-Fri
  }
  return count;
}

export const syncPerformanceWithAttendance = (period: string) => {
  const employees = getEmployees();
  const attendance = getAttendance(period);
  const currentPerf = getPerformance(period);
  const businessDays = getBusinessDaysCount(period);
  
  const newPerfRecords: PerformanceRecord[] = [];

  employees.forEach(emp => {
    // 1. Get existing or init new record
    const existing = currentPerf.find(p => p.employeeId === emp.id) || {
      id: `perf-${emp.id}-${period}`,
      employeeId: emp.id,
      period: period,
      permissionCount: 0, // Preserve manual input if possible
      absentCount: 0,
      rating: 100,
      notes: ''
    };

    // 2. Count actual attendance from Fingerprint logs
    const empAttendanceCount = attendance.filter(a => a.employeeId === emp.id).length;
    
    // 3. Calculate Missed Days
    // If they attended more than business days (e.g. weekend overtime), max it at 100% logic or keep raw.
    // Let's assume Missed = BusinessDays - Attended. If negative, they attended extra, so missed is 0.
    const totalMissed = Math.max(0, businessDays - empAttendanceCount);

    // 4. Calculate Alpha (Absent without Permission)
    // Alpha = TotalMissed - Permission (Manual Input)
    const alphaCount = Math.max(0, totalMissed - existing.permissionCount);

    // 5. Calculate Rating (Based on Attendance Percentage)
    // Formula: (DaysPresent / BusinessDays) * 100
    // But we should also factor in that Permission is better than Alpha?
    // For now, let's stick to strict attendance percentage as "Rating" 
    // OR: Rating = 100 - (Alpha * 4%) - (Permission * 1%)?
    // Let's use simple attendance % for now as it's most transparent.
    // If businessDays is 20, and they came 15 times, rating is 75.
    let rating = 0;
    if (businessDays > 0) {
      rating = Math.round((empAttendanceCount / businessDays) * 100);
    }
    
    // Cap at 100
    rating = Math.min(100, rating);

    newPerfRecords.push({
      ...existing,
      absentCount: alphaCount, // Update Alpha automatically
      rating: rating,
      notes: existing.notes || (rating < 100 ? 'Generated from Attendance' : '')
    });
  });

  // Save all
  // Filter out other periods and append new ones
  const allPerf = JSON.parse(localStorage.getItem(K_PERFORMANCE) || '[]') as PerformanceRecord[];
  const otherPerf = allPerf.filter(p => p.period !== period);
  localStorage.setItem(K_PERFORMANCE, JSON.stringify([...otherPerf, ...newPerfRecords]));
  
  return newPerfRecords;
};

// --- Payroll Calculation ---
export const calculatePayroll = (period: string) => {
  const employees = getEmployees();
  const attendance = getAttendance(period);
  const performances = getPerformance(period);
  const salaryRules = getSalaryConfig(); // Load dynamic config
  const salarySlips: SalarySlip[] = [];

  employees.forEach(emp => {
    // 1. Attendance Data
    const empAttendance = attendance.filter(a => a.employeeId === emp.id);
    const totalDays = empAttendance.length;
    const totalOvertime = empAttendance.reduce((sum, r) => sum + r.overtimeHours, 0);

    // 2. Performance Data
    const empPerf = performances.find(p => p.employeeId === emp.id) || {
      permissionCount: 0,
      absentCount: 0,
      rating: 75, // Default average
      notes: 'No record'
    };

    // 3. Calc Components
    // Use dynamic rules
    const transportAllowance = totalDays * salaryRules.transportPerDay;
    const overtimePay = Math.floor(totalOvertime * salaryRules.overtimeRatePerHour);
    
    // Bonus logic
    let performanceBonus = 0;
    if (empPerf.rating >= salaryRules.bonusThreshold) {
       performanceBonus = salaryRules.bonusAmount;
    }

    // Deductions
    const deductions = empPerf.absentCount * salaryRules.deductionPerAbsent;

    // TOTAL FORMULA: Base + Position + Transport + Overtime + Bonus - Deductions
    const positionAllowance = emp.positionAllowance || 0;
    const totalSalary = emp.baseSalary + positionAllowance + transportAllowance + overtimePay + performanceBonus - deductions;

    const slip: SalarySlip = {
      id: `${emp.id}-${period}`,
      employeeId: emp.id,
      period,
      generatedAt: new Date().toISOString(),
      baseSalary: emp.baseSalary,
      positionAllowance: positionAllowance,
      overtimePay,
      performanceBonus,
      transportAllowance,
      totalAttendanceDays: totalDays,
      totalOvertimeHours: Number(totalOvertime.toFixed(2)),
      performanceScore: empPerf.rating || 0,
      deductions,
      totalSalary
    };
    
    salarySlips.push(slip);
  });

  // Save slips
  const allSlips = JSON.parse(localStorage.getItem(K_SALARY) || '[]') as SalarySlip[];
  const otherSlips = allSlips.filter(s => s.period !== period);
  localStorage.setItem(K_SALARY, JSON.stringify([...otherSlips, ...salarySlips]));
  
  return salarySlips;
};

export const getSalarySlips = (period: string): SalarySlip[] => {
  const all = JSON.parse(localStorage.getItem(K_SALARY) || '[]') as SalarySlip[];
  return all.filter(s => s.period === period);
};

// --- Report / Analytics Utilities ---
export const getYearlySummary = (year: number) => {
  const allSlips = JSON.parse(localStorage.getItem(K_SALARY) || '[]') as SalarySlip[];
  
  const summary = [];
  
  for (let m = 1; m <= 12; m++) {
    const monthStr = `${year}-${String(m).padStart(2, '0')}`;
    const monthlySlips = allSlips.filter(s => s.period === monthStr);
    
    const totalSalary = monthlySlips.reduce((acc, curr) => acc + curr.totalSalary, 0);
    const totalOvertime = monthlySlips.reduce((acc, curr) => acc + curr.totalOvertimeHours, 0);
    const avgPerformance = monthlySlips.length > 0 
      ? monthlySlips.reduce((acc, curr) => acc + curr.performanceScore, 0) / monthlySlips.length 
      : 0;
    
    summary.push({
      month: monthStr,
      label: new Date(year, m - 1).toLocaleString('id-ID', { month: 'long' }),
      employeeCount: monthlySlips.length,
      totalSalary,
      totalOvertime,
      avgPerformance: Math.round(avgPerformance)
    });
  }
  
  return summary;
};
