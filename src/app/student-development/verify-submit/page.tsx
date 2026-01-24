"use client";

import { useState, useEffect } from "react";

//  API
//
// 1. GET /api/student-development/nominations
//    - Purpose: ดึงข้อมูลรายการเสนอชื่อทั้งหมด (รองรับ Filter, Search, Pagination)
//    - Query Params: ?page=1&limit=6&search=...&status=...
//    - Response: { data: Nomination[], total: number }
//
// 2. PATCH /api/student-development/nominations/{id}/verify
//    - Purpose: บันทึกข้อมูลที่เจ้าหน้าที่ระบุ (ระดับผลงาน, ประเภทกิจกรรม) และเปลี่ยนสถานะเป็น 'verified'
//    - Body: { competitionLevel: "...", activityType: "..." }
//
// 3. PATCH /api/student-development/nominations/{id}/reject
//    - Purpose: ตีกลับเอกสาร (เปลี่ยนสถานะเป็น 'rejected') พร้อมเหตุผล
//    - Body: { reason: "..." }
//
// 4. PATCH /api/student-development/nominations/{id}/undo-reject
//    - Purpose: ยกเลิกการตีกลับ (เปลี่ยนสถานะกลับเป็น 'pending')
//
// 5. POST /api/student-development/nominations/submit-to-committee
//    - Purpose: ส่งรายชื่อที่ผ่านการตรวจสอบแล้วทั้งหมดไปยังคณะกรรมการ (Submit All)
//    - Body: { nominationIds: [1, 2, 3] }

interface Nomination {
  id: number;
  name: string;
  studentId: string;
  year: string;
  category: string; 
  status: string;
  date: string;
  
  // Data for Modal
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

  // Specific Data & Files
  activityCriteria?: string;
  innovationQual?: boolean;
  awardDate?: string;
  projectName?: string;
  teamName?: string;
  workName?: string;
  receivedAward?: string;
  organizer?: string;
  files?: string[];

  // Staff Verification Fields
  competitionLevel?: "university" | "national" | "international"; 
  activityType?: "desirable" | "health" | "public_service" | "ethics" | "culture"; 
  
  // Internal
  actionReason?: string;
}

export default function SDDManagePage() {
  const [candidates, setCandidates] = useState<Nomination[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all"); 

  // Modal States
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Nomination | null>(null);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6; 

  // Reset Pagination when filters change
  useEffect(() => { setCurrentPage(1); }, [searchTerm, filterStatus]);

  // 1. [API] Fetch Data (Load Nominations)
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // API: ดึงข้อมูลรายการเสนอชื่อ
        /*
        const token = localStorage.getItem("accessToken");
        const params = new URLSearchParams({
            page: currentPage.toString(),
            limit: itemsPerPage.toString(),
            search: searchTerm,
            status: filterStatus !== 'all' ? filterStatus : ''
        });

        const res = await fetch(`/api/student-development/nominations?${params.toString()}`, {
            method: "GET",
            headers: { "Authorization": `Bearer ${token}` }
        });

        if (!res.ok) throw new Error("Failed to fetch data");
        const result = await res.json();
        setCandidates(result.data); // Update state with real data
        */

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
                awardType: "behavior", faculty: "สังคมศาสตร์", major: "รัฐศาสตร์", advisor: "ดร. ชูใจ", gpa: "3.90", phone: "0877778888", email: "wichai@ku.th", address: "หอพักนอก", files: []
            },
            { 
                id: 6, name: "ปิติ ยินดี", firstName: "ปิติ", lastName: "ยินดี", studentId: "66104524333", 
                year: "4", category: "ด้านความคิดสร้างสรรค์และนวัตกรรม", status: "verified", date: "2024-01-05",
                awardType: "innovation", faculty: "เกษตร", major: "พืชไร่", advisor: "ศ. ปิติ", gpa: "3.60", phone: "0899990000", email: "piti@ku.th", address: "นครปฐม",
                innovationQual: true, awardDate: "2023-10-10", projectName: "Green Farm", teamName: "Green Team", workName: "Organic", receivedAward: "Silver", organizer: "DOA", files: [],
                competitionLevel: "national", activityType: "desirable" // เคยระบุมาแล้ว
            }, 
            { 
                id: 7, name: "ชูใจ ใฝ่ดี", firstName: "ชูใจ", lastName: "ใฝ่ดี", studentId: "66104524444", 
                year: "1", category: "ด้านกิจกรรมเสริมหลักสูตร", status: "rejected", date: "2024-01-08",
                awardType: "activity", faculty: "ศึกษาศาสตร์", major: "พลศึกษา", advisor: "อ. วีระ", gpa: "2.90", phone: "0812341234", email: "choojai@ku.th", address: "กทม.",
                activityCriteria: "committee", awardDate: "2023-09-01", projectName: "Sport Day", teamName: "-", workName: "-", receivedAward: "-", organizer: "KU", files: ["activity_log.pdf"],
                actionReason: "เอกสารไม่ครบถ้วน (ขาดใบรับรองชั่วโมงกิจกรรม)"
            }, 
        ];
        setCandidates(mockData);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching data:", error);
        setLoading(false);
      }
    };
    fetchData();
  }, [searchTerm, filterStatus, currentPage]);

  // Handlers: Update Level/Type (ใน Modal)
  const handleUpdateDetails = (level: string, type: string) => {
      if (!selectedItem) return;
      setSelectedItem(prev => prev ? { ...prev, competitionLevel: level as any, activityType: type as any } : null);
  };

  // Handlers: Save & Verify (ปุ่มสีเขียวใน Modal)
  const handleVerifyConfirm = async () => {
      if (!selectedItem) return;
      
      // Validation: ต้องระบุข้อมูลก่อน
      if (!selectedItem.competitionLevel || !selectedItem.activityType) {
          alert("กรุณาระบุ 'ระดับการแข่งขัน' และ 'ประเภทกิจกรรม' ให้ครบถ้วนก่อนอนุมัติ");
          return;
      }

      if (confirm(`ยืนยันการอนุมัติรายชื่อ "${selectedItem.name}" ?`)) {
          try {
              //  2. [API] Verify & Update Details
              /*
              const token = localStorage.getItem("accessToken");
              await fetch(`/api/student-development/nominations/${selectedItem.id}/verify`, {
                  method: "PATCH",
                  headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
                  body: JSON.stringify({ 
                      competitionLevel: selectedItem.competitionLevel, 
                      activityType: selectedItem.activityType 
                  })
              });
              */

              // Update Local State (Mock)
              setCandidates(prev => prev.map(item => 
                  item.id === selectedItem.id 
                    ? { ...item, status: "verified", competitionLevel: selectedItem.competitionLevel, activityType: selectedItem.activityType } 
                    : item
              ));
              setIsDetailModalOpen(false);
              
          } catch (error) {
              alert("บันทึกข้อมูลไม่สำเร็จ");
          }
      }
  };

  // Handlers: Reject
  const handleRejectConfirm = async () => {
      if (!selectedItem) return;
      if (!rejectReason.trim()) return alert("กรุณาระบุเหตุผล");

      try {
          // 3. [API] Reject Nomination
          /*
          const token = localStorage.getItem("accessToken");
          await fetch(`/api/student-development/nominations/${selectedItem.id}/reject`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
              body: JSON.stringify({ reason: rejectReason })
          });
          */

          // Update Local State
          setCandidates(prev => prev.map(item => item.id === selectedItem.id ? { ...item, status: "rejected", actionReason: rejectReason } : item));
          
          setIsRejectModalOpen(false);
          setIsDetailModalOpen(false); 
          setRejectReason("");

      } catch (error) {
          alert("ดำเนินการไม่สำเร็จ");
      }
  };

  // Handlers: Undo Reject (ยกเลิกการตีกลับ)
  const handleUndoReject = async (id: number) => {
      if(confirm("ยืนยันยกเลิกการตีกลับ และเปลี่ยนสถานะเป็น 'รอตรวจสอบ' ?")) {
          try {
              // 4. [API] Undo Reject
              /*
              const token = localStorage.getItem("accessToken");
              await fetch(`/api/student-development/nominations/${id}/undo-reject`, {
                  method: "PATCH",
                  headers: { "Authorization": `Bearer ${token}` }
              });
              */

              // Update Local State
              setCandidates(prev => prev.map(item => item.id === id ? { ...item, status: "pending", actionReason: undefined } : item));

          } catch (error) {
              alert("ดำเนินการไม่สำเร็จ");
          }
      }
  };

  // --- Submit All to Committee ---
  const handleSubmitToCommittee = async () => {
      const verifiedItems = candidates.filter(c => c.status === "verified");
      const verifiedCount = verifiedItems.length;

      if (confirm(`ยืนยันส่งรายชื่อทั้งหมด ${verifiedCount} คน ให้คณะกรรมการพิจารณา?`)) {
          try {
              // -----------------------------------------------------
              //  5. [API] Submit All Verified Nominations
              // -----------------------------------------------------
              /*
              const token = localStorage.getItem("accessToken");
              const ids = verifiedItems.map(item => item.id);
              await fetch(`/api/student-development/nominations/submit-to-committee`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
                  body: JSON.stringify({ nominationIds: ids })
              });
              */

              alert("ส่งข้อมูลเรียบร้อยแล้ว!");
              setCandidates(prev => prev.map(c => c.status === 'verified' ? { ...c, status: 'submitted' } : c));

          } catch (error) {
              alert("ส่งข้อมูลไม่สำเร็จ");
          }
      }
  };

  // Filtering & Pagination
  const filteredData = candidates.filter(item => {
      if (item.status === 'submitted') return false; // ซ่อนคนที่ส่งไปแล้ว
      const matchSearch = item.name.includes(searchTerm) || item.studentId.includes(searchTerm);
      const matchStatus = filterStatus === "all" ? true : item.status === filterStatus;
      return matchSearch && matchStatus;
  });

  const verifiedCount = candidates.filter(c => c.status === "verified").length;
  
  // Calculate Pagination
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentItems = filteredData.slice(startIndex, startIndex + itemsPerPage);

  const handlePageChange = (page: number) => {
      if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8 font-sans pb-24">
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">ตรวจสอบและคัดกรอง</h1>
          <p className="text-sm text-gray-500 mt-1">เจ้าหน้าที่ตรวจสอบเอกสาร และระบุประเภทรางวัล/ระดับผลงาน</p>
        </div>
        <div className="text-right">
            <div className="text-sm font-bold text-gray-600">พร้อมส่งให้กรรมการ</div>
            <div className="text-3xl font-bold text-green-600">{verifiedCount} <span className="text-sm font-normal text-gray-400">คน</span></div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col min-h-[600px]">
        {/* Filter Bar */}
        <div className="p-4 border-b border-gray-100 flex gap-4 bg-gray-50/30">
            <input type="text" placeholder="ค้นหาชื่อ, รหัสนิสิต..." className="border rounded-lg px-4 py-2 text-sm w-80 focus:ring-2 focus:ring-blue-500 outline-none" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            <select className="border rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                <option value="all">สถานะทั้งหมด</option>
                <option value="pending">รอตรวจสอบ</option>
                <option value="verified">ตรวจสอบแล้ว</option>
                <option value="rejected">ตีกลับแล้ว</option>
            </select>
        </div>

        {/* Table Body */}
        <div className="flex-1 overflow-x-auto">
            <table className="w-full text-left">
                <thead className="bg-gray-100 text-gray-600 text-xs uppercase font-semibold border-b border-gray-200">
                    <tr>
                        <th className="p-4 w-[5%] text-center">#</th>
                        <th className="p-4 w-[25%]">นิสิต</th>
                        <th className="p-4 w-[20%]">ประเภทรางวัล</th>
                        <th className="p-4 w-[15%] text-center">ระดับผลงาน</th>
                        <th className="p-4 w-[15%] text-center">ประเภทกิจกรรม</th>
                        <th className="p-4 w-[10%] text-center">สถานะ</th>
                        <th className="p-4 w-[10%] text-center">จัดการ</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm">
                    {loading ? (
                        <tr><td colSpan={7} className="p-8 text-center text-gray-400">กำลังโหลดข้อมูล</td></tr>
                    ) : currentItems.length === 0 ? (
                        <tr><td colSpan={7} className="p-8 text-center text-gray-400">ไม่พบรายการ</td></tr>
                    ) : (
                        currentItems.map((item, idx) => (
                            <tr key={item.id} className={`hover:bg-gray-50 transition-colors ${item.status === 'verified' ? 'bg-green-50/30' : item.status === 'rejected' ? 'bg-red-50/30' : ''}`}>
                                <td className="p-4 text-center text-gray-400">{startIndex + idx + 1}</td>
                                <td className="p-4">
                                    <div className="font-bold text-gray-800">{item.name}</div>
                                    <div className="text-xs text-gray-500">{item.studentId} | {item.faculty}</div>
                                </td>
                                <td className="p-4 text-gray-700">{item.category}</td>
                                
                                {/* แสดงผลระดับผลงาน */}
                                <td className="p-4 text-center">
                                    {item.competitionLevel ? (
                                        <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs border border-blue-200">
                                            {item.competitionLevel === 'university' ? 'ระดับอุดมศึกษา' : item.competitionLevel === 'national' ? 'ระดับชาติ' : 'ระดับนานาชาติ'}
                                        </span>
                                    ) : <span className="text-gray-300">-</span>}
                                </td>

                                {/* แสดงผลประเภทกิจกรรม */}
                                <td className="p-4 text-center">
                                    {item.activityType ? (
                                        <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs border border-purple-200">
                                            {item.activityType === 'desirable' && 'คุณลักษณะบัณฑิต'}
                                            {item.activityType === 'health' && 'กีฬา/สุขภาพ'}
                                            {item.activityType === 'public_service' && 'บำเพ็ญประโยชน์'}
                                            {item.activityType === 'ethics' && 'คุณธรรม'}
                                            {item.activityType === 'culture' && 'ศิลปวัฒนธรรม'}
                                        </span>
                                    ) : <span className="text-gray-300">-</span>}
                                </td>

                                <td className="p-4 text-center">
                                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold border
                                        ${item.status === 'verified' ? 'bg-green-100 text-green-700 border-green-200' : 
                                          item.status === 'rejected' ? 'bg-red-100 text-red-700 border-red-200' : 
                                          'bg-yellow-100 text-yellow-700 border-yellow-200'}`}>
                                        {item.status === 'pending' ? 'รอตรวจสอบ' : item.status === 'verified' ? 'ตรวจสอบแล้ว' : 'ตีกลับแล้ว'}
                                    </span>
                                </td>
                                <td className="p-4 text-center">
                                    <div className="flex flex-col gap-2 items-center">
                                        {/* ปุ่มจัดการ (เปลี่ยนเป็นปุ่มสีน้ำเงิน) */}
                                        <button 
                                            onClick={() => { setSelectedItem(item); setIsDetailModalOpen(true); }}
                                            className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3 py-1.5 rounded shadow-sm transition-all w-24 active:scale-95"
                                        >
                                            {item.status === 'verified' ? 'แก้ไขข้อมูล' : 'ตรวจสอบ'}
                                        </button>

                                        {/* ปุ่มยกเลิกการตีกลับ (แสดงเฉพาะตอน Rejected) */}
                                        {item.status === 'rejected' && (
                                            <button 
                                                onClick={() => handleUndoReject(item.id)}
                                                className="text-xs text-gray-500 hover:text-gray-700 underline"
                                            >
                                                ยกเลิกตีกลับ
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>

        {/* Pagination UI */}
        {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 p-4 border-t border-gray-100 bg-gray-50 mt-auto">
                {/* Previous Button (<) */}
                <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className={`w-9 h-9 flex items-center justify-center rounded-lg border text-sm font-medium transition-colors
                        ${currentPage === 1 
                            ? 'bg-gray-50 text-gray-300 border-gray-100 cursor-not-allowed' 
                            : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50 shadow-sm'}`}
                >
                    &lt;
                </button>

                {/* Page Numbers */}
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                        key={page}
                        onClick={() => handlePageChange(page)}
                        className={`w-9 h-9 flex items-center justify-center rounded-lg border text-sm font-bold shadow-sm transition-all
                            ${currentPage === page 
                                ? 'bg-blue-600 border-blue-600 text-white' 
                                : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                    >
                        {page}
                    </button>
                ))}

                {/* Next Button (>) */}
                <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className={`w-9 h-9 flex items-center justify-center rounded-lg border text-sm font-medium transition-colors
                        ${currentPage === totalPages 
                            ? 'bg-gray-50 text-gray-300 border-gray-100 cursor-not-allowed' 
                            : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50 shadow-sm'}`}
                >
                    &gt;
                </button>
            </div>
        )}
      </div>

      {/* Floating Submit Bar */}
      <div className="fixed bottom-0 left-0 w-full bg-white border-t p-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] z-10 flex justify-end px-10">
          <button 
            onClick={handleSubmitToCommittee}
            disabled={verifiedCount === 0}
            className={`px-6 py-3 rounded-lg font-bold text-white shadow-lg flex items-center gap-2 transition-all active:scale-95 ${verifiedCount > 0 ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-300 cursor-not-allowed'}`}
          >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              ส่งรายชื่อให้คณะกรรมการ ({verifiedCount})
          </button>
      </div>

      {/* Detail Modal */}
      {isDetailModalOpen && selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsDetailModalOpen(false)}></div>
            <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <div>
                        <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                            ตรวจสอบข้อมูล: {selectedItem.name}
                            <span className={`text-xs px-2 py-0.5 rounded border ${selectedItem.status === 'verified' ? 'bg-green-100 text-green-700 border-green-200' : selectedItem.status === 'rejected' ? 'bg-red-100 text-red-700 border-red-200' : 'bg-yellow-100 text-yellow-700 border-yellow-200'}`}>
                                {selectedItem.status}
                            </span>
                        </h3>
                        <p className="text-sm text-gray-500">{selectedItem.studentId} | {selectedItem.faculty}</p>
                    </div>
                    <button onClick={() => setIsDetailModalOpen(false)} className="text-gray-400 hover:text-gray-600"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg></button>
                </div>
                <div className="flex-1 overflow-y-auto p-6 bg-gray-50/30">
                    <div className="grid grid-cols-12 gap-6 h-full">
                        <div className="col-span-7 space-y-6 overflow-y-auto pr-2">
                            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                                <h4 className="font-bold text-gray-700 mb-3 border-b pb-2 flex items-center gap-2">1. ข้อมูลทั่วไป</h4>
                                <div className="grid grid-cols-2 gap-y-3 text-sm">
                                    <div><span className="text-gray-500 block text-xs">ชื่อ-นามสกุล</span>{selectedItem.name}</div>
                                    <div><span className="text-gray-500 block text-xs">รหัสนิสิต</span>{selectedItem.studentId}</div>
                                    <div><span className="text-gray-500 block text-xs">คณะ</span>{selectedItem.faculty}</div>
                                    <div><span className="text-gray-500 block text-xs">สาขาวิชา</span>{selectedItem.major}</div>
                                    <div><span className="text-gray-500 block text-xs">อาจารย์ที่ปรึกษา</span>{selectedItem.advisor}</div>
                                    <div><span className="text-gray-500 block text-xs">เกรดเฉลี่ย</span>{selectedItem.gpa}</div>
                                    <div><span className="text-gray-500 block text-xs">โทรศัพท์</span>{selectedItem.phone}</div>
                                    <div><span className="text-gray-500 block text-xs">อีเมล</span>{selectedItem.email}</div>
                                </div>
                                <div className="mt-3 text-sm"><span className="text-gray-500 block text-xs">ที่อยู่</span>{selectedItem.address}</div>
                            </div>
                            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                                <h4 className="font-bold text-gray-700 mb-3 border-b pb-2 flex items-center gap-2">2. รายละเอียดผลงาน ({selectedItem.awardType})</h4>
                                <div className="grid grid-cols-2 gap-y-3 text-sm">
                                    {selectedItem.awardDate && <div><span className="text-gray-500 block text-xs">วันที่ได้รับรางวัล</span>{selectedItem.awardDate}</div>}
                                    {selectedItem.projectName && <div><span className="text-gray-500 block text-xs">ชื่อโครงการ</span>{selectedItem.projectName}</div>}
                                    {selectedItem.teamName && <div><span className="text-gray-500 block text-xs">ชื่อทีม</span>{selectedItem.teamName}</div>}
                                    {selectedItem.workName && <div><span className="text-gray-500 block text-xs">ชื่อผลงาน</span>{selectedItem.workName}</div>}
                                    {selectedItem.receivedAward && <div><span className="text-gray-500 block text-xs">รางวัลที่ได้รับ</span>{selectedItem.receivedAward}</div>}
                                    {selectedItem.organizer && <div><span className="text-gray-500 block text-xs">หน่วยงานผู้จัด</span>{selectedItem.organizer}</div>}
                                </div>
                                {selectedItem.activityCriteria && <div className="mt-3 text-sm"><span className="text-gray-500 block text-xs">เกณฑ์กิจกรรม</span>{selectedItem.activityCriteria}</div>}
                            </div>
                            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                                <h4 className="font-bold text-gray-700 mb-3 border-b pb-2 flex items-center gap-2">3. เอกสารแนบ</h4>
                                <div className="flex flex-wrap gap-2">
                                    {selectedItem.files?.map((f, i) => (
                                        <a key={i} href="#" className="flex items-center gap-2 px-3 py-2 bg-gray-50 text-blue-600 rounded-lg text-sm hover:bg-blue-50 border border-gray-200 transition-colors">
                                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" /></svg>
                                            {f}
                                        </a>
                                    ))}
                                    {(!selectedItem.files || selectedItem.files.length === 0) && <span className="text-gray-400 text-sm">- ไม่มีเอกสารแนบ -</span>}
                                </div>
                            </div>
                        </div>
                        <div className="col-span-5 bg-blue-50/50 p-5 rounded-xl border border-blue-100 flex flex-col h-full">
                            <h4 className="font-bold text-blue-800 mb-4 flex items-center gap-2 text-lg">ส่วนเจ้าหน้าที่พิจารณา</h4>
                            <div className="space-y-6 flex-1 overflow-y-auto pr-1">
                                <div className="bg-white p-4 rounded-lg border border-blue-100 shadow-sm">
                                    <label className="text-sm font-bold text-gray-700 mb-3 block">7) ระดับการประกวด/แข่งขัน <span className="text-red-500">*</span></label>
                                    <div className="space-y-2">
                                        {[{ val: "university", label: "ระดับอุดมศึกษา", desc: "แข่งขันระหว่างสถาบัน" }, { val: "national", label: "ระดับชาติ", desc: "ร่วมกับประชาชนทั่วไป" }, { val: "international", label: "ระดับนานาชาติ", desc: "มีต่างชาติเข้าร่วม" }].map((opt) => (
                                            <label key={opt.val} className={`flex items-start gap-3 cursor-pointer p-2.5 rounded border transition-all ${selectedItem.competitionLevel === opt.val ? 'bg-blue-50 border-blue-500 ring-1 ring-blue-500' : 'bg-white border-gray-200 hover:border-blue-300'}`}>
                                                <input type="radio" name="competitionLevel" checked={selectedItem.competitionLevel === opt.val} onChange={() => handleUpdateDetails(opt.val, selectedItem.activityType || "")} className="mt-1 text-blue-600 focus:ring-blue-500" />
                                                <div><span className="text-sm font-bold text-gray-800 block">{opt.label}</span><span className="text-xs text-gray-500">{opt.desc}</span></div>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                                <div className="bg-white p-4 rounded-lg border border-blue-100 shadow-sm">
                                    <label className="text-sm font-bold text-gray-700 mb-3 block">8) ประเภทกิจกรรม <span className="text-red-500">*</span></label>
                                    <div className="space-y-2">
                                        {[{ val: "desirable", label: "ส่งเสริมคุณลักษณะบัณฑิตฯ" }, { val: "health", label: "กีฬาหรือส่งเสริมสุขภาพ" }, { val: "public_service", label: "บำเพ็ญประโยชน์/สิ่งแวดล้อม" }, { val: "ethics", label: "คุณธรรมและจริยธรรม" }, { val: "culture", label: "ศิลปะและวัฒนธรรม" }].map((opt) => (
                                            <label key={opt.val} className={`flex items-center gap-3 cursor-pointer p-2.5 rounded border transition-all ${selectedItem.activityType === opt.val ? 'bg-purple-50 border-purple-500 ring-1 ring-purple-500' : 'bg-white border-gray-200 hover:border-purple-300'}`}>
                                                <input type="radio" name="activityType" checked={selectedItem.activityType === opt.val} onChange={() => handleUpdateDetails(selectedItem.competitionLevel || "", opt.val)} className="text-purple-600 focus:ring-purple-500" />
                                                <span className="text-sm text-gray-700">{opt.label}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <div className="mt-6 pt-4 border-t border-blue-200 flex flex-col gap-3">
                                <button onClick={handleVerifyConfirm} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg shadow-md transition-all flex justify-center items-center gap-2">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/></svg>บันทึกและอนุมัติ (Verify)
                                </button>
                                <button onClick={() => setIsRejectModalOpen(true)} className="w-full bg-white hover:bg-red-50 text-red-600 font-bold py-2.5 rounded-lg border border-red-200 transition-all text-sm">ตีกลับเอกสาร (Reject)</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* Reject Modal */}
      {isRejectModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
              <div className="absolute inset-0 bg-black/50" onClick={() => setIsRejectModalOpen(false)}></div>
              <div className="relative bg-white p-6 rounded-xl shadow-xl w-full max-w-md animate-scale-up">
                  <h3 className="text-lg font-bold text-red-600 mb-2">ระบุเหตุผลการตีกลับ</h3>
                  <textarea className="w-full border rounded-lg p-3 text-sm h-32 focus:ring-2 focus:ring-red-500 outline-none" placeholder="เช่น เอกสารไม่ครบถ้วน..." value={rejectReason} onChange={e => setRejectReason(e.target.value)}></textarea>
                  <div className="flex justify-end gap-3 mt-4">
                      <button onClick={() => setIsRejectModalOpen(false)} className="px-4 py-2 text-gray-600 text-sm">ยกเลิก</button>
                      <button onClick={handleRejectConfirm} className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-bold hover:bg-red-700">ยืนยันตีกลับ</button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
}