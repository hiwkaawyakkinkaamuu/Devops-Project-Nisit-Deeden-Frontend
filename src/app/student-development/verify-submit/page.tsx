"use client";

import { useState, useEffect, useMemo } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";

// ==========================================
// 0. Configuration & Service Layer
// ==========================================

const USE_MOCK_DATA = true; // Set FALSE to use Real API
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";
const ITEMS_PER_PAGE = 6;

// --- Options Constants (Staff Verification) ---
const COMPETITION_LEVELS = [
  "ระดับอุดมศึกษา",
  "ระดับชาติ",
  "ระดับนานาชาติ"
];

const ACTIVITY_CATEGORIES = [
  "ด้านวิชาการและส่งเสริมคุณลักษณะบัณฑิต",
  "ด้านกีฬาและส่งเสริมสุขภาพ",
  "ด้านบำเพ็ญประโยชน์และรักษาสิ่งแวดล้อม",
  "ด้านส่งเสริมคุณธรรมและจริยธรรม",
  "ด้านส่งเสริมศิลปะและวัฒนธรรม"
];

// --- Validation Schemas (Zod) ---
const VerificationSchema = z.object({
  competition_level: z.string().min(1, "กรุณาระบุระดับการแข่งขัน"),
  activity_category: z.string().min(1, "กรุณาระบุประเภทกิจกรรม"),
});

const RejectionSchema = z.string().min(5, "กรุณาระบุเหตุผลอย่างน้อย 5 ตัวอักษร");

// --- Interfaces ---
interface FileResponse {
  file_dir_id: number;
  file_name: string;
  file_path: string;
}

interface NominationDetail {
  prize_date?: string;
  project_name?: string;
  team_name?: string;
  award_name?: string;
  organizer?: string;
  benefit_desc?: string;
  position?: string;
  
  // Student's Selection
  criteria_innovation?: boolean;
  criteria_activity_type?: 'community' | 'competition' | 'position';
}

interface Nomination {
  form_id: number;
  student_id: number;
  student_number: string;
  student_firstname: string;
  student_lastname: string;
  faculty_name: string;
  department_name: string;
  award_type_id: number; // 1=Behavior, 2=Innovation, 3=Activity
  award_type_name: string;
  created_at: string;
  form_status_id: number;
  gpa: number;
  email: string;
  phone_number: string;
  advisor_name: string;
  student_year: number;
  date_of_birth: string;
  address: string;
  files: FileResponse[];
  detail: NominationDetail;
  
  // Staff Input Fields (Local State in Component)
  competition_level?: string;
  activity_category?: string;
}

// --- Mock Data ---
const MOCK_DATA: Nomination[] = [
    {
        form_id: 1, student_id: 101, student_number: "6610400001", student_firstname: "สมชาย", student_lastname: "รักเรียน",
        faculty_name: "คณะวิศวกรรมศาสตร์", department_name: "วิศวกรรมคอมพิวเตอร์",
        award_type_id: 2, award_type_name: "ความคิดสร้างสรรค์และนวัตกรรม", created_at: "2026-02-12T09:00:00Z", form_status_id: 1,
        gpa: 3.50, email: "somchai.r@ku.th", phone_number: "081-234-5678", advisor_name: "ดร.วิชัย", student_year: 4,
        date_of_birth: "2004-01-01", address: "หอพักใน มก.",
        files: [{ file_dir_id: 1, file_name: "project_poster.pdf", file_path: "#" }],
        detail: { 
            criteria_innovation: true,
            prize_date: "2025-12-10", 
            project_name: "Smart Farm IoT", 
            team_name: "AgriTech KU", 
            award_name: "ชนะเลิศอันดับ 1", 
            organizer: "NIA" 
        }
    },
    {
        form_id: 2, student_id: 102, student_number: "6610400002", student_firstname: "กานดา", student_lastname: "มีสุข",
        faculty_name: "คณะบริหารธุรกิจ", department_name: "การตลาด",
        award_type_id: 3, award_type_name: "กิจกรรมนอกหลักสูตร", created_at: "2026-02-11T14:30:00Z", form_status_id: 1,
        gpa: 3.85, email: "kanda.m@ku.th", phone_number: "089-876-5432", advisor_name: "ผศ.สมศรี", student_year: 3,
        date_of_birth: "2005-05-20", address: "คอนโดศุภาลัย",
        files: [{ file_dir_id: 2, file_name: "activity_log.pdf", file_path: "#" }],
        detail: { 
            criteria_activity_type: 'position', 
            position: "นายกสโมสรนิสิตคณะบริหารธุรกิจ", 
            benefit_desc: "จัดกิจกรรมรับน้องสร้างสรรค์" 
        }
    },
    {
        form_id: 3, student_id: 103, student_number: "6610400003", student_firstname: "ปิติ", student_lastname: "ยินดี",
        faculty_name: "คณะเกษตร", department_name: "พืชไร่",
        award_type_id: 3, award_type_name: "กิจกรรมนอกหลักสูตร", created_at: "2026-02-10T10:15:00Z", form_status_id: 1,
        gpa: 3.20, email: "piti.y@ku.th", phone_number: "081-112-2233", advisor_name: "อ.มานะ", student_year: 2,
        date_of_birth: "2005-08-15", address: "บ้านพักนิสิต",
        files: [],
        detail: { 
            criteria_activity_type: 'community',
            prize_date: "2025-11-05", 
            project_name: "ค่ายอาสาพัฒนาชนบท", 
            award_name: "รางวัลนิสิตจิตอาสาดีเด่น", 
            organizer: "ทบวงมหาวิทยาลัย", 
            benefit_desc: "สร้างฝายชะลอน้ำให้ชุมชน จ.น่าน" 
        }
    }
];

// --- Service Object ---
const apiService = {
  getNominations: async () => {
    if (USE_MOCK_DATA) {
      await new Promise(resolve => setTimeout(resolve, 800)); // Simulate delay
      return MOCK_DATA;
    } else {
      try {
        const res = await axios.get(`${API_BASE_URL}/nominations/verify-list`);
        return res.data;
      } catch (error) {
        throw error;
      }
    }
  },
  approveNomination: async (id: number, data: any) => {
    if (USE_MOCK_DATA) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      return { success: true };
    } else {
      const res = await axios.post(`${API_BASE_URL}/nominations/${id}/approve`, data);
      return res.data;
    }
  },
  rejectNomination: async (id: number, reason: string) => {
    if (USE_MOCK_DATA) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      return { success: true };
    } else {
      const res = await axios.post(`${API_BASE_URL}/nominations/${id}/reject`, { reason });
      return res.data;
    }
  }
};

const Toast = Swal.mixin({
  toast: true,
  position: 'top-end',
  showConfirmButton: false,
  timer: 4000,
  timerProgressBar: true,
  background: '#ffffff',
  color: '#1f2937',
  didOpen: (toast) => {
    toast.addEventListener('mouseenter', Swal.stopTimer)
    toast.addEventListener('mouseleave', Swal.resumeTimer)
  }
});

// ==========================================
// 1. Helper Components
// ==========================================

const ReadOnlyField = ({ label, value, fullWidth = false }: { label: string; value: any, fullWidth?: boolean }) => (
  <div className={`space-y-1.5 ${fullWidth ? 'col-span-2' : ''}`}>
    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">{label}</label>
    <div className="w-full bg-gray-50/50 border border-gray-100 rounded-xl px-4 py-3 text-sm text-gray-700 min-h-[46px] flex items-center">
      {value || "-"}
    </div>
  </div>
);

const CriteriaOption = ({ label, checked }: { label: string, checked: boolean }) => (
    <div className={`flex items-start gap-3 p-3 rounded-xl border transition-all ${checked ? 'bg-green-50 border-green-200 shadow-sm' : 'bg-gray-50 border-transparent opacity-60'}`}>
        <div className={`mt-0.5 w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${checked ? 'border-green-500 bg-white' : 'border-gray-400 bg-white'}`}>
            {checked && <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-scale-up"></div>}
        </div>
        <p className={`text-sm leading-relaxed ${checked ? 'text-green-900 font-bold' : 'text-gray-500'}`}>{label}</p>
    </div>
);

const StatusBadge = ({ type }: { type: number }) => {
  const config = {
    1: { bg: "bg-blue-50", text: "text-blue-600", border: "border-blue-200", label: "ความประพฤติดี" },
    2: { bg: "bg-purple-50", text: "text-purple-600", border: "border-purple-200", label: "ความคิดสร้างสรรค์และนวัตกรรม" },
    3: { bg: "bg-orange-50", text: "text-orange-600", border: "border-orange-200", label: "กิจกรรมนอกหลักสูตร" }
  } as const;
  const style = config[type as keyof typeof config];
  return <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border ${style.bg} ${style.text} ${style.border}`}>{style.label}</span>;
};

// ==========================================
// 2. Main Page Component
// ==========================================

export default function SDDVerifyPage() {
  const [candidates, setCandidates] = useState<Nomination[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  
  // Modal State
  const [selectedItem, setSelectedItem] = useState<Nomination | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRejectMode, setIsRejectMode] = useState(false);
  
  // Form State
  const [compLevel, setCompLevel] = useState("");
  const [actType, setActType] = useState("");
  const [rejectReason, setRejectReason] = useState("");

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await apiService.getNominations();
      setCandidates(data);
    } catch (error) {
      Toast.fire({ icon: 'error', title: 'โหลดข้อมูลล้มเหลว' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isModalOpen && selectedItem) {
      setCompLevel(selectedItem.competition_level || "");
      setActType(selectedItem.activity_category || "");
      setRejectReason("");
      setIsRejectMode(false);
    }
  }, [isModalOpen, selectedItem]);

  const filteredData = useMemo(() => {
    return candidates.filter(item => {
      const matchesSearch = 
        item.student_firstname.includes(searchTerm) || 
        item.student_lastname.includes(searchTerm) || 
        item.student_number.includes(searchTerm);
      const matchesType = filterType === "all" ? true : item.award_type_id.toString() === filterType;
      return matchesSearch && matchesType;
    });
  }, [candidates, searchTerm, filterType]);

  const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);
  const paginatedData = filteredData.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  // --- Handlers ---

  const handleApprove = async () => {
    if (!selectedItem) return;
    const studentName = `${selectedItem.student_firstname} ${selectedItem.student_lastname}`;

    // Advanced Validation: Check if staff fields are filled for specific award types
    if (selectedItem.award_type_id !== 1) { // Not Behavior Award
      const validation = VerificationSchema.safeParse({ competition_level: compLevel, activity_category: actType });
      if (!validation.success) {
        Swal.fire({ icon: 'warning', title: 'ข้อมูลไม่ครบถ้วน', text: validation.error.issues[0].message, confirmButtonColor: '#F59E0B' });
        return;
      }
    }

    const result = await Swal.fire({
      title: 'ยืนยันการอนุมัติ?',
      text: `ส่งรายชื่อ ${studentName} ให้คณะกรรมการพิจารณา`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'ยืนยันอนุมัติ',
      cancelButtonText: 'ยกเลิก',
      confirmButtonColor: '#10B981',
      cancelButtonColor: '#E5E7EB',
      customClass: { cancelButton: 'text-gray-600' }
    });

    if (result.isConfirmed) {
      try {
        await apiService.approveNomination(selectedItem.form_id, { competition_level: compLevel, activity_category: actType });
        setCandidates(prev => prev.filter(c => c.form_id !== selectedItem.form_id));
        setIsModalOpen(false);
        Toast.fire({ icon: 'success', title: 'บันทึกสำเร็จ', text: `ส่งต่อรายชื่อ ${studentName} เรียบร้อยแล้ว` });
      } catch (err) {
        Swal.fire('Error', 'เกิดข้อผิดพลาดในการบันทึก', 'error');
      }
    }
  };

  const handleReject = async () => {
    if (!selectedItem) return;
    const studentName = `${selectedItem.student_firstname} ${selectedItem.student_lastname}`;

    const validation = RejectionSchema.safeParse(rejectReason);
    if (!validation.success) {
      Swal.fire({ icon: 'warning', title: 'ระบุเหตุผล', text: validation.error.issues[0].message, confirmButtonColor: '#EF4444' });
      return;
    }

    try {
      await apiService.rejectNomination(selectedItem.form_id, rejectReason);
      setCandidates(prev => prev.filter(c => c.form_id !== selectedItem.form_id));
      setIsModalOpen(false);
      Toast.fire({ icon: 'info', title: 'ดำเนินการสำเร็จ', text: `ตีกลับเอกสารของ ${studentName} เรียบร้อยแล้ว` });
    } catch (err) {
      Swal.fire('Error', 'เกิดข้อผิดพลาด', 'error');
    }
  };

  const calculateAge = (dob: string) => {
      if (!dob) return "-";
      const birthDate = new Date(dob);
      const ageDifMs = Date.now() - birthDate.getTime();
      const ageDate = new Date(ageDifMs); 
      return Math.abs(ageDate.getUTCFullYear() - 1970);
  }

  // ==========================================
  // Render UI
  // ==========================================

  return (
    <div className="min-h-screen bg-[#F8F9FC] p-8 pb-32 font-sans text-gray-800">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">ตรวจสอบคุณสมบัติ</h1>
          <p className="text-gray-500 mt-1">
              {USE_MOCK_DATA && <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded mr-2">MOCK MODE</span>}
              คัดกรองเบื้องต้นโดยกองกิจการนิสิต (SDD)
          </p>
        </div>
        
        {/* Filters */}
        <div className="flex gap-3 bg-white p-2 rounded-2xl shadow-sm border border-gray-100">
             <div className="relative">
                 <svg className="w-5 h-5 absolute left-3 top-2.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                 <input 
                    type="text" 
                    placeholder="ค้นหา..." 
                    className="pl-10 pr-4 py-2 bg-transparent outline-none text-sm w-48 md:w-64"
                    value={searchTerm}
                    onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                 />
             </div>
             <div className="w-px bg-gray-200 my-1"></div>
             <select 
                className="bg-transparent outline-none text-sm px-2 cursor-pointer text-gray-600 font-medium"
                value={filterType}
                onChange={e => { setFilterType(e.target.value); setCurrentPage(1); }}
             >
                 <option value="all">ทั้งหมด</option>
                 <option value="1">ความประพฤติดี</option>
                 <option value="2">ความคิดสร้างสรรค์ฯ</option>
                 <option value="3">กิจกรรมนอกหลักสูตร</option>
             </select>
        </div>
      </div>

      {/* Table Card */}
      <div className="bg-white rounded-[24px] shadow-[0_2px_20px_rgba(0,0,0,0.04)] border border-gray-100 flex flex-col min-h-[600px]">
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100 text-xs uppercase text-gray-400 font-bold tracking-wider">
                <th className="p-6 w-16 text-center">#</th>
                <th className="p-6">นิสิต</th>
                <th className="p-6">คณะ/สาขา</th>
                <th className="p-6">ประเภท</th>
                <th className="p-6 text-center">สถานะ</th>
                <th className="p-6 text-center">จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                 [...Array(5)].map((_, i) => (
                    <tr key={i} className="animate-pulse border-b border-gray-50">
                        <td className="p-6"><div className="h-4 bg-gray-100 rounded w-8 mx-auto"></div></td>
                        <td className="p-6"><div className="h-4 bg-gray-100 rounded w-32 mb-2"></div><div className="h-3 bg-gray-50 rounded w-20"></div></td>
                        <td className="p-6"><div className="h-4 bg-gray-100 rounded w-24"></div></td>
                        <td className="p-6"><div className="h-6 bg-gray-100 rounded-lg w-20"></div></td>
                        <td className="p-6"><div className="h-6 bg-gray-100 rounded-full w-16 mx-auto"></div></td>
                        <td className="p-6"><div className="h-8 bg-gray-100 rounded-lg w-20 mx-auto"></div></td>
                    </tr>
                 ))
              ) : paginatedData.length === 0 ? (
                 <tr>
                    <td colSpan={6} className="p-20 text-center text-gray-400">ไม่พบข้อมูลที่ค้นหา</td>
                 </tr>
              ) : (
                <AnimatePresence>
                  {paginatedData.map((item, index) => (
                    <motion.tr 
                        key={item.form_id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="group hover:bg-gray-50/80 transition-colors border-b border-gray-50 last:border-0"
                    >
                      <td className="p-6 text-center text-gray-300 font-mono text-xs">{(currentPage - 1) * ITEMS_PER_PAGE + index + 1}</td>
                      <td className="p-6">
                        <div className="font-bold text-gray-800">{item.student_firstname} {item.student_lastname}</div>
                        <div className="text-xs text-gray-400 mt-1 font-mono">{item.student_number}</div>
                      </td>
                      <td className="p-6">
                        <div className="text-sm text-gray-700 font-medium">{item.faculty_name}</div>
                        <div className="text-xs text-gray-400 mt-0.5">{item.department_name}</div>
                      </td>
                      <td className="p-6">
                        <StatusBadge type={item.award_type_id} />
                      </td>
                      <td className="p-6 text-center">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-yellow-100 text-yellow-700 border border-yellow-200 shadow-sm">
                            <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 animate-pulse"></span>
                            รอตรวจสอบ
                        </span>
                      </td>
                      <td className="p-6 text-center">
                        <button 
                            onClick={() => { setSelectedItem(item); setIsModalOpen(true); }}
                            className="bg-white hover:bg-blue-600 hover:text-white text-gray-600 border border-gray-200 hover:border-blue-600 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95"
                        >
                            ตรวจสอบ
                        </button>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="flex justify-between items-center p-5 border-t border-gray-100 bg-gray-50">
             <div className="flex items-center gap-2">
                <button 
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} 
                    disabled={currentPage === 1}
                    className="flex items-center justify-center px-4 py-2 rounded-lg bg-white border border-gray-200 text-gray-500 text-sm font-bold hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
                >
                    &lt;
                </button>
                <span className="text-xs font-semibold text-gray-500 px-3 py-1.5 bg-gray-100 rounded-lg">
                    หน้า {currentPage} / {Math.max(totalPages, 1)}
                </span>
                <button 
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} 
                    disabled={currentPage === totalPages || totalPages === 0}
                    className="flex items-center justify-center px-4 py-2 rounded-lg bg-white border border-gray-200 text-gray-500 text-sm font-bold hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
                >
                    &gt;
                </button>
             </div>
        </div>
      </div>

      {/* ==========================================
        MODAL SECTION
        ==========================================
      */}
      <AnimatePresence>
        {isModalOpen && selectedItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
             <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }} className="relative bg-white w-full max-w-5xl h-[85vh] rounded-[28px] shadow-2xl flex flex-col overflow-hidden">
                
                {/* Modal Header */}
                <div className="px-8 py-5 border-b border-gray-100 flex justify-between items-center bg-white/80 backdrop-blur-md z-10">
                    <div>
                        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-3">
                            <span className={`w-2 h-6 rounded-full ${selectedItem.award_type_id === 1 ? 'bg-blue-500' : selectedItem.award_type_id === 2 ? 'bg-purple-500' : 'bg-orange-500'}`}></span>
                            ตรวจสอบข้อมูล: {selectedItem.award_type_name}
                        </h2>
                        <p className="text-sm text-gray-500 pl-5">{selectedItem.student_firstname} {selectedItem.student_lastname} ({selectedItem.student_number})</p>
                    </div>
                    <button onClick={() => setIsModalOpen(false)} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
                </div>

                <div className="flex-1 overflow-y-auto p-8 bg-[#F8F9FB]">
                    {!isRejectMode ? (
                        <div className="grid grid-cols-12 gap-8">
                            <div className={`col-span-12 ${selectedItem.award_type_id !== 1 ? 'lg:col-span-7' : ''} space-y-6`}>
                                {/* 1. General Info */}
                                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                                    <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><div className="w-6 h-6 rounded-lg bg-gray-100 text-gray-500 flex items-center justify-center text-xs font-bold">1</div>ข้อมูลทั่วไป</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <ReadOnlyField label="คณะ" value={selectedItem.faculty_name} />
                                        <ReadOnlyField label="สาขา" value={selectedItem.department_name} />
                                        <ReadOnlyField label="อาจารย์ที่ปรึกษา" value={selectedItem.advisor_name} />
                                        <ReadOnlyField label="เกรดเฉลี่ย (GPA)" value={selectedItem.gpa.toFixed(2)} />
                                        <ReadOnlyField label="วันเกิด" value={selectedItem.date_of_birth} />
                                        <ReadOnlyField label="อายุ" value={`${calculateAge(selectedItem.date_of_birth || "")} ปี`} />
                                        <ReadOnlyField label="เบอร์โทรศัพท์" value={selectedItem.phone_number} />
                                        <ReadOnlyField label="อีเมล" value={selectedItem.email} />
                                        <ReadOnlyField label="ที่อยู่ปัจจุบัน" value={selectedItem.address} fullWidth />
                                    </div>
                                </div>

                                {/* 2. Award Details */}
                                {selectedItem.award_type_id !== 1 && (
                                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                                        <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><div className="w-6 h-6 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold">2</div>รายละเอียดผลงาน/รางวัล</h3>
                                        <div className="grid grid-cols-2 gap-4">
                                            {/* Innovation */}
                                            {selectedItem.award_type_id === 2 && (
                                                <div className="col-span-2 mb-2">
                                                    <CriteriaOption checked={selectedItem.detail.criteria_innovation || false} label="ด้านความคิดสร้างสรรค์และนวัตกรรม: ต้องได้รับรางวัลจากการประกวดหรือการแข่งขันระดับอุดมศึกษา ระดับชาติหรือระดับนานาชาติที่มีหน่วยงานภาครัฐหรือเอกชนเป็นผู้จัด" />
                                                </div>
                                            )}
                                            {/* Activity */}
                                            {selectedItem.award_type_id === 3 && (
                                                <div className="col-span-2 space-y-3 mb-2">
                                                    <CriteriaOption checked={selectedItem.detail.criteria_activity_type === 'community'} label="เป็นนิสิตที่ดำเนินกิจกรรมและต้องแสดงให้เห็นว่าเมื่อดำเนินกิจกรรมแล้ว ชาวบ้าน ชุมชนในท้องถิ่น หรือผู้เข้าร่วมกิจกรรมได้รับประโยชน์อย่างไรจากการดำเนินกิจกรรมก่อให้เกิดประโยชน์ต่อส่วนรวมและเป็นการสร้างชื่อเสียง เกียรติคุณต่อคณะหรือมหาวิทยาลัยหรือไม่" />
                                                    <CriteriaOption checked={selectedItem.detail.criteria_activity_type === 'competition'} label="เข้าร่วมแข่งขันทางวิชาการหรือศิลปวัฒนธรรมระดับอุดมศึกษา ระดับชาติหรือระดับนานาชาติและได้รับรางวัลใดรางวัลหนึ่งจากการแข่งขัน" />
                                                    <CriteriaOption checked={selectedItem.detail.criteria_activity_type === 'position'} label="ดำรงตำแหน่งนายกองค์การบริหาร องค์การนิสิต ประธานสภาผู้แทนนิสิต หรือนายกสโมสรนิสิต (กองกิจการนิสิตเสนอชื่อโดยตำแหน่ง)" />
                                                </div>
                                            )}

                                            {/* Detail Fields */}
                                            {selectedItem.award_type_id === 2 && (
                                                <>
                                                    <ReadOnlyField label="โครงการ/ผลงาน" value={selectedItem.detail?.project_name} fullWidth />
                                                    <ReadOnlyField label="ชื่อทีม" value={selectedItem.detail?.team_name} />
                                                    <ReadOnlyField label="รางวัลที่ได้รับ" value={selectedItem.detail?.award_name} />
                                                    <ReadOnlyField label="หน่วยงานผู้จัด" value={selectedItem.detail?.organizer} />
                                                    <ReadOnlyField label="วันที่ได้รับรางวัล" value={selectedItem.detail?.prize_date} />
                                                </>
                                            )}
                                            {selectedItem.award_type_id === 3 && (
                                                <>
                                                    {selectedItem.detail?.criteria_activity_type === 'position' ? (
                                                        <ReadOnlyField label="ตำแหน่ง" value={selectedItem.detail?.position} fullWidth />
                                                    ) : (
                                                        <>
                                                            <ReadOnlyField label="โครงการ/กิจกรรม" value={selectedItem.detail?.project_name} fullWidth />
                                                            <ReadOnlyField label="รางวัลที่ได้รับ" value={selectedItem.detail?.award_name} />
                                                            <ReadOnlyField label="หน่วยงานผู้จัด" value={selectedItem.detail?.organizer} />
                                                        </>
                                                    )}
                                                    {selectedItem.detail?.benefit_desc && (
                                                        <div className="col-span-2 mt-2">
                                                            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">ประโยชน์ที่ได้รับ/รายละเอียดเพิ่มเติม</label>
                                                            <div className="mt-1 p-3 bg-gray-50 rounded-xl text-sm text-gray-700">{selectedItem.detail.benefit_desc}</div>
                                                        </div>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* 3. Files */}
                                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                                    <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><div className="w-6 h-6 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center text-xs font-bold">3</div>เอกสารแนบ</h3>
                                    <div className="flex flex-wrap gap-3">
                                        {selectedItem.files.length > 0 ? selectedItem.files.map((f, i) => (
                                            <a key={i} href={f.file_path} target="_blank" rel="noreferrer" className="flex items-center gap-2 px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-600 hover:border-blue-400 hover:text-blue-600 transition-all">
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg> {f.file_name}
                                            </a>
                                        )) : <span className="text-gray-400 text-sm italic">ไม่มีเอกสารแนบ</span>}
                                    </div>
                                </div>
                            </div>

                            {/* Right: Staff Input */}
                            {selectedItem.award_type_id !== 1 && (
                                <div className="col-span-12 lg:col-span-5">
                                    <div className="bg-blue-50/50 p-6 rounded-2xl border border-blue-100 h-full">
                                        <h3 className="font-bold text-blue-800 mb-4 flex items-center gap-2"><div className="w-6 h-6 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold">4</div>ส่วนเจ้าหน้าที่ (ตรวจสอบคุณสมบัติ)</h3>
                                        <div className="space-y-6">
                                            <div className="bg-white p-4 rounded-xl shadow-sm border border-blue-100/50">
                                                <label className="text-xs font-bold text-gray-400 uppercase mb-3 block">ระดับการแข่งขัน <span className="text-red-500">*</span></label>
                                                <div className="space-y-2">{COMPETITION_LEVELS.map(val => (<label key={val} className={`flex items-center p-3 rounded-lg border cursor-pointer transition-all ${compLevel === val ? 'bg-blue-50 border-blue-500' : 'border-gray-100 hover:border-blue-200'}`}><input type="radio" name="compLevel" value={val} checked={compLevel === val} onChange={e => setCompLevel(e.target.value)} className="text-blue-600 focus:ring-blue-500 mr-3" /><span className="text-sm font-medium text-gray-700">{val}</span></label>))}</div>
                                            </div>
                                            <div className="bg-white p-4 rounded-xl shadow-sm border border-blue-100/50">
                                                <label className="text-xs font-bold text-gray-400 uppercase mb-3 block">ประเภทกิจกรรม <span className="text-red-500">*</span></label>
                                                <div className="space-y-2">{ACTIVITY_CATEGORIES.map(val => (<label key={val} className={`flex items-start p-3 rounded-lg border cursor-pointer transition-all ${actType === val ? 'bg-purple-50 border-purple-500' : 'border-gray-100 hover:border-purple-200'}`}><input type="radio" name="actType" value={val} checked={actType === val} onChange={e => setActType(e.target.value)} className="text-purple-600 focus:ring-purple-500 mr-3 mt-0.5" /><span className="text-sm font-medium text-gray-700 leading-snug">{val}</span></label>))}</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="max-w-xl mx-auto mt-10"><div className="bg-red-50 p-6 rounded-2xl border border-red-100 text-center"><div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">!</div><h3 className="text-xl font-bold text-red-700 mb-2">ระบุเหตุผลการตีกลับ</h3><p className="text-sm text-red-500 mb-6">เอกสารของ <b>{selectedItem.student_firstname} {selectedItem.student_lastname}</b> จะถูกส่งกลับให้แก้ไข</p><textarea className="w-full h-32 p-4 rounded-xl border border-red-200 focus:ring-4 focus:ring-red-100 focus:border-red-500 outline-none text-sm resize-none" placeholder="เช่น เอกสารไม่ชัดเจน, ข้อมูลผลงานไม่ถูกต้อง..." value={rejectReason} onChange={e => setRejectReason(e.target.value)}></textarea></div></div>
                    )}
                </div>

                <div className="px-8 py-5 border-t border-gray-100 bg-white flex justify-end gap-3 z-10">
                    {!isRejectMode ? (
                        <>
                            <button onClick={() => setIsRejectMode(true)} className="px-6 py-2.5 rounded-xl text-sm font-bold text-red-600 bg-red-50 hover:bg-red-100 border border-transparent transition-colors">ตีกลับ (Reject)</button>
                            <button onClick={handleApprove} className="px-8 py-2.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:shadow-lg hover:scale-105 transition-all active:scale-95">อนุมัติ (Approve)</button>
                        </>
                    ) : (
                        <>
                             <button onClick={() => setIsRejectMode(false)} className="px-6 py-2.5 rounded-xl text-sm font-bold text-gray-500 hover:bg-gray-100 transition-colors">ยกเลิก</button>
                            <button onClick={handleReject} className="px-8 py-2.5 rounded-xl text-sm font-bold text-white bg-red-600 hover:bg-red-700 shadow-lg shadow-red-200 hover:scale-105 transition-all active:scale-95">ยืนยันตีกลับ</button>
                        </>
                    )}
                </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}