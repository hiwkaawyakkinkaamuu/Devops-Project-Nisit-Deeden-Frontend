"use client";

import { useState, useEffect } from "react";
import NominationDetailModal from "../../../components/nomination-detail-modal"; 

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

interface GoodBehaviorDetail {}

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

// Mockup Master Data
const MOCK_FACULTIES: MasterFaculty[] = [
    { faculty_id: 1, faculty_name: "คณะวิทยาศาสตร์" },
    { faculty_id: 2, faculty_name: "คณะวิศวกรรมศาสตร์" },
    { faculty_id: 3, faculty_name: "คณะบริหารธุรกิจ" },
    { faculty_id: 4, faculty_name: "คณะสังคมศาสตร์" },
    { faculty_id: 5, faculty_name: "คณะเกษตร" },
    { faculty_id: 6, faculty_name: "คณะศึกษาศาสตร์" }
];

const MOCK_DEPARTMENTS: MasterDepartment[] = [
    { department_id: 10, department_name: "ภาควิชาวิทยาการคอมพิวเตอร์", faculty_id: 1 },
    { department_id: 11, department_name: "ภาควิชาเคมี", faculty_id: 1 },
    { department_id: 20, department_name: "ภาควิชาวิศวกรรมไฟฟ้า", faculty_id: 2 },
    { department_id: 30, department_name: "ภาควิชาการตลาด", faculty_id: 3 },
    { department_id: 40, department_name: "ภาควิชารัฐศาสตร์", faculty_id: 4 },
    { department_id: 50, department_name: "ภาควิชาพืชไร่", faculty_id: 5 },
    { department_id: 60, department_name: "ภาควิชาพลศึกษา", faculty_id: 6 }
];

// Main Component
export default function HeadOfDepartmentConsiderPage() {
  const [nominations, setNominations] = useState<Nomination[]>([]);
  const [masterFaculties, setMasterFaculties] = useState<MasterFaculty[]>(MOCK_FACULTIES);
  const [masterDepartments, setMasterDepartments] = useState<MasterDepartment[]>(MOCK_DEPARTMENTS);

  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalData, setModalData] = useState<Nomination | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [filterYear, setFilterYear] = useState("");
  const [filterStatusId, setFilterStatusId] = useState<string>("");

  // Sort State
  const [sortConfig, setSortConfig] = useState<{ 
      key: keyof Nomination | 'award_type_name' | 'academic_year' | null, 
      direction: 'asc' | 'desc' | 'behavior' | 'innovation' | 'activity' | null 
  }>({ key: null, direction: null });

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // Helpers
  const getStatusName = (id: number) => {
      switch(id) {
          case 2: return "เห็นชอบ";
          case 3: return "ไม่เห็นชอบ";
          default: return "รอพิจารณา";
      }
  };
  
  const getStatusColor = (id: number) => {
      switch(id) {
          case 2: return "bg-green-100 text-green-700";
          case 3: return "bg-red-100 text-red-700";
          default: return "bg-yellow-100 text-yellow-700";
      }
  };

  // Helper: แปลงวันที่ ISO
  const formatDateStandard = (isoDate: string) => {
      if (!isoDate) return "-";
      return new Date(isoDate).toLocaleDateString('en-GB');
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterDate, filterYear, filterStatusId, sortConfig]);

  // Fetch Data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("accessToken");
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "";
        
        const params = new URLSearchParams();
        if (searchTerm) params.append("q", searchTerm);
        if (filterDate) params.append("date", filterDate);
        if (filterYear) params.append("student_year", filterYear);
        if (filterStatusId) params.append("status_id", filterStatusId);

        const [resNominations, resFaculties, resDepartments] = await Promise.all([
            fetch(`${apiUrl}/api/department/nominations?${params.toString()}`, {
                method: "GET",
                headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" }
            }),
            fetch(`${apiUrl}/api/master/faculties`, { headers: { "Authorization": `Bearer ${token}` } }),
            fetch(`${apiUrl}/api/master/departments`, { headers: { "Authorization": `Bearer ${token}` } })
        ]);

        if (resNominations.ok) {
            const data = await resNominations.json();
            setNominations(data.data || []);
        } else {
            throw new Error("Nominations API Failed");
        }

        if (resFaculties.ok) {
            const data = await resFaculties.json();
            if (data.data?.length > 0) setMasterFaculties(data.data);
        }
        if (resDepartments.ok) {
            const data = await resDepartments.json();
            if (data.data?.length > 0) setMasterDepartments(data.data);
        }

      } catch (error) {
        console.warn("⚠️ Fetch Error (Using Mockup Data):", error);

        // MOCKUP
        setNominations([
            { 
                form_id: 1, student_id: 101, student_number: "66104524665", 
                student_firstname: "สมชาย", student_lastname: "ใจดี", 
                student_year: 1, form_status_id: 1, created_at: "2026-01-15T10:00:00Z", latest_update: "2026-01-15T10:00:00Z",
                award_type_id: 1, award_type_name: "ด้านความประพฤติดี", 
                faculty_id: 1, department_id: 10, campus_id: 1, 
                academic_year: 2026,
                semester: 1,
                advisor_name: "ดร. สมหญิง", gpa: 3.75, phone_number: "0812345678", email: "somchai@ku.th", address: "หอพักใน", date_of_birth: "2002-01-01T00:00:00Z",
                detail: {}, files: [{ file_dir_id: 1, file_name: "transcript.pdf", file_type: "application/pdf", file_size: 1024, file_path: "#" }]
            },
            { 
                form_id: 2, student_id: 102, student_number: "66104524885", 
                student_firstname: "สมหญิง", student_lastname: "รักเรียน", 
                student_year: 1, form_status_id: 1, created_at: "2026-01-16T09:00:00Z", latest_update: "2026-01-16T09:00:00Z",
                award_type_id: 1, award_type_name: "ด้านความประพฤติดี", 
                faculty_id: 2, department_id: 20, campus_id: 1, 
                academic_year: 2026, 
                semester: 1,
                advisor_name: "อ. สมศรี", gpa: 3.80, phone_number: "0891234567", email: "ying@ku.th", address: "กทม.", date_of_birth: "2002-02-02T00:00:00Z",
                detail: {}, files: []
            },
            { 
                form_id: 3, student_id: 103, student_number: "66104524999", 
                student_firstname: "เก่ง", student_lastname: "กล้า", 
                student_year: 1, form_status_id: 1, created_at: "2026-01-15T14:30:00Z", latest_update: "2026-01-15T14:30:00Z",
                award_type_id: 2, award_type_name: "ด้านความคิดสร้างสรรค์และนวัตกรรม", 
                faculty_id: 1, department_id: 11, campus_id: 1, 
                academic_year: 2026, 
                semester: 1,
                advisor_name: "ดร. สมชาย", gpa: 3.50, phone_number: "0811112222", email: "keng@ku.th", address: "นนทบุรี", date_of_birth: "2002-03-03T00:00:00Z",
                detail: {
                    project_title: "Smart Home AI", team_name: "AI Team", prize: "Gold Medal", 
                    organized_by: "Google", competition_level: "International", activity_category: "Innovation",
                    date_received: "2023-12-01T00:00:00Z"
                } as CreativityDetail,
                files: [{ file_dir_id: 2, file_name: "project.pdf", file_type: "application/pdf", file_size: 2048, file_path: "#" }]
            },
            { 
                form_id: 4, student_id: 104, student_number: "66104524111", 
                student_firstname: "มานะ", student_lastname: "อดทน", 
                student_year: 2, form_status_id: 1, created_at: "2026-01-10T11:00:00Z", latest_update: "2026-01-10T11:00:00Z",
                award_type_id: 3, award_type_name: "ด้านกิจกรรมเสริมหลักสูตร", 
                faculty_id: 3, department_id: 30, campus_id: 1, 
                academic_year: 2026, 
                semester: 1,
                advisor_name: "อ. มานี", gpa: 3.20, phone_number: "0855556666", email: "mana@ku.th", address: "ปทุมธานี", date_of_birth: "2001-04-04T00:00:00Z",
                detail: {
                    qualification_type: "Competition", project_title: "Startup Pitching", team_name: "Biz Kids", prize: "Winner", 
                    organized_by: "SET", competition_level: "National", activity_category: "Business",
                    date_received: "2023-11-20T00:00:00Z"
                } as ExtracurricularDetail,
                files: [{ file_dir_id: 3, file_name: "cert.pdf", file_type: "application/pdf", file_size: 1500, file_path: "#" }]
            },
            { 
                form_id: 5, student_id: 105, student_number: "66104524222", 
                student_firstname: "วิชัย", student_lastname: "ใจสู้", 
                student_year: 3, form_status_id: 1, created_at: "2026-01-12T08:00:00Z", latest_update: "2026-01-12T08:00:00Z",
                award_type_id: 1, award_type_name: "ด้านความประพฤติดี", 
                faculty_id: 4, department_id: 40, campus_id: 1, 
                academic_year: 2026, 
                semester: 1,
                advisor_name: "ดร. ชูใจ", gpa: 3.90, phone_number: "0877778888", email: "wichai@ku.th", address: "หอพักนอก", date_of_birth: "2000-05-05T00:00:00Z",
                detail: {}, files: []
            },
            { 
                form_id: 6, student_id: 106, student_number: "66104524333", 
                student_firstname: "ปิติ", student_lastname: "ยินดี", 
                student_year: 4, form_status_id: 2, created_at: "2026-01-05T09:00:00Z", latest_update: "2026-01-07T09:00:00Z",
                award_type_id: 2, award_type_name: "ด้านความคิดสร้างสรรค์และนวัตกรรม", 
                faculty_id: 5, department_id: 50, campus_id: 1, 
                academic_year: 2026, 
                semester: 1,
                advisor_name: "ศ. ปิติ", gpa: 3.60, phone_number: "0899990000", email: "piti@ku.th", address: "นครปฐม", date_of_birth: "1999-06-06T00:00:00Z",
                detail: {
                    project_title: "Green Farm", team_name: "Green Team", prize: "Silver", 
                    organized_by: "DOA", competition_level: "National", activity_category: "Agriculture",
                    date_received: "2023-10-10T00:00:00Z"
                } as CreativityDetail,
                files: []
            },
            { 
                form_id: 7, student_id: 107, student_number: "66104524444", 
                student_firstname: "ชูใจ", student_lastname: "ใฝ่ดี", 
                student_year: 1, form_status_id: 3, created_at: "2026-01-08T13:00:00Z", latest_update: "2026-01-09T10:00:00Z",
                award_type_id: 3, award_type_name: "ด้านกิจกรรมเสริมหลักสูตร", 
                faculty_id: 6, department_id: 60, campus_id: 1, 
                academic_year: 2026, 
                semester: 1,
                advisor_name: "อ. วีระ", gpa: 2.90, phone_number: "0812341234", email: "choojai@ku.th", address: "กทม.", date_of_birth: "2002-07-07T00:00:00Z",
                detail: {
                    qualification_type: "Committee", project_title: "Sport Day", team_name: "-", prize: "-", 
                    organized_by: "KU", competition_level: "University", activity_category: "Sports",
                    date_received: "2023-09-01T00:00:00Z"
                } as ExtracurricularDetail,
                files: [{ file_dir_id: 4, file_name: "activity_log.pdf", file_type: "application/pdf", file_size: 500, file_path: "#" }]
            }
        ]);

      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [searchTerm, filterDate, filterYear, filterStatusId]);

  // Filtering Logic
  const filteredNominations = nominations.filter((item) => {
      const fullName = `${item.student_firstname} ${item.student_lastname}`;
      const matchSearch = fullName.includes(searchTerm) || item.student_number.includes(searchTerm);
      
      const itemDate = item.created_at.split('T')[0];
      const matchDate = filterDate ? itemDate === filterDate : true; 
      
      const matchYear = filterYear ? item.student_year.toString() === filterYear : true;
      const matchStatus = filterStatusId ? item.form_status_id.toString() === filterStatusId : true;
      return matchSearch && matchDate && matchYear && matchStatus;
  });

  // Sorting Logic
  const sortedNominations = [...filteredNominations].sort((a, b) => {
      if (!sortConfig.key || !sortConfig.direction) return 0;

      if (sortConfig.key === 'student_firstname') {
          const nameA = `${a.student_firstname} ${a.student_lastname}`;
          const nameB = `${b.student_firstname} ${b.student_lastname}`;
          return sortConfig.direction === 'asc' ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
      }
      
      // Sort ปีการศึกษา
      if (sortConfig.key === 'academic_year') { 
          return sortConfig.direction === 'asc' 
              ? a.academic_year - b.academic_year 
              : b.academic_year - a.academic_year;
      }
      if (sortConfig.key === 'student_number') {
          return sortConfig.direction === 'asc'
              ? String(a.student_number).localeCompare(String(b.student_number))
              : String(b.student_number).localeCompare(String(a.student_number));
      }
      // Sort วันที่
      if (sortConfig.key === 'created_at') {
          const dateA = new Date(a.created_at).getTime();
          const dateB = new Date(b.created_at).getTime();
          return sortConfig.direction === 'desc' ? dateB - dateA : dateA - dateB;
      }
      
      if (sortConfig.key === 'award_type_name') {
          const target = sortConfig.direction === 'behavior' ? 'ด้านความประพฤติดี'
                       : sortConfig.direction === 'innovation' ? 'ด้านความคิดสร้างสรรค์และนวัตกรรม'
                       : 'ด้านกิจกรรมเสริมหลักสูตร';
          const isA = a.award_type_name === target;
          const isB = b.award_type_name === target;
          if (isA && !isB) return -1;
          if (!isA && isB) return 1;
          return 0;
      }
      return 0;
  });

  // Pagination
  const totalPages = Math.ceil(sortedNominations.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentItems = sortedNominations.slice(startIndex, startIndex + itemsPerPage);

  // Handlers
  const handleViewDetail = (item: Nomination) => {
    setModalData(item);
    setIsModalOpen(true);
  };

  const handleAction = async (action: "approved" | "rejected") => {
    if (selectedId === null) {
      alert("กรุณาเลือกรายชื่อนิสิตก่อน");
      return;
    }
    const statusId = action === "approved" ? 2 : 3;
    const confirmMsg = action === "approved" ? "ยืนยันการเห็นชอบ?" : "ยืนยันการ 'ไม่' เห็นชอบ?";
    if (!confirm(confirmMsg)) return;

    try {
        setNominations((prev) => 
            prev.map(item => item.form_id === selectedId ? { ...item, form_status_id: statusId } : item)
        );
        setSelectedId(null);
        alert(`ดำเนินการเรียบร้อย`);
    } catch (error) {
        console.error(error);
        alert("เกิดข้อผิดพลาดในการทำรายการ");
    }
  };

  const handleSort = (key: any) => { 
      setSortConfig((prev) => {
          if (prev.key !== key) {
              if (key === 'created_at') return { key, direction: 'desc' };
              if (key === 'award_type_name') return { key, direction: 'behavior' };
              return { key, direction: 'asc' };
          }
          if (key === 'created_at') {
              if (prev.direction === 'desc') return { key, direction: 'asc' };
              if (prev.direction === 'asc') return { key: null, direction: null };
          }
          else if (key === 'award_type_name') {
              if (prev.direction === 'behavior') return { key, direction: 'innovation' };
              if (prev.direction === 'innovation') return { key, direction: 'activity' };
              if (prev.direction === 'activity') return { key: null, direction: null };
          }
          else {
              if (prev.direction === 'asc') return { key, direction: 'desc' };
              if (prev.direction === 'desc') return { key: null, direction: null };
          }
          return { key: null, direction: null };
      });
  };

  const renderSortIcon = (key: string) => {
      if (sortConfig.key !== key || sortConfig.direction === null) return null;
      if (key === 'award_type_name') {
          const label = sortConfig.direction === 'behavior' ? '(ประพฤติดี)'
                      : sortConfig.direction === 'innovation' ? '(นวัตกรรม)'
                      : '(กิจกรรม)';
          return <span className="text-xs text-blue-600 bg-blue-50 px-1 rounded ml-1 font-normal">{label}</span>;
      }
      return sortConfig.direction === 'asc' 
        ? <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7"></path></svg>
        : <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8 font-sans">
      
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <h1 className="text-2xl font-bold text-gray-800">อนุมัติเห็นชอบหรือไม่เห็นชอบ</h1>
        <p className="text-gray-400 text-sm mt-1">เลือกนิสิตและกดเห็นชอบหรือไม่เห็นชอบ</p>

        {/* Filters Bar */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
          <div className="relative">
            <input type="text" placeholder="ค้นหาชื่อ หรือ รหัสนิสิต" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-gray-100 border-none rounded-lg px-4 py-2.5 pl-10 text-sm focus:ring-1 focus:ring-green-500" />
            <svg className="w-4 h-4 absolute left-3 top-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
          </div>
          
          {/* DATE FILTER */}
          <div className="relative">
            <input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="w-full bg-gray-100 border-none rounded-lg px-4 py-2.5 text-sm text-gray-500"
            />
          </div>

          <div className="relative">
            <select value={filterYear} onChange={(e) => setFilterYear(e.target.value)} className="w-full bg-gray-100 border-none rounded-lg px-4 py-2.5 text-sm text-gray-500 appearance-none cursor-pointer">
                <option value="">ทุกระดับชั้น</option><option value="1">ปี 1</option><option value="2">ปี 2</option><option value="3">ปี 3</option><option value="4">ปี 4</option>
            </select>
            <svg className="w-4 h-4 absolute right-3 top-3 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
          </div>
          <div className="relative">
            <select value={filterStatusId} onChange={(e) => setFilterStatusId(e.target.value)} className="w-full bg-gray-100 border-none rounded-lg px-4 py-2.5 text-sm text-gray-500 appearance-none cursor-pointer">
                <option value="">ทั้งหมด</option><option value="1">รอพิจารณา</option><option value="2">เห็นชอบแล้ว</option><option value="3">ไม่เห็นชอบ</option>
            </select>
            <svg className="w-4 h-4 absolute right-3 top-3 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
          </div>
        </div>

        {/* Table */}
        <div className="mt-6 overflow-hidden rounded-lg border border-gray-100">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-100 text-gray-600 text-sm uppercase tracking-wider select-none">
                
                <th className="p-4 font-semibold cursor-pointer hover:bg-gray-200 transition-colors" onClick={() => handleSort('student_firstname')}>
                    <div className="flex items-center gap-1">ชื่อ-นามสกุล {renderSortIcon('student_firstname')}</div>
                </th>

                <th className="p-4 font-semibold text-center cursor-pointer hover:bg-gray-200 transition-colors" onClick={() => handleSort('student_number')}>
                    <div className="flex items-center justify-center gap-1">รหัสนิสิต {renderSortIcon('student_number')}</div>
                </th>

                <th className="p-4 font-semibold text-center cursor-pointer hover:bg-gray-200 transition-colors" onClick={() => handleSort('academic_year')}>
                    <div className="flex items-center justify-center gap-1">ปีการศึกษา {renderSortIcon('academic_year')}</div>
                </th>

                <th className="p-4 font-semibold text-center cursor-pointer hover:bg-gray-200 transition-colors" onClick={() => handleSort('award_type_name')}>
                    <div className="flex items-center justify-center gap-1">ประเภทรางวัล {renderSortIcon('award_type_name')}</div>
                </th>
                
                <th className="p-4 font-semibold text-center cursor-pointer hover:bg-gray-200 transition-colors" onClick={() => handleSort('created_at')}>
                    <div className="flex items-center justify-center gap-1">วันที่ส่ง {renderSortIcon('created_at')}</div>
                </th>

                <th className="p-4 font-semibold text-center">สถานะ</th>
                <th className="p-4 font-semibold text-center">รายละเอียด</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={7} className="p-8 text-center text-gray-400">กำลังโหลด...</td></tr>
              ) : currentItems.length === 0 ? (
                <tr><td colSpan={7} className="p-8 text-center text-gray-400">ไม่พบข้อมูลที่ค้นหา</td></tr>
              ) : (
                currentItems.map((item) => (
                  <tr 
                    key={item.form_id} 
                    onClick={() => setSelectedId(item.form_id)} 
                    className={`cursor-pointer transition-colors duration-150 ${selectedId === item.form_id ? "bg-[#95F2AD] bg-opacity-40" : "hover:bg-gray-50 bg-white"}`}
                  >
                    <td className="p-4 text-sm font-medium text-gray-700">{item.student_firstname} {item.student_lastname}</td>
                    <td className="p-4 text-sm text-center text-gray-600">{item.student_number}</td>
                    <td className="p-4 text-sm text-center text-gray-600">{item.academic_year}</td>
                    <td className="p-4 text-sm text-center text-gray-600 italic">{item.award_type_name}</td>
        
                    <td className="p-4 text-sm text-center text-gray-500">{formatDateStandard(item.created_at)}</td>
                    
                    <td className="p-4 text-center">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(item.form_status_id)}`}>
                            {getStatusName(item.form_status_id)}
                        </span>
                    </td>
                    <td className="p-4 text-center">
                        <button 
                            onClick={(e) => {
                                e.stopPropagation();
                                handleViewDetail(item);
                            }}
                            className="text-gray-400 hover:text-blue-600 transition-colors p-1.5 hover:bg-blue-50 rounded-full"
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

        {/* Footer */}
        <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-100">
            <div className="flex items-center gap-2">
                <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1} className="w-8 h-8 flex items-center justify-center rounded bg-gray-100 text-gray-500 hover:bg-gray-200 text-sm disabled:opacity-50 disabled:cursor-not-allowed">{'<'}</button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button key={page} onClick={() => setCurrentPage(page)} className={`w-8 h-8 flex items-center justify-center rounded text-sm font-bold transition-colors ${currentPage === page ? "bg-blue-100 text-blue-600" : "bg-transparent text-gray-500 hover:bg-gray-100"}`}>{page}</button>
                ))}
                <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages || totalPages === 0} className="w-8 h-8 flex items-center justify-center rounded bg-gray-100 text-gray-500 hover:bg-gray-200 text-sm disabled:opacity-50 disabled:cursor-not-allowed">{'>'}</button>
            </div>

            <div className="flex gap-3">
                <button onClick={() => handleAction("rejected")} disabled={selectedId === null} className={`px-6 py-2 rounded-lg text-sm font-bold text-white transition-all shadow-md ${selectedId === null ? "bg-gray-300 cursor-not-allowed" : "bg-[#C81E1E] hover:bg-red-800"}`}>ไม่เห็นชอบ</button>
                <button onClick={() => handleAction("approved")} disabled={selectedId === null} className={`px-6 py-2 rounded-lg text-sm font-bold text-white transition-all shadow-md ${selectedId === null ? "bg-gray-300 cursor-not-allowed" : "bg-[#22C55E] hover:bg-green-700"}`}>เห็นชอบ</button>
            </div>
        </div>

      </div>

      {/* ส่ง Master Data เข้าไปใน Modal */}
      <NominationDetailModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        data={modalData} 
        faculties={masterFaculties}
        departments={masterDepartments}
      />

    </div>
  );
}