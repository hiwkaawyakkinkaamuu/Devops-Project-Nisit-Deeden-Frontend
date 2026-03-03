"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import NominationDetailModal from "@/components/Nomination-detail-modal";
import { motion, AnimatePresence, Variants } from "framer-motion";
import {
  Search, Calendar, GraduationCap, CheckCircle2,
  Eye, Award, Building2, ChevronLeft, ChevronRight, 
  ArrowUpDown, ArrowUp, ArrowDown, ChevronDown, Check,
  Sparkles, FileSignature, History
} from "lucide-react";
import { api } from "@/lib/axios";

// ==========================================
// 0. Configuration & Types
// ==========================================
const USE_MOCK_DATA = false;
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api";

export interface FileResponse {
  file_dir_id: number;
  file_name?: string;
  file_type: string;
  file_size: number;
  file_path: string;
}

export interface Nomination {
  form_id: number;
  user_id: number;
  student_firstname: string;
  student_lastname: string;
  student_email: string;
  student_number: string;
  faculty_id: number;
  department_id: number;
  campus_id: number;
  academic_year: number;
  semester: number;
  form_status: number;
  award_type: string;
  award_type_name?: string;
  created_at: string;
  latest_update: string;
  student_year: number;
  advisor_name: string;
  student_phone_number: string;
  student_address: string;
  gpa: number;
  student_date_of_birth: string;
  org_name: string;
  org_type: string;
  org_location: string;
  org_phone_number: string;
  form_detail: string | any;
  reject_reason: string;
  files?: FileResponse[];
  is_organization_nominated?: boolean; 
  organization_name?: string;
}

const ITEMS_PER_PAGE = 8; 

const modalVariants: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  show: { opacity: 1, scale: 1, transition: { type: "spring", duration: 0.3 } },
  exit: { opacity: 0, scale: 0.95, transition: { duration: 0.2 } }
};

// 🌟 Custom Dropdown Component (Theme Indigo) 🌟
const CustomSelect = ({ value, onChange, options, icon: Icon, placeholder, className = "" }: any) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
  
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);
  
    const selectedLabel = options.find((o: any) => String(o.v) === String(value))?.l || placeholder;
  
    return (
        <div className={`relative w-full ${className}`} style={{ zIndex: isOpen ? 40 : 1 }} ref={dropdownRef}>
            <div 
                onClick={() => setIsOpen(!isOpen)}
                className={`flex items-center justify-between w-full pl-11 pr-4 py-3.5 bg-white/80 backdrop-blur-sm border rounded-2xl cursor-pointer transition-all duration-300 shadow-sm
                    ${isOpen ? 'border-indigo-400 ring-4 ring-indigo-500/10' : 'border-slate-200/80 hover:border-slate-300'}
                `}
            >
                <Icon className={`w-4 h-4 absolute left-4 top-3.5 transition-colors ${isOpen ? 'text-indigo-500' : 'text-slate-400'}`} />
                <span className={`text-sm font-medium truncate ${!value || value === "all" ? 'text-slate-500' : 'text-slate-800'}`}>
                    {selectedLabel}
                </span>
                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-300 ${isOpen ? 'rotate-180 text-indigo-500' : ''}`} />
            </div>
  
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className="absolute top-[calc(100%+8px)] left-0 w-full bg-white/95 backdrop-blur-xl border border-slate-100 rounded-2xl shadow-2xl py-2 max-h-60 overflow-y-auto z-[50] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-slate-200 hover:[&::-webkit-scrollbar-thumb]:bg-slate-300"
                    >
                        {options.map((o: any, i: number) => (
                            <div
                                key={i}
                                onClick={() => { onChange(String(o.v)); setIsOpen(false); }}
                                className={`px-4 py-3 cursor-pointer transition-all duration-200 text-sm font-medium flex items-center justify-between
                                    ${String(value) === String(o.v) ? 'bg-indigo-50 text-indigo-700 font-bold' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}
                                `}
                            >
                                {o.l}
                                {String(value) === String(o.v) && <CheckCircle2 size={16} className="text-indigo-500" />}
                            </div>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

// ==========================================
// 1. Main Component
// ==========================================
export default function ChairmanHistoryPage() {
  
  // --- States ---
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<Nomination[]>([]);
  const [awardTypes, setAwardTypes] = useState<string[]>([]);

  // Modals
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [modalData, setModalData] = useState<Nomination | null>(null);

  // Filters & Sort
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterYear, setFilterYear] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState<{ key: keyof Nomination | 'award_type_name' | null, direction: 'asc' | 'desc' | null }>({ key: 'latest_update', direction: 'desc' });

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm), 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, filterCategory, filterYear]);

  const formatDateTh = (isoDate: string) => {
    if (!isoDate) return "-";
    const date = new Date(isoDate);
    return date.toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: '2-digit', hour: '2-digit', minute:'2-digit' });
  };

  // ==========================================
  // 2. Data Fetching
  // ==========================================
  useEffect(() => {
    let isMounted = true;
    
    const fetchAwardTypes = async () => {
      try {
        const response = await api.get(`${API_BASE_URL}/awards/types`);
        const types = response.data?.data || response.data || [];
        if (isMounted) setAwardTypes(types);
      } catch (error) {
        console.error("Error fetching award types:", error);
      }
    };

    const fetchData = async () => {
      setLoading(true);
      try {
        if (USE_MOCK_DATA) return;

        const params: Record<string, string> = { limit: "500" };
        const response = await api.get(`${API_BASE_URL}/awards/search`, { params });
        
        const fetchedData = response.data?.data || response.data;
        const rawData = Array.isArray(fetchedData) ? fetchedData : [];

        const mappedData = rawData.map((item: any) => {
            const isOrgNominated = item.org_name && item.org_name.trim() !== "";
            return {
                ...item,
                form_status: item.form_status_id || item.form_status, 
                award_type_name: item.award_type,
                is_organization_nominated: isOrgNominated, 
                organization_name: item.org_name
            };
        });

        // 🚨 ดึงเฉพาะสถานะตั้งแต่ 12 ขึ้นไป (12 = ประธานเซ็นแล้ว, 13 = อธิการบดีเซ็นแล้ว)
        const TARGET_STATUS_MIN = 12; 
        const filteredData = mappedData.filter((item: any) => item.form_status >= TARGET_STATUS_MIN);

        if (isMounted) setItems(filteredData);
      } catch (error) {
        console.error("API Error:", error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchAwardTypes();
    fetchData();
    return () => { isMounted = false; };
  }, []);

  // ==========================================
  // 3. Logic & Handlers
  // ==========================================
  const processedData = useMemo(() => {
    let filtered = items;

    if (debouncedSearch) {
        const lowerTerm = debouncedSearch.toLowerCase();
        filtered = filtered.filter(item => 
          item.student_firstname?.toLowerCase().includes(lowerTerm) || 
          item.student_lastname?.toLowerCase().includes(lowerTerm) ||
          item.student_number?.includes(lowerTerm)
        );
    }

    if (filterCategory && filterCategory !== "all") {
        filtered = filtered.filter(item => item.award_type_name === filterCategory);
    }

    if (filterYear && filterYear !== "all") {
        filtered = filtered.filter(item => String(item.student_year) === filterYear);
    }
    
    if (sortConfig.key) {
      filtered.sort((a: any, b: any) => {
        let valA = sortConfig.key ? a[sortConfig.key] : '';
        let valB = sortConfig.key ? b[sortConfig.key] : '';
        if (sortConfig.key === 'student_firstname') {
          valA = `${a.student_firstname} ${a.student_lastname}`;
          valB = `${b.student_firstname} ${b.student_lastname}`;
        } else if (sortConfig.key === 'latest_update' || sortConfig.key === 'created_at') {
          valA = new Date(a.latest_update || a.created_at).getTime();
          valB = new Date(b.latest_update || b.created_at).getTime();
        }
        if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
        if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return filtered;
  }, [items, debouncedSearch, filterCategory, filterYear, sortConfig]);

  const totalPages = Math.ceil(processedData.length / ITEMS_PER_PAGE);
  const currentItems = processedData.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const handleSort = (key: keyof Nomination | 'award_type_name' | 'latest_update') => {
    setSortConfig(prev => {
      if (prev.key === key) return { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' };
      return { key, direction: 'asc' };
    });
  };

  const getDisplayName = (item: Nomination) => {
    if (!item.student_lastname || item.student_lastname === "-") return item.student_firstname || "-";
    return `${item.student_firstname || ""} ${item.student_lastname || ""}`.trim();
  };

  // --- Options สำหรับ Dropdowns ---
  const awardTypeOptions = [
    { v: "all", l: "ทุกประเภทรางวัล" },
    ...awardTypes.map(type => ({ v: type, l: type }))
  ];

  const yearOptions = [
    { v: "all", l: "ทุกระดับชั้นปี" },
    { v: "1", l: "ชั้นปีที่ 1" },
    { v: "2", l: "ชั้นปีที่ 2" },
    { v: "3", l: "ชั้นปีที่ 3" },
    { v: "4", l: "ชั้นปีที่ 4" },
  ];

  // ==========================================
  // 4. Render UI
  // ==========================================
  return (
    <div className="min-h-screen bg-white p-6 pt-24 lg:p-10 lg:pt-28 font-sans pb-24 relative overflow-hidden">
      
      {/* --- CSS Animations --- */}
      <style jsx global>{`
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(15px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in-up { animation: fadeInUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
      `}</style>

      <div className="max-w-7xl mx-auto space-y-6 relative z-10">
        
        {/* --- Header Section --- */}
        <div className="bg-white rounded-[32px] shadow-sm border border-slate-200 p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 animate-fade-in-up relative z-[50]">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 mb-3 text-indigo-600">
                <History className="w-4 h-4" />
                <span className="text-[11px] font-black uppercase tracking-[0.15em]">ประวัติการลงนาม</span>
            </div>
            <h1 className="text-3xl lg:text-4xl font-black text-slate-800 flex items-center gap-3 tracking-tight">
              ประวัติการลงนาม
            </h1>
            <p className="text-slate-500 mt-2 font-medium flex items-center gap-2">
              <Building2 className="w-4 h-4 text-indigo-400" /> สำหรับประธานคณะกรรมการ
            </p>
          </div>
        </div>

        {/* --- Filters Grid --- */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-fade-in-up relative z-[60]" style={{ animationDelay: '100ms' }}>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10"><Search className="h-4 w-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" /></div>
              <input 
                type="text" 
                placeholder="ค้นหาชื่อ หรือ รหัสนิสิต" 
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)} 
                className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-3.5 pl-11 text-sm font-medium focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-400 outline-none transition-all shadow-sm placeholder:text-slate-400 text-slate-800 relative z-10" 
              />
            </div>
            
            <div className="relative z-[60]">
               <CustomSelect 
                  value={filterCategory} 
                  onChange={setFilterCategory} 
                  options={awardTypeOptions} 
                  icon={Award}
                  placeholder="ทุกประเภทรางวัล"
               />
            </div>
            
            <div className="relative z-[60]">
               <CustomSelect 
                  value={filterYear} 
                  onChange={setFilterYear} 
                  options={yearOptions} 
                  icon={GraduationCap}
                  placeholder="ทุกระดับชั้นปี"
               />
            </div>
        </div>

        {/* --- Data Table --- */}
        <div className="bg-white rounded-[32px] shadow-sm border border-slate-200 overflow-visible animate-fade-in-up relative z-10" style={{ animationDelay: '150ms' }}>
          <div className="overflow-x-auto min-h-[400px]">
            <table className="w-full text-left border-collapse min-w-[900px]">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-[11px] font-extrabold uppercase tracking-widest border-b border-slate-200">
                  <th className="p-6 cursor-pointer hover:bg-slate-100 transition-colors w-[30%]" onClick={() => handleSort('student_firstname')}>
                    <div className="flex items-center gap-1.5">ผู้ได้รับการเสนอชื่อ {sortConfig.key === 'student_firstname' ? (sortConfig.direction === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-indigo-500"/> : <ArrowDown className="w-3.5 h-3.5 text-indigo-500"/>) : <ArrowUpDown className="w-3.5 h-3.5 text-slate-300"/>}</div>
                  </th>
                  <th className="p-6 cursor-pointer hover:bg-slate-100 transition-colors text-center w-[20%]" onClick={() => handleSort('student_number')}>
                    <div className="flex items-center justify-center gap-1.5">รหัสนิสิต {sortConfig.key === 'student_number' ? (sortConfig.direction === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-indigo-500"/> : <ArrowDown className="w-3.5 h-3.5 text-indigo-500"/>) : <ArrowUpDown className="w-3.5 h-3.5 text-slate-300"/>}</div>
                  </th>
                  <th className="p-6 text-center w-[20%]">
                    <div className="flex items-center justify-center gap-1.5">สถานะการพิจารณา</div>
                  </th>
                  <th className="p-6 cursor-pointer hover:bg-slate-100 transition-colors text-center w-[20%]" onClick={() => handleSort('latest_update')}>
                     <div className="flex items-center justify-center gap-1.5">วันที่รับรองผล {sortConfig.key === 'latest_update' ? (sortConfig.direction === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-indigo-500"/> : <ArrowDown className="w-3.5 h-3.5 text-indigo-500"/>) : <ArrowUpDown className="w-3.5 h-3.5 text-slate-300"/>}</div>
                  </th>
                  <th className="p-6 text-center w-[10%]">รายละเอียด</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white text-sm">
                {loading ? (
                  [1, 2, 3, 4, 5].map((i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="p-6"><div className="h-4 bg-slate-200 rounded-md w-48 mb-2"></div><div className="h-3 bg-slate-100 rounded-md w-32"></div></td>
                      <td className="p-6"><div className="h-4 bg-slate-200 rounded w-24 mx-auto"></div></td>
                      <td className="p-6"><div className="h-6 w-24 bg-slate-200 rounded-full mx-auto"></div></td>
                      <td className="p-6"><div className="h-4 bg-slate-200 rounded w-24 mx-auto"></div></td>
                      <td className="p-6"><div className="h-10 w-10 bg-slate-200 rounded-xl mx-auto"></div></td>
                    </tr>
                  ))
                ) : currentItems.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-20 text-center">
                      <div className="flex flex-col items-center justify-center text-slate-400">
                        <div className="bg-indigo-50 p-5 rounded-full mb-4 shadow-sm border border-indigo-100">
                          <FileSignature className="w-12 h-12 text-indigo-300" strokeWidth={1.5} />
                        </div>
                        <p className="text-xl font-bold text-slate-700">ไม่มีประวัติการรับรองผล</p>
                        <p className="text-sm mt-2 font-medium text-slate-500">ยังไม่มีรายการที่คุณได้ลงนามรับรองผลมติของคณะกรรมการ</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  currentItems.map((item, index) => {
                    const fullName = getDisplayName(item);
                    const isOrg = item.student_lastname === "-";

                    return (
                        <tr 
                          key={item.form_id} 
                          className="group hover:bg-slate-50 transition-all duration-300 animate-fade-in-up"
                          style={{ opacity: 0, animationDelay: `${index * 50}ms`, animationFillMode: 'forwards' }}
                        >
                          {/* Column 1: Info */}
                          <td className="p-6 align-middle">
                            <div className="font-extrabold text-slate-800 text-[15px] group-hover:text-indigo-700 transition-colors">{fullName}</div>
                            <div className="text-[12px] text-slate-500 mt-1 font-medium tracking-wide">
                                FORM ID: #{item.form_id}
                            </div>
                            <div className="text-[10.5px] font-bold text-indigo-600 mt-2.5 bg-indigo-50 inline-block px-3 py-1 rounded-lg border border-indigo-100 shadow-sm">
                                {item.award_type_name || item.award_type}
                            </div>
                          </td>

                          {/* Column 2: Student Number / Type */}
                          <td className="p-6 text-center align-middle">
                            {isOrg ? (
                                <span className="text-indigo-500 font-bold bg-indigo-50 px-3 py-1 rounded-md border border-indigo-100">องค์กรภายนอก</span>
                            ) : (
                                <span className="font-mono bg-slate-100 px-3 py-1 rounded-md text-slate-600 border border-slate-200">{item.student_number}</span>
                            )} 
                          </td>

                          {/* Column 3: Status Badge */}
                          <td className="p-6 text-center align-middle">
                              <span className="inline-flex items-center px-3.5 py-1.5 rounded-xl text-xs font-bold shadow-sm bg-indigo-100 text-indigo-700 border border-indigo-200">
                                  <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" strokeWidth={3} /> รับรองผลเรียบร้อย
                              </span>
                          </td>

                          {/* Column 4: Date */}
                          <td className="p-6 text-center align-middle">
                              <div className="flex flex-col items-center justify-center">
                                <span className="font-bold text-slate-700">{formatDateTh(item.latest_update || item.created_at).split(' ')[0]}</span>
                                <span className="text-[11px] text-slate-400 font-mono bg-slate-50 px-2 py-0.5 rounded-md mt-1 border border-slate-100">{formatDateTh(item.latest_update || item.created_at).split(' ')[1]} น.</span>
                              </div>
                          </td>

                          {/* Column 5: Details */}
                          <td className="p-6 text-center align-middle">
                            <button 
                              onClick={() => { setModalData(item); setIsDetailModalOpen(true); }} 
                              className="inline-flex items-center justify-center p-3 rounded-xl text-slate-500 bg-slate-50 hover:text-indigo-600 hover:bg-indigo-50 transition-all transform hover:scale-110 border border-slate-200 hover:border-indigo-200 shadow-sm"
                              title="ดูรายละเอียดข้อมูล"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* --- Table Footer / Pagination --- */}
          <div className="bg-slate-50 border-t border-slate-200 p-5 flex flex-col md:flex-row justify-between items-center gap-4 rounded-b-[32px]">
            <div className="flex items-center gap-2">
              <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1} className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-50 transition-all shadow-sm"><ChevronLeft className="w-4 h-4" /></button>
              <span className="text-sm font-bold text-slate-700 bg-white px-5 py-2.5 rounded-xl border border-slate-200 shadow-sm">หน้า {currentPage} จาก {totalPages || 1}</span>
              <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages || totalPages === 0} className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-50 transition-all shadow-sm"><ChevronRight className="w-4 h-4" /></button>
            </div>
            <div className="text-[13px] text-slate-600 font-bold bg-white px-5 py-2.5 rounded-xl border border-slate-200 shadow-sm">
                พบประวัติการลงนามทั้งหมด <span className="text-indigo-600 text-[14px] ml-1">{processedData.length}</span> รายการ
            </div>
          </div>
        </div>

        {/* --- Modal: Nomination Detail --- */}
        <NominationDetailModal 
          isOpen={isDetailModalOpen} 
          onClose={() => setIsDetailModalOpen(false)} 
          data={modalData} 
          faculties={[]} 
          departments={[]}
        />

      </div>
    </div>
  );
}