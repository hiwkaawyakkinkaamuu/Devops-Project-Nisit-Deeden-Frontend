"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { createPortal } from "react-dom"; // ✅ Import Portal
import { motion, AnimatePresence } from "framer-motion";
import Swal from "sweetalert2";
import { z } from "zod";
import { api } from "@/lib/axios";
import { 
  Search, Calendar, CheckCircle2, XCircle, Eye, 
  Award, Building2, User, Phone, Mail, MapPin, 
  ChevronLeft, ChevronRight, FileText, ChevronDown, 
  ShieldCheck, AlertTriangle, Sparkles, Inbox,
  ArrowUp, ArrowDown, ArrowUpDown,
  AlertCircle
} from "lucide-react";

import NominationDetailModal from "@/components/Nomination-detail-modal";

// ==========================================
// 0. Configuration & Validation
// ==========================================

const USE_MOCK_DATA = false;
const ITEMS_PER_PAGE = 8;

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api";

const getFileUrl = (filePath: string) => {
  if (!filePath) return "#";
  const backendUrl = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api").replace(/\/api$/, "");
  const cleanPath = filePath.startsWith("/") ? filePath.substring(1) : filePath;
  return `${backendUrl}/${cleanPath}`;
};

const RejectionSchema = z.string().min(5, "กรุณาระบุเหตุผลอย่างน้อย 5 ตัวอักษร");

// ==========================================
// 1. Interfaces
// ==========================================

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

// ==========================================
// 2. Custom Dropdown — แก้ด้วย Portal
// ==========================================

const CustomAwardTypeDropdown = ({ value, onChange, options }: any) => {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null); // ✅ ref ของ dropdown menu

  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});

  // คำนวณตำแหน่ง dropdown ทุกครั้งที่เปิด
  useEffect(() => {
    if (isOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setDropdownStyle({
        position: "fixed",
        top: rect.bottom + 8,
        left: rect.left,
        width: rect.width,
        zIndex: 99999,
      });
    }
  }, [isOpen]);

  // ปิด dropdown เมื่อคลิกข้างนอก (ต้องไม่อยู่ใน trigger และไม่อยู่ใน menu)
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      const inTrigger = triggerRef.current?.contains(target);
      const inMenu = menuRef.current?.contains(target);
      if (!inTrigger && !inMenu) setIsOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  // ✅ ปิด dropdown เมื่อ scroll เฉพาะนอก dropdown menu เท่านั้น
  // ถ้า scroll เกิดใน menuRef (เลื่อนดูตัวเลือก) → ไม่ปิด
  useEffect(() => {
    if (!isOpen) return;
    const handleScroll = (e: Event) => {
      if (menuRef.current?.contains(e.target as Node)) return; // scroll ใน menu → ไม่ปิด
      setIsOpen(false); // scroll นอก menu → ปิด
    };
    window.addEventListener("scroll", handleScroll, true);
    return () => window.removeEventListener("scroll", handleScroll, true);
  }, [isOpen]);

  const selectedLabel = value === "all" ? "ทุกประเภทรางวัล" : value;

  // ✅ Portal target — render dropdown menu ออกไปที่ body โดยตรง
  // หลุดพ้นจาก stacking context ของ backdrop-blur และ overflow ทุกชั้น
  const dropdownMenu = (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={menuRef} // ✅ ผูก ref เพื่อให้ scroll listener รู้ว่า scroll อยู่ใน menu หรือเปล่า
          initial={{ opacity: 0, y: -8, filter: "blur(4px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          exit={{ opacity: 0, y: -8, filter: "blur(4px)" }}
          transition={{ duration: 0.18 }}
          style={dropdownStyle}
          className="bg-white/95 backdrop-blur-xl border border-slate-100 rounded-2xl shadow-2xl overflow-hidden py-2 max-h-60 overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-slate-200 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-slate-300"
        >
          <div
            onClick={() => { onChange("all"); setIsOpen(false); }}
            className={`px-4 py-3 cursor-pointer transition-all duration-200 text-sm font-medium flex items-center justify-between
              ${value === "all" ? "bg-blue-50 text-blue-600" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"}
            `}
          >
            ทุกประเภทรางวัล
            {value === "all" && <CheckCircle2 size={16} className="text-blue-500" />}
          </div>
          {options.map((type: string, i: number) => (
            <div
              key={i}
              onClick={() => { onChange(type); setIsOpen(false); }}
              className={`px-4 py-3 cursor-pointer transition-all duration-200 text-sm font-medium truncate flex items-center justify-between
                ${value === type ? "bg-blue-50 text-blue-600" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"}
              `}
            >
              {type}
              {value === type && <CheckCircle2 size={16} className="text-blue-500" />}
            </div>
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    // ✅ ไม่ต้องใส่ z-index บน wrapper อีกต่อไป เพราะ menu ถูก portal ไป body แล้ว
    <div className="relative w-full sm:w-64" ref={triggerRef}>
      <div
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center justify-between w-full pl-11 pr-4 py-3 bg-white/80 backdrop-blur-sm border rounded-2xl cursor-pointer transition-all duration-300 shadow-sm
          ${isOpen ? "border-blue-400 ring-4 ring-blue-500/10" : "border-slate-200/80 hover:border-slate-300"}
        `}
      >
        <Award
          className={`w-4 h-4 absolute left-4 top-3.5 transition-colors ${isOpen ? "text-blue-500" : "text-slate-400"}`}
        />
        <span className={`text-sm font-medium truncate ${value === "all" ? "text-slate-500" : "text-slate-800"}`}>
          {selectedLabel}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-slate-400 transition-transform duration-300 ${isOpen ? "rotate-180 text-blue-500" : ""}`}
        />
      </div>

      {/* ✅ Portal: render ออกไปที่ document.body ทันที ไม่ถูก clip โดย overflow หรือ stacking context ใดๆ */}
      {typeof document !== "undefined" && createPortal(dropdownMenu, document.body)}
    </div>
  );
};

// ==========================================
// 3. Main Component
// ==========================================

export default function SDDVerifyPage() {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<Nomination[]>([]);
  
  // Master Data
  const [faculties, setFaculties] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [campuses, setCampuses] = useState<any[]>([]);
  const [awardTypes, setAwardTypes] = useState<string[]>([]);

  // Search & Filter & Sort
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState<{ key: keyof Nomination | 'award_type_name' | null, direction: 'asc' | 'desc' | null }>({ key: 'created_at', direction: 'desc' });
  
  // Modal State
  const [selectedItem, setSelectedItem] = useState<Nomination | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRejectMode, setIsRejectMode] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  // ==========================================
  // Fetch Data
  // ==========================================
  useEffect(() => {
    let isMounted = true;

    const fetchMasterData = async () => {
        try {
            const [facRes, deptRes, campRes, typeRes] = await Promise.all([
                api.get(`${API_BASE_URL}/faculty`),
                api.get(`${API_BASE_URL}/department`),
                api.get(`${API_BASE_URL}/campus`),
                api.get(`${API_BASE_URL}/awards/types`)
            ]);
            if(isMounted) {
                setFaculties(facRes.data?.data || facRes.data || []);
                setDepartments(deptRes.data?.data || deptRes.data || []);
                setCampuses(campRes.data?.data || campRes.data || []);
                setAwardTypes(typeRes.data?.data || typeRes.data || []);
            }
        } catch (error) { console.error("Error fetching master data", error); }
    };

    const fetchData = async () => {
      setLoading(true);
      try {
        if (USE_MOCK_DATA) return;

        const params: Record<string, string> = { limit: "200" };
        if (searchTerm) params.keyword = searchTerm;
        if (filterType !== "all") params.award_type = filterType;

        const response = await api.get(`${API_BASE_URL}/awards/search`, { params });
        
        const fetchedData = response.data?.data || response.data;
        const rawData = Array.isArray(fetchedData) ? fetchedData : [];

        const mappedData = rawData.map((item: any) => ({
            ...item,
            award_type_name: item.award_type,
            is_organization_nominated: item.org_name && item.org_name.trim() !== "", 
            organization_name: item.org_name 
        }));

        const TARGET_STATUS_ID = 6; 
        const filteredData = mappedData.filter((item: any) => item.form_status === TARGET_STATUS_ID);

        if (isMounted) setItems(filteredData);
      } catch (error) {
        console.error("API Error:", error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchMasterData();
    fetchData();
    return () => { isMounted = false; };
  }, [searchTerm, filterType]);

  useEffect(() => {
    if (isModalOpen && selectedItem) {
      setRejectReason("");
      setIsRejectMode(false);
    }
  }, [isModalOpen, selectedItem]);

  // ==========================================
  // Logic & Sorting
  // ==========================================
  const processedData = useMemo(() => {
    let filtered = items;
    
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
  }, [items, sortConfig]);

  const totalPages = Math.ceil(processedData.length / ITEMS_PER_PAGE);
  const paginatedData = processedData.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const handleSort = (key: keyof Nomination | 'award_type_name') => {
    setSortConfig(prev => {
      if (prev.key === key) return { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' };
      return { key, direction: 'asc' };
    });
  };

  // ==========================================
  // Handlers & Helpers
  // ==========================================
  const getDisplayName = (item: Nomination) => {
    if (!item.student_lastname || item.student_lastname === "-") return item.student_firstname || "-";
    return `${item.student_firstname || ""} ${item.student_lastname || ""}`.trim();
  };

  const getCampusName = (id: number) => {
    const c = campuses.find(c => c.campusID === id || c.campus_id === id || c.id === id);
    return c ? (c.campusName || c.campus_name || c.name) : "-";
  };

  const getFacultyName = (id: number) => {
    const f = faculties.find(f => f.faculty_id === id || f.facultyID === id || f.id === id);
    return f ? (f.faculty_name || f.facultyName || f.name) : "-";
  };
  
  const getDepartmentName = (id: number) => {
    const d = departments.find(d => d.department_id === id || d.departmentID === id || d.id === id);
    return d ? (d.department_name || d.departmentName || d.name) : "-";
  };

  const handleApprove = async () => {
    if (!selectedItem) return;
    const studentName = getDisplayName(selectedItem);

    const result = await Swal.fire({
      title: 'ยืนยันความถูกต้อง?',
      html: `คุณได้ตรวจสอบความถูกต้องของ <b>${studentName}</b><br/>และพร้อมส่งให้คณะกรรมการพิจารณาใช่หรือไม่?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'ยืนยันการส่งต่อ',
      cancelButtonText: 'ยกเลิก',
      confirmButtonColor: '#3b82f6',
      cancelButtonColor: '#94a3b8',
      customClass: { popup: 'rounded-3xl' }
    });

    if (result.isConfirmed) {
      try {
        await api.put(`${API_BASE_URL}/awards/form-status/change/${selectedItem.form_id}`, { 
            form_status: 8, 
            reject_reason: "" 
        });

        setItems(prev => prev.filter(c => c.form_id !== selectedItem.form_id));
        setIsModalOpen(false);
        Swal.fire({ toast: true, position: 'top-end', showConfirmButton: false, timer: 3000, icon: 'success', title: 'ตรวจสอบและส่งต่อสำเร็จ' });
      } catch (err) {
        Swal.fire('Error', 'เกิดข้อผิดพลาดในการบันทึกสถานะ', 'error');
      }
    }
  };

  const handleReject = async () => {
    if (!selectedItem) return;

    const validation = RejectionSchema.safeParse(rejectReason);
    if (!validation.success) {
      return Swal.fire({ icon: 'warning', title: 'กรุณาระบุเหตุผล', text: validation.error.issues[0].message, confirmButtonColor: '#f43f5e' });
    }

    try {
      await api.put(`${API_BASE_URL}/awards/form-status/change/${selectedItem.form_id}`, { 
          form_status: 9, 
          reject_reason: rejectReason 
      });

      setItems(prev => prev.filter(c => c.form_id !== selectedItem.form_id));
      setIsModalOpen(false);
      Swal.fire({ toast: true, position: 'top-end', showConfirmButton: false, timer: 3000, icon: 'info', title: 'ส่งกลับแก้ไขสำเร็จ' });
    } catch (err) {
      Swal.fire('Error', 'เกิดข้อผิดพลาด', 'error');
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans relative">
      
      {/* 🔮 Abstract Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-400/10 blur-[120px] rounded-full" />
          <div className="absolute bottom-[-10%] right-[-5%] w-[30%] h-[50%] bg-indigo-400/10 blur-[120px] rounded-full" />
      </div>

      <style jsx global>{`
          @keyframes fadeInUp { from { opacity: 0; transform: translateY(15px); } to { opacity: 1; transform: translateY(0); } }
          .animate-fade-in-up { animation: fadeInUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
          ::-webkit-scrollbar { width: 8px; height: 8px; }
          ::-webkit-scrollbar-track { background: transparent; }
          ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
          ::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
      `}</style>

      {/* 📄 Main Content Area */}
      <div className="p-6 pt-24 lg:p-10 lg:pt-28 pb-32 relative z-10">
        <div className="max-w-7xl mx-auto space-y-8">
            
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white/70 backdrop-blur-xl p-8 rounded-[32px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/80 animate-fade-in-up">
              <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-blue-50 text-blue-600 text-xs font-bold mb-3 border border-blue-200 shadow-sm">
                      <Sparkles className="w-4 h-4" />ระบบตรวจสอบความถูกต้อง
                  </div>
                  <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
                    ตรวจสอบความถูกต้อง
                  </h1>
                  <p className="text-slate-500 mt-1 text-sm font-medium flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-blue-400" /> กองพัฒนานิสิต - คัดกรองและประเมินผลงาน
                  </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
                  {/* Search Input */}
                  <div className="relative group w-full sm:w-64">
                      <Search className="w-4 h-4 absolute left-4 top-3.5 text-slate-400 group-focus-within:text-blue-500 transition-colors z-10" />
                      <input 
                          type="text" 
                          placeholder="ค้นหาชื่อ, รหัสนิสิต..." 
                          className="w-full pl-11 pr-4 py-3 bg-white/80 backdrop-blur-sm border border-slate-200/80 rounded-2xl outline-none text-sm font-medium focus:ring-4 focus:ring-blue-500/10 focus:border-blue-400 transition-all shadow-sm text-slate-800 placeholder:text-slate-400"
                          value={searchTerm}
                          onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                      />
                  </div>
                  
                  {/* ✅ Dropdown — ใช้ Portal แล้ว ไม่ถูก clip อีก */}
                  <CustomAwardTypeDropdown 
                      value={filterType} 
                      onChange={(val: string) => { setFilterType(val); setCurrentPage(1); }} 
                      options={awardTypes} 
                  />
              </div>
            </div>

            {/* Table */}
            <div className="bg-white/90 backdrop-blur-xl rounded-[32px] shadow-[0_10px_40px_rgb(0,0,0,0.05)] border border-slate-100 flex flex-col min-h-[500px] overflow-hidden animate-fade-in-up" style={{ animationDelay: '100ms' }}>
            <div className="overflow-x-auto flex-1">
                <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="bg-slate-50/50 border-b border-slate-100 text-[11px] uppercase text-slate-500 font-extrabold tracking-widest">
                    <th className="p-6 w-16 text-center">#</th>
                    <th className="p-6 cursor-pointer hover:bg-slate-100/50 transition-colors" onClick={() => handleSort('student_firstname')}>
                        <div className="flex items-center gap-1.5">ชื่อ-นามสกุล / รหัสนิสิต {sortConfig.key === 'student_firstname' ? (sortConfig.direction === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-blue-500"/> : <ArrowDown className="w-3.5 h-3.5 text-blue-500"/>) : <ArrowUpDown className="w-3.5 h-3.5 text-slate-300"/>}</div>
                    </th>
                    <th className="p-6">วิทยาเขต / คณะ / สาขาวิชา</th>
                    <th className="p-6 cursor-pointer hover:bg-slate-100/50 transition-colors text-center" onClick={() => handleSort('award_type_name')}>
                        <div className="flex items-center justify-center gap-1.5">รางวัลที่เสนอ {sortConfig.key === 'award_type_name' ? (sortConfig.direction === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-blue-500"/> : <ArrowDown className="w-3.5 h-3.5 text-blue-500"/>) : <ArrowUpDown className="w-3.5 h-3.5 text-slate-300"/>}</div>
                    </th>
                    <th className="p-6 text-center">สถานะการตรวจสอบ</th>
                    <th className="p-6 text-center">จัดการ</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 bg-transparent text-sm">
                    {loading ? (
                    [...Array(5)].map((_, i) => (
                        <tr key={i} className="animate-pulse">
                            <td className="p-6"><div className="h-4 bg-slate-200 rounded-md w-8 mx-auto"></div></td>
                            <td className="p-6"><div className="h-4 bg-slate-200 rounded-md w-32 mb-2"></div><div className="h-3 bg-slate-100 rounded-md w-20"></div></td>
                            <td className="p-6"><div className="h-4 bg-slate-200 rounded-md w-24 mb-2"></div><div className="h-3 bg-slate-100 rounded-md w-20"></div></td>
                            <td className="p-6"><div className="h-6 bg-slate-200 rounded-full w-28 mx-auto"></div></td>
                            <td className="p-6"><div className="h-6 bg-slate-200 rounded-full w-24 mx-auto"></div></td>
                            <td className="p-6"><div className="h-10 bg-slate-200 rounded-xl w-28 mx-auto"></div></td>
                        </tr>
                    ))
                    ) : paginatedData.length === 0 ? (
                    <tr>
                        <td colSpan={6} className="p-20 text-center">
                            <div className="flex flex-col items-center justify-center text-slate-400">
                                <div className="bg-blue-50 p-5 rounded-full mb-4 shadow-sm border border-blue-100">
                                <Inbox className="w-12 h-12 text-blue-300" strokeWidth={1.5} />
                                </div>
                                <p className="text-xl font-bold text-slate-700">ไม่มีรายการรอตรวจสอบ</p>
                                <p className="text-sm mt-2 font-medium text-slate-500">เอกสารทั้งหมดได้รับการดำเนินการเรียบร้อยแล้ว</p>
                            </div>
                        </td>
                    </tr>
                    ) : (
                    paginatedData.map((item, index) => (
                        <tr 
                            key={item.form_id} 
                            className="group hover:bg-blue-50/30 transition-all duration-300 animate-fade-in-up cursor-pointer"
                            style={{ opacity: 0, animationDelay: `${index * 50}ms`, animationFillMode: 'forwards' }}
                            onClick={() => { setSelectedItem(item); setIsModalOpen(true); setIsRejectMode(false); }}
                        >
                        <td className="p-6 text-center text-slate-300 font-mono text-xs">{(currentPage - 1) * ITEMS_PER_PAGE + index + 1}</td>
                        <td className="p-6 align-middle">
                            <div className="flex items-center gap-3">
                            <div className="w-2 h-2 rounded-full shrink-0 bg-slate-300 group-hover:bg-blue-500 transition-colors"></div>
                            <div>
                                <div className="font-extrabold text-slate-800 text-[15px] group-hover:text-blue-700 transition-colors">{getDisplayName(item)}</div>
                                <div className="text-[12px] text-slate-500 mt-1 font-medium tracking-wide">
                                    {item.student_lastname === "-" ? <span className="text-blue-500 font-bold bg-blue-50 px-2 py-0.5 rounded">องค์กรภายนอก</span> : <span className="font-mono bg-slate-100 px-2 py-0.5 rounded-md text-slate-600">{item.student_number}</span>}
                                </div>
                            </div>
                            </div>
                        </td>
                        <td className="p-6 text-sm text-slate-600 align-middle">
                            <div className="font-extrabold text-blue-700 text-[11px] mb-1 bg-blue-50/80 w-fit px-2 py-0.5 rounded-md border border-blue-100">
                                วิทยาเขต{getCampusName(item.campus_id)}
                            </div>
                            <div className="font-bold text-slate-700">{getFacultyName(item.faculty_id)}</div>
                            <div className="text-xs text-slate-400 mt-0.5 font-medium">{getDepartmentName(item.department_id)}</div>
                        </td>
                        <td className="p-6 text-center align-middle">
                            <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-slate-700 text-xs font-bold border border-slate-200 bg-white shadow-sm group-hover:border-blue-200 transition-colors">
                            {item.award_type_name || item.award_type}
                            </span>
                        </td>
                        <td className="p-6 text-center align-middle">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-600 border border-amber-200 shadow-sm">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                                รอการตรวจสอบ
                            </span>
                        </td>
                        <td className="p-6 text-center align-middle" onClick={(e) => e.stopPropagation()}>
                            <button 
                                onClick={() => { setSelectedItem(item); setIsModalOpen(true); setIsRejectMode(false); }}
                                className="bg-white hover:bg-blue-600 hover:text-white text-slate-600 border border-slate-200 hover:border-blue-600 px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm hover:shadow-md active:scale-95 flex items-center gap-2 mx-auto"
                            >
                                <Eye size={14} /> ตรวจสอบเอกสาร
                            </button>
                        </td>
                        </tr>
                    ))
                    )}
                </tbody>
                </table>
            </div>

            {/* Pagination Footer */}
            <div className="flex justify-between items-center p-5 border-t border-slate-100 bg-slate-50/80">
                <div className="flex items-center gap-2">
                    <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1} className="flex items-center justify-center p-2.5 rounded-xl bg-white border border-slate-200 text-slate-500 hover:bg-slate-100 disabled:opacity-50 transition-all shadow-sm">
                        <ChevronLeft size={16} />
                    </button>
                    <span className="text-sm font-bold text-slate-600 px-5 py-2.5 bg-white rounded-xl border border-slate-200 shadow-sm">
                        หน้า {currentPage} จาก {Math.max(totalPages, 1)}
                    </span>
                    <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages || totalPages === 0} className="flex items-center justify-center p-2.5 rounded-xl bg-white border border-slate-200 text-slate-500 hover:bg-slate-100 disabled:opacity-50 transition-all shadow-sm">
                        <ChevronRight size={16} />
                    </button>
                </div>
                <div className="text-[13px] text-slate-500 font-bold bg-white px-5 py-2.5 rounded-xl border border-slate-200 shadow-sm hidden sm:block">
                    พบข้อมูลรอตรวจสอบ <span className="text-blue-600 text-[14px] ml-1">{processedData.length}</span> รายการ
                </div>
            </div>
            </div>
        </div>
      </div>

      {/* Modal Section */}
      <AnimatePresence>
        {isModalOpen && selectedItem && !isRejectMode && (
           <NominationDetailModal 
               isOpen={isModalOpen} 
               onClose={() => setIsModalOpen(false)} 
               data={selectedItem} 
               faculties={faculties}
               departments={departments}
           />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isModalOpen && selectedItem && !isRejectMode && (
           <div className="fixed bottom-0 left-0 w-full z-[10000] p-6 pointer-events-none flex justify-center">
               <motion.div 
                   initial={{ y: 100, opacity: 0 }} 
                   animate={{ y: 0, opacity: 1 }} 
                   exit={{ y: 100, opacity: 0 }}
                   className="bg-white/90 backdrop-blur-xl p-4 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.15)] border border-slate-200 pointer-events-auto flex items-center gap-4"
               >
                    <button onClick={() => setIsRejectMode(true)} className="px-8 py-3.5 rounded-xl text-sm font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-transparent transition-colors shadow-sm">
                        ปฏิเสธฟอร์ม
                    </button>
                    <button onClick={handleApprove} className="px-10 py-3.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:shadow-[0_8px_20px_rgba(37,99,235,0.3)] hover:-translate-y-0.5 transition-all flex items-center gap-2">
                        บันทึกและส่งต่อ <ChevronRight size={16}/>
                    </button>
               </motion.div>
           </div>
        )}
      </AnimatePresence>

      {/* Reject Reason Modal */}
      <AnimatePresence>
        {isRejectMode && selectedItem && (
          <div className="fixed inset-0 z-[10001] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsRejectMode(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-100">
                <div className="bg-rose-50/50 px-6 py-5 border-b border-rose-100 flex items-center justify-between">
                    <h3 className="text-xl font-bold text-rose-800 flex items-center gap-2"><AlertCircle className="w-6 h-6 text-rose-500" /> ระบุเหตุผล "ไม่เห็นชอบ"</h3>
                    <button onClick={() => setIsRejectMode(false)} className="text-rose-400 hover:text-rose-600 bg-white p-1.5 rounded-full hover:bg-rose-100 transition-colors"><XCircle className="w-5 h-5"/></button>
                </div>
                <div className="p-6">
                    <p className="text-slate-600 font-medium mb-4 text-sm">
                        เอกสารของ <b className="text-slate-800">{getDisplayName(selectedItem)}</b> จะถูกปฏิเสธ
                    </p>
                    <label className="block text-sm font-bold text-slate-700 mb-2">เหตุผลที่ตีกลับเอกสาร <span className="text-rose-500">*</span></label>
                    <textarea 
                        value={rejectReason} 
                        onChange={(e) => setRejectReason(e.target.value)} 
                        className="w-full border border-slate-300 rounded-xl p-4 text-sm outline-none transition-all h-32 resize-none bg-slate-50/50 focus:ring-4 focus:ring-rose-100 focus:border-rose-400" 
                        placeholder="ระบุเหตุผลอย่างน้อย 5 ตัวอักษร..." 
                        autoFocus 
                    />
                    <div className="mt-6 flex justify-end gap-3">
                        <button onClick={() => setIsRejectMode(false)} className="px-5 py-2.5 rounded-xl text-slate-600 hover:bg-slate-100 font-medium">ยกเลิก</button>
                        <button onClick={handleReject} className="px-6 py-2.5 rounded-xl bg-rose-600 text-white font-bold hover:bg-rose-700 shadow-lg shadow-rose-600/20 flex items-center gap-2"><XCircle size={16}/> ยืนยันการตีกลับ</button>
                    </div>
                </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
