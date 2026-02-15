"use client";

import { useState, useEffect, useMemo } from "react";
import NominationDetailModal from "@/components/Nomination-detail-modal"; 
import Swal from "sweetalert2"; 
import axios from "axios";

// ==========================================
// 0. Configuration & Service Layer
// ==========================================

const USE_MOCK_DATA = false; 
const API_BASE_URL = "/api"; 

// --- Interfaces ---
export interface FileResponse {
  file_dir_id: number;
  file_name: string;
  file_type: string;
  file_size: number;
  file_path: string;
}

interface ExtracurricularDetail {
  qualification_type: string;
  date_received: string;
  team_name: string;
  project_title: string;
  prize: string;
  organized_by: string;
  competition_level: string;
  activity_category: string;
  competition_name: string; // เพิ่มให้ครบ
}

interface CreativityDetail {
  date_received: string;
  team_name: string;
  project_title: string;
  prize: string;
  organized_by: string;
  competition_level: string;
  activity_category: string;
  competition_name: string; // เพิ่มให้ครบ
}

interface GoodBehaviorDetail {
   behavior_desc?: string;
}

// Interface ที่ตรงกับ Backend DTO (Snake Case)
export interface Nomination {
  form_id: number;
  student_id: number;
  student_firstname: string;
  student_lastname: string;
  email: string;
  student_number: string;
  faculty_id: number;
  department_id: number;
  campus_id: number;
  academic_year: number;
  semester: number;
  form_status_id: number; 
  award_type_id: number;
  award_type_name: string;
  created_at: string;
  latest_update: string;
  student_year: number;
  advisor_name: string;
  phone_number: string;
  address: string;
  gpa: number;
  date_of_birth: string;
  reject_reason?: string; // เพิ่ม field นี้
  detail?: ExtracurricularDetail | CreativityDetail | GoodBehaviorDetail;
  files?: FileResponse[];
}

interface MasterFaculty {
  faculty_id: number;
  faculty_name: string;
}

interface MasterDepartment {
  department_id: number;
  department_name: string;
  faculty_id: number;
}

// --- Service Logic ---
const approvalService = {
  getNominations: async (token: string | null, params: Record<string, string>) => {
    if (USE_MOCK_DATA) {
      // ... (ส่วน Mock เดิม ไม่ต้องแก้) ...
      return []; 
    } else {
      try {
        // [แก้ไขจุดที่ 1] เปลี่ยน Endpoint ให้ตรงกับ Backend
        // ใช้ /api/awards/search เพื่อดึงรายการทั้งหมด
        // เพิ่ม limit=100 เพื่อดึงมาให้ครบแล้วค่อยกรองหน้าบ้าน
        const response = await axios.get(`${API_BASE_URL}/awards/search`, {
          params: { 
            ...params, 
            limit: 100 
          }, 
          headers: { Authorization: `Bearer ${token}` }
        });
        
        console.log("Raw Data from API:", response.data.data);

        const rawData = response.data.data || [];

        // [แก้ไขจุดที่ 2] กรองเฉพาะสถานะที่ต้องพิจารณา 
        // เช่น หัวหน้าภาคดูเฉพาะสถานะ 1 (รอหัวหน้าภาคพิจารณา)
        // ** ตรวจสอบเลข Status ID ใน Database ของคุณอีกครั้งว่าใช่เลข 2 หรือไม่ **
        const TARGET_STATUS_ID = 1; 

        const filteredData = rawData.filter((item: any) => item.form_status_id === TARGET_STATUS_ID);

        return filteredData;

      } catch (error) {
        console.error("Error fetching nominations:", error);
        throw error;
      }
    }
  },

  submitVote: async (token: string | null, formId: number, statusId: number, reason: string) => {
    if (USE_MOCK_DATA) {
      await new Promise(r => setTimeout(r, 800));
      return { success: true, message: "Mock vote submitted" };
    } else {
      // API จริง: เปลี่ยนไปใช้ PUT /api/awards/:id/form-status ให้ตรงกับ Backend
      const payload = { 
          form_status_id: statusId
          // หมายเหตุ: Backend ปัจจุบันรับแค่ form_status_id 
          // (ถ้าต้องการเก็บ reason ต้องไปเพิ่ม Logic ที่ Backend ครับ)
      };

      const response = await axios.put(`${API_BASE_URL}/awards/${formId}/form-status`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    }
  }
};

// ==========================================
// 1. Static Data & Components
// ==========================================

const ITEMS_PER_PAGE = 6;

const STATIC_FACULTIES: MasterFaculty[] = [
  { faculty_id: 1, faculty_name: "คณะวิทยาศาสตร์" },
  { faculty_id: 2, faculty_name: "คณะวิศวกรรมศาสตร์" },
];

const STATIC_DEPARTMENTS: MasterDepartment[] = [
  { department_id: 10, department_name: "วิทยาการคอมพิวเตอร์", faculty_id: 1 },
];

const TableSkeleton = () => (
  <>
    {[1, 2, 3, 4, 5, 6].map((i) => (
      <tr key={i} className="animate-pulse border-b border-gray-100">
        <td className="p-4"><div className="h-4 bg-gray-200 rounded w-32"></div></td>
        <td className="p-4"><div className="h-4 bg-gray-200 rounded w-24 mx-auto"></div></td>
        <td className="p-4"><div className="h-4 bg-gray-200 rounded w-16 mx-auto"></div></td>
        <td className="p-4"><div className="h-4 bg-gray-200 rounded w-40 mx-auto"></div></td>
        <td className="p-4"><div className="h-4 bg-gray-200 rounded w-24 mx-auto"></div></td>
        <td className="p-4"><div className="h-6 bg-gray-200 rounded-full w-20 mx-auto"></div></td>
        <td className="p-4"><div className="h-8 w-8 bg-gray-200 rounded-full mx-auto"></div></td>
      </tr>
    ))}
  </>
);

// ==========================================
// 3. Main Component
// ==========================================

export default function HeadOfDepartmentApprovalPage() { 
  
  // States
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<Nomination[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  
  // Modals
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [modalData, setModalData] = useState<Nomination | null>(null);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  
  // Filters & Sort
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterDate, setFilterDate] = useState(""); 
  const [filterYear, setFilterYear] = useState("");
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
  // 4. Effects (Fetch Data)
  // ==========================================

  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("token"); 
        if (!token) return;

        const params: Record<string, string> = {};
        if (searchTerm) params.keyword = searchTerm; // แก้ parameter ให้ตรงกับ Backend (q -> keyword)
        if (filterCategory) params.award_type = filterCategory; // Note: Backend อาจยังไม่รองรับ filter นี้โดยตรง
        if (filterYear) params.student_year = filterYear;

        const data = await approvalService.getNominations(token, params);

        if (isMounted) setItems(data);
      } catch (error) {
        console.warn("API Error:", error);
        if (isMounted) {
            Swal.fire({
                icon: 'error',
                title: 'ไม่สามารถดึงข้อมูลได้',
                text: 'กรุณาลองใหม่อีกครั้ง',
                toast: true,
                position: 'top-end',
                showConfirmButton: false,
                timer: 3000
            });
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchData();
    return () => { isMounted = false; };
  }, [searchTerm, filterCategory, filterYear]);

  // ==========================================
  // 5. Logic: Filter / Sort / Paginate
  // ==========================================

  const processedData = useMemo(() => {
    let filtered = items;
    
    // Client-side filtering for award type if backend doesn't support it well
    if (filterCategory) {
        filtered = filtered.filter(item => item.award_type_name === filterCategory);
    }

    if (filterDate) {
        const filterTime = new Date(filterDate).setHours(23, 59, 59, 999);
        filtered = filtered.filter(item => new Date(item.created_at).getTime() <= filterTime);
    }
    
    if (sortConfig.key) {
        filtered.sort((a, b) => {
            let valA: any = sortConfig.key ? a[sortConfig.key] : '';
            let valB: any = sortConfig.key ? b[sortConfig.key] : '';

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
  }, [items, filterDate, filterCategory, sortConfig]);

  const totalPages = Math.ceil(processedData.length / ITEMS_PER_PAGE);
  const currentItems = processedData.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  // ==========================================
  // 6. Handlers
  // ==========================================

  const handleSort = (key: keyof Nomination | 'award_type_name') => {
      setSortConfig(prev => {
          if (prev.key === key) return { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' };
          return { key, direction: 'asc' };
      });
  };

  const renderSortIcon = (key: string) => {
    if (sortConfig.key !== key) return <span className="text-gray-300 ml-1">↕</span>;
    return sortConfig.direction === 'asc' ? <span className="text-blue-500 ml-1">↑</span> : <span className="text-blue-500 ml-1">↓</span>;
  };

  const handleApprove = async () => {
    if (selectedId === null) return Swal.fire({ icon: 'warning', title: 'กรุณาเลือกรายการ', text: 'โปรดคลิกเลือกรายชื่อนิสิตในตารางก่อน' });
    const selectedItem = items.find(c => c.form_id === selectedId);
    if (!selectedItem) return;

    const result = await Swal.fire({
        title: `ยืนยันการ "เห็นชอบ"?`,
        html: `คุณต้องการลงความเห็น <b>"เห็นชอบ"</b> <br/>ให้กับ ${selectedItem.student_firstname} ${selectedItem.student_lastname} หรือไม่?`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'ยืนยัน',
        cancelButtonText: 'ยกเลิก',
        confirmButtonColor: '#10B981',
    });

    if (result.isConfirmed) {
        // [Logic Status]
        // สมมติ: 1 (รอหัวหน้าภาค) -> 2 (รอรองคณบดี) 
        // คุณต้องเช็ค Step ID ของคุณว่า "เห็นชอบ" แล้วไป Status ID ไหน
        const NEXT_STATUS_ID = 2; 
        await submitVote(selectedId, NEXT_STATUS_ID, "", `${selectedItem.student_firstname} ${selectedItem.student_lastname}`);
    }
  };

  const handleOpenRejectModal = () => {
    if (selectedId === null) return Swal.fire({ icon: 'warning', title: 'กรุณาเลือกรายการ', text: 'โปรดคลิกเลือกรายชื่อนิสิตในตารางก่อน' });
    setRejectReason("");
    setIsRejectModalOpen(true);
  };

  const handleConfirmReject = async () => {
    if (!rejectReason.trim()) return Swal.fire({ icon: 'warning', title: 'กรุณาระบุเหตุผล', text: 'โปรดกรอกเหตุผลในการไม่เห็นชอบ' });
    const selectedItem = items.find(c => c.form_id === selectedId);
    if (selectedId && selectedItem) {
        // [Logic Status]
        // สมมติ: ตีกลับเป็น Rejected ให้ใช้ Status ID ที่กำหนด (เช่น 99 หรือ 0)
        // หรือถ้าแค่ "ไม่เห็นชอบ" แล้วส่งกลับให้นิสิตแก้ อาจใช้ Status 4
        const REJECT_STATUS_ID = 4; // สมมติว่า 4 คือ Reject
        await submitVote(selectedId, REJECT_STATUS_ID, rejectReason, `${selectedItem.student_firstname} ${selectedItem.student_lastname}`);
        setIsRejectModalOpen(false);
    }
  };

  const submitVote = async (id: number, statusId: number, reason: string, studentName: string) => {
    try {
      const token = localStorage.getItem("token");
      
      // แก้ไขการส่ง Parameter ให้ตรงกับ service ใหม่
      await approvalService.submitVote(token, id, statusId, reason);
      
      // Remove from UI
      setItems(prev => prev.filter(c => c.form_id !== id));
      setSelectedId(null);

      const isReject = reason.length > 0;

      const Toast = Swal.mixin({
          toast: true, position: 'top-end', showConfirmButton: false, timer: 3000, timerProgressBar: true
      });
      Toast.fire({
          icon: isReject ? 'info' : 'success',
          title: 'บันทึกผลสำเร็จ',
          text: `ได้ทำการ${isReject ? 'ไม่เห็นชอบ' : 'เห็นชอบ'}นิสิต: ${studentName} เรียบร้อยแล้ว`
      });
    } catch (error) {
      console.error("Submit Error:", error);
      Swal.fire({ icon: 'error', title: 'เกิดข้อผิดพลาด', text: 'ดำเนินการไม่สำเร็จ' });
    }
  };

  // ... (Render Part เหมือนเดิมทุกประการ) ...
  return (
        <div className="font-sans pb-24">
            {/* Inject Keyframes */}
            <style jsx global>{`
                @keyframes fadeInUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
                .animate-fade-in-up { animation: fadeInUp 0.4s ease-out forwards; }
            `}</style>
            
            {/* Header Card */}
            <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-lg border border-white/50 p-8 mb-8 animate-fade-in-up">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                            พิจารณาคัดเลือกนิสิตดีเด่น (หัวหน้าภาค)
                        </h1>
                        <p className="text-gray-500 mt-1 font-medium">
                            {USE_MOCK_DATA && <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded mr-2">MOCK MODE</span>}
                            กรุณาพิจารณาข้อมูลและลงความเห็นเห็นชอบ/ไม่เห็นชอบ
                        </p>
                    </div>
                </div>

                {/* Filters */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-8">
                    <div className="relative group">
                        <input type="text" placeholder="ค้นหาชื่อ หรือ รหัสนิสิต" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 pl-10 text-sm focus:ring-4 focus:ring-blue-100 outline-none transition-all shadow-sm" />
                        <svg className="w-5 h-5 absolute left-3 top-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
                    </div>
                    <div className="relative group">
                        <input type="date" value={filterDate} onChange={(e) => setFilterDate(e.target.value)} className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-500 outline-none focus:ring-4 focus:ring-blue-100 transition-all shadow-sm cursor-pointer" />
                    </div>
                    <div className="relative group">
                        <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-500 outline-none focus:ring-4 focus:ring-blue-100 transition-all shadow-sm cursor-pointer appearance-none">
                            <option value="">ทุกประเภทรางวัล</option>
                            <option value="ด้านความคิดสร้างสรรค์และนวัตกรรม">ด้านนวัตกรรม</option>
                            <option value="ด้านความประพฤติดี">ด้านความประพฤติดี</option>
                            <option value="ด้านกิจกรรมเสริมหลักสูตร">ด้านกิจกรรม</option>
                        </select>
                        <svg className="w-4 h-4 absolute right-4 top-3.5 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                    </div>
                    <div className="relative group">
                        <select value={filterYear} onChange={(e) => setFilterYear(e.target.value)} className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-500 outline-none focus:ring-4 focus:ring-blue-100 transition-all shadow-sm cursor-pointer appearance-none">
                            <option value="">ทุกระดับชั้น</option><option value="1">ชั้นปีที่ 1</option><option value="2">ชั้นปีที่ 2</option><option value="3">ชั้นปีที่ 3</option><option value="4">ชั้นปีที่ 4</option>
                        </select>
                        <svg className="w-4 h-4 absolute right-4 top-3.5 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden animate-fade-in-up" style={{ animationDelay: '100ms' }}>
                <div className="overflow-x-auto min-h-[400px]">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50/80 text-gray-500 text-xs font-bold uppercase tracking-wider border-b border-gray-200">
                                <th className="p-5 cursor-pointer hover:bg-gray-100" onClick={() => handleSort('student_firstname')}><div className="flex items-center gap-1">ชื่อ-นามสกุล {renderSortIcon('student_firstname')}</div></th>
                                <th className="p-5 text-center cursor-pointer hover:bg-gray-100" onClick={() => handleSort('student_number')}><div className="flex items-center justify-center gap-1">รหัสนิสิต {renderSortIcon('student_number')}</div></th>
                                <th className="p-5 text-center cursor-pointer hover:bg-gray-100" onClick={() => handleSort('academic_year')}><div className="flex items-center justify-center gap-1">ปีการศึกษา {renderSortIcon('academic_year')}</div></th>
                                <th className="p-5 text-center cursor-pointer hover:bg-gray-100" onClick={() => handleSort('award_type_name')}><div className="flex items-center justify-center gap-1">รางวัล {renderSortIcon('award_type_name')}</div></th>
                                <th className="p-5 text-center cursor-pointer hover:bg-gray-100" onClick={() => handleSort('created_at')}><div className="flex items-center justify-center gap-1">วันที่ส่ง {renderSortIcon('created_at')}</div></th>
                                <th className="p-5 text-center">สถานะ</th>
                                <th className="p-5 text-center w-[10%]">รายละเอียด</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 bg-white">
                            {loading ? (
                                <TableSkeleton />
                            ) : currentItems.length === 0 ? (
                                <tr><td colSpan={7} className="p-10 text-center text-gray-400 py-20">ไม่พบข้อมูลที่ต้องพิจารณา</td></tr>
                            ) : (
                                currentItems.map((item, index) => (
                                    <tr 
                                        key={item.form_id} 
                                        onClick={() => setSelectedId(item.form_id)}
                                        className={`transition-all duration-300 cursor-pointer animate-fade-in-up hover:-translate-y-1 hover:shadow-lg
                                            ${selectedId === item.form_id ? "bg-blue-50 border-l-4 border-l-blue-500" : "hover:bg-blue-50/30 border-l-4 border-l-transparent"}`}
                                        style={{ animationDelay: `${index * 50}ms` }}
                                    >
                                        <td className="p-5 text-sm font-bold text-gray-700">{item.student_firstname} {item.student_lastname}</td>
                                        <td className="p-5 text-sm text-center text-gray-600 font-mono">{item.student_number}</td>
                                        <td className="p-5 text-sm text-center text-gray-600">{item.academic_year}</td>
                                        <td className="p-5 text-sm text-center"><span className="px-3 py-1 rounded-full bg-gray-100 text-gray-600 text-xs font-medium border border-gray-200">{item.award_type_name}</span></td>
                                        <td className="p-5 text-sm text-center text-gray-500">{formatDateTh(item.created_at)}</td>
                                        <td className="p-5 text-center align-middle">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 border border-yellow-200 shadow-sm animate-pulse">รอพิจารณา</span>
                                        </td>
                                        <td className="p-5 text-center align-middle" onClick={(e) => e.stopPropagation()}>
                                            <button onClick={() => { setModalData(item); setIsDetailModalOpen(true); }} className="text-gray-400 hover:text-blue-600 bg-transparent hover:bg-blue-50 p-2 rounded-full transition-all duration-200 transform hover:scale-110 active:scale-95 shadow-sm hover:shadow-md">
                                                <svg className="w-5 h-5 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Footer / Actions */}
                <div className="flex justify-between items-center p-6 border-t border-gray-100 bg-gray-50/30">
                    {/* Pagination */}
                    <div className="flex items-center gap-2">
                        <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1} className="w-9 h-9 flex items-center justify-center rounded-lg bg-white border border-gray-200 text-gray-500 hover:bg-gray-100 disabled:opacity-50 transition-all shadow-sm">{'<'}</button>
                        <span className="text-xs font-semibold text-gray-500 bg-white px-3 py-1.5 rounded-lg border border-gray-200 shadow-sm">หน้า {currentPage} จาก {totalPages || 1}</span>
                        <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages || totalPages === 0} className="w-9 h-9 flex items-center justify-center rounded-lg bg-white border border-gray-200 text-gray-500 hover:bg-gray-100 disabled:opacity-50 transition-all shadow-sm">{'>'}</button>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-4 items-center animate-fade-in">
                        <span className="text-xs font-medium text-gray-400 mr-2 bg-gray-100 px-3 py-1 rounded-full">{selectedId ? `เลือกรายการ #${selectedId}` : "คลิกที่แถวเพื่อเลือก"}</span>
                        
                        <button onClick={handleOpenRejectModal} disabled={selectedId === null} className={`px-6 py-2.5 rounded-xl text-sm font-bold border-2 transition-all shadow-sm hover:shadow-md active:scale-95 flex items-center gap-2 ${selectedId === null ? "bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed" : "bg-white border-red-100 text-red-600 hover:bg-red-50 hover:border-red-200"}`}>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
                            ไม่เห็นชอบ
                        </button>

                        <button onClick={handleApprove} disabled={selectedId === null} className={`px-6 py-2.5 rounded-xl text-sm font-bold text-white transition-all shadow-md hover:shadow-lg transform active:scale-95 flex items-center gap-2 ${selectedId === null ? "bg-gray-300 cursor-not-allowed shadow-none" : "bg-emerald-500 hover:bg-emerald-600"}`}>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/></svg>
                            เห็นชอบ
                        </button>
                    </div>
                </div>
            </div>

            {/* Nomination Detail Modal */}
            <NominationDetailModal 
                isOpen={isDetailModalOpen} 
                onClose={() => setIsDetailModalOpen(false)} 
                data={modalData} 
                faculties={STATIC_FACULTIES}
                departments={STATIC_DEPARTMENTS}
            />

            {/* Reject Modal */}
            {isRejectModalOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-md" onClick={() => setIsRejectModalOpen(false)}></div>
                    <div className="relative bg-white/90 backdrop-blur-xl rounded-2xl shadow-2xl w-full max-w-lg p-6 animate-scale-up border border-white/50">
                        <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-500">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
                            </div>
                            ระบุเหตุผล "ไม่เห็นชอบ"
                        </h3>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">เหตุผลที่ตีกลับเอกสาร <span className="text-red-500">*</span></label>
                            <textarea className="w-full border border-gray-300 rounded-xl p-3 text-sm focus:ring-4 focus:ring-red-100 focus:border-red-400 outline-none transition-all h-32 resize-none bg-white" placeholder="กรุณาระบุเหตุผล..." value={rejectReason} onChange={(e) => setRejectReason(e.target.value)}></textarea>
                        </div>
                        <div className="flex justify-end gap-3">
                            <button onClick={() => setIsRejectModalOpen(false)} className="px-4 py-2 rounded-lg text-gray-600 hover:bg-gray-100 font-medium transition-colors">ยกเลิก</button>
                            <button onClick={handleConfirmReject} className="px-6 py-2 rounded-lg bg-red-600 text-white font-bold hover:bg-red-700 shadow-md transition-all">ยืนยันไม่เห็นชอบ</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
  );
}