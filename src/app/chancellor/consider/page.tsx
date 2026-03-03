"use client";

import { useState, useEffect, useRef } from "react";
import NominationDetailModal from "@/components/Nomination-detail-modal";
import Swal from "sweetalert2";
import { motion, AnimatePresence, Variants } from "framer-motion";
import {
  Search, GraduationCap, CheckCircle2,
  Eye, Award, Building2, ChevronLeft, ChevronRight, 
  ArrowUpDown, ArrowUp, ArrowDown, ChevronDown, PenTool, Check,
  Sparkles, FileSignature
} from "lucide-react";
import { api } from "@/lib/axios";

// ==========================================
// 0. Configuration & Types
// ==========================================
const USE_MOCK_DATA = false;

interface VoteSummary {
  approve: number;
  reject: number;
  abstain: number;
  total_voters: number;
}

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
  vote_summary?: VoteSummary; 
}

const modalVariants: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  show: { opacity: 1, scale: 1, transition: { type: "spring", duration: 0.3 } },
  exit: { opacity: 0, scale: 0.95, transition: { duration: 0.2 } }
};

// Custom Dropdown Component
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
                className={`flex items-center justify-between w-full pl-11 pr-4 py-3.5 bg-white border rounded-2xl cursor-pointer transition-all duration-300 shadow-sm
                    ${isOpen ? 'border-purple-400 ring-4 ring-purple-500/10' : 'border-slate-200 hover:border-slate-300'}
                `}
            >
                <Icon className={`w-4 h-4 absolute left-4 top-4 transition-colors ${isOpen ? 'text-purple-500' : 'text-slate-400'}`} />
                <span className={`text-sm font-medium truncate ${!value || value === "all" ? 'text-slate-500' : 'text-slate-800'}`}>
                    {selectedLabel}
                </span>
                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-300 ${isOpen ? 'rotate-180 text-purple-500' : ''}`} />
            </div>
  
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}
                        className="absolute top-[calc(100%+8px)] left-0 w-full bg-white/95 backdrop-blur-xl border border-slate-100 rounded-2xl shadow-2xl py-2 max-h-60 overflow-y-auto z-[50] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-slate-200 hover:[&::-webkit-scrollbar-thumb]:bg-slate-300"
                    >
                        {options.map((o: any, i: number) => (
                            <div
                                key={i}
                                onClick={() => { onChange(String(o.v)); setIsOpen(false); }}
                                className={`px-4 py-3 cursor-pointer transition-all duration-200 text-sm font-medium flex items-center justify-between
                                    ${String(value) === String(o.v) ? 'bg-purple-50 text-purple-700 font-bold' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}
                                `}
                            >
                                {o.l}
                                {String(value) === String(o.v) && <CheckCircle2 size={16} className="text-purple-500" />}
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
export default function ChancellorApprovalPage() {
  
  // --- States ---
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<Nomination[]>([]);
  const [awardTypes, setAwardTypes] = useState<string[]>([]);
  const [signingId, setSigningId] = useState<number | null>(null);

  // Modals
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [modalData, setModalData] = useState<Nomination | null>(null);

  // Filters, Sort & Backend Pagination
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterYear, setFilterYear] = useState("all");
  
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0); // เก็บจำนวนทั้งหมด
  
  const [sortConfig, setSortConfig] = useState<{ key: string | null, direction: 'asc' | 'desc' | null }>({ key: 'date', direction: 'desc' });

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm), 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // รีเซ็ตไปหน้า 1 เสมอเมื่อมีการเปลี่ยน Filter
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, filterCategory, filterYear, sortConfig]);

  // ==========================================
  // 2. Data Fetching
  // ==========================================
  useEffect(() => {
    let isMounted = true;
    
    const fetchAwardTypes = async () => {
      try {
        const response = await api.get(`/awards/types`);
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

        // 🚨 ส่ง Parameters ไปหา Backend เพื่อทำ Server-side Pagination 🚨
        const params: Record<string, any> = { 
            page: currentPage, 
            // 🚨 ไม่ส่ง limit เพื่อให้ backend ใช้ default ของมัน (สมมติว่า backend ล็อกไว้ที่ 6)
            sortBy: sortConfig.key || "date",
            sortOrder: sortConfig.direction || "desc",
            // 🚨 แจ้ง Backend ว่าขอเฉพาะสถานะ 12 (ลงนามโดยประธานคณะกรรมการ)
            form_status: 12, 
            status: 12 // ส่งไปเผื่อไว้ กรณี Backend ตั้งชื่อตัวแปรไม่ตรงกัน
        };

        if (debouncedSearch) params.keyword = debouncedSearch;
        if (filterCategory !== "all") params.award_type = filterCategory;
        if (filterYear !== "all") params.student_year = filterYear;

        const response = await api.get(`/awards/search`, { params });
        
        const fetchedData = response.data?.data || response.data;
        const rawData = Array.isArray(fetchedData) ? fetchedData : [];
        const pagination = response.data?.pagination;

        const mappedData = rawData.map((item: any) => {
            const isOrgNominated = item.org_name && item.org_name.trim() !== "";
            
            // 💡 Mock Vote Summary
            const mockApprove = (item.form_id % 3) + 3; // สุ่ม 3-5
            const mockReject = 5 - mockApprove;

            return {
                ...item,
                form_status: item.form_status_id || item.form_status, 
                award_type_name: item.award_type,
                is_organization_nominated: isOrgNominated, 
                organization_name: item.org_name,
                vote_summary: { approve: mockApprove, reject: mockReject, abstain: 0, total_voters: 5 }
            };
        });

        // ตอนนี้เราไม่ต้อง Filter สถานะฝั่ง Frontend แล้ว เพราะ Backend ควรจะเป็นคน Filter ให้
        // แต่ใส่กันเหนียวไว้เผื่อ Backend ยังไม่ได้ทำ
        const TARGET_STATUS_ID = 12; 
        const filteredData = mappedData.filter((item: any) => item.form_status === TARGET_STATUS_ID);

        if (isMounted) {
            setItems(filteredData);
            if (pagination) {
                setTotalPages(pagination.total_pages || 1);
                setTotalItems(pagination.total_items || filteredData.length);
            } else {
                setTotalPages(1); 
                setTotalItems(filteredData.length);
            }
        }
      } catch (error) {
        console.error("API Error:", error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchAwardTypes();
    fetchData();
    return () => { isMounted = false; };
  }, [currentPage, debouncedSearch, filterCategory, filterYear, sortConfig]);

  // ==========================================
  // 3. Handlers
  // ==========================================
  const handleSort = (key: string) => {
    setSortConfig(prev => {
      if (prev.key === key) return { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' };
      return { key, direction: 'asc' };
    });
  };

  const getDisplayName = (item: Nomination) => {
    if (!item.student_lastname || item.student_lastname === "-") return item.student_firstname || "-";
    return `${item.student_firstname || ""} ${item.student_lastname || ""}`.trim();
  };

  const getResolution = (votes?: VoteSummary) => {
      if (!votes) return { isPassed: true, label: "เห็นชอบ", colorClass: "bg-emerald-100 text-emerald-700 border-emerald-200" };
      const total = votes.total_voters || 1; 
      const threshold = total / 2;
      const isPassed = votes.approve > threshold;
      return {
        isPassed,
        label: isPassed ? "มติเห็นชอบ" : "มติไม่เห็นชอบ",
        colorClass: isPassed 
          ? "bg-emerald-50 text-emerald-600 border border-emerald-200" 
          : "bg-rose-50 text-rose-600 border border-rose-200"
      };
  };

  const handleSign = async (id: number, name: string) => {
    if (!id) return;

    const result = await Swal.fire({
        title: 'ยืนยันการลงนามขั้นสุดท้าย?',
        html: `คุณต้องการลงนามอนุมัติรางวัลให้กับ<br/><b class="text-purple-600 text-lg">${name}</b> ใช่หรือไม่?<br/><span class="text-sm text-slate-500">(เมื่อลงนามแล้ว จะถือว่าสิ้นสุดกระบวนการพิจารณา)</span>`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#9333ea', 
        cancelButtonColor: '#94a3b8',
        confirmButtonText: 'ยืนยันอนุมัติ',
        cancelButtonText: 'ยกเลิก',
        customClass: { 
            popup: 'rounded-[24px]',
            confirmButton: 'rounded-xl px-6 py-2.5 font-bold',
            cancelButton: 'rounded-xl px-6 py-2.5 font-bold'
        }
    });

    if (!result.isConfirmed) return;

    setSigningId(id);

    try {
        if (!USE_MOCK_DATA) {
            // สถานะ 13 = ลงนามโดยอธิการบดี (สิ้นสุดกระบวนการ)
            const NEXT_STATUS_ID = 13; 
            await api.put(`/awards/form-status/change/${id}`, { form_status: NEXT_STATUS_ID, reject_reason: "" });
        }

        setItems(prev => prev.filter(item => item.form_id !== id));

        Swal.fire({
            icon: 'success',
            title: 'ลงนามสำเร็จ',
            text: `บันทึกการอนุมัติขั้นสุดท้ายเรียบร้อยแล้ว`,
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 3000,
            timerProgressBar: true
        });

    } catch (error: any) {
        console.error(error);
        if (error.response?.status === 403) {
            Swal.fire({ 
              icon: 'error', 
              title: 'ไม่มีสิทธิ์เข้าถึง (403)', 
              text: 'บัญชีอธิการบดีของคุณไม่ได้รับอนุญาต กรุณาแจ้ง Backend ให้ปลดล็อกสิทธิ์ API' 
            });
        } else {
            Swal.fire({ icon: 'error', title: 'เกิดข้อผิดพลาด', text: 'ไม่สามารถบันทึกการลงนามได้' });
        }
    } finally {
        setSigningId(null);
    }
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
        
        {/* --- Header Section (Layer กลาง) --- */}
        <div className="bg-white rounded-[32px] shadow-sm border border-slate-200 p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 animate-fade-in-up relative z-20">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-50 border border-purple-100 mb-3 text-purple-600">
                <Sparkles className="w-4 h-4" />
                <span className="text-[11px] font-black uppercase tracking-[0.15em]">ลงนามขั้นสุดท้าย</span>
            </div>
            <h1 className="text-3xl lg:text-4xl font-black text-slate-800 flex items-center gap-3 tracking-tight">
              ลงนามอนุมัติขั้นสุดท้าย
            </h1>
            <p className="text-slate-500 mt-2 font-medium flex items-center gap-2">
              <Building2 className="w-4 h-4 text-purple-400" /> สำหรับอธิการบดี
            </p>
          </div>
        </div>

        {/* --- Filters Grid (Layer 30 ให้อยู่เหนือตาราง) --- */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-fade-in-up relative z-30" style={{ animationDelay: '100ms' }}>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><Search className="h-4 w-4 text-slate-400 group-focus-within:text-purple-500 transition-colors" /></div>
              <input 
                type="text" 
                placeholder="ค้นหาชื่อ หรือ รหัสนิสิต" 
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)} 
                className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-3.5 pl-11 text-sm font-medium focus:ring-4 focus:ring-purple-500/10 focus:border-purple-400 outline-none transition-all shadow-sm placeholder:text-slate-400 text-slate-800" 
              />
            </div>
            
            <div className="relative">
               <CustomSelect 
                  value={filterCategory} 
                  onChange={setFilterCategory} 
                  options={awardTypeOptions} 
                  icon={Award}
                  placeholder="ทุกประเภทรางวัล"
               />
            </div>
            
            <div className="relative">
               <CustomSelect 
                  value={filterYear} 
                  onChange={setFilterYear} 
                  options={yearOptions} 
                  icon={GraduationCap}
                  placeholder="ทุกระดับชั้นปี"
               />
            </div>
        </div>

        {/* --- Data Table (Layer 10 ต่ำสุด) --- */}
        <div className="bg-white rounded-[32px] shadow-sm border border-slate-200 overflow-visible animate-fade-in-up relative z-10" style={{ animationDelay: '150ms' }}>
          <div className="overflow-x-auto min-h-[400px]">
            <table className="w-full text-left border-collapse min-w-[900px]">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-[11px] font-extrabold uppercase tracking-widest border-b border-slate-200">
                  <th className="p-6 cursor-pointer hover:bg-slate-100 transition-colors w-[30%]" onClick={() => handleSort('student_firstname')}>
                    <div className="flex items-center gap-1.5">ผู้ได้รับการเสนอชื่อ {sortConfig.key === 'student_firstname' ? (sortConfig.direction === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-purple-500"/> : <ArrowDown className="w-3.5 h-3.5 text-purple-500"/>) : <ArrowUpDown className="w-3.5 h-3.5 text-slate-300"/>}</div>
                  </th>
                  <th className="p-6 text-center w-[20%]">
                    <div className="flex items-center justify-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5"/> สถานะมติกรรมการ</div>
                  </th>
                  <th className="p-6 cursor-pointer hover:bg-slate-100 transition-colors text-center w-[20%]" onClick={() => handleSort('date')}>
                     <div className="flex items-center justify-center gap-1.5">อัปเดตล่าสุด {sortConfig.key === 'date' ? (sortConfig.direction === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-purple-500"/> : <ArrowDown className="w-3.5 h-3.5 text-purple-500"/>) : <ArrowUpDown className="w-3.5 h-3.5 text-slate-300"/>}</div>
                  </th>
                  <th className="p-6 text-center w-[15%]">การดำเนินการ</th>
                  <th className="p-6 text-center w-[15%]">รายละเอียด</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white text-sm">
                {loading ? (
                  [1, 2, 3, 4, 5].map((i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="p-6"><div className="h-4 bg-slate-200 rounded-md w-48 mb-2"></div><div className="h-3 bg-slate-100 rounded-md w-32"></div></td>
                      <td className="p-6"><div className="h-6 w-24 bg-slate-200 rounded-full mx-auto"></div></td>
                      <td className="p-6"><div className="h-4 bg-slate-200 rounded w-24 mx-auto"></div></td>
                      <td className="p-6"><div className="h-10 w-28 bg-slate-200 rounded-xl mx-auto"></div></td>
                      <td className="p-6"><div className="h-10 w-10 bg-slate-200 rounded-xl mx-auto"></div></td>
                    </tr>
                  ))
                ) : items.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-20 text-center">
                      <div className="flex flex-col items-center justify-center text-slate-400">
                        <div className="bg-purple-50 p-5 rounded-full mb-4 shadow-sm border border-purple-100">
                          <FileSignature className="w-12 h-12 text-purple-300" strokeWidth={1.5} />
                        </div>
                        <p className="text-xl font-bold text-slate-700">ไม่มีรายการรออนุมัติ</p>
                        <p className="text-sm mt-2 font-medium text-slate-500">ฟอร์มทั้งหมดได้รับการลงนามจากอธิการบดีเรียบร้อยแล้ว </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  items.map((item, index) => {
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
                            <div className="font-extrabold text-slate-800 text-[15px] group-hover:text-purple-700 transition-colors">{fullName}</div>
                            <div className="text-[12px] text-slate-500 mt-1 font-medium tracking-wide">
                                {isOrg ? <span className="text-purple-500 font-bold bg-purple-50 px-2 py-0.5 rounded">องค์กรภายนอก</span> : <span className="font-mono bg-slate-100 px-2 py-0.5 rounded-md text-slate-600">{item.student_number}</span>} 
                            </div>
                            <div className="text-[10.5px] font-bold text-purple-600 mt-2.5 bg-purple-50 inline-block px-3 py-1 rounded-lg border border-purple-100 shadow-sm">
                                {item.award_type_name || item.award_type}
                            </div>
                          </td>

                          {/* Column 2: Status from Committee */}
                          <td className="p-6 text-center align-middle">
                              <span className="inline-flex items-center px-3.5 py-1.5 rounded-xl text-xs font-bold shadow-sm bg-emerald-50 text-emerald-600 border border-emerald-200">
                                  <Check className="w-3.5 h-3.5 mr-1" strokeWidth={3} /> ผ่านมติคณะกรรมการ
                              </span>
                          </td>

                          {/* Column 3: Date */}
                          <td className="p-6 text-center align-middle">
                              <div className="text-slate-600 font-medium">{new Date(item.latest_update || item.created_at).toLocaleDateString('th-TH')}</div>
                          </td>

                          {/* Column 4: Action (Sign) */}
                          <td className="p-6 text-center align-middle">
                              <button 
                                  onClick={() => handleSign(item.form_id, fullName)}
                                  disabled={signingId === item.form_id}
                                  className={`
                                      relative overflow-hidden bg-purple-600 hover:bg-purple-700 
                                      text-white text-[13px] font-bold px-6 py-3 rounded-xl shadow-md
                                      transition-all transform hover:-translate-y-0.5 active:scale-95 flex items-center justify-center gap-2 mx-auto w-full max-w-[140px]
                                      ${signingId === item.form_id ? 'opacity-80 cursor-not-allowed' : ''}
                                  `}
                              >
                                  {signingId === item.form_id ? (
                                      <>
                                          <div className="w-4 h-4 border-[2.5px] border-white/30 border-t-white rounded-full animate-spin"></div>
                                          <span>กำลังบันทึก</span>
                                      </>
                                  ) : (
                                      <>
                                          <PenTool className="w-4 h-4 relative z-10" />
                                          <span className="relative z-10">อนุมัติ</span>
                                      </>
                                  )}
                              </button>
                          </td>

                          {/* Column 5: Details */}
                          <td className="p-6 text-center align-middle">
                            <button 
                              onClick={() => { setModalData(item); setIsDetailModalOpen(true); }} 
                              className="inline-flex items-center justify-center p-3 rounded-xl text-slate-500 bg-slate-50 hover:text-purple-600 hover:bg-purple-50 transition-all transform hover:scale-110 border border-slate-200 hover:border-purple-200 shadow-sm"
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