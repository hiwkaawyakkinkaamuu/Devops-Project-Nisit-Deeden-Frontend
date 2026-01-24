"use client";

import { useState, useEffect } from "react";

interface SystemConfig {
  academic_year_id?: number;
  year: string; 
  semester: string;
  start_date: string;
  end_date: string;
  is_open_register: boolean;
}

export default function SystemSettingsPage() {
  const [savedConfig, setSavedConfig] = useState<SystemConfig>({
    year: "",
    semester: "",
    start_date: "",
    end_date: "",
    is_open_register: false,
  });

  // ค่าที่กำลังแก้ไขในฟอร์ม
  const [draftConfig, setDraftConfig] = useState<SystemConfig>({
    year: "",
    semester: "",
    start_date: "",
    end_date: "",
    is_open_register: false,
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Fetch Data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // [API Integration] GET
        /*
        const token = localStorage.getItem("accessToken");
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/system-config`, {
            method: "GET",
            headers: { 
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}` 
            }
        });

        if (!response.ok) throw new Error("Failed to fetch");
        const result = await response.json();
        // Map data from API to State
        setSavedConfig(result.data);
        setDraftConfig(result.data);
        setLoading(false);
        return; 
        */

        // MOCKUP DATA
        const initialData: SystemConfig = {
          academic_year_id: 1,
          year: "2568",
          semester: "1",
          start_date: "2024-01-10",
          end_date: "2024-02-28",
          is_open_register: true,
        };
        setSavedConfig(initialData); 
        setDraftConfig(initialData); 
        setLoading(false);

      } catch (error) {
        console.error("Fetch error:", error);
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // คำนวณสถานะระบบ
  const getSystemStatus = () => {
    // ถ้า is_open_register เป็น false คือปิดระบบทันที
    if (!savedConfig.is_open_register) return "closed_manual";
    
    if (!savedConfig.start_date || !savedConfig.end_date) return "pending";

    const now = new Date();
    const start = new Date(savedConfig.start_date);
    const end = new Date(savedConfig.end_date);
    end.setHours(23, 59, 59, 999);

    if (now >= start && now <= end) return "open";
    if (now < start) return "upcoming";
    return "closed";
  };

  const status = getSystemStatus();

  // Logic Save
  const handleSave = async () => {
    // Validate
    if (!draftConfig.year || !draftConfig.semester || !draftConfig.start_date || !draftConfig.end_date) {
      alert("กรุณากรอกข้อมูลให้ครบถ้วน");
      return;
    }
    if (new Date(draftConfig.start_date) > new Date(draftConfig.end_date)) {
      alert("วันเริ่มต้นต้องมาก่อนวันสิ้นสุด");
      return;
    }

    setSaving(true);

    try {
        // [API Integration] PUT
        /*
        const token = localStorage.getItem("accessToken");
        // แปลงข้อมูลให้ตรง Type ของ Go ก่อนส่ง
        const payload = {
            ...draftConfig,
            year: parseInt(draftConfig.year),
            semester: parseInt(draftConfig.semester),
            // start_date, end_date ส่งเป็น string ตาม format ที่ Go รับได้ (RFC3339 หรือ YYYY-MM-DD)
        };

        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/system-config`, {
            method: "PUT",
            headers: { 
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}` 
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) throw new Error("Failed to update");
        */
        
        setSavedConfig(draftConfig);
        alert("บันทึกการตั้งค่าเรียบร้อยแล้ว");

    } catch (error) {
        console.error("Save error:", error);
        alert("เกิดข้อผิดพลาดในการบันทึก");
    } finally {
        setSaving(false);
    }
  };

  const formatDateThai = (dateString: string) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleDateString("th-TH", { day: "numeric", month: "long", year: "numeric" });
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] p-8 font-sans">
      <div className="max-w-[1600px] mx-auto"> 
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 tracking-tight">ตั้งค่าปีการศึกษา</h1>
          <p className="text-sm text-gray-500 mt-2">ตั้งค่าปีการศึกษาและช่วงเวลาเปิดรับสมัครเข้าใช้งานระบบ</p>
        </div>

        {loading ? (
          <div className="p-20 text-center text-gray-400 animate-pulse bg-white rounded-3xl shadow-sm">
            กำลังโหลดข้อมูลการตั้งค่า...
          </div>
        ) : (
          <div className="grid grid-cols-12 gap-8 items-stretch">
            
            {/* Left Column: Forms (8/12) */}
            <div className="col-span-12 lg:col-span-8 flex flex-col gap-8">
              
              {/* Card 1: ปีการศึกษา & ภาคเรียน */}
              <div className="bg-white rounded-3xl shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)] border border-gray-100 overflow-hidden">
                  <div className="bg-blue-50/40 px-8 py-5 border-b border-blue-100/50 flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600 shadow-sm ring-4 ring-blue-50">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                      </div>
                      <div>
                          <h2 className="text-lg font-bold text-gray-800">ปีการศึกษาและภาคเรียน</h2>
                          <p className="text-xs text-gray-500">กำหนดปี พ.ศ. และเทอมปัจจุบัน</p>
                      </div>
                  </div>
                  
                  <div className="p-8">
                      <div className="flex flex-col md:flex-row items-center gap-8">
                          {/* Input: year */}
                          <div className="flex-1 w-full">
                              <label className="block text-sm font-bold text-gray-700 mb-3 uppercase tracking-wider">ปีการศึกษา (Year)</label>
                              <div className="relative">
                                <input 
                                    type="number" 
                                    className="w-full text-4xl font-extrabold tracking-[0.2em] text-blue-600 border-2 border-gray-200 bg-gray-50 rounded-2xl px-6 py-4 text-center focus:ring-4 focus:ring-blue-100 focus:border-blue-500 focus:bg-white outline-none transition-all placeholder:text-gray-300 shadow-inner"
                                    placeholder="25XX"
                                    maxLength={4}
                                    value={draftConfig.year}
                                    onChange={(e) => setDraftConfig({ ...draftConfig, year: e.target.value })}
                                />
                              </div>
                          </div>

                          {/* Input: semester (เพิ่มมาใหม่) */}
                          <div className="w-full md:w-48">
                              <label className="block text-sm font-bold text-gray-700 mb-3 uppercase tracking-wider">ภาคเรียน (Semester)</label>
                              <div className="relative">
                                <select 
                                    className="w-full text-3xl font-bold text-blue-600 border-2 border-gray-200 bg-gray-50 rounded-2xl px-6 py-4 text-center focus:ring-4 focus:ring-blue-100 focus:border-blue-500 focus:bg-white outline-none transition-all cursor-pointer appearance-none"
                                    value={draftConfig.semester}
                                    onChange={(e) => setDraftConfig({ ...draftConfig, semester: e.target.value })}
                                >
                                    <option value="1">1</option>
                                    <option value="2">2</option>
                                    <option value="3">3 (Summer)</option>
                                </select>
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                                </div>
                              </div>
                          </div>
                      </div>
                      
                      <div className="mt-6 bg-yellow-50 border border-yellow-100 p-5 rounded-2xl flex gap-4 items-start shadow-sm">
                          <div className="p-2 bg-yellow-100 text-yellow-600 rounded-lg shrink-0">
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
                          </div>
                          <div className="text-sm text-yellow-800/80 leading-relaxed">
                              <p className="font-bold text-yellow-900 mb-1">ข้อควรระวัง</p>
                              การเปลี่ยนปีการศึกษาหรือภาคเรียน จะทำให้ระบบเริ่มเก็บข้อมูลชุดใหม่ กรุณาตรวจสอบให้แน่ใจก่อนบันทึก
                          </div>
                      </div>
                  </div>
              </div>

              {/* Card 2: ช่วงเวลา Timeline */}
              <div className="bg-white rounded-3xl shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)] border border-gray-100 overflow-hidden flex-1">
                  <div className="bg-green-50/40 px-8 py-5 border-b border-green-100/50 flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center text-green-600 shadow-sm ring-4 ring-green-50">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      </div>
                      <div>
                          <h2 className="text-lg font-bold text-gray-800">กำหนดช่วงเวลา</h2>
                          <p className="text-xs text-gray-500">ช่วงเวลาที่อนุญาตให้นิสิตส่งข้อมูล</p>
                      </div>
                  </div>
                  
                  <div className="p-8 space-y-8">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          {/* Input: start_date */}
                          <div>
                              <label className="block text-sm font-bold text-gray-700 mb-3">วันเปิดระบบ (Start Date)</label>
                              <div className="relative group">
                                <input 
                                    type="date" 
                                    className="w-full border border-gray-200 bg-gray-50 rounded-xl px-4 py-3 text-base focus:ring-4 focus:ring-green-100 focus:border-green-500 focus:bg-white outline-none transition-all cursor-pointer group-hover:border-green-300 text-gray-700 font-medium"
                                    value={draftConfig.start_date}
                                    onChange={(e) => setDraftConfig({ ...draftConfig, start_date: e.target.value })}
                                />
                              </div>
                              <p className="text-sm text-green-600 mt-2 ml-1 font-medium bg-green-50 inline-block px-2 py-1 rounded-md">
                                  {formatDateThai(draftConfig.start_date)}
                              </p>
                          </div>
                          {/* Input: end_date */}
                          <div>
                              <label className="block text-sm font-bold text-gray-700 mb-3">วันปิดระบบ (End Date)</label>
                              <div className="relative group">
                                <input 
                                    type="date" 
                                    className="w-full border border-gray-200 bg-gray-50 rounded-xl px-4 py-3 text-base focus:ring-4 focus:ring-red-100 focus:border-red-500 focus:bg-white outline-none transition-all cursor-pointer group-hover:border-red-300 text-gray-700 font-medium"
                                    value={draftConfig.end_date}
                                    onChange={(e) => setDraftConfig({ ...draftConfig, end_date: e.target.value })}
                                />
                              </div>
                              <p className="text-sm text-red-600 mt-2 ml-1 font-medium bg-red-50 inline-block px-2 py-1 rounded-md">
                                  {formatDateThai(draftConfig.end_date)}
                              </p>
                          </div>
                      </div>

                      {/* Manual Toggle: is_open_register */}
                      <div className="bg-gray-50 rounded-2xl p-5 flex items-center justify-between border border-gray-200">
                          <div className="flex items-center gap-4">
                              <div className={`p-3 rounded-xl ${draftConfig.is_open_register ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"/></svg>
                              </div>
                              <div>
                                <h3 className="font-bold text-gray-800">สถานะการเปิดระบบ (System Status)</h3>
                                <p className="text-xs text-gray-500">
                                    {draftConfig.is_open_register ? 'ระบบเปิดใช้งานอยู่ (Active)' : 'ระบบถูกปิดการใช้งาน (Inactive)'}
                                </p>
                              </div>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                              <input 
                                  type="checkbox" 
                                  className="sr-only peer" 
                                  checked={draftConfig.is_open_register}
                                  onChange={(e) => setDraftConfig({ ...draftConfig, is_open_register: e.target.checked })}
                              />
                              <div className="w-14 h-8 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-green-500"></div>
                          </label>
                      </div>
                  </div>
              </div>

            </div>

            {/* Right Column: Status & Save (4/12) */}
            <div className="col-span-12 lg:col-span-4 flex flex-col gap-6 sticky top-0 h-full">
              
              <div className="flex flex-col h-full gap-6">
                
                {/* Status Card */}
                <div className="bg-white rounded-3xl shadow-lg shadow-gray-100 border border-gray-200 p-8 flex flex-col items-center justify-center text-center flex-1 relative overflow-hidden min-h-[400px]">
                    <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100"></div>
                    
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-10">สถานะระบบปัจจุบัน</h3>
                    
                    <div className="relative mb-8">
                      <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 rounded-full opacity-20 blur-xl ${status === 'open' ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                      
                      <div className={`w-32 h-32 rounded-full flex items-center justify-center shadow-xl relative z-10 transition-all duration-500
                          ${status === 'open' ? 'bg-green-500 text-white shadow-green-200' : 
                            status === 'upcoming' ? 'bg-blue-500 text-white shadow-blue-200' : 
                            'bg-white border-2 border-red-100 text-red-500'}`}>
                          {status === 'open' && <svg className="w-14 h-14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>}
                          {status === 'upcoming' && <svg className="w-14 h-14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                          {(status === 'closed' || status === 'closed_manual') && <svg className="w-14 h-14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>}
                      </div>
                    </div>

                    <h2 className={`text-4xl font-extrabold mb-3 ${status === 'open' ? 'text-green-600' : status === 'upcoming' ? 'text-blue-600' : 'text-red-600'}`}>
                        {status === 'open' ? 'เปิดรับสมัคร' : status === 'upcoming' ? 'รอเปิดระบบ' : 'ปิดรับสมัคร'}
                    </h2>
                    
                    <p className="text-sm text-gray-400 font-medium px-4 leading-relaxed max-w-xs mx-auto">
                        {status === 'open' && 'ระบบเปิดใช้งานปกติ นิสิตสามารถส่งข้อมูลได้'}
                        {status === 'upcoming' && 'ยังไม่ถึงกำหนดวันเริ่มเปิดระบบ'}
                        {status === 'closed' && 'ไม่อยู่ในช่วงเวลาที่กำหนด'}
                        {status === 'closed_manual' && 'ถูกปิดโดยผู้ดูแลระบบ (Manual Inactive)'}
                    </p>
                </div>

                {/* Save Button */}
                <button 
                    onClick={handleSave}
                    disabled={saving}
                    className={`w-full py-5 rounded-2xl font-bold text-lg text-white shadow-xl shadow-blue-200 transition-all flex items-center justify-center gap-3 transform active:scale-[0.98]
                        ${saving ? 'bg-gray-400 cursor-wait' : 'bg-blue-600 hover:bg-blue-700 hover:shadow-blue-300'}`}
                >
                    {saving ? (
                        <span className="flex items-center gap-2">
                          <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                          กำลังบันทึก...
                        </span>
                    ) : (
                        <>
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>
                            บันทึกการตั้งค่า
                        </>
                    )}
                </button>
                
              </div>

            </div>

          </div>
        )}
      </div>
    </div>
  );
}