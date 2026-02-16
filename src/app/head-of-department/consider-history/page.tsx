"use client";

import { useState, useEffect, useMemo } from "react";
import NominationDetailModal from "@/components/Nomination-detail-modal";
import axios from "axios";

// ==========================================
// 0. Configuration
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
  competition_name: string;
}

interface CreativityDetail {
  date_received: string;
  team_name: string;
  project_title: string;
  prize: string;
  organized_by: string;
  competition_level: string;
  activity_category: string;
  competition_name: string;
}

interface GoodBehaviorDetail {
   behavior_desc?: string;
}

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
  reject_reason?: string;
  detail?: ExtracurricularDetail | CreativityDetail | GoodBehaviorDetail;
  files?: FileResponse[];
}

// ==========================================
// 1. Service Layer
// ==========================================

const historyService = {
  getHistory: async (token: string | null, params: Record<string, string>) => {
    if (USE_MOCK_DATA) {
      return [];
    } else {
      try {
        const response = await axios.get(`${API_BASE_URL}/awards/search`, {
          params: { 
            ...params, 
            limit: 100 
          }, 
          headers: { Authorization: `Bearer ${token}` }
        });
        
        const rawData = response.data.data || [];

        // Filter: เอาเฉพาะที่ Status != 1 (คือตรวจไปแล้ว)
        const PENDING_STATUS_ID = 1; 
        const filteredData = rawData.filter((item: any) => item.form_status_id !== PENDING_STATUS_ID);

        return filteredData;

      } catch (error) {
        console.error("History Fetch Error:", error);
        throw error;
      }
    }
  }
};

// ==========================================
// 2. Main Component
// ==========================================

export default function HeadOfDepartmentHistoryPage() { 
  
  // States
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<Nomination[]>([]);
  
  // Modals
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [modalData, setModalData] = useState<Nomination | null>(null);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterYear, setFilterYear] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  // Format Date Helper
  const formatDateTh = (isoDate: string) => {
    if (!isoDate) return "-";
    const date = new Date(isoDate);
    return date.toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: '2-digit', hour: '2-digit', minute:'2-digit' });
  };

  // Helper Badge สถานะ
  const getStatusBadge = (statusId: number) => {
      // 4 = ไม่เห็นชอบ (Reject), > 1 = เห็นชอบแล้ว (Approved)
      if (statusId === 4 || statusId === 99) { 
          return <span className="px-3 py-1 rounded-full bg-red-100 text-red-700 text-xs font-bold border border-red-200">ไม่เห็นชอบ</span>;
      } else if (statusId > 1) {
          return <span className="px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-bold border border-green-200">เห็นชอบแล้ว</span>;
      }
      return <span className="px-3 py-1 rounded-full bg-gray-100 text-gray-700 text-xs border border-gray-200">สถานะ {statusId}</span>;
  };

  // ==========================================
  // 3. Fetch Data
  // ==========================================

  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("token"); 
        if (!token) return;

        const params: Record<string, string> = {};
        if (searchTerm) params.keyword = searchTerm;
        if (filterCategory) params.award_type = filterCategory;
        if (filterYear) params.student_year = filterYear;

        const data = await historyService.getHistory(token, params);

        if (isMounted) setItems(data);
      } catch (error) {
        console.warn("API Error:", error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchData();
    return () => { isMounted = false; };
  }, [searchTerm, filterCategory, filterYear]);

  // ==========================================
  // 4. Logic: Filter / Sort / Paginate
  // ==========================================

  const processedData = useMemo(() => {
    let filtered = items;
    if (filterCategory) {
        filtered = filtered.filter(item => item.award_type_name === filterCategory);
    }
    // Sort ล่าสุดขึ้นก่อน
    filtered.sort((a, b) => new Date(b.latest_update || b.created_at).getTime() - new Date(a.latest_update || a.created_at).getTime());
    return filtered;
  }, [items, filterCategory]);

  const totalPages = Math.ceil(processedData.length / ITEMS_PER_PAGE);
  const currentItems = processedData.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  // ==========================================
  // 5. Render
  // ==========================================

  return (
        <div className="font-sans pb-24">
            <style jsx global>{`
                @keyframes fadeInUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
                .animate-fade-in-up { animation: fadeInUp 0.4s ease-out forwards; }
            `}</style>
            
            {/* Header */}
            <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-lg border border-white/50 p-8 mb-8 animate-fade-in-up">
                <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-gray-700 to-gray-900">
                    ประวัติการพิจารณา (หัวหน้าภาค)
                </h1>
                <p className="text-gray-500 mt-2">รายการที่ท่านได้ดำเนินการตรวจสอบเรียบร้อยแล้ว</p>

                {/* Filters */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                    <div className="relative">
                        <input type="text" placeholder="ค้นหาชื่อ, รหัสนิสิต..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 pl-10 outline-none focus:ring-2 focus:ring-blue-100 transition-all" />
                        <svg className="w-5 h-5 absolute left-3 top-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
                    </div>
                    <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="bg-white border border-gray-200 rounded-xl px-4 py-3 outline-none cursor-pointer focus:ring-2 focus:ring-blue-100">
                        <option value="">ทุกประเภทรางวัล</option>
                        <option value="ด้านความคิดสร้างสรรค์และนวัตกรรม">ด้านนวัตกรรม</option>
                        <option value="ด้านความประพฤติดี">ด้านความประพฤติดี</option>
                        <option value="ด้านกิจกรรมเสริมหลักสูตร">ด้านกิจกรรม</option>
                    </select>
                    <select value={filterYear} onChange={(e) => setFilterYear(e.target.value)} className="bg-white border border-gray-200 rounded-xl px-4 py-3 outline-none cursor-pointer focus:ring-2 focus:ring-blue-100">
                        <option value="">ทุกชั้นปี</option>
                        <option value="1">ปี 1</option><option value="2">ปี 2</option><option value="3">ปี 3</option><option value="4">ปี 4</option>
                    </select>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden animate-fade-in-up" style={{ animationDelay: '100ms' }}>
                <div className="overflow-x-auto min-h-[400px]">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50/80 text-gray-500 text-xs font-bold uppercase tracking-wider border-b border-gray-200">
                                <th className="p-5">นิสิต</th>
                                <th className="p-5 text-center">รางวัล</th>
                                <th className="p-5 text-center">วันที่พิจารณา</th>
                                <th className="p-5 text-center">ผลการพิจารณา</th>
                                <th className="p-5 text-center">รายละเอียด</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 bg-white">
                            {loading ? (
                                <tr><td colSpan={5} className="p-10 text-center text-gray-400 py-20">กำลังโหลดข้อมูล...</td></tr>
                            ) : currentItems.length === 0 ? (
                                <tr><td colSpan={5} className="p-10 text-center text-gray-400 py-20">ไม่พบประวัติการพิจารณา</td></tr>
                            ) : (
                                currentItems.map((item, idx) => (
                                    <tr key={item.form_id} className="hover:bg-gray-50 transition-colors animate-fade-in-up" style={{ animationDelay: `${idx * 50}ms` }}>
                                        <td className="p-5">
                                            <div className="font-bold text-gray-700">{item.student_firstname} {item.student_lastname}</div>
                                            <div className="text-xs text-gray-400 font-mono">{item.student_number}</div>
                                        </td>
                                        <td className="p-5 text-center text-sm"><span className="px-2 py-1 rounded bg-gray-100 text-gray-600 text-xs">{item.award_type_name}</span></td>
                                        <td className="p-5 text-center text-sm text-gray-500">{formatDateTh(item.latest_update)}</td>
                                        <td className="p-5 text-center">
                                            {getStatusBadge(item.form_status_id)}
                                        </td>
                                        <td className="p-5 text-center">
                                            {/* ปุ่มไอคอนรูปตา */}
                                            <button 
                                                onClick={() => { setModalData(item); setIsDetailModalOpen(true); }} 
                                                className="text-gray-400 hover:text-blue-600 bg-transparent hover:bg-blue-50 p-2 rounded-full transition-all duration-200 transform hover:scale-110 active:scale-95 shadow-sm hover:shadow-md"
                                                title="ดูรายละเอียด"
                                            >
                                                <svg className="w-5 h-5 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
                 {/* Pagination */}
                 <div className="flex justify-end items-center p-6 border-t border-gray-100 bg-gray-50/30 gap-2">
                        <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1} className="w-8 h-8 flex items-center justify-center rounded-lg bg-white border border-gray-200 text-gray-500 hover:bg-gray-100 disabled:opacity-50 text-sm">{'<'}</button>
                        <span className="text-xs font-semibold text-gray-500">หน้า {currentPage} / {totalPages || 1}</span>
                        <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages || totalPages === 0} className="w-8 h-8 flex items-center justify-center rounded-lg bg-white border border-gray-200 text-gray-500 hover:bg-gray-100 disabled:opacity-50 text-sm">{'>'}</button>
                </div>
            </div>

            {/* Modal */}
            <NominationDetailModal 
                isOpen={isDetailModalOpen} 
                onClose={() => setIsDetailModalOpen(false)} 
                data={modalData} 
                faculties={[{ faculty_id: 1, faculty_name: "Mock Faculty" }]} 
                departments={[{ department_id: 1, department_name: "Mock Dept", faculty_id: 1 }]}
            />
        </div>
  );
}