
import React, { useState, useEffect } from 'react';
import { Users, Clock, TrendingUp, DollarSign, Menu, LayoutDashboard, Printer, Save, RefreshCw, Trash2, Plus, Search, FileText, Briefcase, ChevronRight, X, Database, Download, AlertTriangle, Settings, BarChart } from 'lucide-react';
import { ViewState, Employee, AttendanceRecord, PerformanceRecord, SalarySlip, JobHistoryRecord, JobHistoryType, SalaryConfig } from './types';
import * as db from './services/storageService';
import { generatePerformanceReview } from './services/geminiService';
import { DIVISIONS, POSITIONS } from './constants';

// --- SUB-COMPONENTS (Inlined for single-file requirement structure, normally separate files) ---

const Sidebar = ({ currentView, setView }: { currentView: ViewState, setView: (v: ViewState) => void }) => {
  const menuItems = [
    { id: ViewState.DASHBOARD, label: 'Dashboard', icon: LayoutDashboard },
    { id: ViewState.EMPLOYEES, label: 'Data Karyawan', icon: Users },
    { id: ViewState.ATTENDANCE, label: 'Absensi', icon: Clock },
    { id: ViewState.PERFORMANCE, label: 'Performa', icon: TrendingUp },
    { id: ViewState.PAYROLL, label: 'Penggajian', icon: DollarSign },
    { id: ViewState.REPORTS, label: 'Laporan', icon: BarChart },
  ];

  return (
    <div className="w-64 bg-slate-900 text-white min-h-screen flex flex-col no-print">
      <div className="p-6 border-b border-slate-700">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <span className="text-blue-400">HRM</span> Pro
        </h1>
        <p className="text-xs text-slate-400 mt-1">Sistem Penggajian & SDM</p>
      </div>
      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setView(item.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              currentView === item.id ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <item.icon size={20} />
            <span className="font-medium">{item.label}</span>
          </button>
        ))}
      </nav>
      <div className="p-4 border-t border-slate-700 space-y-2">
        <button 
           onClick={() => setView(ViewState.SETTINGS)}
           className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              currentView === ViewState.SETTINGS ? 'bg-slate-800 text-white' : 'text-slate-500 hover:text-slate-300'
           }`}
        >
          <Settings size={20} />
          <span className="font-medium">Pengaturan</span>
        </button>
        <div className="flex items-center gap-3 pt-2">
          <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center font-bold">A</div>
          <div>
            <p className="text-sm font-medium">Administrator</p>
            <p className="text-xs text-slate-400">HR Manager</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- MODULES ---

const ReportsModule = () => {
  const [year, setYear] = useState(new Date().getFullYear());
  const [summary, setSummary] = useState<any[]>([]);

  useEffect(() => {
    setSummary(db.getYearlySummary(year));
  }, [year]);

  const maxSalary = Math.max(...summary.map(s => s.totalSalary), 1);

  return (
    <div className="p-6">
       <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-slate-800">Laporan Tahunan</h2>
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-600 font-bold">Pilih Tahun:</span>
          <select 
             value={year} 
             onChange={e => setYear(Number(e.target.value))} 
             className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
          >
             <option value={2022}>2022</option>
             <option value={2023}>2023</option>
             <option value={2024}>2024</option>
             <option value={2025}>2025</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
         <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
           <h3 className="text-slate-500 text-sm font-bold uppercase mb-2">Total Pengeluaran Gaji</h3>
           <p className="text-2xl font-bold text-slate-800">
             Rp {summary.reduce((a,b) => a + b.totalSalary, 0).toLocaleString('id-ID')}
           </p>
         </div>
         <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
           <h3 className="text-slate-500 text-sm font-bold uppercase mb-2">Total Jam Lembur</h3>
           <p className="text-2xl font-bold text-slate-800">
             {summary.reduce((a,b) => a + b.totalOvertime, 0).toFixed(1)} Jam
           </p>
         </div>
         <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
           <h3 className="text-slate-500 text-sm font-bold uppercase mb-2">Rata-rata Performa</h3>
           <p className="text-2xl font-bold text-slate-800">
             {Math.round(summary.reduce((a,b) => a + b.avgPerformance, 0) / 12)}/100
           </p>
         </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden p-6">
         <h3 className="font-bold text-slate-700 mb-6">Grafik Pengeluaran & Statistik Bulanan</h3>
         
         <div className="space-y-6">
           {summary.map((item) => (
             <div key={item.month} className="grid grid-cols-12 gap-4 items-center">
                <div className="col-span-2 text-sm font-bold text-slate-600">{item.label}</div>
                
                <div className="col-span-6 h-6 bg-slate-100 rounded-full overflow-hidden relative group cursor-pointer">
                   <div 
                     className="h-full bg-blue-500 rounded-full transition-all duration-500" 
                     style={{ width: `${(item.totalSalary / maxSalary) * 100}%` }}
                   ></div>
                   {item.totalSalary > 0 && (
                      <div className="absolute top-0 left-2 text-xs text-white font-bold h-full flex items-center">
                        Rp {(item.totalSalary / 1000000).toFixed(1)} Jt
                      </div>
                   )}
                </div>

                <div className="col-span-4 flex justify-between text-xs text-slate-500 px-2">
                   <span>Karyawan: <b>{item.employeeCount}</b></span>
                   <span>Lembur: <b>{Math.round(item.totalOvertime)}j</b></span>
                   <span className={item.avgPerformance >= 85 ? 'text-green-600 font-bold' : ''}>Perf: {item.avgPerformance}</span>
                </div>
             </div>
           ))}
         </div>
      </div>
    </div>
  );
};

const EmployeeHistoryModal = ({ employee, onClose, onUpdate }: { employee: Employee, onClose: () => void, onUpdate: () => void }) => {
  const [history, setHistory] = useState<JobHistoryRecord[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    setHistory(db.getJobHistory(employee.id));
  }, [employee.id]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);

    const type = formData.get('type') as JobHistoryType;
    const newRecord: JobHistoryRecord = {
      id: `hist-${Date.now()}`,
      employeeId: employee.id,
      type: type,
      previousPosition: employee.position,
      newPosition: (formData.get('newPosition') as string) || employee.position,
      previousSalary: employee.baseSalary,
      newSalary: Number(formData.get('newSalary')) || employee.baseSalary,
      effectiveDate: formData.get('effectiveDate') as string,
      notes: formData.get('notes') as string
    };

    db.addJobHistory(newRecord);
    setHistory(db.getJobHistory(employee.id));
    setShowAddForm(false);
    onUpdate(); // Trigger parent refresh to update salary/position in main table
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        <div className="p-6 border-b border-slate-200 flex justify-between items-center">
          <div>
             <h3 className="text-xl font-bold text-slate-800">Riwayat Jabatan & Sanksi</h3>
             <p className="text-sm text-slate-500">{employee.name} - {employee.nik}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={24}/></button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {!showAddForm ? (
             <div className="space-y-6">
               <div className="flex justify-between items-center">
                 <h4 className="font-bold text-slate-700">Timeline Karir</h4>
                 <button onClick={() => setShowAddForm(true)} className="bg-blue-600 text-white px-3 py-2 rounded-lg text-sm flex items-center gap-2 hover:bg-blue-700">
                   <Plus size={16}/> Catat Perubahan/Sanksi
                 </button>
               </div>
               
               <div className="relative border-l-2 border-slate-200 ml-3 space-y-8 pb-4">
                  {history.map(rec => (
                    <div key={rec.id} className="relative pl-8">
                       <div className={`absolute -left-[9px] top-0 w-4 h-4 rounded-full border-2 border-white ${
                         rec.type === 'PROMOSI' ? 'bg-green-500' : 
                         rec.type === 'DEMOSI' ? 'bg-orange-500' :
                         rec.type === 'SANKSI' ? 'bg-red-500' : 'bg-blue-500'
                       }`}></div>
                       <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 shadow-sm">
                          <div className="flex justify-between items-start mb-2">
                             <div>
                               <span className={`text-xs font-bold px-2 py-1 rounded uppercase ${
                                 rec.type === 'PROMOSI' ? 'bg-green-100 text-green-800' : 
                                 rec.type === 'DEMOSI' ? 'bg-orange-100 text-orange-800' :
                                 rec.type === 'SANKSI' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
                               }`}>{rec.type}</span>
                               <span className="text-xs text-slate-500 ml-2">{rec.effectiveDate}</span>
                             </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4 text-sm mt-3">
                            {rec.type !== 'SANKSI' && (
                              <>
                                <div>
                                  <p className="text-xs text-slate-400">Jabatan</p>
                                  <p className="font-medium">{rec.previousPosition} <ChevronRight className="inline w-3 h-3 text-slate-400"/> {rec.newPosition}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-slate-400">Gaji Pokok</p>
                                  <p className="font-medium">
                                    Rp {rec.previousSalary.toLocaleString('id-ID')} <ChevronRight className="inline w-3 h-3 text-slate-400"/> 
                                    <span className={rec.newSalary > rec.previousSalary ? 'text-green-600' : rec.newSalary < rec.previousSalary ? 'text-red-600' : ''}> Rp {rec.newSalary.toLocaleString('id-ID')}</span>
                                  </p>
                                </div>
                              </>
                            )}
                            <div className="col-span-2">
                              <p className="text-xs text-slate-400">Keterangan</p>
                              <p className="text-slate-700 italic">"{rec.notes}"</p>
                            </div>
                          </div>
                       </div>
                    </div>
                  ))}
                  {history.length === 0 && (
                    <div className="pl-8 text-slate-400 italic">Belum ada riwayat tercatat.</div>
                  )}
               </div>
             </div>
          ) : (
            <div>
              <h4 className="font-bold text-slate-700 mb-4">Input Riwayat Baru</h4>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                   <div>
                     <label className="block text-sm font-medium text-slate-700 mb-1">Jenis Perubahan</label>
                     <select name="type" required className="w-full border p-2 rounded">
                       <option value="PROMOSI">Promosi (Kenaikan Jabatan)</option>
                       <option value="MUTASI">Mutasi (Pindah Divisi)</option>
                       <option value="DEMOSI">Demosi (Penurunan Jabatan)</option>
                       <option value="SANKSI">Sanksi (Surat Peringatan dll)</option>
                     </select>
                   </div>
                   <div>
                     <label className="block text-sm font-medium text-slate-700 mb-1">Tanggal Efektif</label>
                     <input type="date" name="effectiveDate" required className="w-full border p-2 rounded" />
                   </div>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                  <p className="text-xs text-blue-800 font-bold mb-3 uppercase">Dampak Perubahan (Master Data)</p>
                  <div className="grid grid-cols-2 gap-4">
                     <div>
                       <label className="block text-sm font-medium text-slate-700 mb-1">Jabatan Baru</label>
                       <select name="newPosition" defaultValue={employee.position} className="w-full border p-2 rounded">
                          {POSITIONS.map(p => <option key={p} value={p}>{p}</option>)}
                       </select>
                     </div>
                     <div>
                       <label className="block text-sm font-medium text-slate-700 mb-1">Gaji Pokok Baru</label>
                       <input type="number" name="newSalary" defaultValue={employee.baseSalary} className="w-full border p-2 rounded" />
                     </div>
                  </div>
                  <p className="text-xs text-slate-500 mt-2">* Data master karyawan akan otomatis terupdate jika memilih Promosi/Mutasi/Demosi.</p>
                </div>

                <div>
                   <label className="block text-sm font-medium text-slate-700 mb-1">Keterangan / Alasan</label>
                   <textarea name="notes" required rows={3} className="w-full border p-2 rounded" placeholder="Contoh: Kenaikan jabatan tahunan atau SP1 karena terlambat..."></textarea>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button type="button" onClick={() => setShowAddForm(false)} className="px-4 py-2 border rounded hover:bg-slate-50">Batal</button>
                  <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Simpan Riwayat</button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const SettingsModule = () => {
  const [stats, setStats] = useState(db.getDatabaseStats());
  const [salaryConfig, setSalaryConfig] = useState<SalaryConfig>(db.getSalaryConfig());

  const handleDownload = () => {
    const jsonStr = db.exportDatabase();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `hrm-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleReset = () => {
    if (confirm("PERINGATAN: Semua data akan dihapus (Karyawan, Absensi, Gaji) dan dikembalikan ke data awal. Lanjutkan?")) {
      db.resetDatabase();
      setStats(db.getDatabaseStats());
      setSalaryConfig(db.getSalaryConfig());
      alert("Database telah di-reset.");
      window.location.reload();
    }
  };

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    db.saveSalaryConfig(salaryConfig);
    alert("Konfigurasi gaji berhasil disimpan.");
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-slate-800 mb-6">Pengaturan Sistem</h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Kolom Kiri: Database */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
            <Database size={20}/> Database & Penyimpanan
          </h3>
          
          <div className="flex items-start gap-4 mb-6 p-4 bg-blue-50 border border-blue-100 rounded-lg">
             <div className="text-sm text-blue-700">
               Data tersimpan di <b>Local Storage</b> browser. Lakukan backup berkala.
             </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
             <div className="bg-slate-50 p-3 rounded border border-slate-200">
               <div className="text-xs text-slate-500 uppercase">Karyawan</div>
               <div className="text-xl font-bold">{stats.employees}</div>
             </div>
             <div className="bg-slate-50 p-3 rounded border border-slate-200">
               <div className="text-xs text-slate-500 uppercase">Absensi</div>
               <div className="text-xl font-bold">{stats.attendance}</div>
             </div>
          </div>

          <div className="space-y-3">
            <button onClick={handleDownload} className="w-full flex items-center justify-center gap-2 bg-slate-800 text-white px-4 py-2 rounded hover:bg-slate-700">
              <Download size={16} /> Download Backup (JSON)
            </button>
            <button onClick={handleReset} className="w-full flex items-center justify-center gap-2 bg-white border border-red-300 text-red-600 px-4 py-2 rounded hover:bg-red-50">
              <AlertTriangle size={16} /> Reset Factory Data
            </button>
          </div>
        </div>

        {/* Kolom Kanan: Salary Rules */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
           <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
             <DollarSign size={20}/> Konfigurasi Gaji Global
           </h3>
           <p className="text-xs text-slate-500 mb-4">Pengaturan ini akan diterapkan pada perhitungan gaji periode berikutnya.</p>

           <form onSubmit={handleSaveConfig} className="space-y-4">
              <div>
                 <label className="block text-sm font-medium text-slate-700 mb-1">Uang Transport (Per Hari Hadir)</label>
                 <div className="relative">
                   <span className="absolute left-3 top-2 text-slate-500 text-sm">Rp</span>
                   <input 
                      type="number" 
                      value={salaryConfig.transportPerDay}
                      onChange={e => setSalaryConfig({...salaryConfig, transportPerDay: Number(e.target.value)})}
                      className="w-full pl-10 border p-2 rounded" 
                   />
                 </div>
              </div>

              <div>
                 <label className="block text-sm font-medium text-slate-700 mb-1">Rate Lembur (Per Jam)</label>
                 <div className="relative">
                   <span className="absolute left-3 top-2 text-slate-500 text-sm">Rp</span>
                   <input 
                      type="number" 
                      value={salaryConfig.overtimeRatePerHour}
                      onChange={e => setSalaryConfig({...salaryConfig, overtimeRatePerHour: Number(e.target.value)})}
                      className="w-full pl-10 border p-2 rounded" 
                   />
                 </div>
              </div>

              <div>
                 <label className="block text-sm font-medium text-slate-700 mb-1">Nominal Bonus Performa (Jika Target Tercapai)</label>
                 <div className="relative">
                   <span className="absolute left-3 top-2 text-slate-500 text-sm">Rp</span>
                   <input 
                      type="number" 
                      value={salaryConfig.bonusAmount}
                      onChange={e => setSalaryConfig({...salaryConfig, bonusAmount: Number(e.target.value)})}
                      className="w-full pl-10 border p-2 rounded" 
                   />
                 </div>
              </div>
              
              <div>
                 <label className="block text-sm font-medium text-slate-700 mb-1">Potongan Mangkir (Per Hari)</label>
                 <div className="relative">
                   <span className="absolute left-3 top-2 text-slate-500 text-sm">Rp</span>
                   <input 
                      type="number" 
                      value={salaryConfig.deductionPerAbsent}
                      onChange={e => setSalaryConfig({...salaryConfig, deductionPerAbsent: Number(e.target.value)})}
                      className="w-full pl-10 border p-2 rounded text-red-600" 
                   />
                 </div>
              </div>

              <div className="pt-4">
                 <button type="submit" className="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 flex justify-center gap-2">
                   <Save size={18}/> Simpan Konfigurasi
                 </button>
              </div>
           </form>
        </div>
      </div>
    </div>
  );
};

const EmployeeModule = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmp, setEditingEmp] = useState<Employee | null>(null);
  const [historyEmp, setHistoryEmp] = useState<Employee | null>(null); // State for history modal
  const [search, setSearch] = useState('');

  useEffect(() => {
    setEmployees(db.getEmployees());
  }, []);

  const refreshData = () => {
    setEmployees(db.getEmployees());
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    
    const newEmp: Employee = {
      id: editingEmp ? editingEmp.id : `emp-${Date.now()}`,
      pin: formData.get('pin') as string,
      nik: formData.get('nik') as string,
      name: formData.get('name') as string,
      division: formData.get('division') as string,
      position: formData.get('position') as string,
      joinDate: formData.get('joinDate') as string,
      birthPlace: formData.get('birthPlace') as string,
      birthDate: formData.get('birthDate') as string,
      address: formData.get('address') as string,
      baseSalary: Number(formData.get('baseSalary')),
      positionAllowance: Number(formData.get('positionAllowance')),
      photoUrl: editingEmp?.photoUrl || `https://picsum.photos/100/100?random=${Date.now()}` // Mock upload
    };

    db.saveEmployee(newEmp);
    refreshData();
    setIsModalOpen(false);
    setEditingEmp(null);
  };

  const handleDelete = (id: string) => {
    if(confirm('Hapus karyawan ini?')) {
      db.deleteEmployee(id);
      refreshData();
    }
  };

  const filtered = employees.filter(e => e.name.toLowerCase().includes(search.toLowerCase()) || e.nik.includes(search));

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-slate-800">Manajemen Karyawan</h2>
        <button onClick={() => { setEditingEmp(null); setIsModalOpen(true); }} className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700">
          <Plus size={18} /> Tambah Karyawan
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Cari Nama atau NIK..." 
              className="pl-10 pr-4 py-2 w-full border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-slate-600 font-medium text-sm">
            <tr>
              <th className="p-4">Karyawan</th>
              <th className="p-4">Divisi & Jabatan</th>
              <th className="p-4">PIN / NIK</th>
              <th className="p-4">Gaji Pokok + Tunj.</th>
              <th className="p-4">Bergabung</th>
              <th className="p-4 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map(emp => (
              <tr key={emp.id} className="hover:bg-slate-50">
                <td className="p-4 flex items-center gap-3">
                  <img src={emp.photoUrl} alt="" className="w-10 h-10 rounded-full object-cover" />
                  <div>
                    <div className="font-medium text-slate-900">{emp.name}</div>
                    <div className="text-xs text-slate-500">{emp.address}</div>
                  </div>
                </td>
                <td className="p-4">
                  <div className="text-sm font-medium">{emp.position}</div>
                  <div className="text-xs text-slate-500">{emp.division}</div>
                </td>
                <td className="p-4 text-sm">
                  <div className="font-mono text-slate-600">{emp.pin}</div>
                  <div className="font-mono text-xs text-slate-400">{emp.nik}</div>
                </td>
                <td className="p-4 text-sm">
                   <div className="font-medium text-green-700">Rp {emp.baseSalary.toLocaleString('id-ID')}</div>
                   {emp.positionAllowance > 0 && (
                     <div className="text-xs text-green-600">+ Rp {emp.positionAllowance.toLocaleString('id-ID')} (Tunj.)</div>
                   )}
                </td>
                <td className="p-4 text-sm text-slate-500">{emp.joinDate}</td>
                <td className="p-4 text-right">
                  <div className="flex justify-end gap-2">
                    <button 
                      onClick={() => setHistoryEmp(emp)} 
                      className="text-indigo-600 hover:text-indigo-800 p-1 rounded hover:bg-indigo-50"
                      title="Riwayat Jabatan"
                    >
                      <Briefcase size={18} />
                    </button>
                    <button 
                      onClick={() => { setEditingEmp(emp); setIsModalOpen(true); }} 
                      className="text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-50"
                      title="Edit Data"
                    >
                      <FileText size={18} />
                    </button>
                    <button 
                      onClick={() => handleDelete(emp.id)} 
                      className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50"
                      title="Hapus"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={6} className="p-8 text-center text-slate-400">Tidak ada data karyawan</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* History Modal */}
      {historyEmp && (
        <EmployeeHistoryModal 
          employee={historyEmp} 
          onClose={() => setHistoryEmp(null)} 
          onUpdate={refreshData}
        />
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4">{editingEmp ? 'Edit Data Karyawan' : 'Tambah Karyawan Baru'}</h3>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">Nama Lengkap</label>
                <input required name="name" defaultValue={editingEmp?.name} className="w-full border p-2 rounded" />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">NIK</label>
                <input required name="nik" defaultValue={editingEmp?.nik} className="w-full border p-2 rounded" />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">PIN (Fingerspot ID)</label>
                <input required name="pin" defaultValue={editingEmp?.pin} className="w-full border p-2 rounded" />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">Divisi</label>
                <select name="division" defaultValue={editingEmp?.division} className="w-full border p-2 rounded">
                  {DIVISIONS.map(d => <option key={d}>{d}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">Jabatan</label>
                <select name="position" defaultValue={editingEmp?.position} className="w-full border p-2 rounded">
                  {POSITIONS.map(p => <option key={p}>{p}</option>)}
                </select>
              </div>
              
              <div className="md:col-span-2 bg-blue-50 p-3 rounded border border-blue-100">
                <p className="text-xs font-bold text-blue-800 uppercase mb-2">Komponen Gaji Personal</p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-700">Gaji Pokok (Rp)</label>
                    <input required type="number" name="baseSalary" defaultValue={editingEmp?.baseSalary} className="w-full border p-2 rounded" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-700">Tunj. Jabatan (Rp)</label>
                    <input type="number" name="positionAllowance" defaultValue={editingEmp?.positionAllowance || 0} className="w-full border p-2 rounded" />
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">Tempat Lahir</label>
                <input required name="birthPlace" defaultValue={editingEmp?.birthPlace} className="w-full border p-2 rounded" />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">Tanggal Lahir</label>
                <input required type="date" name="birthDate" defaultValue={editingEmp?.birthDate} className="w-full border p-2 rounded" />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">Tanggal Bergabung</label>
                <input required type="date" name="joinDate" defaultValue={editingEmp?.joinDate} className="w-full border p-2 rounded" />
              </div>
              <div className="md:col-span-2 space-y-1">
                <label className="text-sm font-medium text-slate-700">Alamat</label>
                <textarea required name="address" defaultValue={editingEmp?.address} className="w-full border p-2 rounded h-20"></textarea>
              </div>
              <div className="md:col-span-2 flex justify-end gap-3 mt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 border rounded hover:bg-slate-50">Batal</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const AttendanceModule = () => {
  const [period, setPeriod] = useState('2023-10');
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setEmployees(db.getEmployees());
    setRecords(db.getAttendance(period));
  }, [period]);

  const handleImport = () => {
    setIsLoading(true);
    setTimeout(() => {
      const count = db.simulateFingerspotImport(period);
      setRecords(db.getAttendance(period));
      setIsLoading(false);
      alert(`Berhasil mengimpor ${count} data absensi dari mesin.`);
    }, 1500);
  };

  const getEmpName = (id: string) => employees.find(e => e.id === id)?.name || 'Unknown';

  const getShiftColor = (shift: string) => {
    switch(shift) {
      case 'PAGI': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'SIANG': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'MALAM': return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      default: return 'bg-slate-100 text-slate-800';
    }
  };

  return (
    <div className="p-6">
       <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-slate-800">Data Absensi</h2>
        <div className="flex gap-4">
          <input 
            type="month" 
            value={period} 
            onChange={e => setPeriod(e.target.value)} 
            className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
          />
          <button 
            onClick={handleImport} 
            disabled={isLoading}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-indigo-700 disabled:opacity-50"
          >
            {isLoading ? <RefreshCw className="animate-spin" size={18}/> : <Save size={18} />}
            Import Data (Mesin)
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-slate-600 font-medium text-sm">
            <tr>
              <th className="p-4">Tanggal</th>
              <th className="p-4">Karyawan</th>
              <th className="p-4">Shift</th>
              <th className="p-4">Jam Masuk</th>
              <th className="p-4">Jam Pulang</th>
              <th className="p-4 text-center">Durasi (Jam)</th>
              <th className="p-4 text-center">Lembur (Jam)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {records.sort((a,b) => a.date.localeCompare(b.date)).map(rec => (
              <tr key={rec.id} className="hover:bg-slate-50">
                <td className="p-4 font-mono text-slate-600">{rec.date}</td>
                <td className="p-4 font-medium">{getEmpName(rec.employeeId)}</td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded text-xs font-bold border ${getShiftColor(rec.shift)}`}>
                    {rec.shift}
                  </span>
                </td>
                <td className="p-4 text-green-600 font-mono">{rec.checkIn}</td>
                <td className="p-4 text-red-600 font-mono">{rec.checkOut}</td>
                <td className="p-4 text-center font-bold">{rec.totalHours}</td>
                <td className="p-4 text-center">
                  {rec.overtimeHours > 0 ? (
                    <span className="bg-amber-100 text-amber-800 px-2 py-1 rounded-full text-xs font-bold">
                      +{rec.overtimeHours}
                    </span>
                  ) : '-'}
                </td>
              </tr>
            ))}
             {records.length === 0 && (
              <tr><td colSpan={7} className="p-12 text-center text-slate-400">Belum ada data absensi untuk periode ini. Silakan Import.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const PerformanceModule = () => {
  const [period, setPeriod] = useState('2023-10');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [records, setRecords] = useState<PerformanceRecord[]>([]);
  const [attendanceStats, setAttendanceStats] = useState<AttendanceRecord[]>([]);

  useEffect(() => {
    setEmployees(db.getEmployees());
    setRecords(db.getPerformance(period));
    setAttendanceStats(db.getAttendance(period));
  }, [period]);

  const handleUpdate = (empId: string, field: keyof PerformanceRecord, value: any) => {
    const existing = records.find(r => r.employeeId === empId) || {
      id: `perf-${empId}-${period}`,
      employeeId: empId,
      period: period,
      permissionCount: 0,
      absentCount: 0,
      rating: 0,
      notes: ''
    };
    
    // If updating permission, we must recalculate alpha automatically
    let updated = { ...existing, [field]: value };
    
    if (field === 'permissionCount') {
       // Need to re-sync to get correct Alpha count based on new Permission count
       // For simple UI update without full re-sync:
       // We can just save it, and let the sync button handle the logic, OR:
       // We can trigger a save which re-reads logic?
       // Let's just save. The Sync button is the "Source of Truth" for calculation.
    }

    db.savePerformance(updated);
    setRecords(db.getPerformance(period));
  };

  const handleSync = () => {
    const updated = db.syncPerformanceWithAttendance(period);
    setRecords(updated);
    alert("Data performa berhasil disinkronisasi dengan data absensi.");
  };

  // Helper to get present count for display
  const getPresentCount = (empId: string) => attendanceStats.filter(a => a.employeeId === empId).length;

  return (
    <div className="p-6">
       <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-slate-800">Penilaian Performa</h2>
        <div className="flex gap-4">
          <input 
              type="month" 
              value={period} 
              onChange={e => setPeriod(e.target.value)} 
              className="border border-slate-300 rounded-lg px-3 py-2 text-sm"
            />
          <button 
            onClick={handleSync}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-purple-700"
          >
            <RefreshCw size={18}/> Sinkronisasi Absensi
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {employees.map(emp => {
          const rec = records.find(r => r.employeeId === emp.id) || { permissionCount: 0, absentCount: 0, rating: 0 };
          const presentCount = getPresentCount(emp.id);
          
          return (
            <div key={emp.id} className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col md:flex-row items-center gap-6 shadow-sm">
               <div className="flex items-center gap-3 w-full md:w-1/4">
                  <img src={emp.photoUrl} className="w-12 h-12 rounded-full" alt=""/>
                  <div>
                    <div className="font-bold text-slate-800">{emp.name}</div>
                    <div className="text-xs text-slate-500">{emp.position}</div>
                  </div>
               </div>
               
               <div className="flex-1 grid grid-cols-4 gap-4 w-full">
                  <div className="bg-green-50 p-2 rounded border border-green-100 text-center">
                    <label className="block text-xs font-bold text-green-700 uppercase mb-1">Hadir (Auto)</label>
                    <div className="font-bold text-lg text-green-800">{presentCount} Hari</div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Izin (Input)</label>
                    <input 
                      type="number" min="0"
                      value={rec.permissionCount}
                      onChange={e => handleUpdate(emp.id, 'permissionCount', Number(e.target.value))}
                      className="w-full border border-slate-300 rounded p-2 text-center"
                    />
                  </div>
                  <div className="bg-red-50 p-2 rounded border border-red-100 text-center">
                    <label className="block text-xs font-bold text-red-700 uppercase mb-1">Alpha (Auto)</label>
                    <div className="font-bold text-lg text-red-800">{rec.absentCount} Hari</div>
                  </div>
                  <div>
                     <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Rating Kehadiran</label>
                     <div className="flex items-center gap-2">
                        <div className="flex-1 h-3 bg-slate-200 rounded-full overflow-hidden">
                           <div 
                             className={`h-full ${rec.rating >= 85 ? 'bg-green-500' : rec.rating >= 60 ? 'bg-orange-500' : 'bg-red-500'}`} 
                             style={{width: `${rec.rating}%`}}
                           ></div>
                        </div>
                        <span className="text-sm font-bold">{rec.rating}%</span>
                     </div>
                  </div>
               </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const PayrollModule = () => {
  const [period, setPeriod] = useState('2023-10');
  const [slips, setSlips] = useState<SalarySlip[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedSlip, setSelectedSlip] = useState<SalarySlip | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<string>("");
  const [isAnalysing, setIsAnalysing] = useState(false);

  useEffect(() => {
    setEmployees(db.getEmployees());
    setSlips(db.getSalarySlips(period));
  }, [period]);

  const handleCalculate = () => {
    setIsProcessing(true);
    setTimeout(() => {
      const results = db.calculatePayroll(period);
      setSlips(results);
      setIsProcessing(false);
    }, 1000);
  };

  const getEmp = (id: string) => employees.find(e => e.id === id);

  const handleViewSlip = async (slip: SalarySlip) => {
    setSelectedSlip(slip);
    setAiAnalysis("");
  };

  const handleGenerateAI = async () => {
    if(!selectedSlip) return;
    setIsAnalysing(true);
    const emp = getEmp(selectedSlip.employeeId);
    if(emp) {
      const text = await generatePerformanceReview(emp, selectedSlip);
      setAiAnalysis(text);
    }
    setIsAnalysing(false);
  };

  const printSlip = () => {
    window.print();
  };

  // Render View (List or Detail)
  if (selectedSlip) {
    const emp = getEmp(selectedSlip.employeeId);
    if (!emp) return null;

    return (
      <div className="p-6 bg-slate-100 min-h-screen">
        <div className="max-w-3xl mx-auto no-print mb-4 flex gap-2">
            <button onClick={() => setSelectedSlip(null)} className="px-4 py-2 bg-slate-600 text-white rounded">Kembali</button>
            <button onClick={printSlip} className="px-4 py-2 bg-blue-600 text-white rounded flex items-center gap-2"><Printer size={16}/> Cetak PDF</button>
        </div>

        {/* SLIP GAJI UI - Styled for Print */}
        <div className="bg-white p-8 rounded-xl shadow-lg border border-slate-200 max-w-3xl mx-auto print:shadow-none print:border-none print:w-full">
          <div className="border-b-2 border-slate-800 pb-4 mb-6 flex justify-between items-end">
            <div>
              <h1 className="text-3xl font-bold text-slate-800">SLIP GAJI</h1>
              <p className="text-slate-500">Periode: {selectedSlip.period}</p>
            </div>
            <div className="text-right">
              <div className="font-bold text-xl text-blue-800">HRM Pro Corp.</div>
              <div className="text-sm text-slate-500">Jl. Teknologi No. 1, Jakarta</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 mb-8">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase">Karyawan</p>
              <p className="font-bold text-lg">{emp.name}</p>
              <p className="text-slate-600">{emp.nik} | {emp.division}</p>
              <p className="text-slate-600">{emp.position}</p>
            </div>
            <div className="text-right">
              <p className="text-xs font-bold text-slate-400 uppercase">Status Kehadiran</p>
              <p className="text-sm">Total Hari: <span className="font-bold">{selectedSlip.totalAttendanceDays}</span></p>
              <p className="text-sm">Total Lembur: <span className="font-bold">{selectedSlip.totalOvertimeHours} Jam</span></p>
              <p className="text-sm">Rating Performa: <span className="font-bold">{selectedSlip.performanceScore}/100</span></p>
            </div>
          </div>

          <div className="mb-6">
            <h3 className="font-bold border-b border-slate-300 mb-3 pb-1">PENERIMAAN</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Gaji Pokok</span>
                <span>Rp {selectedSlip.baseSalary.toLocaleString('id-ID')}</span>
              </div>
              {selectedSlip.positionAllowance > 0 && (
                <div className="flex justify-between">
                  <span>Tunjangan Jabatan</span>
                  <span>Rp {selectedSlip.positionAllowance.toLocaleString('id-ID')}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Tunjangan Transport</span>
                <span>Rp {selectedSlip.transportAllowance.toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between">
                <span>Upah Lembur</span>
                <span>Rp {selectedSlip.overtimePay.toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between text-green-700">
                <span>Bonus Performa</span>
                <span>Rp {selectedSlip.performanceBonus.toLocaleString('id-ID')}</span>
              </div>
            </div>
          </div>

          <div className="mb-6">
            <h3 className="font-bold border-b border-slate-300 mb-3 pb-1 text-red-700">POTONGAN</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-red-600">
                <span>Ketidakhadiran (Mangkir)</span>
                <span>- Rp {selectedSlip.deductions.toLocaleString('id-ID')}</span>
              </div>
            </div>
          </div>

          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 flex justify-between items-center mb-8">
            <span className="font-bold text-lg text-slate-700">TOTAL DITERIMA (TAKE HOME PAY)</span>
            <span className="font-bold text-2xl text-blue-800">Rp {selectedSlip.totalSalary.toLocaleString('id-ID')}</span>
          </div>

          {/* AI Section */}
          <div className="mt-8 pt-4 border-t border-slate-200 no-print">
             <div className="flex justify-between items-center mb-2">
               <h4 className="font-bold text-purple-700 flex items-center gap-2">✨ AI Performance Summary</h4>
               {!aiAnalysis && (
                 <button onClick={handleGenerateAI} disabled={isAnalysing} className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded hover:bg-purple-200">
                   {isAnalysing ? 'Generating...' : 'Generate Review'}
                 </button>
               )}
             </div>
             {aiAnalysis && (
               <div className="p-3 bg-purple-50 text-purple-900 text-sm rounded border border-purple-100 italic">
                 "{aiAnalysis}"
               </div>
             )}
          </div>
          
          {/* Print only analysis text if exists */}
          {aiAnalysis && (
            <div className="mt-8 pt-4 border-t border-slate-200 print-only block">
              <h4 className="font-bold text-sm text-slate-500 mb-1">Catatan Manajemen</h4>
              <p className="text-sm italic text-slate-700">{aiAnalysis}</p>
            </div>
          )}

          <div className="mt-12 text-center text-xs text-slate-400">
            Dokumen ini dihasilkan secara otomatis oleh sistem HRM Pro pada {new Date(selectedSlip.generatedAt).toLocaleString('id-ID')}.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
       <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-slate-800">Penggajian</h2>
        <div className="flex gap-4">
          <input 
            type="month" 
            value={period} 
            onChange={e => setPeriod(e.target.value)} 
            className="border border-slate-300 rounded-lg px-3 py-2 text-sm"
          />
          <button 
            onClick={handleCalculate} 
            disabled={isProcessing}
            className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-green-700"
          >
            {isProcessing ? <RefreshCw className="animate-spin" size={18}/> : <DollarSign size={18} />}
            Hitung Gaji (Otomatis)
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-slate-600 font-medium text-sm">
            <tr>
              <th className="p-4">Karyawan</th>
              <th className="p-4 text-right">Gaji Pokok</th>
              <th className="p-4 text-right">Lembur</th>
              <th className="p-4 text-right">Bonus</th>
              <th className="p-4 text-right">Potongan</th>
              <th className="p-4 text-right">Total Gaji</th>
              <th className="p-4 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {slips.map(slip => {
              const emp = getEmp(slip.employeeId);
              return (
                <tr key={slip.id} className="hover:bg-slate-50">
                  <td className="p-4 font-medium">{emp?.name} <span className="block text-xs font-normal text-slate-400">{emp?.division}</span></td>
                  <td className="p-4 text-right text-slate-600">{slip.baseSalary.toLocaleString('id-ID')}</td>
                  <td className="p-4 text-right text-slate-600">{slip.overtimePay.toLocaleString('id-ID')}</td>
                  <td className="p-4 text-right text-green-600">{slip.performanceBonus.toLocaleString('id-ID')}</td>
                  <td className="p-4 text-right text-red-500">({slip.deductions.toLocaleString('id-ID')})</td>
                  <td className="p-4 text-right font-bold text-blue-700 text-base">{slip.totalSalary.toLocaleString('id-ID')}</td>
                  <td className="p-4 text-center">
                    <button onClick={() => handleViewSlip(slip)} className="text-blue-600 hover:text-blue-800 font-medium text-xs border border-blue-200 px-3 py-1 rounded">
                      Lihat Slip
                    </button>
                  </td>
                </tr>
              );
            })}
             {slips.length === 0 && (
              <tr><td colSpan={7} className="p-12 text-center text-slate-400">Belum ada data gaji. Klik "Hitung Gaji".</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const DashboardModule = ({ changeView }: { changeView: (v: ViewState) => void }) => {
  const employees = db.getEmployees();
  const date = new Date();
  const period = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  const slips = db.getSalarySlips(period);
  const totalPayroll = slips.reduce((acc, curr) => acc + curr.totalSalary, 0);

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-slate-800 mb-6">Dashboard Ringkasan</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div onClick={() => changeView(ViewState.EMPLOYEES)} className="bg-blue-500 text-white p-6 rounded-xl shadow-lg cursor-pointer transform hover:scale-105 transition-transform">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-lg">Total Karyawan</h3>
            <Users size={24} className="opacity-80"/>
          </div>
          <p className="text-4xl font-bold">{employees.length}</p>
          <p className="text-sm opacity-80 mt-2">Aktif Bekerja</p>
        </div>

        <div onClick={() => changeView(ViewState.PAYROLL)} className="bg-emerald-500 text-white p-6 rounded-xl shadow-lg cursor-pointer transform hover:scale-105 transition-transform">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-lg">Total Penggajian</h3>
            <DollarSign size={24} className="opacity-80"/>
          </div>
          <p className="text-3xl font-bold">Rp {(totalPayroll / 1000000).toFixed(1)} Jt</p>
          <p className="text-sm opacity-80 mt-2">Periode {period}</p>
        </div>

        <div onClick={() => changeView(ViewState.PERFORMANCE)} className="bg-violet-500 text-white p-6 rounded-xl shadow-lg cursor-pointer transform hover:scale-105 transition-transform">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-lg">Performa Rata-rata</h3>
            <TrendingUp size={24} className="opacity-80"/>
          </div>
          <p className="text-4xl font-bold">85/100</p>
          <p className="text-sm opacity-80 mt-2">Target Tercapai</p>
        </div>
      </div>
    </div>
  );
};

// --- MAIN APP COMPONENT ---

export default function App() {
  const [view, setView] = useState<ViewState>(ViewState.DASHBOARD);

  // Mobile drawer state could go here

  return (
    <div className="flex min-h-screen bg-slate-100">
      <Sidebar currentView={view} setView={setView} />
      
      <main className="flex-1 overflow-auto h-screen relative">
        {/* Mobile Header Placeholder */}
        <div className="md:hidden bg-slate-900 text-white p-4 flex justify-between items-center">
             <span className="font-bold">HRM Pro</span>
             <Menu size={24} />
        </div>

        {view === ViewState.DASHBOARD && <DashboardModule changeView={setView} />}
        {view === ViewState.EMPLOYEES && <EmployeeModule />}
        {view === ViewState.ATTENDANCE && <AttendanceModule />}
        {view === ViewState.PERFORMANCE && <PerformanceModule />}
        {view === ViewState.PAYROLL && <PayrollModule />}
        {view === ViewState.REPORTS && <ReportsModule />}
        {view === ViewState.SETTINGS && <SettingsModule />}
      </main>
    </div>
  );
}