"use client";

import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import Swal from "sweetalert2";

// ==========================================
// 0. Configuration

// ==========================================
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "/api";

// ==========================================
// 1. Interfaces & Types
// ==========================================

interface NominationHistory {
  form_id: number;
  academic_year: number;
  semester: number;
  award_type_name: string;
  nomination_status: string;
  status_code: 2 | 3 | 4; // 2=Approved, 3=Rejected, 4=Pending/Other
  created_at: string;
  completed_date: string;
  reject_reason?: string;
}

// ==========================================
// 2. Icons Components (SVG)
// ==========================================

const Icons = {
  Document: () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
  ),
  CheckCircle: () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
  ),
  XCircle: () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
  ),
  Calendar: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
  ),
  Flag: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 21v-8a2 2 0 01-2-8h6l2 2 6 0a2 2 0 002 2v8a2 2 0 00-2 2h-2l-2-2H5a2 2 0 01-2-2z" /></svg>
  ),
  ChevronRight: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
  ),
  EmptyBox: () => (
    <svg className="w-10 h-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" /></svg>
  ),
  Alert: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
  )
};

// ==========================================
// 3. Service Layer (Axios)
// ==========================================

// Helper: แปลงข้อมูลจาก Backend เป็นรูปแบบที่หน้าบ้านต้องการ
// StudentHistoryPage.tsx

const mapBackendToHistory = (data: any[]): NominationHistory[] => {
    return data.map((item: any) => {
        // 1. เช็คสถานะ:
        // หมายเหตุ: DTO ของ Backend ปัจจุบันยังไม่ได้ส่ง field reject_reason มาให้ (ต้องไปแก้ Backend เพิ่ม)
        // แต่ถ้าแก้แล้ว หรือใช้ form_status_id ในการเช็ค ให้ใช้ logic นี้:
        const hasRejectReason = !!item.reject_reason; // ถ้า Backend ส่งมา
        
        // สมมติว่าสถานะ 8 = อนุมัติ (ปรับเลขตาม Database ของคุณ)
        const isApproved = item.form_status_id === 8; 
        
        // ตีความสถานะสำหรับ Frontend (4 = Pending ใน Interface ของคุณ)
        let statusCode: 2 | 3 | 4 = 4;
        let statusLabel = "อยู่ระหว่างพิจารณา";

        if (isApproved) {
            statusCode = 2;
            statusLabel = "ผ่านการคัดเลือก";
        } else if (hasRejectReason) {
            statusCode = 3;
            statusLabel = "ไม่ผ่านการคัดเลือก";
        }

        return {
            // [แก้จุดที่ 1] Backend ส่งมาเป็น form_id
            form_id: item.form_id, 
            
            academic_year: item.academic_year || 0,
            semester: item.semester || 0,
            
            // [แก้จุดที่ 2] Backend ส่ง award_type_name มาเป็น string เลย (ไม่ต้อง .name)
            award_type_name: item.award_type_name || "ไม่ระบุประเภท",
            
            nomination_status: statusLabel,
            status_code: statusCode,
            
            created_at: item.created_at,
            
            // [แก้จุดที่ 3] Backend ใช้ latest_update ไม่ใช่ updated_at
            completed_date: item.latest_update || item.created_at, 
            
            reject_reason: item.reject_reason || "",
        };
    });
};

const nominationHistoryService = {
  getHistory: async (token: string | null): Promise<NominationHistory[]> => {
      try {
        // ยิงไปที่ Endpoint เดียวกัน แต่ดึงทั้งหมดมาแสดง
        const response = await axios.get(`${API_BASE_URL}/awards/my/submissions`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        const rawData = response.data?.data;
        if (!Array.isArray(rawData)) return [];

        return mapBackendToHistory(rawData);

      } catch (error: any) {
        if (error.response?.form_status_id === 404) return []; // ไม่เคยส่ง = ว่าง
        console.error("API Error:", error);
        return [];
      }
  },
};

// ==========================================
// 4. Helper Constants & Functions
// ==========================================

const formatDate = (isoDate: string) => {
  if (!isoDate) return "-";
  const date = new Date(isoDate);
  return date.toLocaleDateString("th-TH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const getStatusConfig = (code: number) => {
  switch (code) {
    case 2: // Approved
      return {
        label: "ผ่านการคัดเลือก",
        color: "bg-green-50 text-green-700 border-green-200",
        icon: <Icons.CheckCircle />,
      };
    case 3: // Rejected
      return {
        label: "ไม่ผ่านการคัดเลือก",
        color: "bg-red-50 text-red-700 border-red-200",
        icon: <Icons.XCircle />,
      };
    default: // Pending / Other
      return {
        label: "อยู่ระหว่างพิจารณา",
        color: "bg-blue-50 text-blue-600 border-blue-200", // เปลี่ยนสี Pending เป็นน้ำเงินให้ดู active
        icon: <Icons.Flag />, // ใช้รูปธงสื่อถึงกำลังดำเนินงาน
      };
  }
};

// ==========================================
// 5. Sub-Components
// ==========================================

const StatCard = ({ title, count, colorClass, icon }: any) => (
  <div className={`p-6 rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 group`}>
    <div className="flex justify-between items-start">
      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-gray-400 group-hover:text-blue-500 transition-colors">
          {title}
        </p>
        <p className={`text-4xl font-black mt-2 ${colorClass}`}>{count}</p>
      </div>
      <div className={`w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center group-hover:scale-110 transition-transform ${colorClass}`}>
        {icon}
      </div>
    </div>
  </div>
);

const HistorySkeleton = () => (
  <div className="space-y-4">
    {[1, 2, 3].map((i) => (
      <div key={i} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm animate-pulse flex justify-between items-center">
        <div className="flex gap-4 items-center w-full">
          <div className="h-16 w-16 bg-gray-200 rounded-xl"></div>
          <div className="space-y-3 flex-1">
            <div className="h-4 bg-gray-200 rounded w-1/3"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
          <div className="h-10 bg-gray-200 rounded w-24"></div>
        </div>
      </div>
    ))}
  </div>
);

// ==========================================
// 6. Main Component
// ==========================================

export default function StudentHistoryPage() {
  const [loading, setLoading] = useState(true);
  const [historyList, setHistoryList] = useState<NominationHistory[]>([]);
  const [filterYear, setFilterYear] = useState<string>("");

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("token"); // ใช้ key 'token' ให้ตรงกับระบบ
        if(!token) return;

        const data = await nominationHistoryService.getHistory(token);
        // เรียงลำดับจากล่าสุดไปเก่าสุด
        data.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        
        setHistoryList(data);
      } catch (error) {
        Swal.fire({ icon: "error", title: "เกิดข้อผิดพลาด", text: "ไม่สามารถดึงข้อมูลประวัติได้" });
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredList = useMemo(() => {
    if (!filterYear) return historyList;
    return historyList.filter((item) => item.academic_year.toString() === filterYear);
  }, [historyList, filterYear]);

  const stats = useMemo(() => {
    return {
      total: historyList.length,
      approved: historyList.filter((i) => i.status_code === 2).length,
      rejected: historyList.filter((i) => i.status_code === 3).length,
    };
  }, [historyList]);

  // ดึงปีการศึกษาที่มีอยู่มาทำตัวเลือก Filter
  const availableYears = Array.from(new Set(historyList.map((i) => i.academic_year))).sort((a, b) => b - a);

  // --- Handlers (SweetAlert with SVG Icons) ---
  const handleViewDetail = (item: NominationHistory) => {
    const statusConfig = getStatusConfig(item.status_code);
    
    // SVG strings for SweetAlert
    const iconSuccess = `<svg class="w-16 h-16 text-green-500 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>`;
    const iconFail = `<svg class="w-16 h-16 text-red-500 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>`;
    const iconInfo = `<svg class="w-16 h-16 text-blue-500 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>`;
    const iconAlert = `<svg class="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>`;

    // เลือก Icon ตามสถานะ
    let mainIcon = iconInfo;
    if (item.status_code === 2) mainIcon = iconSuccess;
    else if (item.status_code === 3) mainIcon = iconFail;

    Swal.fire({
      html: `
            <div class="text-left font-sans">
                <div class="text-center mb-6">
                    ${mainIcon}
                    <h3 class="text-xl font-bold text-gray-800 mt-4 leading-tight">${item.award_type_name}</h3>
                    <p class="text-sm text-gray-500 mt-1">REF: #${item.form_id}</p>
                </div>
                
                <div class="bg-gray-50 p-6 rounded-2xl border border-gray-100 text-sm space-y-4">
                    <div class="flex justify-between items-center border-b border-gray-200 pb-3">
                        <span class="text-gray-500">ปีการศึกษา</span>
                        <span class="font-bold text-gray-800 text-base">${item.academic_year} <span class="text-gray-400 text-xs font-normal">/ เทอม ${item.semester}</span></span>
                    </div>
                    <div class="flex justify-between items-center">
                        <span class="text-gray-500">วันที่เสนอ</span>
                        <span class="font-medium text-gray-800">${formatDate(item.created_at)}</span>
                    </div>
                    <div class="flex justify-between items-center">
                        <span class="text-gray-500">อัปเดตล่าสุด</span>
                        <span class="font-medium text-gray-800">${formatDate(item.completed_date)}</span>
                    </div>
                    
                    <div class="flex justify-between items-center pt-2">
                        <span class="text-gray-500">สถานะ</span>
                        <span class="px-3 py-1 rounded-lg text-xs font-bold ${statusConfig.color} border">
                            ${item.nomination_status}
                        </span>
                    </div>

                    ${item.reject_reason ? `
                    <div class="mt-4 p-4 bg-red-50 border border-red-100 rounded-xl">
                        <span class="text-xs font-bold text-red-600 block mb-1">
                            ${iconAlert} เหตุผลที่ไม่ผ่าน
                        </span>
                        <span class="text-red-800 text-xs leading-relaxed">${item.reject_reason}</span>
                    </div>` : ""}
                </div>
            </div>
          `,
      showConfirmButton: false,
      showCloseButton: true,
      customClass: {
        popup: "animated-popup rounded-[24px] p-0 overflow-hidden",
        htmlContainer: "m-0 p-6",
        closeButton: "focus:outline-none"
      },
    });
  };

  return (
    <div className="min-h-screen bg-gray-50/50 p-6 md:p-10 font-sans pb-24">
      <style jsx global>{`
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in-up { animation: fadeInUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
      `}</style>

      <div className="max-w-[1200px] mx-auto space-y-8 animate-fade-in-up">
        {/* 1. Header & Stats */}
        <div>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
            <div>
              <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-gray-700 to-gray-900 tracking-tight">
                ประวัติคำร้อง
              </h1>
              <p className="text-gray-500 mt-2 font-medium">รายการเสนอชื่อย้อนหลังทั้งหมดของคุณ</p>
            </div>

            <div className="relative group flex items-center gap-2">
              <div className="relative">
                <select
                    value={filterYear}
                    onChange={(e) => setFilterYear(e.target.value)}
                    disabled={availableYears.length === 0}
                    className="bg-white border border-gray-200 text-gray-700 text-sm rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-400 block p-3 pr-10 shadow-sm outline-none cursor-pointer hover:border-blue-300 transition-all font-medium appearance-none min-w-[160px] disabled:opacity-50"
                >
                    <option value="">ทุกปีการศึกษา</option>
                    {availableYears.map((year) => (
                    <option key={year} value={year}>
                        ปีการศึกษา {year}
                    </option>
                    ))}
                </select>
                <div className="absolute right-3 top-3.5 pointer-events-none text-gray-400">
                    <Icons.ChevronRight />
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <StatCard 
                title="คำร้องทั้งหมด" 
                count={stats.total} 
                colorClass="text-gray-800" 
                icon={<Icons.Document />} 
            />
            <StatCard 
                title="ผ่านการคัดเลือก" 
                count={stats.approved} 
                colorClass="text-green-600" 
                icon={<Icons.CheckCircle />} 
            />
            <StatCard 
                title="ไม่ผ่านการคัดเลือก" 
                count={stats.rejected} 
                colorClass="text-red-600" 
                icon={<Icons.XCircle />} 
            />
          </div>
        </div>

        {/* 2. History List */}
        <div className="bg-white/80 backdrop-blur-md rounded-[32px] shadow-lg border border-white/60 p-8 min-h-[400px]">
          <h2 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
            <span className="w-1.5 h-6 bg-blue-600 rounded-full"></span>
            รายการย้อนหลัง
          </h2>

          {loading ? (
            <HistorySkeleton />
          ) : filteredList.length === 0 ? (
            <div className="text-center py-20 text-gray-400">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                 <Icons.EmptyBox />
              </div>
              <p className="text-lg font-medium">ไม่พบประวัติคำร้อง</p>
              <p className="text-sm opacity-70">คุณยังไม่มีการเสนอชื่อในปีที่เลือก</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredList.map((item, index) => {
                const status = getStatusConfig(item.status_code);
                return (
                  <div
                    key={item.form_id || index}
                    onClick={() => handleViewDetail(item)}
                    className="group relative bg-white rounded-2xl border border-gray-100 p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 hover:shadow-xl hover:-translate-y-1 hover:border-blue-100 transition-all duration-300 cursor-pointer animate-fade-in-up"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className="flex items-start gap-5 w-full">
                      <div className="flex flex-col items-center justify-center w-16 h-16 bg-blue-50 rounded-2xl border border-blue-100 shrink-0 group-hover:bg-blue-600 group-hover:border-blue-600 transition-colors duration-300">
                        <span className="text-[10px] text-blue-400 font-bold uppercase group-hover:text-blue-200">เทอม</span>
                        <span className="text-2xl font-black text-blue-700 leading-none group-hover:text-white">{item.semester}</span>
                        <span className="text-[10px] text-blue-400 font-medium group-hover:text-blue-200">{item.academic_year}</span>
                      </div>

                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-gray-800 group-hover:text-blue-600 transition-colors line-clamp-1">
                          {item.award_type_name}
                        </h3>
                        <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-gray-500">
                          <span className="flex items-center gap-1.5 bg-gray-50 px-2.5 py-1 rounded-md text-xs border border-gray-100">
                            <Icons.Calendar />
                            เสนอ: {formatDate(item.created_at)}
                          </span>
                          <span className="text-gray-300">|</span>
                          <span className="flex items-center gap-1.5 bg-gray-50 px-2.5 py-1 rounded-md text-xs border border-gray-100">
                             <Icons.Flag />
                            อัปเดต: {formatDate(item.completed_date)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end pl-20 md:pl-0">
                      <span className={`px-3 py-1.5 rounded-lg text-xs font-bold border flex items-center gap-1.5 ${status.color}`}>
                        {item.status_code === 2 && <span className="w-4 h-4"><Icons.CheckCircle/></span>}
                        {item.status_code === 3 && <span className="w-4 h-4"><Icons.XCircle/></span>}
                        {item.status_code === 4 && <span className="w-4 h-4"><Icons.Flag/></span>}
                        {item.nomination_status}
                      </span>
                      <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-blue-600 group-hover:text-white transition-all transform group-hover:rotate-90 shadow-sm group-hover:shadow-md">
                        <Icons.ChevronRight />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}