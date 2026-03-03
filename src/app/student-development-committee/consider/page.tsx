"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import NominationDetailModal from "@/components/Nomination-detail-modal"; 
import Swal from "sweetalert2";
import { motion, AnimatePresence, Variants } from "framer-motion";
import {
  Search, Calendar, GraduationCap, CheckCircle2, XCircle,
  Eye, AlertCircle, Award, Clock, X, Building2,
  ChevronLeft, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown, ChevronDown
} from "lucide-react";
import { api } from "@/lib/axios";

// ==========================================
// 0. Configuration & Types
// ==========================================
const USE_MOCK_DATA = false;

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
        <div className={`relative w-full ${className}`} style={{ zIndex: isOpen ? 1000 : 1 }} ref={dropdownRef}>
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
                        className="absolute top-[calc(100%+8px)] left-0 w-full bg-white/95 backdrop-blur-xl border border-slate-100 rounded-2xl shadow-2xl py-2 max-h-60 overflow-y-auto z-[99999] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-slate-200 hover:[&::-webkit-scrollbar-thumb]:bg-slate-300"
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
export default function StudentDevelopmentCommitteeConsiderPage() {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<Nomination[]>([]);
  const [awardTypes, setAwardTypes] = useState<string[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  // Modals
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [modalData, setModalData] = useState<Nomination | null>(null);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  // Filters & Sort
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterDate, setFilterDate] = useState("");
  const [filterYear, setFilterYear] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState<{ key: keyof Nomination | 'award_type_name' | null, direction: 'asc' | 'desc' | null }>({ key: 'created_at', direction: 'desc' });

  useEffect(() => {
    setCurrentPage(1);
    setSelectedId(null);
  }, [searchTerm, filterCategory, filterDate, filterYear]);

  const formatDateTh = (isoDate: string) => {
    if (!isoDate) return "-";
    const date = new Date(isoDate);
    return date.toLocaleDateString('th-TH', { year: 'numeric', month: '2-digit', day: '2-digit' });
  };

  // ==========================================
  // 3. Data Fetching
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
        if (USE_MOCK_DATA) {
          setTimeout(() => { if(isMounted) { setItems([]); setLoading(false); } }, 800);
          return;
        }

        const response = await api.get(`/awards/search`);
        
        const fetchedData = response.data?.data || response.data;
        const rawData = Array.isArray(fetchedData) ? fetchedData : [];

        const mappedData = rawData.map((item: any) => {
            const isOrgNominated = item.org_name && item.org_name.trim() !== "";
            return {
                ...item,
                award_type_name: item.award_type,
                is_organization_nominated: isOrgNominated, 
                organization_name: item.org_name 
            };
        });

        const TARGET_STATUS_ID = 8; 
        const filteredData = mappedData.filter((item: any) => item.form_status === TARGET_STATUS_ID);

        if (isMounted) setItems(filteredData);
      } catch (error: any) {
        console.error("Error fetching nominations:", error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchAwardTypes();
    fetchData();
    return () => { isMounted = false; };
  }, []); 

  // ==========================================
  // 4. Filtering & Sorting Logic
  // ==========================================
  const processedData = useMemo(() => {
    let filtered = items;
    
    if (searchTerm) {
      const lowerTerm = searchTerm.toLowerCase();
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

    if (filterDate) {
      const filterTime = new Date(filterDate).setHours(23, 59, 59, 999);
      filtered = filtered.filter(item => new Date(item.created_at).getTime() <= filterTime);
    }
    
    if (sortConfig.key) {
      filtered.sort((a: any, b: any) => {
        let valA = sortConfig.key ? a[sortConfig.key] : '';
        let valB = sortConfig.key ? b[sortConfig.key] : '';
        if (sortConfig.key === 'student_firstname') {
          valA = `${a.student_firstname} ${a.student_lastname}`;
          valB = `${b.student_firstname} ${b.student_lastname}`;
        } else if (sortConfig.key === 'created_at') {
          valA = new Date(a.created_at).getTime();
          valB = new Date(b.created_at).getTime();
        }
        if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
        if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return filtered;
  }, [items, searchTerm, filterYear, filterDate, filterCategory, sortConfig]);

  const totalPages = Math.ceil(processedData.length / ITEMS_PER_PAGE);
  const currentItems = processedData.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  // ==========================================
  // Dropdown Options
  // ==========================================
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
  // 5. Handlers
  // ==========================================
  const handleSort = (key: keyof Nomination | 'award_type_name') => {
    setSortConfig(prev => {
      if (prev.key === key) return { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' };
      return { key, direction: 'asc' };
    });
  };

  // 🚨🚨 ส่วนที่แก้ไข: เพิ่มโค้ดบังคับยิง API ไปบันทึก Log เข้าตาราง 🚨🚨
  const submitVote = async (id: number, statusId: number, reason: string, studentName: string) => {
    try {
      if (!USE_MOCK_DATA) {
        const operationType = statusId === 10 ? "approve" : "reject";

        // 1. ส่งผลโหวตไปจัดการสถานะหลัก
        await api.post(`/awards/committee/vote/${id}`, { 
           operation: operationType,
           reason: reason // แนบเหตุผลไปด้วยเผื่อหลังบ้านต้องการ
        });

        // 2. ยิงเข้าตาราง Approval Logs ตรงๆ (ตามที่หน้าอื่นทำ)
        try {
            await api.post(`/awards/approval-logs`, {
                form_id: id,
                operation: operationType,
                comment: reason,
                reason: reason
            });
        } catch (logErr) {
            console.warn("ไม่สามารถบันทึกเข้าตาราง Log ได้ (อาจจะชื่อ Endpoint ผิด):", logErr);
            // ให้มันทำงานต่อไปได้แม้ Log จะพัง
        }
      }

      setItems(prev => prev.filter(c => c.form_id !== id));
      setSelectedId(null);
      setIsRejectModalOpen(false);
      Swal.fire({ toast: true, position: 'top-end', showConfirmButton: false, timer: 3000, icon: reason.length > 0 ? 'info' : 'success', title: 'บันทึกผลสำเร็จ', text: `จัดการข้อมูลของ: ${studentName} เรียบร้อย` });
    } catch (error) {
      Swal.fire({ icon: 'error', title: 'เกิดข้อผิดพลาด', text: 'ดำเนินการไม่สำเร็จ โปรดลองอีกครั้ง' });
    }
  };

  const getDisplayName = (item: Nomination) => {
    if (!item.student_lastname || item.student_lastname === "-") return item.student_firstname || "-";
    return `${item.student_firstname || ""} ${item.student_lastname || ""}`.trim();
  };

  const handleApprove = async () => {
    if (selectedId === null) return;
    const selectedItem = items.find(c => c.form_id === selectedId);
    if (!selectedItem) return;
    const displayName = getDisplayName(selectedItem);
    const result = await Swal.fire({ title: `ยืนยันการ "เห็นชอบ"?`, html: `ยืนยันความเห็นชอบให้กับ <b>${displayName}</b>`, icon: 'question', showCancelButton: true, confirmButtonText: 'ยืนยัน', cancelButtonText: 'ยกเลิก', confirmButtonColor: '#10B981' });
    
    if (result.isConfirmed) {
      const NEXT_STATUS_ID = 10; 
      await submitVote(selectedId, NEXT_STATUS_ID, "", displayName);
    }
  };

  const handleConfirmReject = async () => {
    if (!rejectReason.trim()) return Swal.fire({ icon: 'warning', title: 'กรุณาระบุเหตุผล' });
    const selectedItem = items.find(c => c.form_id === selectedId);
    if (selectedId && selectedItem) {
      const displayName = getDisplayName(selectedItem);
      const REJECT_STATUS_ID = 11; 
      await submitVote(selectedId, REJECT_STATUS_ID, rejectReason, displayName);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 p-6 lg:p-10 font-sans pb-24">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header Section */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="bg-white/70 backdrop-blur-xl border border-white shadow-sm rounded-3xl p-8 relative z-[50]">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-600 flex items-center gap-3">
                <CheckCircle2 className="w-8 h-8 text-emerald-500" /> พิจารณาคัดเลือกนิสิตดีเด่น
              </h1>
              <p className="text-slate-500 mt-2 font-medium flex items-center gap-2">
                <Building2 className="w-4 h-4" /> สำหรับคณะกรรมการส่วนกลาง
              </p>
            </div>
          </div>

          {/* Filters Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-8 relative z-[100]">
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none"><Search className="h-4 w-4 text-slate-400" /></div>
              <input type="text" placeholder="ค้นหาชื่อ หรือ รหัสนิสิต" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-white/80 border border-slate-200/80 rounded-2xl px-4 py-3 pl-10 text-sm outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all shadow-sm font-medium placeholder:text-slate-400" />
            </div>
            
            <div className="relative group">
               <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none z-10"><Calendar className="h-4 w-4 text-slate-400 group-focus-within:text-emerald-500 transition-colors" /></div>
              <input type="date" value={filterDate} onChange={(e) => setFilterDate(e.target.value)} className="w-full bg-white/80 border border-slate-200/80 rounded-2xl px-4 py-3 pl-10 text-sm font-medium text-slate-600 outline-none cursor-pointer focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-400 transition-all shadow-sm" />
            </div>
            
            <CustomSelect 
                value={filterCategory} 
                onChange={setFilterCategory} 
                options={awardTypeOptions} 
                icon={Award}
                placeholder="ทุกประเภทรางวัล"
            />
            
            <CustomSelect 
                value={filterYear} 
                onChange={setFilterYear} 
                options={yearOptions} 
                icon={GraduationCap}
                placeholder="ทุกระดับชั้นปี"
            />
          </div>
        </motion.div>

        {/* Data Table */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-visible relative z-10">
          <div className="overflow-x-auto min-h-[400px]">
            <table className="w-full text-left border-collapse min-w-[900px]">
              <thead>
                <tr className="bg-slate-50/80 text-slate-500 text-xs font-bold uppercase tracking-wider border-b border-slate-200">
                  <th className="p-5 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort('student_firstname')}>
                    <div className="flex items-center gap-1">ชื่อ-นามสกุล {sortConfig.key === 'student_firstname' ? (sortConfig.direction === 'asc' ? <ArrowUp className="w-3 h-3 text-emerald-500"/> : <ArrowDown className="w-3 h-3 text-emerald-500"/>) : <ArrowUpDown className="w-3 h-3 text-slate-300"/>}</div>
                  </th>
                  <th className="p-5 cursor-pointer hover:bg-slate-100 transition-colors text-center" onClick={() => handleSort('student_number')}>
                    <div className="flex items-center justify-center gap-1">รหัสนิสิต {sortConfig.key === 'student_number' ? (sortConfig.direction === 'asc' ? <ArrowUp className="w-3 h-3 text-emerald-500"/> : <ArrowDown className="w-3 h-3 text-emerald-500"/>) : <ArrowUpDown className="w-3 h-3 text-slate-300"/>}</div>
                  </th>
                  <th className="p-5 cursor-pointer hover:bg-slate-100 transition-colors text-center" onClick={() => handleSort('award_type_name')}>
                     <div className="flex items-center justify-center gap-1">รางวัล {sortConfig.key === 'award_type_name' ? (sortConfig.direction === 'asc' ? <ArrowUp className="w-3 h-3 text-emerald-500"/> : <ArrowDown className="w-3 h-3 text-emerald-500"/>) : <ArrowUpDown className="w-3 h-3 text-slate-300"/>}</div>
                  </th>
                  <th className="p-5 text-center">ผู้เสนอชื่อ</th>
                  <th className="p-5 cursor-pointer hover:bg-slate-100 transition-colors text-center" onClick={() => handleSort('created_at')}>
                     <div className="flex items-center justify-center gap-1">วันที่ส่ง {sortConfig.key === 'created_at' ? (sortConfig.direction === 'asc' ? <ArrowUp className="w-3 h-3 text-emerald-500"/> : <ArrowDown className="w-3 h-3 text-emerald-500"/>) : <ArrowUpDown className="w-3 h-3 text-slate-300"/>}</div>
                  </th>
                  <th className="p-5 text-center">สถานะ</th>
                  <th className="p-5 text-center">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {loading ? (
                  [1, 2, 3, 4, 5].map((i) => (
                    <tr key={i} className="animate-pulse border-b border-slate-100">
                      <td colSpan={7} className="p-5"><div className="h-4 bg-slate-200 rounded w-full"></div></td>
                    </tr>
                  ))
                ) : currentItems.length === 0 ? (
                  <tr><td colSpan={7} className="py-32 text-center text-slate-400 font-medium">ไม่พบรายการรอพิจารณา</td></tr>
                ) : (
                  currentItems.map((item, index) => (
                    <motion.tr key={item.form_id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: index * 0.05 }} onClick={() => setSelectedId(item.form_id)} className={`transition-colors cursor-pointer group ${selectedId === item.form_id ? "bg-emerald-50/50" : "hover:bg-slate-50"}`}>
                      <td className="p-5">
                        <div className="flex items-center gap-3">
                           <div className={`w-2 h-2 rounded-full shrink-0 ${selectedId === item.form_id ? 'bg-emerald-500' : 'bg-transparent'}`}></div>
                           <div><p className="text-sm font-bold text-slate-800">{getDisplayName(item)}</p><p className="text-xs text-slate-500">{item.student_lastname === "-" ? 'หน่วยงาน' : `ปี ${item.student_year || "-"}`}</p></div>
                        </div>
                      </td>
                      <td className="p-5 text-sm text-center text-slate-600 font-mono">{item.student_lastname === "-" ? "-" : (item.student_number || "-")}</td>
                      <td className="p-5 text-center"><span className="inline-flex items-center px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-medium border border-slate-200">{item.award_type_name || "-"}</span></td>
                      <td className="p-5 text-center">
                          {item.is_organization_nominated ? (<span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">องค์กร: {item.organization_name}</span>) : (<span className="text-xs font-medium text-slate-500 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">เสนอตัวเอง</span>)}
                      </td>
                      <td className="p-5 text-sm text-center text-slate-500">{formatDateTh(item.created_at)}</td>
                      <td className="p-5 text-center"><span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-600 border border-amber-200"><Clock className="w-3.5 h-3.5" /> รอพิจารณา</span></td>
                      <td className="p-5 text-center" onClick={(e) => e.stopPropagation()}><button onClick={() => { setModalData(item); setIsDetailModalOpen(true); }} className="p-2 rounded-xl text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-all"><Eye className="w-5 h-5" /></button></td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Footer Actions */}
          <div className="bg-slate-50 border-t border-slate-200 p-5 flex flex-col md:flex-row justify-between items-center gap-4 rounded-b-3xl">
            <div className="flex items-center gap-2">
              <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1} className="p-2 rounded-xl bg-white border border-slate-200 disabled:opacity-50 shadow-sm"><ChevronLeft className="w-4 h-4" /></button>
              <span className="text-sm font-medium text-slate-600 bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm">หน้า {currentPage} จาก {totalPages || 1}</span>
              <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages || totalPages === 0} className="p-2 rounded-xl bg-white border border-slate-200 disabled:opacity-50 shadow-sm"><ChevronRight className="w-4 h-4" /></button>
            </div>

            <div className="flex items-center gap-3">
              <button onClick={() => { setRejectReason(""); setIsRejectModalOpen(true); }} disabled={selectedId === null} className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold border-2 transition-all ${selectedId === null ? "bg-slate-100 text-slate-400 cursor-not-allowed" : "bg-white border-rose-100 text-rose-600 hover:bg-rose-50 hover:border-rose-200"}`}><XCircle className="w-4 h-4" /> ไม่เห็นชอบ</button>
              <button onClick={handleApprove} disabled={selectedId === null} className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold text-white transition-all shadow-lg ${selectedId === null ? "bg-slate-300 cursor-not-allowed" : "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20"}`}><CheckCircle2 className="w-4 h-4" /> เห็นชอบ</button>
            </div>
          </div>
        </motion.div>

        {/* Modal: Nomination Detail */}
        <NominationDetailModal isOpen={isDetailModalOpen} onClose={() => setIsDetailModalOpen(false)} data={modalData} faculties={[]} departments={[]} />

        {/* Modal: Reject Reason */}
        <AnimatePresence>
          {isRejectModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsRejectModalOpen(false)} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
              <motion.div variants={modalVariants} initial="hidden" animate="show" exit="exit" className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-100">
                <div className="bg-rose-50/50 px-6 py-5 border-b border-rose-100 flex items-center justify-between">
                  <h3 className="text-xl font-bold text-rose-800 flex items-center gap-2"><AlertCircle className="w-6 h-6 text-rose-500" /> ระบุเหตุผล "ไม่เห็นชอบ"</h3>
                  <button onClick={() => setIsRejectModalOpen(false)} className="text-rose-400 hover:text-rose-600 bg-white p-1.5 rounded-full hover:bg-rose-100 transition-colors"><X className="w-5 h-5"/></button>
                </div>
                <div className="p-6">
                  <label className="block text-sm font-medium text-slate-700 mb-2">เหตุผลที่ตีกลับเอกสาร <span className="text-rose-500">*</span></label>
                  <textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} className="w-full border border-slate-300 rounded-xl p-4 text-sm outline-none transition-all h-32 resize-none bg-slate-50/50 focus:ring-4 focus:ring-rose-100 focus:border-rose-400" placeholder="ระบุเหตุผล..." autoFocus />
                  <div className="mt-6 flex justify-end gap-3">
                    <button onClick={() => setIsRejectModalOpen(false)} className="px-5 py-2.5 rounded-xl text-slate-600 hover:bg-slate-100 font-medium">ยกเลิก</button>
                    <button onClick={handleConfirmReject} className="px-6 py-2.5 rounded-xl bg-rose-600 text-white font-bold hover:bg-rose-700 shadow-lg shadow-rose-600/20">ยืนยันไม่เห็นชอบ</button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}