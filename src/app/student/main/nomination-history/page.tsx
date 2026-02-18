"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import axios from "axios";
import Swal from "sweetalert2";

// ==========================================
// 0. Configuration
// ==========================================

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

// ==========================================
// 1. Interfaces & Types
// ==========================================

interface NominationHistory {
  form_id: number;
  academic_year: number;
  semester: number;
  award_type_id: number;
  award_type_name: string;
  nomination_status: string;
  status_code: 2 | 3 | 4; 
  created_at: string;
  completed_date: string;
  reject_reason?: string;
}

// Color Variant Configuration for Tailwind
const colorVariants: any = {
  orange: {
    base: "hover:border-orange-200 hover:shadow-orange-100",
    dateBox: "bg-orange-50 border-orange-100 group-hover:bg-orange-600 group-hover:border-orange-600",
    dateText: "text-orange-400 group-hover:text-orange-200",
    dateNum: "text-orange-700 group-hover:text-white",
    title: "group-hover:text-orange-600",
    chevron: "group-hover:bg-orange-600 group-hover:text-white",
    badge: "bg-orange-50 text-orange-700 border-orange-200"
  },
  purple: {
    base: "hover:border-purple-200 hover:shadow-purple-100",
    dateBox: "bg-purple-50 border-purple-100 group-hover:bg-purple-600 group-hover:border-purple-600",
    dateText: "text-purple-400 group-hover:text-purple-200",
    dateNum: "text-purple-700 group-hover:text-white",
    title: "group-hover:text-purple-600",
    chevron: "group-hover:bg-purple-600 group-hover:text-white",
    badge: "bg-purple-50 text-purple-700 border-purple-200"
  },
  blue: {
    base: "hover:border-blue-200 hover:shadow-blue-100",
    dateBox: "bg-blue-50 border-blue-100 group-hover:bg-blue-600 group-hover:border-blue-600",
    dateText: "text-blue-400 group-hover:text-blue-200",
    dateNum: "text-blue-700 group-hover:text-white",
    title: "group-hover:text-blue-600",
    chevron: "group-hover:bg-blue-600 group-hover:text-white",
    badge: "bg-blue-50 text-blue-700 border-blue-200"
  },
  green: {
    base: "hover:border-green-200 hover:shadow-green-100",
    dateBox: "bg-green-50 border-green-100 group-hover:bg-green-600 group-hover:border-green-600",
    dateText: "text-green-400 group-hover:text-green-200",
    dateNum: "text-green-700 group-hover:text-white",
    title: "group-hover:text-green-600",
    chevron: "group-hover:bg-green-600 group-hover:text-white",
    badge: "bg-green-50 text-green-700 border-green-200"
  },
  gray: {
    base: "hover:border-gray-200 hover:shadow-gray-100",
    dateBox: "bg-gray-50 border-gray-100 group-hover:bg-gray-600 group-hover:border-gray-600",
    dateText: "text-gray-400 group-hover:text-gray-200",
    dateNum: "text-gray-700 group-hover:text-white",
    title: "group-hover:text-gray-600",
    chevron: "group-hover:bg-gray-600 group-hover:text-white",
    badge: "bg-gray-50 text-gray-700 border-gray-200"
  }
};

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

const isZeroDate = (dateStr: string) => {
    return !dateStr || dateStr.startsWith("0001") || dateStr.includes("0001-01-01");
};

const mapBackendToHistory = (data: any[]): NominationHistory[] => {
    return data.map((item: any) => {
        const hasRejectReason = !!item.reject_reason;
        const isApproved = item.form_status_id === 8; 
        
        let statusCode: 2 | 3 | 4 = 4;
        let statusLabel = "อยู่ระหว่างพิจารณา";

        if (isApproved) {
            statusCode = 2;
            statusLabel = "ผ่านการคัดเลือก";
        } else if (hasRejectReason) {
            statusCode = 3;
            statusLabel = "ไม่ผ่านการคัดเลือก";
        }

        let completedDate = item.latest_update;
        if (isZeroDate(completedDate)) {
            completedDate = item.created_at;
        }

        return {
            form_id: item.form_id, 
            academic_year: item.academic_year || 0,
            semester: item.semester || 0,
            award_type_id: item.award_type_id || 0,
            award_type_name: item.award_type_name || "ไม่ระบุประเภท",
            nomination_status: statusLabel,
            status_code: statusCode,
            created_at: item.created_at,
            completed_date: completedDate, 
            reject_reason: item.reject_reason || "",
        };
    });
};

const nominationHistoryService = {
  getHistory: async (token: string | null): Promise<NominationHistory[]> => {
      try {
        const response = await axios.get(`/api/awards/my/submissions`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        const rawData = response.data?.data;
        if (!Array.isArray(rawData)) return [];

        return mapBackendToHistory(rawData);

      } catch (error: any) {
        if (error.response?.form_status_id === 404) return []; 
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

const getThemeColor = (item: NominationHistory): string => {
    const id = item.award_type_id;
    const name = item.award_type_name || "";
    
    if (id === 1 || name.includes("กิจกรรม")) return 'orange';
    if (id === 2 || name.includes("นวัตกรรม")) return 'purple';
    if (id === 3 || name.includes("ประพฤติ")) return 'blue';
    if (id === 4 || name.includes("อื่นๆ")) return 'green';
    
    return 'gray'; 
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
        const token = localStorage.getItem("token"); 
        if(!token) return;

        const data = await nominationHistoryService.getHistory(token);
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

  const availableYears = Array.from(new Set(historyList.map((i) => i.academic_year))).sort((a, b) => b - a);

  // --- Handlers ---
  const handleViewDetail = (item: NominationHistory) => {
    const theme = getThemeColor(item);
    // Use theme class from colorVariants
    const themeClasses = colorVariants[theme] || colorVariants.gray;
    
    // Icons for Swal (HTML String)
    const iconSuccess = `<svg class="w-16 h-16 text-green-500 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>`;
    const iconFail = `<svg class="w-16 h-16 text-red-500 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>`;
    const iconInfo = `<svg class="w-16 h-16 text-blue-500 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>`;
    const iconAlert = `<svg class="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>`;

    let mainIcon = iconInfo;
    let badgeClass = "bg-gray-50 text-gray-600 border-gray-200";

    if (item.status_code === 2) {
         mainIcon = iconSuccess;
         badgeClass = themeClasses.badge; // Use theme color for approved
    } else if (item.status_code === 3) {
         mainIcon = iconFail;
         badgeClass = "bg-red-50 text-red-700 border-red-200";
    } else {
         badgeClass = themeClasses.badge; // Use theme color for pending too (or gray)
    }

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
                        <span class="px-3 py-1 rounded-lg text-xs font-bold ${badgeClass} border">
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

  // --- Show Empty State (Redirect Card) when no history ---
  if (!loading && historyList.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6 font-sans">
        <div className="bg-white p-10 rounded-[32px] shadow-xl text-center max-w-lg w-full border border-gray-100 animate-fade-in-up">
          <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6 text-blue-500 shadow-sm">
            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
          </div>
          <h2 className="text-2xl font-extrabold text-gray-900 mb-3">ยังไม่มีประวัติการเสนอชื่อ</h2>
          <p className="text-gray-500 mb-8 leading-relaxed">
            คุณยังไม่ได้ทำการเสนอชื่อนิสิตดีเด่นในปีการศึกษานี้<br/>
            กรุณากรอกแบบฟอร์มเพื่อเริ่มต้นการเสนอชื่อ
          </p>
          <Link href="/student/main/student-nomination-form" className="w-full block py-4 bg-gray-900 text-white rounded-2xl font-bold hover:bg-black transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2 group">
            <span>ไปที่แบบฟอร์มเสนอชื่อ</span>
            <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50 p-6 md:p-10 font-sans pb-24">
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
          ) : (
            <div className="grid gap-4">
              {filteredList.map((item, index) => {
                const theme = getThemeColor(item);
                const themeClasses = colorVariants[theme] || colorVariants.gray;
                
                // Status Badge Color Logic
                let statusBadgeClass = "bg-gray-50 text-gray-600 border-gray-200";
                if (item.status_code === 2) statusBadgeClass = themeClasses.badge; 
                else if (item.status_code === 3) statusBadgeClass = "bg-red-50 text-red-700 border-red-200"; 
                else statusBadgeClass = themeClasses.badge;

                return (
                  <div
                    key={item.form_id || index}
                    onClick={() => handleViewDetail(item)}
                    className={`group relative bg-white rounded-2xl border border-gray-100 p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer animate-fade-in-up ${themeClasses.base}`}
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className="flex items-start gap-5 w-full">
                      {/* Date Box with Dynamic Color */}
                      <div className={`flex flex-col items-center justify-center w-16 h-16 rounded-2xl border shrink-0 transition-colors duration-300 ${themeClasses.dateBox}`}>
                        <span className={`text-[10px] font-bold uppercase ${themeClasses.dateText}`}>เทอม</span>
                        <span className={`text-2xl font-black leading-none ${themeClasses.dateNum}`}>{item.semester}</span>
                        <span className={`text-[10px] font-medium ${themeClasses.dateText}`}>{item.academic_year}</span>
                      </div>

                      <div className="flex-1">
                        {/* Title with Dynamic Hover Color */}
                        <h3 className={`text-lg font-bold text-gray-800 transition-colors line-clamp-1 ${themeClasses.title}`}>
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
                      {/* Status Badge */}
                      <span className={`px-3 py-1.5 rounded-lg text-xs font-bold border flex items-center gap-1.5 ${statusBadgeClass}`}>
                        {item.status_code === 2 && <span className="w-4 h-4"><Icons.CheckCircle/></span>}
                        {item.status_code === 3 && <span className="w-4 h-4"><Icons.XCircle/></span>}
                        {item.status_code === 4 && <span className="w-4 h-4"><Icons.Flag/></span>}
                        {item.nomination_status}
                      </span>
                      {/* Chevron with Dynamic Color */}
                      <div className={`w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 transition-all transform group-hover:rotate-90 shadow-sm group-hover:shadow-md ${themeClasses.chevron}`}>
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