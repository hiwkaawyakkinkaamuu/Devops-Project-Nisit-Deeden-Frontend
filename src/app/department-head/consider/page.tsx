"use client";

import { useState, useEffect } from "react";
import NominationDetailModal from "../../../components/nomination-detail-modal"; 

// กำหนด Type ของข้อมูล
interface Nomination {
  id: number;
  name: string; 
  studentId: string;
  year: string;
  category: string; 
  status: string; 
  date: string;   // YYYY-MM-DD
  
  // --- ข้อมูลสำหรับ Modal ---
  firstName: string;
  lastName: string;
  awardType: "behavior" | "activity" | "innovation"; 
  faculty: string;
  major: string;
  advisor: string;
  gpa: string;
  phone: string;
  email: string;
  address: string;
  
  // ข้อมูลเฉพาะด้าน
  activityCriteria?: string;
  innovationQual?: boolean;
  awardDate?: string;
  projectName?: string;
  teamName?: string;
  workName?: string;
  receivedAward?: string;
  organizer?: string;
  files?: string[];
}

export default function DepartmentheadApprovalPage() {
  // --- Data State ---
  const [nominations, setNominations] = useState<Nomination[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  // --- Modal State ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalData, setModalData] = useState<Nomination | null>(null);

  // --- Filter States ---
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [filterYear, setFilterYear] = useState("");
  const [filterStatus, setFilterStatus] = useState("pending");

  // --- Sorting State ---
  interface SortConfig {
      key: string | null;
      direction: 'asc' | 'desc' | 'behavior' | 'innovation' | 'activity' | null;
  }
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: null, direction: null });

  // --- Pagination State ---
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // --- Effect 1: Reset หน้าเมื่อมีการ Filter หรือ Sort ---
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterDate, filterYear, filterStatus, sortConfig]);

  //  Fetch Data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // =========================================================
        // [API]
        // =========================================================
        /*
        const token = localStorage.getItem("token"); // ดึง Token
        const params = new URLSearchParams();

        // แนบ Query Params ตาม Filter
        if (searchTerm) params.append("q", searchTerm);
        if (filterDate) params.append("date", filterDate);
        if (filterYear) params.append("year", filterYear);
        if (filterStatus) params.append("status", filterStatus);

        const res = await fetch(`/api/department-head/nominations?${params.toString()}`, {
            method: "GET",
            headers: { 
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            }
        });

        if (!res.ok) {
            if (res.status === 401) {
                // Handle Unauthorized (เช่น เด้งไปหน้า Login)
                window.location.href = "/login";
                return;
            }
            throw new Error("Failed to fetch data");
        }
        
        const apiData = await res.json();
        setNominations(apiData); // นำข้อมูลจาก API ใส่ State
        */

        // =========================================================
        // [MOCKUP] ข้อมูลจำลอง (ใช้งานระหว่างรอหลังบ้าน)
        // =========================================================
        const mockData: Nomination[] = [
            { 
                id: 1, name: "สมชาย ใจดี", firstName: "สมชาย", lastName: "ใจดี", studentId: "66104524665", 
                year: "1", category: "ด้านความประพฤติดี", status: "pending", date: "2024-01-15",
                awardType: "behavior", faculty: "วิทยาศาสตร์", major: "วิทยาการคอมพิวเตอร์", advisor: "ดร. สมหญิง", gpa: "3.75", phone: "0812345678", email: "somchai@ku.th", address: "หอพักใน", files: ["transcript.pdf"]
            },
            { 
                id: 2, name: "สมหญิง รักเรียน", firstName: "สมหญิง", lastName: "รักเรียน", studentId: "66104524885", 
                year: "1", category: "ด้านความประพฤติดี", status: "pending", date: "2024-01-16",
                awardType: "behavior", faculty: "มนุษยศาสตร์", major: "ภาษาอังกฤษ", advisor: "อ. สมศรี", gpa: "3.80", phone: "0891234567", email: "ying@ku.th", address: "กทม."
            },
            { 
                id: 3, name: "เก่ง กล้า", firstName: "เก่ง", lastName: "กล้า", studentId: "66104524999", 
                year: "1", category: "ด้านความคิดสร้างสรรค์และนวัตกรรม", status: "pending", date: "2024-01-15",
                awardType: "innovation", faculty: "วิศวกรรมศาสตร์", major: "ไฟฟ้า", advisor: "ดร. สมชาย", gpa: "3.50", phone: "0811112222", email: "keng@ku.th", address: "นนทบุรี",
                innovationQual: true, awardDate: "2023-12-01", projectName: "Smart Home AI", teamName: "AI Team", workName: "Robot", receivedAward: "Gold Medal", organizer: "Google", files: ["project.pdf"]
            },
            { 
                id: 4, name: "มานะ อดทน", firstName: "มานะ", lastName: "อดทน", studentId: "66104524111", 
                year: "2", category: "ด้านกิจกรรมเสริมหลักสูตร", status: "pending", date: "2024-01-10",
                awardType: "activity", faculty: "บริหารธุรกิจ", major: "การตลาด", advisor: "อ. มานี", gpa: "3.20", phone: "0855556666", email: "mana@ku.th", address: "ปทุมธานี",
                activityCriteria: "competition", awardDate: "2023-11-20", projectName: "Startup Pitching", teamName: "Biz Kids", workName: "App", receivedAward: "Winner", organizer: "SET", files: ["cert.pdf"]
            },
            { 
                id: 5, name: "วิชัย ใจสู้", firstName: "วิชัย", lastName: "ใจสู้", studentId: "66104524222", 
                year: "3", category: "ด้านความประพฤติดี", status: "pending", date: "2024-01-12",
                awardType: "behavior", faculty: "สังคมศาสตร์", major: "รัฐศาสตร์", advisor: "ดร. ชูใจ", gpa: "3.90", phone: "0877778888", email: "wichai@ku.th", address: "หอพักนอก"
            },
            { 
                id: 6, name: "ปิติ ยินดี", firstName: "ปิติ", lastName: "ยินดี", studentId: "66104524333", 
                year: "4", category: "ด้านความคิดสร้างสรรค์และนวัตกรรม", status: "approved", date: "2024-01-05",
                awardType: "innovation", faculty: "เกษตร", major: "พืชไร่", advisor: "ศ. ปิติ", gpa: "3.60", phone: "0899990000", email: "piti@ku.th", address: "นครปฐม",
                innovationQual: true, awardDate: "2023-10-10", projectName: "Green Farm", teamName: "Green Team", workName: "Organic", receivedAward: "Silver", organizer: "DOA"
            }, 
            { 
                id: 7, name: "ชูใจ ใฝ่ดี", firstName: "ชูใจ", lastName: "ใฝ่ดี", studentId: "66104524444", 
                year: "1", category: "ด้านกิจกรรมเสริมหลักสูตร", status: "rejected", date: "2024-01-08",
                awardType: "activity", faculty: "ศึกษาศาสตร์", major: "พลศึกษา", advisor: "อ. วีระ", gpa: "2.90", phone: "0812341234", email: "choojai@ku.th", address: "กทม.",
                activityCriteria: "committee", awardDate: "2023-09-01", projectName: "Sport Day", teamName: "-", workName: "-", receivedAward: "-", organizer: "KU", files: ["activity_log.pdf"]
            }, 
        ];
        // ถ้าใช้ API ให้ลบบรรทัดนี้ออก หรือใส่ไว้ใน catch เพื่อใช้เป็น fallback
        setNominations(mockData); 

      } catch (error) {
        console.error("Error:", error);
        alert("ไม่สามารถดึงข้อมูลได้");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [searchTerm, filterDate, filterYear, filterStatus]); // เพิ่ม Dependency เพื่อให้เรียก API ใหม่เมื่อ Filter เปลี่ยน (สำหรับ API จริง)

  // --- Filtering Logic (Frontend) ---
  // หมายเหตุ: หากใช้ API จริง การ Filter ควรทำที่หลังบ้านผ่าน Query Params 
  // แต่ถ้า API ส่งข้อมูลมาทั้งหมดทีเดียว ก็ใช้ Logic นี้ได้เหมือนเดิม
  const filteredNominations = nominations
    .filter((item) => {
      const matchSearch = item.name.includes(searchTerm) || item.studentId.includes(searchTerm);
      const matchDate = filterDate ? item.date <= filterDate : true; 
      const matchYear = filterYear ? item.year === filterYear : true;
      const matchStatus = filterStatus ? item.status === filterStatus : true;
      return matchSearch && matchDate && matchYear && matchStatus;
    });

  // --- Sorting Logic (Universal) ---
  const sortedNominations = [...filteredNominations].sort((a, b) => {
      if (!sortConfig.key || !sortConfig.direction) return 0; // Default

      // 1. เรียงตามชื่อ (Name)
      if (sortConfig.key === 'name') {
          return sortConfig.direction === 'asc' 
              ? a.name.localeCompare(b.name) 
              : b.name.localeCompare(a.name);
      }

      // 2. เรียงตามรหัสนิสิต (Student ID) และ ชั้นปี (Year)
      if (sortConfig.key === 'studentId' || sortConfig.key === 'year') {
          const valA = sortConfig.key === 'studentId' ? a.studentId : a.year;
          const valB = sortConfig.key === 'studentId' ? b.studentId : b.year;
          return sortConfig.direction === 'asc'
              ? valA.localeCompare(valB)
              : valB.localeCompare(valA);
      }

      // 3. เรียงตามวันที่ (Date)
      if (sortConfig.key === 'date') {
          const dateA = new Date(a.date).getTime();
          const dateB = new Date(b.date).getTime();
          return sortConfig.direction === 'desc' 
              ? dateB - dateA 
              : dateA - dateB;
      }

      // 4. เรียงตามประเภทรางวัล (Category)
      if (sortConfig.key === 'category') {
          const target = sortConfig.direction === 'behavior' ? 'ด้านความประพฤติดี'
                       : sortConfig.direction === 'innovation' ? 'ด้านความคิดสร้างสรรค์และนวัตกรรม'
                       : 'ด้านกิจกรรมเสริมหลักสูตร';
          const isA = a.category === target;
          const isB = b.category === target;
          if (isA && !isB) return -1;
          if (!isA && isB) return 1;
          return 0;
      }

      return 0;
  });

  // --- Pagination Logic ---
  const totalPages = Math.ceil(sortedNominations.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentItems = sortedNominations.slice(startIndex, startIndex + itemsPerPage);

  // --- Handlers ---
  const handleViewDetail = (item: Nomination) => {
    setModalData(item);
    setIsModalOpen(true);
  };

  const handleAction = async (action: "approved" | "rejected") => {
    if (selectedId === null) {
      alert("กรุณาเลือกรายชื่อนิสิตก่อน");
      return;
    }
    const confirmMsg = action === "approved" ? "ยืนยันการเห็นชอบ?" : "ยืนยันการ 'ไม่' เห็นชอบ?";
    if (!confirm(confirmMsg)) return;

    try {
        // =========================================================
        // [API]
        // =========================================================
        /*
        const token = localStorage.getItem("token");
        const res = await fetch(`/api/departmenthead/approve/${selectedId}`, {
            method: "PUT",
            headers: { 
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json" 
            },
            body: JSON.stringify({ status: action }) // ส่งค่า status: "approved" หรือ "rejected"
        });

        if (!res.ok) throw new Error("Update failed");

        // ถ้า API สำเร็จ ให้ Update State หน้าบ้าน
        setNominations((prev) => 
            prev.map(item => item.id === selectedId ? { ...item, status: action } : item)
        );
        setSelectedId(null);
        alert("ดำเนินการเรียบร้อย");
        */

        // =========================================================
        // [MOCKUP] จำลองการอัปเดต
        // =========================================================
        setNominations((prev) => 
            prev.map(item => item.id === selectedId ? { ...item, status: action } : item)
        );
        setSelectedId(null);
        alert(`ดำเนินการเรียบร้อย (Mockup)`);

    } catch (error) {
        console.error(error);
        alert("เกิดข้อผิดพลาดในการทำรายการ");
    }
  };

  // --- Header Click Handler (Logic การวน Loop) ---
  const handleSort = (key: string) => {
      setSortConfig((prev) => {
          if (prev.key !== key) {
              if (key === 'date') return { key, direction: 'desc' };
              if (key === 'category') return { key, direction: 'behavior' };
              return { key, direction: 'asc' };
          }

          if (key === 'date') {
              if (prev.direction === 'desc') return { key, direction: 'asc' };
              if (prev.direction === 'asc') return { key: null, direction: null };
          }
          else if (key === 'category') {
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

  // --- Helper Render Icon ---
  const renderSortIcon = (key: string) => {
      if (sortConfig.key !== key || sortConfig.direction === null) return null;

      if (key === 'category') {
          const label = sortConfig.direction === 'behavior' ? '(ประพฤติ)'
                      : sortConfig.direction === 'innovation' ? '(ความคิดสร้างสรรค์และนวัตกรรม)'
                      : '(กิจกรรมเสริมหลักสูตร)';
          return <span className="text-xs text-blue-600 bg-blue-50 px-1 rounded ml-1 font-normal">{label}</span>;
      }

      if (sortConfig.direction === 'asc') {
          return <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7"></path></svg>;
      }
      if (sortConfig.direction === 'desc') {
          return <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>;
      }
      return null;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8 font-sans">
      
      {/* Header Card */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <h1 className="text-2xl font-bold text-gray-800">อนุมัติเห็นชอบหรือไม่เห็นชอบ</h1>
        <p className="text-gray-400 text-sm mt-1">เลือกนิสิตและกดเห็นชอบหรือไม่เห็นชอบ</p>

        {/* --- Filters Bar --- */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
          <div className="relative">
            <input type="text" placeholder="ค้นหาชื่อ หรือ รหัสนิสิต..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-gray-100 border-none rounded-lg px-4 py-2.5 pl-10 text-sm focus:ring-1 focus:ring-green-500" />
            <svg className="w-4 h-4 absolute left-3 top-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
          </div>
          <div className="relative"><input type="date" value={filterDate} onChange={(e) => setFilterDate(e.target.value)} className="w-full bg-gray-100 border-none rounded-lg px-4 py-2.5 text-sm text-gray-500" /></div>
          <div className="relative">
            <select value={filterYear} onChange={(e) => setFilterYear(e.target.value)} className="w-full bg-gray-100 border-none rounded-lg px-4 py-2.5 text-sm text-gray-500 appearance-none cursor-pointer">
                <option value="">ทุกระดับชั้น</option><option value="1">ปี 1</option><option value="2">ปี 2</option><option value="3">ปี 3</option><option value="4">ปี 4</option>
            </select>
            <svg className="w-4 h-4 absolute right-3 top-3 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
          </div>
          <div className="relative">
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="w-full bg-gray-100 border-none rounded-lg px-4 py-2.5 text-sm text-gray-500 appearance-none cursor-pointer">
                <option value="">ทั้งหมด</option><option value="pending">รอพิจารณา</option><option value="approved">เห็นชอบแล้ว</option><option value="rejected">ไม่เห็นชอบ</option>
            </select>
            <svg className="w-4 h-4 absolute right-3 top-3 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
          </div>
        </div>

        {/* --- Table --- */}
        <div className="mt-6 overflow-hidden rounded-lg border border-gray-100">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-100 text-gray-600 text-sm uppercase tracking-wider select-none">
                
                {/* 1. ชื่อ-นามสกุล */}
                <th className="p-4 font-semibold cursor-pointer hover:bg-gray-200 transition-colors" onClick={() => handleSort('name')}>
                    <div className="flex items-center gap-1">
                        ชื่อ-นามสกุล {renderSortIcon('name')}
                    </div>
                </th>

                {/* 2. รหัสนิสิต */}
                <th className="p-4 font-semibold text-center cursor-pointer hover:bg-gray-200 transition-colors" onClick={() => handleSort('studentId')}>
                    <div className="flex items-center justify-center gap-1">
                        รหัสนิสิต {renderSortIcon('studentId')}
                    </div>
                </th>

                {/* 3. ชั้นปี */}
                <th className="p-4 font-semibold text-center cursor-pointer hover:bg-gray-200 transition-colors" onClick={() => handleSort('year')}>
                    <div className="flex items-center justify-center gap-1">
                        ชั้นปี {renderSortIcon('year')}
                    </div>
                </th>

                {/* 4. ประเภทรางวัล (Loop 4 สถานะ) */}
                <th className="p-4 font-semibold text-center cursor-pointer hover:bg-gray-200 transition-colors" onClick={() => handleSort('category')}>
                    <div className="flex items-center justify-center gap-1">
                        ประเภทรางวัล {renderSortIcon('category')}
                    </div>
                </th>
                
                {/* 5. วันที่ส่ง */}
                <th className="p-4 font-semibold text-center cursor-pointer hover:bg-gray-200 transition-colors" onClick={() => handleSort('date')}>
                    <div className="flex items-center justify-center gap-1">
                        วันที่ส่ง {renderSortIcon('date')}
                    </div>
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
                    key={item.id} 
                    onClick={() => setSelectedId(item.id)} 
                    className={`cursor-pointer transition-colors duration-150 ${selectedId === item.id ? "bg-[#95F2AD] bg-opacity-40" : "hover:bg-gray-50 bg-white"}`}
                  >
                    <td className="p-4 text-sm font-medium text-gray-700">{item.name}</td>
                    <td className="p-4 text-sm text-center text-gray-600">{item.studentId}</td>
                    <td className="p-4 text-sm text-center text-gray-600">{item.year}</td>
                    <td className="p-4 text-sm text-center text-gray-600 italic">{item.category}</td>
                    <td className="p-4 text-sm text-center text-gray-500">{item.date}</td>
                    <td className="p-4 text-center">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${item.status === 'approved' ? 'bg-green-100 text-green-700' : item.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                            {item.status === 'approved' ? 'เห็นชอบ' : item.status === 'rejected' ? 'ไม่เห็นชอบ' : 'รอพิจารณา'}
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
            {/* Pagination Controls */}
            <div className="flex items-center gap-2">
                <button 
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="w-8 h-8 flex items-center justify-center rounded bg-gray-100 text-gray-500 hover:bg-gray-200 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {'<'}
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`w-8 h-8 flex items-center justify-center rounded text-sm font-bold transition-colors
                            ${currentPage === page 
                                ? "bg-blue-100 text-blue-600" 
                                : "bg-transparent text-gray-500 hover:bg-gray-100"}`}
                    >
                        {page}
                    </button>
                ))}

                <button 
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages || totalPages === 0}
                    className="w-8 h-8 flex items-center justify-center rounded bg-gray-100 text-gray-500 hover:bg-gray-200 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {'>'}
                </button>
            </div>

            {/* ปุ่ม Action */}
            <div className="flex gap-3">
                <button onClick={() => handleAction("rejected")} disabled={selectedId === null} className={`px-6 py-2 rounded-lg text-sm font-bold text-white transition-all shadow-md ${selectedId === null ? "bg-gray-300 cursor-not-allowed" : "bg-[#C81E1E] hover:bg-red-800"}`}>ไม่เห็นชอบ</button>
                <button onClick={() => handleAction("approved")} disabled={selectedId === null} className={`px-6 py-2 rounded-lg text-sm font-bold text-white transition-all shadow-md ${selectedId === null ? "bg-gray-300 cursor-not-allowed" : "bg-[#22C55E] hover:bg-green-700"}`}>เห็นชอบ</button>
            </div>
        </div>

      </div>

      <NominationDetailModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        data={modalData} 
      />

    </div>
  );
}