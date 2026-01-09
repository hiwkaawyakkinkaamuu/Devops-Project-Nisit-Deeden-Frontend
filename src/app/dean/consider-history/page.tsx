"use client";

import { useState, useEffect } from "react";
import NominationDetailModal from "../../../components/nomination-detail-modal";

// --- 1. Type Definition (ปรับให้ตรงกับ Mock Data เป๊ะๆ) ---
interface HistoryItem {
  // --- ข้อมูลหลักสำหรับตาราง ---
  id: number;
  name: string;
  studentId: string;
  year: string;
  category: string;
  status: string;
  date: string;

  // --- ข้อมูลส่วนตัว (Modal) ---
  title?: string;
  firstName?: string;
  lastName?: string;
  faculty?: string;
  major?: string;
  advisor?: string;
  gpa?: string;
  phone?: string;
  email?: string;
  address?: string;

  // --- ข้อมูลจำเพาะของรางวัล (Fields ตาม Mock Data) ---
  awardType?: string;       // 'behavior', 'innovation', 'activity'
  
  // Fields สำหรับด้านความคิดสร้างสรรค์และนวัตกรรม (Innovation)
  innovationQual?: boolean; // คุณสมบัติเบื้องต้น
  projectName?: string;     // ชื่อผลงาน/โครงการ
  workName?: string;        // ชิ้นงาน
  teamName?: string;        // ชื่อทีม
  
  // Fields สำหรับด้านกิจกรรม/กิจกรรมเสริมหลักสูตร (Activity)
  activityCriteria?: string; // เกณฑ์กิจกรรม (competition, committee, etc.)
  activityName?: string;     // ชื่อกิจกรรม
  position?: string;         // ตำแหน่ง
  
  // Fields ทั่วไปของรางวัล
  awardDate?: string;       // วันที่ได้รับรางวัล
  receivedAward?: string;   // รางวัลที่ได้รับ
  organizer?: string;       // หน่วยงานที่จัด
  description?: string;     // รายละเอียด
  
  // เอกสารแนบ
  files?: string[];         // Array ของชื่อไฟล์
  evidenceFile?: string;    // (เผื่อไว้)
}

export default function HistoryPage() {
  // --- State ---
  const [historyData, setHistoryData] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  // --- Modal State ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalData, setModalData] = useState<HistoryItem | null>(null);

  // --- Filter States ---
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [filterStatus, setFilterStatus] = useState(""); 
  const [filterCategory, setFilterCategory] = useState(""); 

  // --- Sorting State ---
  interface SortConfig {
      key: string | null;
      direction: string | null; 
  }
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: null, direction: null });

  // --- Pagination State ---
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6; 

  // Reset Pagination เมื่อ Filter เปลี่ยน
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterDate, filterStatus, filterCategory, sortConfig]);

  // --- Fetch Data ---
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // =========================================================
        // 🟡 [API Integration] ส่วนเชื่อมต่อหลังบ้าน (สมบูรณ์)
        // =========================================================
        /*
        // 1. เตรียม Token และ URL
        const token = localStorage.getItem("accessToken"); // หรือใช้ Session Hook
        if (!token) {
            console.warn("No access token found");
            setLoading(false);
            return;
        }

        // 2. แปลง Category ไทย -> อังกฤษ (ถ้า Backend ต้องการภาษาอังกฤษ)
        const categoryMap: Record<string, string> = {
            "ด้านความประพฤติดี": "behavior",
            "ด้านความคิดสร้างสรรค์และนวัตกรรม": "innovation",
            "ด้านกิจกรรมเสริมหลักสูตร": "activity"
        };
        const backendCategory = categoryMap[filterCategory] || "";

        // 3. สร้าง Query Parameters
        const params = new URLSearchParams();
        if (searchTerm) params.append("q", searchTerm); // ค้นหาชื่อ/รหัสนิสิต
        if (filterDate) params.append("date", filterDate);
        if (filterStatus) params.append("status", filterStatus); // approved, rejected, pending
        if (filterCategory) params.append("type", backendCategory); // ส่งค่าภาษาอังกฤษไป
        
        // Pagination (ส่งไปให้ Backend ตัด)
        params.append("page", currentPage.toString());
        params.append("limit", itemsPerPage.toString());

        // 4. ยิง Request (GET)
        // ใช้ Path ที่ Proxy ไว้ใน next.config.js หรือ URL เต็ม
        const response = await fetch(`/api/dean/history?${params.toString()}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          }
        });

        if (!response.ok) {
            // Handle error logic (e.g. 401 Unauthorized -> Logout)
            if (response.status === 401) {
                // router.push('/login');
            }
            throw new Error(`API Error: ${response.status} - ${response.statusText}`);
        }

        const result = await response.json();
        
        // 5. Transform Data (ถ้าชื่อ Field หลังบ้านไม่ตรงกับหน้าบ้าน)
        // สมมติ Backend ส่งกลับมาเป็น { data: [...], total: 100 }
        const formattedData: HistoryItem[] = result.data.map((item: any) => ({
            id: item.id,
            name: `${item.student.title} ${item.student.firstName} ${item.student.lastName}`,
            studentId: item.student.studentId,
            year: item.student.year, // อาจต้องคำนวณจากรหัส
            category: item.awardType === 'innovation' ? 'ด้านความคิดสร้างสรรค์และนวัตกรรม' : 
                      item.awardType === 'behavior' ? 'ด้านความประพฤติดี' : 'ด้านกิจกรรมเสริมหลักสูตร',
            status: item.status,
            date: item.submittedDate,
            // ... Map fields อื่นๆ ให้ครบตาม Interface HistoryItem ...
            firstName: item.student.firstName,
            lastName: item.student.lastName,
            email: item.student.email,
            // ...
        }));

        setHistoryData(formattedData);
        // setTotalItems(result.total); // ถ้ามี State เก็บจำนวนทั้งหมด
        */
        
        // --- MOCK DATA (Structure ตรงตาม Interface) ---
        const mockData: HistoryItem[] = [
          { 
            id: 1, 
            name: "สมชาย ใจดี", firstName: "สมชาย", lastName: "ใจดี", studentId: "66104524665", 
            year: "1", category: "ด้านความประพฤติดี", status: "approved", date: "2024-01-15",
            awardType: "behavior", faculty: "วิทยาศาสตร์", major: "วิทยาการคอมพิวเตอร์", advisor: "ดร. สมหญิง", gpa: "3.75", phone: "0812345678", email: "somchai@ku.th", address: "หอพักใน", 
            files: ["transcript.pdf"], description: "มีความประพฤติเรียบร้อย ช่วยเหลืองานคณะสม่ำเสมอ"
          },
          { 
            id: 2, 
            name: "สมหญิง รักเรียน", firstName: "สมหญิง", lastName: "รักเรียน", studentId: "66104524885", 
            year: "1", category: "ด้านความประพฤติดี", status: "approved", date: "2024-01-16",
            awardType: "behavior", faculty: "มนุษยศาสตร์", major: "ภาษาอังกฤษ", advisor: "อ. สมศรี", gpa: "3.80", phone: "0891234567", email: "ying@ku.th", address: "กทม.",
            description: "เก็บของหายคืนเจ้าของ และเป็นตัวแทนนิสิตในการทำกิจกรรมจิตอาสา"
          },
          { 
            id: 3, 
            name: "เก่ง กล้า", firstName: "เก่ง", lastName: "กล้า", studentId: "66104524999", 
            year: "1", category: "ด้านความคิดสร้างสรรค์และนวัตกรรม", status: "approved", date: "2024-01-15",
            awardType: "innovation", faculty: "วิศวกรรมศาสตร์", major: "ไฟฟ้า", advisor: "ดร. สมชาย", gpa: "3.50", phone: "0811112222", email: "keng@ku.th", address: "นนทบุรี",
            innovationQual: true, awardDate: "2023-12-01", projectName: "Smart Home AI", teamName: "AI Team", workName: "Robot", receivedAward: "Gold Medal", organizer: "Google", files: ["project.pdf"]
          },
          { 
            id: 4, 
            name: "มานะ อดทน", firstName: "มานะ", lastName: "อดทน", studentId: "66104524111", 
            year: "2", category: "ด้านกิจกรรมเสริมหลักสูตร", status: "approved", date: "2024-01-10",
            awardType: "activity", faculty: "บริหารธุรกิจ", major: "การตลาด", advisor: "อ. มานี", gpa: "3.20", phone: "0855556666", email: "mana@ku.th", address: "ปทุมธานี",
            activityCriteria: "competition", awardDate: "2023-11-20", projectName: "Startup Pitching", teamName: "Biz Kids", workName: "App", receivedAward: "Winner", organizer: "SET", files: ["cert.pdf"]
          },
          { 
            id: 5, 
            name: "วิชัย ใจสู้", firstName: "วิชัย", lastName: "ใจสู้", studentId: "66104524222", 
            year: "3", category: "ด้านความประพฤติดี", status: "approved", date: "2024-01-12",
            awardType: "behavior", faculty: "สังคมศาสตร์", major: "รัฐศาสตร์", advisor: "ดร. ชูใจ", gpa: "3.90", phone: "0877778888", email: "wichai@ku.th", address: "หอพักนอก",
            description: "อุทิศตนเพื่อสังคม ออกค่ายอาสาอย่างต่อเนื่อง"
          },
          { 
            id: 6, 
            name: "ปิติ ยินดี", firstName: "ปิติ", lastName: "ยินดี", studentId: "66104524333", 
            year: "4", category: "ด้านความคิดสร้างสรรค์และนวัตกรรม", status: "approved", date: "2024-01-05",
            awardType: "innovation", faculty: "เกษตร", major: "พืชไร่", advisor: "ศ. ปิติ", gpa: "3.60", phone: "0899990000", email: "piti@ku.th", address: "นครปฐม",
            innovationQual: true, awardDate: "2023-10-10", projectName: "Green Farm", teamName: "Green Team", workName: "Organic", receivedAward: "Silver", organizer: "DOA", files: ["research.pdf"]
          }, 
          { 
            id: 7, 
            name: "ชูใจ ใฝ่ดี", firstName: "ชูใจ", lastName: "ใฝ่ดี", studentId: "66104524444", 
            year: "1", category: "ด้านกิจกรรมเสริมหลักสูตร", status: "rejected", date: "2024-01-08",
            awardType: "activity", faculty: "ศึกษาศาสตร์", major: "พลศึกษา", advisor: "อ. วีระ", gpa: "2.90", phone: "0812341234", email: "choojai@ku.th", address: "กทม.",
            activityCriteria: "committee", awardDate: "2023-09-01", projectName: "Sport Day", teamName: "-", workName: "-", receivedAward: "-", organizer: "KU", files: ["activity_log.pdf"]
          }, 
        ];
        
        // เรียงลำดับตามวันที่ (ล่าสุดขึ้นก่อน)
        setHistoryData(mockData.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));

      } catch (error) {
        console.error("Error fetching history:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [searchTerm, filterDate, filterStatus, filterCategory]);

  // --- Filtering Logic ---
  const filteredData = historyData.filter((item) => {
    const matchSearch = item.name.includes(searchTerm) || item.studentId.includes(searchTerm);
    const matchDate = filterDate ? item.date === filterDate : true;
    const matchStatus = filterStatus ? item.status === filterStatus : true;
    const matchCategory = filterCategory ? item.category === filterCategory : true;
    return matchSearch && matchDate && matchStatus && matchCategory;
  });

  // --- Sorting Logic ---
  const sortedData = [...filteredData].sort((a, b) => {
      if (!sortConfig.key || !sortConfig.direction) return 0;

      if (['name', 'studentId', 'year'].includes(sortConfig.key)) {
          const valA = a[sortConfig.key as keyof HistoryItem]?.toString() || '';
          const valB = b[sortConfig.key as keyof HistoryItem]?.toString() || '';
          if (sortConfig.direction === 'asc') return valA.localeCompare(valB);
          if (sortConfig.direction === 'desc') return valB.localeCompare(valA);
      }

      if (sortConfig.key === 'category') {
          const isA = a.category === sortConfig.direction;
          const isB = b.category === sortConfig.direction;
          if (isA && !isB) return -1;
          if (!isA && isB) return 1;
          return 0;
      }

      if (sortConfig.key === 'status') {
          const isA = a.status === sortConfig.direction;
          const isB = b.status === sortConfig.direction;
          if (isA && !isB) return -1;
          if (!isA && isB) return 1;
          return 0;
      }
      return 0;
  });

  // --- Pagination Logic ---
  const totalPages = Math.ceil(sortedData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentItems = sortedData.slice(startIndex, startIndex + itemsPerPage);

  // --- Handlers: Sorting Loop ---
  const handleSort = (key: string) => {
      setSortConfig((prev) => {
          if (prev.key !== key) {
              if (key === 'category') return { key, direction: 'ด้านความประพฤติดี' };
              if (key === 'status') return { key, direction: 'approved' };
              return { key, direction: 'asc' };
          }
          if (key === 'category') {
              // 3 Categories Loop
              const cats = ['ด้านความประพฤติดี', 'ด้านความคิดสร้างสรรค์และนวัตกรรม', 'ด้านกิจกรรมเสริมหลักสูตร'];
              const idx = cats.indexOf(prev.direction || '');
              return { key, direction: cats[(idx + 1) % cats.length] || cats[0] };
          } 
          else if (key === 'status') {
              if (prev.direction === 'approved') return { key, direction: 'rejected' };
              if (prev.direction === 'rejected') return { key: null, direction: null };
              return { key: null, direction: null };
          } 
          else {
              if (prev.direction === 'asc') return { key, direction: 'desc' };
              if (prev.direction === 'desc') return { key: null, direction: null };
          }
          return { key: null, direction: null };
      });
  };

  const handleViewDetail = (item: HistoryItem) => {
    setModalData(item);
    setIsModalOpen(true);
  };

  // --- Helper Render Icon ---
  const renderSortIcon = (key: string) => {
      if (sortConfig.key !== key || sortConfig.direction === null) return null;
      
      if (key === 'category') return <span className="text-[10px] text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded ml-1 font-normal whitespace-nowrap truncate max-w-[90px] inline-block align-middle" title={sortConfig.direction}>({sortConfig.direction})</span>;
      
      if (key === 'status') {
          // Map English status to Thai for sorting badge
          let label = sortConfig.direction;
          let colorClass = "bg-gray-100 text-gray-600";
          if(label === 'approved') { label = 'เห็นชอบ'; colorClass = 'bg-green-50 text-green-700'; }
          else if(label === 'rejected') { label = 'ไม่เห็นชอบ'; colorClass = 'bg-red-50 text-red-700'; }

          return <span className={`text-[10px] px-1.5 py-0.5 rounded ml-1 font-normal whitespace-nowrap ${colorClass}`}>({label})</span>;
      }
      
      if (sortConfig.direction === 'asc') return <svg className="w-4 h-4 text-blue-500 ml-1 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7"></path></svg>;
      
      if (sortConfig.direction === 'desc') return <svg className="w-4 h-4 text-blue-500 ml-1 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>;
      
      return null;
  };

  // --- Helper Render Status Badge ---
  const renderStatusBadge = (status: string) => {
      switch(status) {
          case 'approved':
              return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">เห็นชอบ</span>;
          case 'rejected':
              return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">ไม่เห็นชอบ</span>;
          default:
              return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">{status}</span>;
      }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8 font-sans">
      
      {/* Header Card */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <h1 className="text-2xl font-bold text-gray-800">ประวัติการพิจารณาเห็นชอบและไม่เห็นชอบ</h1>
        <p className="text-gray-400 text-sm mt-1">แสดงรายการประวัติการพิจารณาย้อนหลังทั้งหมด</p>

        {/* Filters Bar */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
          <div className="relative">
            <input type="text" placeholder="ค้นหาชื่อ หรือ รหัสนิสิต..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-gray-100 border-none rounded-lg px-4 py-2.5 pl-10 text-sm focus:ring-1 focus:ring-green-500 text-gray-700" />
            <svg className="w-4 h-4 absolute left-3 top-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
          </div>
          <div className="relative">
            <input type="date" value={filterDate} onChange={(e) => setFilterDate(e.target.value)} className="w-full bg-gray-100 border-none rounded-lg px-4 py-2.5 text-sm text-gray-500" />
          </div>
          <div className="relative">
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="w-full bg-gray-100 border-none rounded-lg px-4 py-2.5 text-sm text-gray-500 appearance-none cursor-pointer">
              <option value="">การกระทำ (ทั้งหมด)</option>
              <option value="approved">เห็นชอบ</option>
              <option value="rejected">ไม่เห็นชอบ</option>
            </select>
            <svg className="w-4 h-4 absolute right-3 top-3 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
          </div>
          <div className="relative">
            <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="w-full bg-gray-100 border-none rounded-lg px-4 py-2.5 text-sm text-gray-500 appearance-none cursor-pointer">
              <option value="">ทุกประเภทรางวัล</option>
              <option value="ด้านความประพฤติดี">ด้านความประพฤติดี</option>
              <option value="ด้านความคิดสร้างสรรค์และนวัตกรรม">ด้านความคิดสร้างสรรค์และนวัตกรรม</option>
              <option value="ด้านกิจกรรมเสริมหลักสูตร">ด้านกิจกรรมเสริมหลักสูตร</option>
            </select>
            <svg className="w-4 h-4 absolute right-3 top-3 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
          </div>
        </div>

        {/* Table Section */}
        <div className="mt-6 overflow-hidden rounded-lg border border-gray-100 bg-white">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-100 text-gray-600 text-sm uppercase tracking-wider select-none">
                <th className="p-4 font-semibold text-left cursor-pointer hover:bg-gray-200 transition-colors group" onClick={() => handleSort('name')}>
                    <div className="flex items-center gap-1">ชื่อ-นามสกุล {renderSortIcon('name')}</div>
                </th>
                <th className="p-4 font-semibold text-center cursor-pointer hover:bg-gray-200 transition-colors group" onClick={() => handleSort('studentId')}>
                    <div className="flex items-center justify-center gap-1">รหัสนิสิต {renderSortIcon('studentId')}</div>
                </th>
                <th className="p-4 font-semibold text-center cursor-pointer hover:bg-gray-200 transition-colors group" onClick={() => handleSort('year')}>
                    <div className="flex items-center justify-center gap-1">ชั้นปี {renderSortIcon('year')}</div>
                </th>
                <th className="p-4 font-semibold text-center cursor-pointer hover:bg-gray-200 transition-colors group" onClick={() => handleSort('category')}>
                    <div className="flex items-center justify-center gap-1">ประเภทรางวัล {renderSortIcon('category')}</div>
                </th>
                <th className="p-4 font-semibold text-center cursor-pointer hover:bg-gray-200 transition-colors group" onClick={() => handleSort('status')}>
                    <div className="flex items-center justify-center gap-1">การพิจารณา {renderSortIcon('status')}</div>
                </th>
                <th className="p-4 font-semibold text-center">รายละเอียด</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                 <tr><td colSpan={6} className="p-8 text-center text-gray-400">กำลังโหลด...</td></tr>
              ) : currentItems.length === 0 ? (
                 <tr><td colSpan={6} className="p-8 text-center text-gray-400">ไม่พบข้อมูลประวัติ</td></tr>
              ) : (
                currentItems.map((item) => (
                  <tr key={item.id} className="hover:bg-green-50 bg-white transition-colors duration-150">
                    <td className="p-4 text-sm font-medium text-gray-700">{item.name}</td>
                    <td className="p-4 text-sm text-center text-gray-600">{item.studentId}</td>
                    <td className="p-4 text-sm text-center text-gray-600">{item.year}</td>
                    <td className="p-4 text-sm text-center text-gray-600">{item.category}</td>
                    <td className="p-4 text-sm text-center font-medium">
                      {renderStatusBadge(item.status)}
                    </td>
                    <td className="p-4 text-center">
                        <button 
                            onClick={() => handleViewDetail(item)}
                            className="text-gray-400 hover:text-blue-600 transition-colors p-2 hover:bg-blue-50 rounded-full"
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
        <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-100">
            <div className="flex items-center gap-2">
                <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1} className="w-8 h-8 flex items-center justify-center rounded bg-gray-100 text-gray-500 hover:bg-gray-200 text-sm disabled:opacity-50">{'<'}</button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button key={page} onClick={() => setCurrentPage(page)} className={`w-8 h-8 flex items-center justify-center rounded text-sm font-bold transition-colors ${currentPage === page ? "bg-blue-100 text-blue-600" : "bg-transparent text-gray-500 hover:bg-gray-100"}`}>{page}</button>
                ))}
                <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages || totalPages === 0} className="w-8 h-8 flex items-center justify-center rounded bg-gray-100 text-gray-500 hover:bg-gray-200 text-sm disabled:opacity-50">{'>'}</button>
            </div>
            <div className="text-xs text-gray-400 hidden md:block">
                แสดง {startIndex + 1} ถึง {Math.min(startIndex + itemsPerPage, sortedData.length)} จาก {sortedData.length} รายการ
            </div>
        </div>

      </div>

      <NominationDetailModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        data={modalData as any} 
      />

    </div>
  );
}