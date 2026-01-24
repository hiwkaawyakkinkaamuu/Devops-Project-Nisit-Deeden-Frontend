"use client";

import { useState, useEffect } from "react";
import NominationDetailModal from "../../../components/nomination-detail-modal"; 

type VoteType = "approve" | "reject" | "abstain" | null;

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
  my_vote?: VoteType; 
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

// Mockup
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
export default function CommitteeVotePage() {
  const [nominations, setNominations] = useState<Nomination[]>([]);
  const [candidates, setCandidates] = useState<Nomination[]>([]); // ใช้ state นี้เป็นหลัก
  const [masterFaculties, setMasterFaculties] = useState<MasterFaculty[]>(MOCK_FACULTIES);
  const [masterDepartments, setMasterDepartments] = useState<MasterDepartment[]>(MOCK_DEPARTMENTS);

  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalData, setModalData] = useState<Nomination | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterDateText, setFilterDateText] = useState("");
  const [filterYear, setFilterYear] = useState("");
  const [filterVoteStatus, setFilterVoteStatus] = useState<string>(""); 

  const [sortConfig, setSortConfig] = useState<{ 
      key: keyof Nomination | 'award_type_name' | 'my_vote' | null, 
      direction: 'asc' | 'desc' | 'behavior' | 'innovation' | 'activity' | 'approve' | 'reject' | 'abstain' | null 
  }>({ key: null, direction: null });

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6; 

  // Helpers
  const formatDateAD = (isoDate: string) => {
      if (!isoDate) return "-";
      const date = new Date(isoDate);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${day}/${month}/${year}`;
  };

  const getFacultyName = (id: number) => {
      const f = masterFaculties.find(i => i.faculty_id === id);
      return f ? f.faculty_name : id;
  };

  useEffect(() => { setCurrentPage(1); }, [searchTerm, filterCategory, filterVoteStatus]);

  // Fetch Data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("accessToken");
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "";
        
        const params = new URLSearchParams();
        if (searchTerm) params.append("q", searchTerm);
        if (filterCategory) params.append("award_type", filterCategory);

        // Try Fetching from API
        const [resNominations, resFaculties, resDepartments] = await Promise.all([
            fetch(`${apiUrl}/api/committee/nominations?${params.toString()}`, {
                method: "GET",
                headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" }
            }),
            fetch(`${apiUrl}/api/master/faculties`, { headers: { "Authorization": `Bearer ${token}` } }),
            fetch(`${apiUrl}/api/master/departments`, { headers: { "Authorization": `Bearer ${token}` } })
        ]);

        if (resNominations.ok) {
            const data = await resNominations.json();
            setCandidates(data.data || []);
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
        console.warn("Fetch Error (Using Mockup Data):", error);

        // Mockup Data
        setCandidates([
            { 
                form_id: 1, student_id: 101, student_number: "66104524665", 
                student_firstname: "สมชาย", student_lastname: "ใจดี", 
                student_year: 1, form_status_id: 1, created_at: "2026-01-15T10:00:00Z", latest_update: "2026-01-15T10:00:00Z",
                award_type_id: 1, award_type_name: "ด้านความประพฤติดี", 
                faculty_id: 1, department_id: 10, campus_id: 1, academic_year: 2026, semester: 1,
                advisor_name: "ดร. สมหญิง", gpa: 3.75, phone_number: "0812345678", email: "somchai@ku.th", address: "หอพักใน", date_of_birth: "2002-01-01T00:00:00Z",
                detail: {}, files: [{ file_dir_id: 1, file_name: "transcript.pdf", file_type: "application/pdf", file_size: 1024, file_path: "#" }],
                my_vote: null
            },
            { 
                form_id: 2, student_id: 102, student_number: "66104524885", 
                student_firstname: "สมหญิง", student_lastname: "รักเรียน", 
                student_year: 1, form_status_id: 1, created_at: "2026-01-16T09:00:00Z", latest_update: "2026-01-16T09:00:00Z",
                award_type_id: 1, award_type_name: "ด้านความประพฤติดี", 
                faculty_id: 2, department_id: 20, campus_id: 1, academic_year: 2026, semester: 1,
                advisor_name: "อ. สมศรี", gpa: 3.80, phone_number: "0891234567", email: "ying@ku.th", address: "กทม.", date_of_birth: "2002-02-02T00:00:00Z",
                detail: {}, files: [],
                my_vote: 'approve'
            },
            { 
                form_id: 3, student_id: 103, student_number: "6510409999", 
                student_firstname: "เก่ง", student_lastname: "กล้า", 
                student_year: 2, form_status_id: 1, created_at: "2026-01-15T14:30:00Z", latest_update: "2026-01-15T14:30:00Z",
                award_type_id: 2, award_type_name: "ด้านความคิดสร้างสรรค์และนวัตกรรม", 
                faculty_id: 2, department_id: 11, campus_id: 1, academic_year: 2026, semester: 1,
                advisor_name: "ดร. สมชาย", gpa: 3.50, phone_number: "0811112222", email: "keng@ku.th", address: "นนทบุรี", date_of_birth: "2002-03-03T00:00:00Z",
                detail: {
                    project_title: "Smart Home AI", team_name: "AI Team", prize: "Gold Medal", 
                    organized_by: "Google", competition_level: "International", activity_category: "Innovation",
                    date_received: "2023-12-01T00:00:00Z"
                } as CreativityDetail,
                files: [{ file_dir_id: 2, file_name: "project.pdf", file_type: "application/pdf", file_size: 2048, file_path: "#" }],
                my_vote: 'reject'
            },
            { 
                form_id: 4, student_id: 104, student_number: "6710403333", 
                student_firstname: "มานะ", student_lastname: "อดทน", 
                student_year: 1, form_status_id: 1, created_at: "2026-01-10T11:00:00Z", latest_update: "2026-01-10T11:00:00Z",
                award_type_id: 3, award_type_name: "ด้านกิจกรรมเสริมหลักสูตร", 
                faculty_id: 3, department_id: 30, campus_id: 1, academic_year: 2026, semester: 1,
                advisor_name: "อ. มานี", gpa: 3.20, phone_number: "0855556666", email: "mana@ku.th", address: "ปทุมธานี", date_of_birth: "2001-04-04T00:00:00Z",
                detail: {
                    qualification_type: "Competition", project_title: "Startup Pitching", team_name: "Biz Kids", prize: "Winner", 
                    organized_by: "SET", competition_level: "National", activity_category: "Business",
                    date_received: "2023-11-20T00:00:00Z"
                } as ExtracurricularDetail,
                files: [{ file_dir_id: 3, file_name: "cert.pdf", file_type: "application/pdf", file_size: 1500, file_path: "#" }],
                my_vote: 'abstain'
            }
        ]);

      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [searchTerm, filterCategory]);

  const handleVote = (id: number, voteType: VoteType) => {
    setCandidates(prev => prev.map(item => 
      item.form_id === id ? { ...item, my_vote: voteType } : item
    ));
  };

  const handleSubmitVotes = async () => {
    const votedCandidates = candidates.filter(c => c.my_vote !== undefined && c.my_vote !== null);
    if (votedCandidates.length === 0) {
        alert("กรุณาเลือกผลการโหวตอย่างน้อย 1 รายการ");
        return;
    }

    if (confirm(`ยืนยันการส่งผลคะแนนจำนวน ${votedCandidates.length} รายการ?`)) {
        try {
            console.log("Submitting votes:", votedCandidates.map(c => ({ id: c.form_id, vote: c.my_vote })));
            alert("บันทึกผลการลงคะแนนเรียบร้อยแล้ว!");
        } catch (error) {
            console.error("Submit error:", error);
            alert("เกิดข้อผิดพลาดในการส่งคะแนน");
        }
    }
  };

  const handleViewDetail = (item: Nomination) => {
    setModalData(item);
    setIsModalOpen(true);
  };

  const filteredData = candidates.filter(item => {
    const fullName = `${item.student_firstname} ${item.student_lastname}`;
    const matchSearch = fullName.includes(searchTerm) || item.student_number.includes(searchTerm);
    
    // Filter Date (Text Search)
    const thaiDate = formatDateAD(item.created_at);
    const matchDate = filterDateText ? thaiDate.includes(filterDateText) : true;

    const matchCategory = filterCategory ? item.award_type_name === filterCategory : true;
    const matchYear = filterYear ? item.student_year.toString() === filterYear : true;

    let matchVoteStatus = true;
    if (filterVoteStatus) {
        if (filterVoteStatus === 'pending') matchVoteStatus = item.my_vote === null || item.my_vote === undefined;
        else matchVoteStatus = item.my_vote === filterVoteStatus;
    }

    return matchSearch && matchCategory && matchYear && matchVoteStatus && matchDate;
  });

  const sortedNominations = [...filteredData].sort((a, b) => {
      if (!sortConfig.key || !sortConfig.direction) return 0;

      if (sortConfig.key === 'student_firstname') {
          const nameA = `${a.student_firstname} ${a.student_lastname}`;
          const nameB = `${b.student_firstname} ${b.student_lastname}`;
          return sortConfig.direction === 'asc' ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
      }
      if (sortConfig.key === 'student_number') {
          return sortConfig.direction === 'asc'
              ? String(a.student_number).localeCompare(String(b.student_number))
              : String(b.student_number).localeCompare(String(a.student_number));
      }
      if (sortConfig.key === 'academic_year') { 
          return sortConfig.direction === 'asc' 
              ? a.academic_year - b.academic_year 
              : b.academic_year - a.academic_year;
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
      if (sortConfig.key === 'my_vote') {
          const statusOrder = { 'approve': 1, 'reject': 2, 'abstain': 3, null: 4 };
          const valA = statusOrder[a.my_vote || 'null'] || 99;
          const valB = statusOrder[b.my_vote || 'null'] || 99;
          return sortConfig.direction === 'asc' ? valA - valB : valB - valA;
      }
      return 0;
  });

  const totalPages = Math.ceil(sortedNominations.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentItems = sortedNominations.slice(startIndex, startIndex + itemsPerPage);
  const votedCount = candidates.filter(c => c.my_vote).length;

  const handleSort = (key: any) => { 
      setSortConfig((prev) => {
          if (prev.key !== key) {
              if (key === 'created_at') return { key, direction: 'desc' };
              if (key === 'award_type_name') return { key, direction: 'behavior' };
              if (key === 'my_vote') return { key, direction: 'asc' }; 
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
    <div className="min-h-screen bg-gray-50 p-8 font-sans pb-24">
      
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <h1 className="text-2xl font-bold text-gray-800">พิจารณาคัดเลือกนิสิตดีเด่น</h1>
        <p className="text-gray-400 text-sm mt-1">กรุณาพิจารณาข้อมูลและลงคะแนนเสียง (ผลการลงคะแนนจะเป็นความลับ)</p>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
          <div className="relative">
            <input type="text" placeholder="ค้นหาชื่อ หรือ รหัสนิสิต" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-gray-100 border-none rounded-lg px-4 py-2.5 pl-10 text-sm focus:ring-1 focus:ring-green-500" />
            <svg className="w-4 h-4 absolute left-3 top-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
          </div>
          
          {/* Text Input for Date Search */}
          <div className="relative">
            <input
                type="text"
                placeholder="ค้นหาวันที่ (วว/ดด/ปปปป)"
                value={filterDateText}
                onChange={(e) => setFilterDateText(e.target.value)}
                className="w-full bg-gray-100 border-none rounded-lg px-4 py-2.5 text-sm text-gray-500 placeholder-gray-400"
            />
            <svg className="w-4 h-4 absolute right-3 top-3 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
          </div>

          <div className="relative">
            <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="w-full bg-gray-100 border-none rounded-lg px-4 py-2.5 text-sm text-gray-500 appearance-none cursor-pointer">
                <option value="">ทุกประเภทรางวัล</option>
                <option value="ด้านความคิดสร้างสรรค์และนวัตกรรม">ด้านความคิดสร้างสรรค์และนวัตกรรม</option>
                <option value="ด้านความประพฤติดี">ด้านความประพฤติดี</option>
                <option value="ด้านกิจกรรมเสริมหลักสูตร">ด้านกิจกรรมเสริมหลักสูตร</option>
            </select>
            <svg className="w-4 h-4 absolute right-3 top-3 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
          </div>

          <div className="relative">
            <select value={filterVoteStatus} onChange={(e) => setFilterVoteStatus(e.target.value)} className="w-full bg-gray-100 border-none rounded-lg px-4 py-2.5 text-sm text-gray-500 appearance-none cursor-pointer">
                <option value="">สถานะการโหวตทั้งหมด</option>
                <option value="pending">ยังไม่ลงคะแนน</option>
                <option value="approve">เห็นชอบ</option>
                <option value="reject">ไม่เห็นชอบ</option>
                <option value="abstain">งดออกเสียง</option>
            </select>
            <svg className="w-4 h-4 absolute right-3 top-3 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
          </div>
        </div>

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

                {/* ✅ ปรับ min-w เพื่อแก้ปัญหาสถานะโดนเบียด */}
                <th className="p-4 font-semibold text-center cursor-pointer hover:bg-gray-200 transition-colors min-w-[140px]" onClick={() => handleSort('my_vote')}>
                    <div className="flex items-center justify-center gap-1">สถานะการเลือก {renderSortIcon('my_vote')}</div>
                </th>

                <th className="p-4 font-semibold text-center w-[30%]">ลงคะแนน</th>
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
                    className={`transition-colors ${item.my_vote ? "bg-blue-50/20" : "hover:bg-gray-50 bg-white"}`}
                  >
                    <td className="p-4 text-sm font-medium text-gray-700">{item.student_firstname} {item.student_lastname}</td>
                    <td className="p-4 text-sm text-center text-gray-600">{item.student_number}</td>
                    <td className="p-4 text-sm text-center text-gray-600">{item.academic_year}</td>
                    <td className="p-4 text-sm text-center text-gray-600 italic">{item.award_type_name}</td>
                    <td className="p-4 text-sm text-center text-gray-500">{formatDateAD(item.created_at)}</td>
                    
                    <td className="p-4 text-center align-middle whitespace-nowrap">
                        {item.my_vote ? (
                            <span className={`px-3 py-1 rounded-full text-xs font-bold border 
                                ${item.my_vote === 'approve' ? 'bg-green-50 text-green-700 border-green-200' : 
                                  item.my_vote === 'reject' ? 'bg-red-50 text-red-700 border-red-200' : 
                                  'bg-gray-100 text-gray-600 border-gray-200'}`}>
                                {item.my_vote === 'approve' && 'เห็นชอบ'}
                                {item.my_vote === 'reject' && 'ไม่เห็นชอบ'}
                                {item.my_vote === 'abstain' && 'งดออกเสียง'}
                            </span>
                        ) : (
                            <span className="text-xs text-gray-400 font-medium">- ยังไม่เลือก -</span>
                        )}
                    </td>

                    <td className="p-4 align-middle" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-center gap-2">
                            <button onClick={() => handleVote(item.form_id, 'approve')} className={`flex-1 px-2 py-1.5 rounded text-xs font-semibold border ${item.my_vote === 'approve' ? 'bg-green-600 text-white border-green-600' : 'bg-white text-gray-600 border-gray-300 hover:border-green-500'}`}>เห็นชอบ</button>
                            <button onClick={() => handleVote(item.form_id, 'reject')} className={`flex-1 px-2 py-1.5 rounded text-xs font-semibold border ${item.my_vote === 'reject' ? 'bg-red-600 text-white border-red-600' : 'bg-white text-gray-600 border-gray-300 hover:border-red-500'}`}>ไม่เห็นชอบ</button>
                            <button onClick={() => handleVote(item.form_id, 'abstain')} className={`flex-1 px-2 py-1.5 rounded text-xs font-semibold border ${item.my_vote === 'abstain' ? 'bg-gray-600 text-white border-gray-600' : 'bg-white text-gray-600 border-gray-300 hover:border-gray-500'}`}>งดออกเสียง</button>
                            
                            <button onClick={() => handleViewDetail(item)} className="ml-2 text-gray-400 hover:text-blue-600 p-1 rounded-full hover:bg-blue-50">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                            </button>
                        </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-100">
            <div className="flex items-center gap-2">
                <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1} className="w-8 h-8 flex items-center justify-center rounded bg-gray-100 text-gray-500 hover:bg-gray-200 text-sm disabled:opacity-50">{'<'}</button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button key={page} onClick={() => setCurrentPage(page)} className={`w-8 h-8 flex items-center justify-center rounded text-sm font-bold ${currentPage === page ? "bg-blue-100 text-blue-600" : "bg-transparent text-gray-500 hover:bg-gray-100"}`}>{page}</button>
                ))}
                <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages || totalPages === 0} className="w-8 h-8 flex items-center justify-center rounded bg-gray-100 text-gray-500 hover:bg-gray-200 text-sm disabled:opacity-50">{'>'}</button>
            </div>

            <div className="flex gap-3 items-center">
                <div className="text-sm text-gray-500 mr-2">ลงคะแนนแล้ว <span className="font-bold text-black">{votedCount}</span> / {candidates.length}</div>
                <button onClick={handleSubmitVotes} disabled={votedCount === 0} className={`px-6 py-2 rounded-lg text-sm font-bold text-white transition-all shadow-md ${votedCount > 0 ? "bg-blue-600 hover:bg-blue-700" : "bg-gray-300 cursor-not-allowed"}`}>ยืนยันการลงคะแนน</button>
            </div>
        </div>

      </div>

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