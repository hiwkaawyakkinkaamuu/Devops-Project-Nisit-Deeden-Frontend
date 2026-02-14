"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import Swal from "sweetalert2";

// ==========================================
// 0. Configuration & Service Layer
// ==========================================

const USE_MOCK_DATA = false;
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

// Interface ตรงกับ DTO หลังบ้าน
interface AcademicYear {
  academic_year_id: number; // 0 = New Record
  year: number;
  semester: number;
  start_date: string;
  end_date: string;
  is_current: boolean;
  is_open_register: boolean;
}

// --- Helper Functions ---
const formatDateThai = (dateString: string) => {
  if (!dateString || dateString.startsWith("0001")) return "-";
  const date = new Date(dateString);
  return date.toLocaleDateString("th-TH", { day: "numeric", month: "long", year: "numeric" });
};

const toInputDate = (dateString: string) => {
  if (!dateString || dateString.startsWith("0001")) return "";
  return dateString.split("T")[0]; 
};

const getAutoDateStatus = (start: string, end: string) => {
  if (!start || !end) return "not_set";
  const now = new Date();
  const startDate = new Date(start);
  const endDate = new Date(end);
  endDate.setHours(23, 59, 59, 999);

  if (now >= startDate && now <= endDate) return "active";
  if (now < startDate) return "upcoming";
  return "expired";
};

// --- Service Object ---
const systemService = {
  // ดึงข้อมูลปีการศึกษาปัจจุบัน
  getCurrentConfig: async (): Promise<AcademicYear | null> => {
    if (USE_MOCK_DATA) {
        await new Promise(r => setTimeout(r, 500));
        return { academic_year_id: 1, year: 2568, semester: 1, start_date: new Date().toISOString(), end_date: new Date().toISOString(), is_current: true, is_open_register: true };
    }
    try {
        const res = await axios.get(`${API_BASE_URL}/system/current-term`);
        return res.data.data;
    } catch (error) {
        // ถ้า 404 แปลว่ายังไม่มีปีการศึกษา ให้ return null เพื่อเข้าโหมด Create
        if (axios.isAxiosError(error) && error.response?.status === 404) {
            return null;
        }
        throw error;
    }
  },

  // บันทึกข้อมูล (แยกกรณี Create และ Update)
  saveConfig: async (data: AcademicYear, isNew: boolean) => {
    const token = localStorage.getItem("token");
    const headers = { Authorization: `Bearer ${token}` };

    // เตรียม Payload สำหรับ Create/Update (DTO: Year, Semester, StartDate, EndDate)
    const payload = {
        year: Number(data.year),
        semester: Number(data.semester),
        start_date: new Date(data.start_date).toISOString(),
        end_date: new Date(data.end_date).toISOString(),
    };

    let targetID = data.academic_year_id;

    if (isNew) {
        // 1. Create New
        const res = await axios.post(`${API_BASE_URL}/academic-years/create`, payload, { headers });
        targetID = res.data.data.academic_year_id;
    } else {
        // 2. Update Existing
        await axios.put(`${API_BASE_URL}/academic-years/edit/${targetID}`, payload, { headers });
    }

    // 3. จัดการ Toggles (API แยก)
    // หมายเหตุ: ต้องทำหลังจาก Create เสร็จแล้วเพื่อให้มี ID
    // เช็คว่าต้อง Toggle ไหม (Logic แบบง่ายคือสั่ง Toggle ให้ตรงกับ State ที่ต้องการ)
    
    // เนื่องจาก Backend เป็น Toggle (สลับสถานะ) การยิงซ้ำอาจทำให้ค่าเพี้ยน 
    // ในที่นี้เราจะสมมติว่าถ้าสร้างใหม่ เราต้องมา Toggle ทีหลังถ้า user เลือก true
    // หรือถ้า Update เราอาจต้องเช็คค่าเดิมก่อน (แต่เพื่อความง่ายใน UI นี้ เราจะเน้น Create/Edit ข้อมูลหลักก่อน)
    
    if (isNew && data.is_current) {
         await axios.put(`${API_BASE_URL}/academic-years/toggle-current/${targetID}`, {}, { headers });
    }
    if (isNew && data.is_open_register) {
         await axios.put(`${API_BASE_URL}/academic-years/toggle-registration/${targetID}`, {}, { headers });
    }
    
    // กรณี Update ถ้าอยากจัดการ Toggle ต้องเปรียบเทียบกับค่าเดิม (ข้ามไปก่อนเพื่อความกระชับ)
    
    return true;
  },
  
  // Wrapper สำหรับเรียก Toggle API ตรงๆ เมื่อกด Switch
  toggleStatus: async (id: number, type: 'current' | 'register') => {
      if(id === 0) return; // ยังไม่ได้เซฟ
      const endpoint = type === 'current' ? 'toggle-current' : 'toggle-registration';
      await axios.put(`${API_BASE_URL}/academic-years/${endpoint}/${id}`);
  }
};

// ==========================================
// Main Component
// ==========================================

export default function SystemSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // State หลัก
  const [config, setConfig] = useState<AcademicYear>({
    academic_year_id: 0, // 0 = New
    year: new Date().getFullYear() + 543,
    semester: 1,
    start_date: "",
    end_date: "",
    is_current: false, // Default สำหรับตัวใหม่
    is_open_register: false,
  });

  const isNewRecord = config.academic_year_id === 0;
  const dateStatus = getAutoDateStatus(config.start_date, config.end_date);

  // --- Init ---
  useEffect(() => {
    const init = async () => {
      try {
        const data = await systemService.getCurrentConfig();
        if (data) {
            setConfig(data);
        } else {
            // ถ้าไม่มีข้อมูล (404) ให้เป็นโหมดสร้างใหม่
            setConfig(prev => ({ ...prev, is_current: true })); // Default ให้เป็น Current เลยถ้าสร้างตัวแรก
        }
      } catch (error) {
        console.error(error);
        Swal.fire({ icon: 'error', title: 'Error', text: 'ไม่สามารถเชื่อมต่อระบบได้' });
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  // --- Handlers ---
  const handleSave = async () => {
    // Validation
    if (!config.start_date || !config.end_date) {
        return Swal.fire({ icon: 'warning', title: 'ข้อมูลไม่ครบ', text: 'กรุณาระบุวันที่เริ่มต้นและสิ้นสุด' });
    }
    if (new Date(config.start_date) > new Date(config.end_date)) {
        return Swal.fire({ icon: 'error', title: 'วันที่ไม่ถูกต้อง', text: 'วันเริ่มต้นต้องมาก่อนวันสิ้นสุด' });
    }

    setSaving(true);
    try {
        await systemService.saveConfig(config, isNewRecord);
        
        Swal.fire({
            icon: 'success',
            title: isNewRecord ? 'สร้างปีการศึกษาใหม่สำเร็จ' : 'บันทึกการแก้ไขสำเร็จ',
            timer: 1500,
            showConfirmButton: false
        });
        
        // Reload ข้อมูลใหม่เพื่อให้ได้ ID และสถานะล่าสุด
        const refreshed = await systemService.getCurrentConfig();
        if (refreshed) setConfig(refreshed);

    } catch (error: any) {
        Swal.fire({ icon: 'error', title: 'บันทึกล้มเหลว', text: error.response?.data?.error || error.message });
    } finally {
        setSaving(false);
    }
  };

  const handleToggle = async (type: 'current' | 'register', value: boolean) => {
      // อัปเดต UI ทันที
      setConfig(prev => ({ ...prev, [type === 'current' ? 'is_current' : 'is_open_register']: value }));
      
      // ถ้าเป็น record ที่มีอยู่จริง ให้ยิง API เลย
      if (!isNewRecord) {
          try {
              await systemService.toggleStatus(config.academic_year_id, type);
          } catch (error) {
              console.error(error);
              // Revert UI ถ้า error (optional)
          }
      }
  };

  // --- Render ---
  if (loading) return <div className="p-10 text-center">Loading System Config...</div>;

  return (
    <div className="min-h-screen bg-[#F8F9FB] p-6 md:p-12 font-sans pb-32">
      <div className="max-w-[1400px] mx-auto space-y-10">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
            <div>
                <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">
                    {isNewRecord ? "สร้างปีการศึกษาใหม่" : "ตั้งค่าปีการศึกษาปัจจุบัน"}
                </h1>
                <p className="text-gray-500 mt-2 font-medium">
                    {isNewRecord ? "กำหนดรายละเอียดสำหรับภาคเรียนใหม่" : "แก้ไขรายละเอียดสถานะภาคเรียนและช่วงเวลารับสมัคร"}
                </p>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            
            {/* Left Column: Info & Active Toggle */}
            <div className="lg:col-span-1 space-y-6">
                
                {/* 1. Year/Semester Inputs (Editable now!) */}
                <div className="relative overflow-hidden rounded-[32px] p-8 text-white shadow-xl shadow-blue-200 transition-transform duration-500 hover:-translate-y-1">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700"></div>
                    {/* Decorative Blobs */}
                    <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-3xl -translate-y-10 translate-x-10"></div>
                    
                    <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-6">
                            <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-[10px] font-bold tracking-wider border border-white/10">
                                {isNewRecord ? "NEW SYSTEM SETUP" : "CURRENT SYSTEM"}
                            </span>
                        </div>
                        <div className="space-y-6">
                            <div>
                                <label className="text-blue-100 text-xs font-bold uppercase tracking-wider mb-2 block">ปีการศึกษา</label>
                                <input 
                                    type="number" 
                                    value={config.year}
                                    onChange={(e) => setConfig({...config, year: parseInt(e.target.value)})}
                                    className="w-full bg-white/20 border border-white/30 rounded-xl px-4 py-3 text-3xl font-black text-white placeholder-white/50 focus:outline-none focus:bg-white/30 transition-all"
                                />
                            </div>
                            <div className="h-px w-full bg-gradient-to-r from-white/30 to-transparent"></div>
                            <div>
                                <label className="text-blue-100 text-xs font-bold uppercase tracking-wider mb-2 block">ภาคเรียนที่</label>
                                <select 
                                    value={config.semester}
                                    onChange={(e) => setConfig({...config, semester: parseInt(e.target.value)})}
                                    className="w-full bg-white/20 border border-white/30 rounded-xl px-4 py-3 text-2xl font-bold text-white focus:outline-none focus:bg-white/30 transition-all cursor-pointer [&>option]:text-gray-900"
                                >
                                    <option value={1}>1</option>
                                    <option value={2}>2</option>
                                    <option value={3}>3 (ภาคฤดูร้อน)</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 2. Semester Toggle Card */}
                <div className="bg-white rounded-[24px] p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-4 mb-6">
                        <div className={`p-3 rounded-2xl transition-colors ${config.is_current ? 'bg-green-50 text-green-600' : 'bg-gray-50 text-gray-400'}`}>
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-800 text-lg">สถานะภาคเรียน</h3>
                            <p className="text-xs text-gray-400">สถานะปัจจุบัน (Current)</p>
                        </div>
                    </div>
                    <div className="flex items-center justify-between bg-gray-50 rounded-2xl p-4 border border-gray-200">
                        <span className={`text-sm font-bold transition-colors ${config.is_current ? 'text-green-600' : 'text-gray-500'}`}>
                            {config.is_current ? 'Active (ปัจจุบัน)' : 'Inactive'}
                        </span>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input 
                                type="checkbox" 
                                className="sr-only peer"
                                checked={config.is_current}
                                onChange={(e) => handleToggle('current', e.target.checked)}
                            />
                            <div className="w-14 h-8 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all after:shadow-sm peer-checked:bg-green-500 hover:bg-gray-300 transition-colors"></div>
                        </label>
                    </div>
                </div>
            </div>

            {/* Right Column: Registration Config */}
            <div className="lg:col-span-2 h-full flex flex-col">
                <div className="bg-white rounded-[32px] shadow-sm border border-gray-100 p-8 md:p-10 flex-1 flex flex-col justify-between hover:shadow-lg transition-shadow duration-300">
                    
                    <div>
                        <div className="flex items-center gap-4 mb-8 pb-6 border-b border-gray-100">
                            <div className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center shadow-sm">
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                            </div>
                            <div>
                                <h3 className="text-2xl font-bold text-gray-800">ตั้งค่าการรับสมัคร</h3>
                                <p className="text-sm text-gray-400 mt-1">กำหนดช่วงเวลาและสถานะการเปิดรับคำร้องจากนิสิต</p>
                            </div>
                        </div>

                        {/* Date Inputs */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
                            <div className="group">
                                <label className="block text-sm font-bold text-gray-600 mb-2 group-hover:text-green-600 transition-colors">วันเปิดรับสมัคร (Start Date)</label>
                                <input 
                                    type="date" 
                                    className="w-full bg-gray-50 hover:bg-white focus:bg-white border border-transparent focus:border-green-300 rounded-2xl px-5 py-4 text-gray-800 font-medium focus:ring-4 focus:ring-green-50 outline-none transition-all cursor-pointer placeholder-gray-400"
                                    value={toInputDate(config.start_date)}
                                    onChange={(e) => setConfig({ ...config, start_date: e.target.value })}
                                />
                                <div className="mt-3 flex items-center gap-2 px-1">
                                    <div className="h-2 w-2 rounded-full bg-green-500"></div>
                                    <p className="text-xs font-bold text-gray-400">{formatDateThai(config.start_date)}</p>
                                </div>
                            </div>
                            <div className="group">
                                <label className="block text-sm font-bold text-gray-600 mb-2 group-hover:text-red-600 transition-colors">วันปิดรับสมัคร (End Date)</label>
                                <input 
                                    type="date" 
                                    className="w-full bg-gray-50 hover:bg-white focus:bg-white border border-transparent focus:border-red-300 rounded-2xl px-5 py-4 text-gray-800 font-medium focus:ring-4 focus:ring-red-50 outline-none transition-all cursor-pointer placeholder-gray-400"
                                    value={toInputDate(config.end_date)}
                                    onChange={(e) => setConfig({ ...config, end_date: e.target.value })}
                                />
                                <div className="mt-3 flex items-center gap-2 px-1">
                                    <div className="h-2 w-2 rounded-full bg-red-500"></div>
                                    <p className="text-xs font-bold text-gray-400">{formatDateThai(config.end_date)}</p>
                                </div>
                            </div>
                        </div>

                        {/* Registration Toggle & Status */}
                        <div className="bg-gray-50/60 p-6 rounded-3xl border border-gray-100 flex flex-col md:flex-row gap-6 justify-between items-center">
                            <div className="flex-1">
                                <h4 className="font-bold text-gray-800 text-lg mb-2">สถานะระบบรับสมัคร</h4>
                                <div className="flex items-center gap-3">
                                    <span className={`text-[10px] uppercase font-bold px-3 py-1 rounded-lg border tracking-wide
                                        ${dateStatus === 'active' ? 'bg-green-100 text-green-700 border-green-200' :
                                        dateStatus === 'upcoming' ? 'bg-blue-50 text-blue-600 border-blue-200' :
                                        'bg-red-50 text-red-600 border-red-200'}`}>
                                        {dateStatus === 'active' ? '● Active Period' : dateStatus === 'upcoming' ? '● Upcoming' : '● Expired'}
                                    </span>
                                </div>
                            </div>

                            <div className="flex items-center gap-5 bg-white px-6 py-4 rounded-2xl border border-gray-200 shadow-sm hover:border-blue-200 transition-colors">
                                <span className={`text-sm font-black tracking-wide transition-colors ${config.is_open_register ? 'text-green-600' : 'text-gray-400'}`}>
                                    {config.is_open_register ? 'OPENING' : 'CLOSED'}
                                </span>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input 
                                        type="checkbox" 
                                        className="sr-only peer"
                                        checked={config.is_open_register}
                                        onChange={(e) => handleToggle('register', e.target.checked)}
                                    />
                                    <div className="w-14 h-8 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all after:shadow-sm peer-checked:bg-green-500 hover:bg-gray-300 transition-colors"></div>
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* Save Button */}
                    <div className="mt-10 pt-8 border-t border-gray-100">
                        <button 
                            onClick={handleSave}
                            disabled={saving}
                            className={`w-full py-4 rounded-2xl font-bold text-lg text-white shadow-xl shadow-gray-200 transition-all flex items-center justify-center gap-3 transform active:scale-[0.98] hover:-translate-y-1
                                ${saving ? 'bg-gray-400 cursor-wait' : 'bg-gray-900 hover:bg-black'}`}
                        >
                            {saving ? (
                                <>
                                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                    กำลังบันทึก...
                                </>
                            ) : (isNewRecord ? 'สร้างปีการศึกษาใหม่' : 'บันทึกการแก้ไข')}
                        </button>
                    </div>

                </div>
            </div>

        </div>
      </div>
    </div>
  );
}