export const DIVISIONS = ['IT', 'HR', 'Finance', 'Operations', 'Marketing'];
export const POSITIONS = ['Staff', 'Supervisor', 'Manager', 'Senior Manager'];

// Simulation Constants
export const SALARY_RULES = {
  overtimeRatePerHour: 25000,
  transportPerDay: 50000,
  deductionPerAbsent: 100000,
  bonusThreshold: 85, // Score > 85 gets bonus
  bonusAmount: 500000
};

export const MOCK_EMPLOYEES_INIT = [
  {
    id: 'emp-1',
    pin: '1001',
    nik: '202301001',
    name: 'Budi Santoso',
    division: 'IT',
    position: 'Manager',
    joinDate: '2020-01-15',
    birthPlace: 'Jakarta',
    birthDate: '1990-05-20',
    address: 'Jl. Sudirman No. 1, Jakarta',
    photoUrl: 'https://picsum.photos/100/100?random=1',
    baseSalary: 12000000
  },
  {
    id: 'emp-2',
    pin: '1002',
    nik: '202302005',
    name: 'Siti Aminah',
    division: 'Finance',
    position: 'Staff',
    joinDate: '2021-03-10',
    birthPlace: 'Bandung',
    birthDate: '1995-08-12',
    address: 'Jl. Merdeka No. 45, Bandung',
    photoUrl: 'https://picsum.photos/100/100?random=2',
    baseSalary: 6000000
  }
];