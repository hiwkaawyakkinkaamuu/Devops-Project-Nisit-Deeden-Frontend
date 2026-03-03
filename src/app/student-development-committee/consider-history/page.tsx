"use client";

import { useState, useEffect, useRef } from "react";
import NominationDetailModal from "@/components/Nomination-detail-modal";
import { motion, AnimatePresence, Variants } from "framer-motion";
import {
  Search, CheckCircle2, XCircle,
  Eye, Award, Building2, History,
  ChevronLeft, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown, ChevronDown, Filter
} from "lucide-react";
import { api } from "@/lib/axios";

// ==========================================
// 0. Configuration & Types
// ==========================================
const USE_MOCK_DATA = false;
const ITEMS_PER_PAGE = 6; 

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
  role_id?: number; 
  is_organization_nominated?: boolean; 
  organization_name?: string;
  
  // 🚨 Fields ที่ดึงมาจากตาราง committee_vote_logs
  operation?: string;         
  operation_date?: string;    
  reason?: string;            // เหตุผลประกอบการโหวต (ถ้ามี)
}

// ==========================================
// 1. Framer Motion Variants
// ==========================================
const modalVariants: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  show: { opacity: 1, scale: 1, transition: { type: "spring", duration: 0.3 } },
  exit: { opacity: 0, scale: 0.95, transition: { duration: 0.2 } }
};

// 🌟 Custom Dropdown Component 🌟
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
                className={`flex items-center justify-between w-full pl-11 pr-4 py-3 bg-white/80 backdrop-blur-sm border rounded-2xl cursor-pointer transition-all duration-300 shadow-sm
                    ${isOpen ? 'border-emerald-400 ring-4 ring-emerald-500/10' : 'border-slate-200/80 hover:border-slate-300'}
                `}
            >
                <Icon className={`w-4 h-4 absolute left-4 top-3.5 transition-colors ${isOpen ? 'text-emerald-500' : 'text-slate-400'}`} />
                <span className={`text-sm font-medium truncate ${!value || value === "all" ? 'text-slate-500' : 'text-slate-800'}`}>
                    {selectedLabel}
                </span>
                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-300 ${isOpen ? 'rotate-180 text-emerald-500' : ''}`} />
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
                                    ${String(value) === String(o.v) ? 'bg-emerald-50 text-emerald-700 font-bold' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}
                                `}
                            >
                                {o.l}
                                {String(value) === String(o.v) && <CheckCircle2 size={16} className="text-emerald-500" />}
                            </div>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

// ==========================================
// 2. Main Component
// ==========================================
export default function CommitteeHistoryPage() { 
  
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<Nomination[]>([]);
  const [awardTypes, setAwardTypes] = useState<string[]>([]);
  
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [modalData, setModalData] = useState<Nomination | null>(null);
  
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterAction, setFilterAction] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sortConfig, setSortConfig] = useState<{ key: keyof Nomination | 'award_type_name' | null, direction: 'asc' | 'desc' | null }>({ key: 'operation_date', direction: 'desc' });
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
      const timer = setTimeout(() => setDebouncedSearch(searchTerm), 500);
      return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, filterCategory, filterAction]);

  const formatDateTh = (isoDate: string) => {
    if (!isoDate) return "-";
    const date = new Date(isoDate);
    return date.toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: '2-digit', hour: '2-digit', minute:'2-digit' });
  };

  const getStatusBadge = (operation: string) => {
    if (operation === "reject") { 
        return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 text-rose-600 text-xs font-bold border border-rose-200"><XCircle className="w-3.5 h-3.5"/> มติไม่เห็นชอบ</span>;
    } 
    else if (operation === "approve") {
        return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 text-xs font-bold border border-emerald-200"><CheckCircle2 className="w-3.5 h-3.5"/> มติเห็นชอบ</span>;
    }
    return <span className="px-3 py-1 rounded-full bg-slate-50 text-slate-600 text-xs font-medium border border-slate-200">อัปเดตข้อมูล</span>;
  };

  const getDisplayName = (item: Nomination) => {
    if (!item.student_lastname || item.student_lastname === "-") return item.student_firstname || "-";
    return `${item.student_firstname || ""} ${item.student_lastname || ""}`.trim();
  };

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

        // 🚨 ดึงข้อมูลจากเส้น Logs (ซึ่ง Backend จะไป Join กับตาราง committee_vote_logs ให้)
        const params: Record<string, any> = { 
            page: currentPage, 
            limit: ITEMS_PER_PAGE,
            sortBy: "date",
            sortOrder: "desc"
        };
        
        if (debouncedSearch) params.keyword = debouncedSearch;
        if (filterCategory !== "all") params.awardType = filterCategory;
        if (filterAction !== "all") params.operation = filterAction;

        // 💡 ถ้าในอนาคต Backend มีเส้น /awards/committee/vote-logs ให้เปลี่ยน URL ด้านล่างเป็นเส้นนั้น
        const response = await api.get(`/awards/my/approval-logs`, { params });
        const rawData = response.data?.data || [];
        const pagination = response.data?.pagination;

        const mappedData = rawData.map((item: any) => {
            const isOrgNominated = item.student_lastname === "-" || !item.student_lastname;
            return {
                ...item,
                award_type_name: item.award_type, 
                is_organization_nominated: isOrgNominated, 
                organization_name: item.student_firstname,
                // ข้อมูลจากตาราง Vote Log
                operation: item.operation,
                operation_date: item.operation_date,
                reject_reason: item.comment || item.reason || "" 
            };
        });

        if (isMounted) {
            setItems(mappedData);
            if (pagination) {
                setTotalPages(pagination.total_pages || 1);
            } else {
                setTotalPages(1); 
            }
        }
      } catch (error) {
        console.warn("API Error:", error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchAwardTypes();
    fetchData();
    return () => { isMounted = false; };
  }, [currentPage, debouncedSearch, filterCategory, filterAction]);

  const handleSort = (key: keyof Nomination | 'award_type_name' | 'latest_update') => {
    setSortConfig(prev => {
      if (prev.key === key) return { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' };
      return { key, direction: 'asc' };
    });
  };

  // Options สำหรับ Dropdowns
  const awardTypeOptions = [
      { v: "all", l: "ทุกประเภทรางวัล" },
      ...awardTypes.map(type => ({ v: type, l: type }))
  ];

  const actionOptions = [
    { v: "all", l: "ทุกการพิจารณา" },
    { v: "approve", l: "มติเห็นชอบ (Approve)" },
    { v: "reject", l: "มติไม่เห็นชอบ (Reject)" }
  ];

  return (
    <div className="min-h-screen bg-slate-50/50 p-6 pt-24 lg:p-10 lg:pt-28 font-sans pb-24">
      <style jsx global>{`
          @keyframes fadeInUp { 
              from { opacity: 0; transform: translateY(10px); } 
              to { opacity: 1; transform: translateY(0); } 
          }
          .animate-fade-in-up { animation: fadeInUp 0.4s ease-out forwards; }
      `}</style>

      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header Section */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="bg-white/70 backdrop-blur-xl border border-white shadow-sm rounded-3xl p-8 relative z-[50]">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-emerald-50 text-emerald-600 text-xs font-bold mb-3 border border-emerald-200 shadow-sm">
                  <History className="w-3.5 h-3.5" /> ระบบประวัติการโหวต
              </div>
              <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-slate-700 to-slate-900 flex items-center gap-3">
                 ประวัติการพิจารณา
              </h1>
              <p className="text-slate-500 mt-2 font-medium flex items-center gap-2">
                <Building2 className="w-4 h-4" />
                สำหรับคณะกรรมการส่วนกลาง
              </p>
            </div>
          </div>

          {/* Filters Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8 relative z-[60]">
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none z-10">
                <Search className="h-4 w-4 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
              </div>
              <input 
                type="text" 
                placeholder="ค้นหาชื่อ หรือ รหัสนิสิต" 
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)} 
                className="w-full bg-white/80 border border-slate-200/80 rounded-2xl px-4 py-3 pl-10 text-sm focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-400 outline-none transition-all shadow-sm font-medium placeholder:text-slate-400 relative z-10" 
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
                    value={filterAction} 
                    onChange={setFilterAction} 
                    options={actionOptions} 
                    icon={Filter}
                    placeholder="ทุกการพิจารณา"
                />
            </div>
          </div>
        </motion.div>

        {/* Data Table */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white rounded-3xl shadow-sm border border-slate-200 flex flex-col min-h-[500px] relative z-10">
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left border-collapse min-w-[900px]">
              <thead>
                <tr className="bg-slate-50/80 text-slate-500 text-xs font-bold uppercase tracking-wider border-b border-slate-200">
                  <th className="p-5 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort('student_firstname')}>
                    <div className="flex items-center gap-1">ผู้ได้รับการเสนอชื่อ {sortConfig.key === 'student_firstname' ? (sortConfig.direction === 'asc' ? <ArrowUp className="w-3 h-3 text-emerald-500"/> : <ArrowDown className="w-3 h-3 text-emerald-500"/>) : <ArrowUpDown className="w-3 h-3 text-slate-300"/>}</div>
                  </th>
                  <th className="p-5 cursor-pointer hover:bg-slate-100 transition-colors text-center" onClick={() => handleSort('student_number')}>
                    <div className="flex items-center justify-center gap-1">รหัสนิสิต {sortConfig.key === 'student_number' ? (sortConfig.direction === 'asc' ? <ArrowUp className="w-3 h-3 text-emerald-500"/> : <ArrowDown className="w-3 h-3 text-emerald-500"/>) : <ArrowUpDown className="w-3 h-3 text-slate-300"/>}</div>
                  </th>
                  <th className="p-5 cursor-pointer hover:bg-slate-100 transition-colors text-center" onClick={() => handleSort('award_type_name')}>
                     <div className="flex items-center justify-center gap-1">รางวัลที่พิจารณา {sortConfig.key === 'award_type_name' ? (sortConfig.direction === 'asc' ? <ArrowUp className="w-3 h-3 text-emerald-500"/> : <ArrowDown className="w-3 h-3 text-emerald-500"/>) : <ArrowUpDown className="w-3 h-3 text-slate-300"/>}</div>
                  </th>
                  <th className="p-5 text-center">ประเภท</th>
                  <th className="p-5 cursor-pointer hover:bg-slate-100 transition-colors text-center" onClick={() => handleSort('latest_update')}>
                     <div className="flex items-center justify-center gap-1">วันที่โหวตพิจารณา {sortConfig.key === 'latest_update' ? (sortConfig.direction === 'asc' ? <ArrowUp className="w-3 h-3 text-emerald-500"/> : <ArrowDown className="w-3 h-3 text-emerald-500"/>) : <ArrowUpDown className="w-3 h-3 text-slate-300"/>}</div>
                  </th>
                  <th className="p-5 text-center">ผลการโหวตของคุณ</th>
                  <th className="p-5 text-center">รายละเอียดฟอร์ม</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {loading ? (
                  [1, 2, 3, 4, 5].map((i) => (
                    <tr key={i} className="animate-pulse border-b border-slate-100">
                      <td colSpan={7} className="p-5"><div className="h-4 bg-slate-200 rounded w-full"></div></td>
                    </tr>
                  ))
                ) : items.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-32 text-center">
                      <div className="flex flex-col items-center justify-center text-slate-400">
                        <div className="bg-slate-50 p-6 rounded-full mb-5 shadow-sm border border-slate-100">
                          <History className="w-12 h-12 text-slate-300" strokeWidth={1.5} />
                        </div>
                        <p className="text-2xl font-bold text-slate-700">ไม่มีประวัติการพิจารณา</p>
                        <p className="text-sm mt-2 text-slate-500">คุณยังไม่ได้ทำการโหวตพิจารณาเอกสารใดๆ ในระบบ</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  items.map((item, index) => (
                    <motion.tr 
                      key={item.form_id} 
                      className="transition-colors hover:bg-emerald-50/30 group animate-fade-in-up"
                      style={{ opacity: 0, animationDelay: `${index * 50}ms`, animationFillMode: 'forwards' }}
                    >
                      <td className="p-5">
                        <div className="flex items-center gap-3">
                           <div className={`w-2 h-2 rounded-full shrink-0 ${item.operation === 'approve' ? 'bg-emerald-500' : item.operation === 'reject' ? 'bg-rose-500' : 'bg-slate-300'}`}></div>
                           <div>
                             <p className="text-sm font-bold text-slate-800">
                                {getDisplayName(item)}
                             </p>
                             <p className="text-[11px] text-slate-500 font-mono mt-0.5 tracking-wider">
                                FORM ID: #{item.form_id}
                             </p>
                           </div>
                        </div>
                      </td>
                      <td className="p-5 text-sm text-center text-slate-600 font-mono">
                        {item.is_organization_nominated ? "-" : (item.student_number || "-")}
                      </td>
                      <td className="p-5 text-center">
                         <span className="inline-flex items-center px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-medium border border-slate-200 group-hover:bg-white transition-colors shadow-sm">
                           {item.award_type_name || item.award_type || "-"}
                         </span>
                      </td>
                      <td className="p-5 text-center">
                          {item.is_organization_nominated ? (
                              <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">องค์กรภายนอก</span>
                          ) : (
                              <span className="text-xs font-bold text-slate-500 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">นิสิต</span>
                          )}
                      </td>
                      <td className="p-5 text-sm text-center text-slate-500">
                        <div className="flex flex-col items-center justify-center">
                          <span className="font-bold text-slate-700">{formatDateTh(item.operation_date || item.created_at).split(' ')[0]}</span>
                          <span className="text-[11px] text-slate-400 font-mono bg-slate-50 px-2 py-0.5 rounded-md mt-1 border border-slate-100">{formatDateTh(item.operation_date || item.created_at).split(' ')[1]} น.</span>
                        </div>
                      </td>
                      <td className="p-5 text-center">
                         <div className="flex flex-col items-center gap-1.5">
                             {getStatusBadge(item.operation || "")}
                             {item.operation === "reject" && item.reject_reason && (
                                 <span className="text-[10px] text-rose-400 truncate max-w-[120px]" title={item.reject_reason}>
                                     ({item.reject_reason})
                                 </span>
                             )}
                         </div>
                      </td>
                      <td className="p-5 text-center">
                        <button 
                          onClick={() => { setModalData(item); setIsDetailModalOpen(true); }} 
                          className="inline-flex items-center justify-center p-2 rounded-xl text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-all focus:ring-2 focus:ring-emerald-100 outline-none shadow-sm border border-transparent hover:border-emerald-200"
                          title="ดูรายละเอียดข้อมูล"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Table Footer / Pagination */}
          <div className="bg-slate-50 border-t border-slate-200 p-5 flex flex-col md:flex-row justify-between items-center gap-4 rounded-b-3xl">
            <div className="flex items-center gap-2">
              <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1} className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-500 hover:bg-slate-100 hover:text-emerald-600 disabled:opacity-50 transition-all shadow-sm"><ChevronLeft className="w-4 h-4" /></button>
              <span className="text-sm font-bold text-slate-600 bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm">หน้า {currentPage} <span className="font-normal text-slate-400 mx-1">จาก</span> {totalPages || 1}</span>
              <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages || totalPages === 0} className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-500 hover:bg-slate-100 hover:text-emerald-600 disabled:opacity-50 transition-all shadow-sm"><ChevronRight className="w-4 h-4" /></button>
            </div>
          </div>
        </motion.div>

        {/* Modal: Nomination Detail */}
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