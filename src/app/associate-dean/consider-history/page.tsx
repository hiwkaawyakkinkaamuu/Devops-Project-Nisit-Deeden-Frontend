"use client";

import { useState, useEffect, useMemo } from "react";
import NominationDetailModal from "@/components/Nomination-detail-modal"; 
import Swal from "sweetalert2"; 
import axios from "axios";

// ==========================================
// 0. Configuration & Service Layer
// ==========================================

const USE_MOCK_DATA = true; // Set FALSE to use Real API
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "";

// --- Interfaces ---
interface FileResponse {
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
}

interface CreativityDetail {
  date_received: string;
  team_name: string;
  project_title: string;
  prize: string;
  organized_by: string;
  competition_level: string;
  activity_category: string;
}

interface GoodBehaviorDetail {
   behavior_desc?: string;
}

interface Nomination {
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

// --- Mock Data ---
const MOCK_NOMINATIONS: Nomination[] = [
    { 
        form_id: 1, student_id: 101, student_number: "6610400001", student_firstname: "สมชาย", student_lastname: "ใจดี", 
        student_year: 4, form_status_id: 2, // เห็นชอบ
        created_at: "2026-02-01T09:00:00Z", latest_update: "2026-02-02T10:00:00Z",
        award_type_id: 1, award_type_name: "ด้านความประพฤติดี", faculty_id: 1, department_id: 10, campus_id: 1, academic_year: 2569, semester: 1,
        advisor_name: "ดร.วิชัย", gpa: 3.75, phone_number: "0812345678", email: "somchai@ku.th", address: "กทม.", date_of_birth: "2003-01-01",
        detail: { behavior_desc: "ช่วยเหลืองานคณะอย่างต่อเนื่อง..." } as GoodBehaviorDetail, files: []
    },
    { 
        form_id: 2, student_id: 102, student_number: "6610400002", student_firstname: "สมหญิง", student_lastname: "รักเรียน", 
        student_year: 3, form_status_id: 3, // ไม่เห็นชอบ
        created_at: "2026-02-02T14:30:00Z", latest_update: "2026-02-03T09:00:00Z",
        award_type_id: 2, award_type_name: "ด้านความคิดสร้างสรรค์และนวัตกรรม", faculty_id: 2, department_id: 20, campus_id: 1, academic_year: 2569, semester: 1,
        advisor_name: "อ.สมศรี", gpa: 2.90, phone_number: "0898765432", email: "ying@ku.th", address: "นนทบุรี", date_of_birth: "2002-02-02",
        detail: { project_title: "Basic Robot", prize: "None", organized_by: "Local School", competition_level: "Local", date_received: "2025-12-01", team_name: "Robo1", activity_category: "Tech" } as CreativityDetail,
        files: []
    },
    { 
        form_id: 3, student_id: 103, student_number: "6610400003", student_firstname: "เก่ง", student_lastname: "กล้า", 
        student_year: 2, form_status_id: 2, // เห็นชอบ
        created_at: "2026-02-03T11:00:00Z", latest_update: "2026-02-04T15:00:00Z",
        award_type_id: 3, award_type_name: "ด้านกิจกรรมเสริมหลักสูตร", faculty_id: 3, department_id: 30, campus_id: 1, academic_year: 2569, semester: 1,
        advisor_name: "ดร.มานะ", gpa: 3.50, phone_number: "0811122233", email: "keng@ku.th", address: "ปทุมธานี", date_of_birth: "2001-03-03",
        detail: { project_title: "Volunteer Camp Leader", prize: "Cert", organized_by: "University", competition_level: "University", date_received: "2025-11-20", team_name: "-", qualification_type: "Leader", activity_category: "Social" } as ExtracurricularDetail,
        files: [{ file_dir_id: 1, file_name: "cert.pdf", file_type: "application/pdf", file_size: 1024, file_path: "#" }]
    },
    { 
        form_id: 4, student_id: 104, student_number: "6610400004", student_firstname: "มานี", student_lastname: "มีตา", 
        student_year: 4, form_status_id: 2, // เห็นชอบ
        created_at: "2026-02-04T10:00:00Z", latest_update: "2026-02-05T11:00:00Z",
        award_type_id: 1, award_type_name: "ด้านความประพฤติดี", faculty_id: 4, department_id: 40, campus_id: 1, academic_year: 2569, semester: 1,
        advisor_name: "อ.ชูใจ", gpa: 3.95, phone_number: "0855566677", email: "manee@ku.th", address: "กทม.", date_of_birth: "2000-04-04",
        detail: { behavior_desc: "เป็นแบบอย่างที่ดี..." } as GoodBehaviorDetail, files: []
    },
    { 
        form_id: 5, student_id: 105, student_number: "6610400005", student_firstname: "ปิติ", student_lastname: "พิทักษ์", 
        student_year: 1, form_status_id: 3, // ไม่เห็นชอบ
        created_at: "2026-02-05T13:00:00Z", latest_update: "2026-02-06T09:00:00Z",
        award_type_id: 2, award_type_name: "ด้านความคิดสร้างสรรค์และนวัตกรรม", faculty_id: 1, department_id: 10, campus_id: 1, academic_year: 2569, semester: 1,
        advisor_name: "ผศ.วีระ", gpa: 2.80, phone_number: "0899988877", email: "piti@ku.th", address: "นนทบุรี", date_of_birth: "2003-05-05",
        detail: { project_title: "Simple App", prize: "-", organized_by: "Class", competition_level: "Class", date_received: "2025-10-10", team_name: "One", activity_category: "Study" } as CreativityDetail,
        files: []
    },
    { 
        form_id: 6, student_id: 106, student_number: "6610400006", student_firstname: "ชูใจ", student_lastname: "เลิศล้ำ", 
        student_year: 3, form_status_id: 2, // เห็นชอบ
        created_at: "2026-02-06T15:00:00Z", latest_update: "2026-02-07T10:00:00Z",
        award_type_id: 3, award_type_name: "ด้านกิจกรรมเสริมหลักสูตร", faculty_id: 2, department_id: 20, campus_id: 1, academic_year: 2569, semester: 1,
        advisor_name: "ดร.กล้า", gpa: 3.30, phone_number: "0877766655", email: "choojai@ku.th", address: "สมุทรปราการ", date_of_birth: "2001-06-06",
        detail: { project_title: "Dance Club", prize: "Winner", organized_by: "Uni", competition_level: "Regional", date_received: "2025-09-09", team_name: "Dance Team", qualification_type: "Member", activity_category: "Arts" } as ExtracurricularDetail,
        files: [{ file_dir_id: 2, file_name: "award.jpg", file_type: "image/jpeg", file_size: 500, file_path: "#" }]
    },
    { 
        form_id: 7, student_id: 107, student_number: "6610400007", student_firstname: "แก้ว", student_lastname: "กล้า", 
        student_year: 2, form_status_id: 2, // เห็นชอบ
        created_at: "2026-02-07T08:00:00Z", latest_update: "2026-02-08T11:00:00Z",
        award_type_id: 1, award_type_name: "ด้านความประพฤติดี", faculty_id: 3, department_id: 30, campus_id: 1, academic_year: 2569, semester: 1,
        advisor_name: "อ.ดวงใจ", gpa: 3.60, phone_number: "0822233344", email: "kaew@ku.th", address: "กทม.", date_of_birth: "2002-07-07",
        detail: { behavior_desc: "ช่วยเหลืองานกาชาด..." } as GoodBehaviorDetail, files: []
    }
];

// --- Service Logic ---
const associateDeanService = {
  getNominationHistory: async (token: string | null, params: Record<string, string>) => {
    if (USE_MOCK_DATA) {
      await new Promise(r => setTimeout(r, 800)); // Simulate Delay
      
      let filtered = MOCK_NOMINATIONS;
      // Mock Filtering
      if (params.q) {
        const lower = params.q.toLowerCase();
        filtered = filtered.filter(i => 
            i.student_firstname.toLowerCase().includes(lower) || 
            i.student_lastname.toLowerCase().includes(lower) || 
            i.student_number.includes(lower)
        );
      }
      if (params.award_type) {
        filtered = filtered.filter(i => i.award_type_name === params.award_type);
      }
      if (params.student_year) {
        filtered = filtered.filter(i => i.student_year.toString() === params.student_year);
      }
      if (params.status_id) {
        filtered = filtered.filter(i => i.form_status_id.toString() === params.status_id);
      }
      
      return filtered;

    } else {
      // Real API Call
      const apiParams = { ...params };
      if (!apiParams.status_id) {
          apiParams.status_id_in = "2,3"; // Default fetch Approved & Rejected
      }

      const response = await axios.get(`${API_BASE_URL}/api/associate-dean/nominations/history`, {
        params: apiParams,
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data.data || [];
    }
  }
};

// ==========================================
// 1. Static Data
// ==========================================

const ITEMS_PER_PAGE = 6;

const STATIC_FACULTIES: MasterFaculty[] = [
  { faculty_id: 1, faculty_name: "คณะวิทยาศาสตร์" },
  { faculty_id: 2, faculty_name: "คณะวิศวกรรมศาสตร์" },
  { faculty_id: 3, faculty_name: "คณะบริหารธุรกิจ" },
  { faculty_id: 4, faculty_name: "คณะมนุษยศาสตร์" }
];

const STATIC_DEPARTMENTS: MasterDepartment[] = [
  { department_id: 10, department_name: "วิทยาการคอมพิวเตอร์", faculty_id: 1 },
  { department_id: 20, department_name: "วิศวกรรมไฟฟ้า", faculty_id: 2 },
  { department_id: 30, department_name: "การตลาด", faculty_id: 3 },
  { department_id: 40, department_name: "ภาษาอังกฤษ", faculty_id: 4 }
];

// ==========================================
// 2. Components: Skeleton Loading
// ==========================================

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

export default function AssociateDeanConsiderHistoryPage() {
  
  // --- UI & Data States ---
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<Nomination[]>([]);
  
  // --- Modal States ---
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [modalData, setModalData] = useState<Nomination | null>(null);

  // --- Filter & Search States ---
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterDate, setFilterDate] = useState(""); 
  const [filterYear, setFilterYear] = useState("");
  const [filterStatusId, setFilterStatusId] = useState<string>("");

  // --- Sort & Pagination States ---
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState<{ 
      key: keyof Nomination | 'award_type_name' | null, 
      direction: 'asc' | 'desc' | null 
  }>({ key: 'created_at', direction: 'desc' });

  // --- Reset Pagination ---
  useEffect(() => { 
      setCurrentPage(1); 
  }, [searchTerm, filterCategory, filterDate, filterYear, filterStatusId]);

  // --- Helpers ---
  const formatDateTh = (isoDate: string) => {
    if (!isoDate) return "-";
    const date = new Date(isoDate);
    return date.toLocaleDateString('th-TH', { year: 'numeric', month: '2-digit', day: '2-digit' });
  };

  const getStatusConfig = (id: number) => {
      switch(id) {
          case 2: return { label: "เห็นชอบ", color: "bg-green-100 text-green-700 border-green-200" };
          case 3: return { label: "ไม่เห็นชอบ", color: "bg-red-100 text-red-700 border-red-200" };
          default: return { label: "รอพิจารณา", color: "bg-yellow-100 text-yellow-700 border-yellow-200" };
      }
  };

  // ==========================================
  // 4. Effects (Fetch Data using Service)
  // ==========================================

  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      setLoading(true);
      
      try {
        const token = localStorage.getItem("accessToken");
        const params: Record<string, string> = {};
        if (searchTerm) params.q = searchTerm;
        if (filterCategory) params.award_type = filterCategory;
        if (filterYear) params.student_year = filterYear;
        if (filterStatusId) params.status_id = filterStatusId;

        const data = await associateDeanService.getNominationHistory(token, params);

        if (isMounted) {
            setItems(data);
        }

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
  }, [searchTerm, filterCategory, filterYear, filterStatusId]);

  // ==========================================
  // 5. Logic: Filter / Sort / Paginate
  // ==========================================

  const processedData = useMemo(() => {
    let filtered = items;

    if (filterDate) {
        const filterTime = new Date(filterDate).setHours(23, 59, 59, 999);
        filtered = filtered.filter(item => new Date(item.created_at).getTime() <= filterTime);
    }
    
    // Sort Logic
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
  }, [items, filterDate, sortConfig]);

  const totalPages = Math.ceil(processedData.length / ITEMS_PER_PAGE);
  const currentItems = processedData.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  // ==========================================
  // 6. Handlers
  // ==========================================

  const handleSort = (key: keyof Nomination | 'award_type_name') => {
      setSortConfig(prev => {
          if (prev.key === key) {
              return { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' };
          }
          return { key, direction: 'asc' };
      });
  };

  const renderSortIcon = (key: string) => {
    if (sortConfig.key !== key) return <span className="text-gray-300 ml-1">↕</span>;
    return sortConfig.direction === 'asc' 
        ? <span className="text-blue-500 ml-1">↑</span>
        : <span className="text-blue-500 ml-1">↓</span>;
  };

  // ==========================================
  // 7. Render UI
  // ==========================================

  return (
    <div className="min-h-screen bg-gray-50/50 p-8 font-sans pb-24">
      
      {/* Inject Keyframes for Stagger Animation */}
      <style jsx global>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up {
          animation: fadeInUp 0.4s ease-out forwards;
        }
      `}</style>
      
      <div className="max-w-7xl mx-auto">
        
        {/* Header Card (Glassmorphism) */}
        <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-lg border border-white/50 p-8 mb-8 animate-fade-in-up">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
                <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                    ประวัติการพิจารณา
                </h1>
                <p className="text-gray-500 mt-1 font-medium">
                    {USE_MOCK_DATA && <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded mr-2">MOCK MODE</span>}
                    รายชื่อนิสิตที่ผ่านการลงคะแนนแล้ว
                </p>
            </div>
            {/* Decoration Icon */}
            <div className="hidden md:block">
                <div className="h-12 w-12 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 shadow-inner">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"/></svg>
                </div>
            </div>
          </div>

          {/* Filters Bar */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-8">
              {/* Search */}
              <div className="relative group">
                  <input type="text" placeholder="ค้นหาชื่อ หรือ รหัสนิสิต" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 pl-10 text-sm focus:ring-4 focus:ring-blue-100 focus:border-blue-300 outline-none transition-all shadow-sm group-hover:shadow-md" />
                  <svg className="w-5 h-5 absolute left-3 top-3 text-gray-400 group-focus-within:text-blue-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
              </div>
              {/* Date */}
              <div className="relative group">
                  <input type="date" value={filterDate} onChange={(e) => setFilterDate(e.target.value)} className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-500 outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-300 transition-all shadow-sm group-hover:shadow-md cursor-pointer" />
              </div>
              {/* Category */}
              <div className="relative group">
                  <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-500 appearance-none cursor-pointer outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-300 transition-all shadow-sm group-hover:shadow-md">
                      <option value="">ทุกประเภทรางวัล</option>
                      <option value="ด้านความคิดสร้างสรรค์และนวัตกรรม">ด้านนวัตกรรม</option>
                      <option value="ด้านความประพฤติดี">ด้านความประพฤติดี</option>
                      <option value="ด้านกิจกรรมเสริมหลักสูตร">ด้านกิจกรรม</option>
                  </select>
                  <svg className="w-4 h-4 absolute right-4 top-3.5 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
              </div>
              {/* Status Filter */}
              <div className="relative group">
                  <select value={filterStatusId} onChange={(e) => setFilterStatusId(e.target.value)} className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-500 appearance-none cursor-pointer outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-300 transition-all shadow-sm group-hover:shadow-md">
                      <option value="">ทุกสถานะ</option>
                      <option value="2">เห็นชอบ</option>
                      <option value="3">ไม่เห็นชอบ</option>
                  </select>
                  <svg className="w-4 h-4 absolute right-4 top-3.5 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
              </div>
          </div>
        </div>

        {/* Table Container */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden animate-fade-in-up" style={{ animationDelay: '100ms' }}>
          
          <div className="overflow-x-auto min-h-[400px]">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/80 text-gray-500 text-xs font-bold uppercase tracking-wider border-b border-gray-200">
                  <th className="p-5 cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleSort('student_firstname')}><div className="flex items-center gap-1">ชื่อ-นามสกุล {renderSortIcon('student_firstname')}</div></th>
                  <th className="p-5 text-center cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleSort('student_number')}><div className="flex items-center justify-center gap-1">รหัสนิสิต {renderSortIcon('student_number')}</div></th>
                  <th className="p-5 text-center cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleSort('academic_year')}><div className="flex items-center justify-center gap-1">ปีการศึกษา {renderSortIcon('academic_year')}</div></th>
                  <th className="p-5 text-center cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleSort('award_type_name')}><div className="flex items-center justify-center gap-1">รางวัล {renderSortIcon('award_type_name')}</div></th>
                  <th className="p-5 text-center cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleSort('created_at')}><div className="flex items-center justify-center gap-1">วันที่ส่ง {renderSortIcon('created_at')}</div></th>
                  <th className="p-5 text-center">สถานะ</th>
                  <th className="p-5 text-center w-[10%]">รายละเอียด</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {loading ? (
                  <TableSkeleton />
                ) : currentItems.length === 0 ? (
                  <tr><td colSpan={7} className="p-10 text-center text-gray-400 py-20 flex flex-col items-center justify-center gap-2">ไม่พบข้อมูล</td></tr>
                ) : (
                  currentItems.map((item, index) => {
                    const status = getStatusConfig(item.form_status_id);
                    return (
                      <tr 
                        key={item.form_id} 
                        className="hover:bg-blue-50/50 bg-white transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 animate-fade-in-up"
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        <td className="p-5 text-sm font-bold text-gray-700">{item.student_firstname} {item.student_lastname}</td>
                        <td className="p-5 text-sm text-center text-gray-600 font-mono">{item.student_number}</td>
                        <td className="p-5 text-sm text-center text-gray-600">{item.academic_year}</td>
                        <td className="p-5 text-sm text-center"><span className="px-3 py-1 rounded-full bg-gray-100 text-gray-600 text-xs font-medium border border-gray-200">{item.award_type_name}</span></td>
                        <td className="p-5 text-sm text-center text-gray-500">{formatDateTh(item.created_at)}</td>
                        <td className="p-5 text-center align-middle">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border shadow-sm ${status.color}`}>
                                {status.label}
                            </span>
                        </td>
                        <td className="p-5 text-center align-middle">
                              <button onClick={() => { setModalData(item); setIsDetailModalOpen(true); }} className="text-gray-400 hover:text-blue-600 bg-transparent hover:bg-blue-50 p-2 rounded-full transition-all duration-200 transform hover:scale-110 active:scale-95 shadow-sm hover:shadow-md" title="ดูรายละเอียด">
                                <svg className="w-5 h-5 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                              </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Footer Pagination */}
          {!loading && currentItems.length > 0 && (
            <div className="flex justify-between items-center p-6 border-t border-gray-100 bg-gray-50/30">
                <div className="flex items-center gap-2">
                  <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1} className="w-9 h-9 flex items-center justify-center rounded-lg bg-white border border-gray-200 text-gray-500 hover:bg-gray-100 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm active:scale-95">{'<'}</button>
                  <span className="text-xs font-semibold text-gray-500 bg-white px-3 py-1.5 rounded-lg border border-gray-200 shadow-sm">หน้า {currentPage} จาก {totalPages || 1}</span>
                  <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages || totalPages === 0} className="w-9 h-9 flex items-center justify-center rounded-lg bg-white border border-gray-200 text-gray-500 hover:bg-gray-100 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm active:scale-95">{'>'}</button>
              </div>
            </div>
          )}
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

    </div>
  );
}