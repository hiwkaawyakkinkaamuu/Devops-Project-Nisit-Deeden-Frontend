"use client";

import { useState, useEffect } from "react";
import NominationDetailModal from "../../../components/nomination-detail-modal"; // ตรวจสอบ path

// --- 1. Type Definition ---
type VoteType = "approve" | "reject" | "abstain" | null;

interface Nomination {
  id: number;
  name: string;
  studentId: string;
  year: string;
  category: string;
  status: string;
  date: string;
  
  myVote?: VoteType;

  // ข้อมูลส่วนตัว
  firstName: string;
  lastName: string;
  awardType: string;
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

export default function CommitteeVotePage() {
  // --- State ---
  const [candidates, setCandidates] = useState<Nomination[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filter & Modal
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalData, setModalData] = useState<Nomination | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6; 

  // --- Reset Pagination ---
  useEffect(() => { setCurrentPage(1); }, [searchTerm, filterCategory]);

  // --- Fetch Data ---
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // =========================================================
        // [API Integration] 1. ดึงรายชื่อผู้ท้าชิง (GET)
        // =========================================================
        /*
        const token = localStorage.getItem("accessToken");
        const params = new URLSearchParams();
        
        // Filter Params
        if (searchTerm) params.append("search", searchTerm);
        if (filterCategory) params.append("category", filterCategory);
        
        // Pagination Params
        params.append("page", currentPage.toString());
        params.append("limit", itemsPerPage.toString());

        // API นี้ควร return เฉพาะนิสิตที่มี status = 'submitted' (ผ่านการกรองจาก SDD แล้ว)
        // และควร return field 'myVote' มาด้วย ถ้ากรรมการคนนี้เคยโหวตไปแล้ว
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/committee/nominations?${params.toString()}`, {
           method: "GET",
           headers: { 
             "Content-Type": "application/json",
             "Authorization": `Bearer ${token}` 
           }
        });

        if (!response.ok) throw new Error("Failed to fetch candidates");
        
        const result = await response.json();
        // setCandidates(result.data); 
        */

        // =========================================================
        // [MOCKUP DATA]
        // =========================================================

        const mockData: Nomination[] = [
            { 
                id: 1, name: "สมชาย ใจดี", firstName: "สมชาย", lastName: "ใจดี", studentId: "66104524665", 
                year: "1", category: "ด้านความประพฤติดี", status: "submitted", date: "2024-01-15",
                awardType: "behavior", faculty: "วิทยาศาสตร์", major: "วิทยาการคอมพิวเตอร์", advisor: "ดร. สมหญิง", gpa: "3.75", phone: "0812345678", email: "somchai@ku.th", address: "หอพักใน", files: ["transcript.pdf"]
            },
            { 
                id: 2, name: "สมหญิง รักเรียน", firstName: "สมหญิง", lastName: "รักเรียน", studentId: "66104524885", 
                year: "1", category: "ด้านความประพฤติดี", status: "submitted", date: "2024-01-16",
                awardType: "behavior", faculty: "มนุษยศาสตร์", major: "ภาษาอังกฤษ", advisor: "อ. สมศรี", gpa: "3.80", phone: "0891234567", email: "ying@ku.th", address: "กทม."
            },
            { 
                id: 3, name: "เก่ง กล้า", firstName: "เก่ง", lastName: "กล้า", studentId: "66104524999", 
                year: "1", category: "ด้านความคิดสร้างสรรค์และนวัตกรรม", status: "submitted", date: "2024-01-15",
                awardType: "innovation", faculty: "วิศวกรรมศาสตร์", major: "ไฟฟ้า", advisor: "ดร. สมชาย", gpa: "3.50", phone: "0811112222", email: "keng@ku.th", address: "นนทบุรี",
                innovationQual: true, awardDate: "2023-12-01", projectName: "Smart Home AI", teamName: "AI Team", workName: "Robot", receivedAward: "Gold Medal", organizer: "Google", files: ["project.pdf"]
            },
            { 
                id: 4, name: "มานะ อดทน", firstName: "มานะ", lastName: "อดทน", studentId: "66104524111", 
                year: "2", category: "ด้านกิจกรรมเสริมหลักสูตร", status: "submitted", date: "2024-01-10",
                awardType: "activity", faculty: "บริหารธุรกิจ", major: "การตลาด", advisor: "อ. มานี", gpa: "3.20", phone: "0855556666", email: "mana@ku.th", address: "ปทุมธานี",
                activityCriteria: "competition", awardDate: "2023-11-20", projectName: "Startup Pitching", teamName: "Biz Kids", workName: "App", receivedAward: "Winner", organizer: "SET", files: ["cert.pdf"]
            },
            { 
                id: 5, name: "วิชัย ใจสู้", firstName: "วิชัย", lastName: "ใจสู้", studentId: "66104524222", 
                year: "3", category: "ด้านความประพฤติดี", status: "submitted", date: "2024-01-12",
                awardType: "behavior", faculty: "สังคมศาสตร์", major: "รัฐศาสตร์", advisor: "ดร. ชูใจ", gpa: "3.90", phone: "0877778888", email: "wichai@ku.th", address: "หอพักนอก"
            },
            { 
                id: 6, name: "ปิติ ยินดี", firstName: "ปิติ", lastName: "ยินดี", studentId: "66104524333", 
                year: "4", category: "ด้านความคิดสร้างสรรค์และนวัตกรรม", status: "submitted", date: "2024-01-05",
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
      setCandidates(mockData);
      setLoading(false);

      } catch (error) {
        console.error("Error fetching candidates:", error);
        setLoading(false);
      }
    };
    fetchData();
  }, [searchTerm, filterCategory, currentPage]);

  // --- Handle Vote ---
  const handleVote = (id: number, voteType: VoteType) => {
    // ถ้าต้องการยิง API ทุกครั้งที่กดปุ่ม (Real-time save) ให้ทำตรงนี้
    // แต่ในที่นี้เราใช้แบบ Batch Submit (กดปุ่มยืนยันทีเดียวด้านล่าง)
    setCandidates(prev => prev.map(item => 
      item.id === id ? { ...item, myVote: voteType } : item
    ));
  };

  // --- Submit Votes (Batch) ---
  const handleSubmitVotes = async () => {
    const votedCandidates = candidates.filter(c => c.myVote !== undefined && c.myVote !== null);
    if (votedCandidates.length === 0) {
        alert("กรุณาเลือกผลการโหวตอย่างน้อย 1 รายการ");
        return;
    }

    if (confirm(`ยืนยันการส่งผลคะแนนจำนวน ${votedCandidates.length} รายการ?`)) {
        try {
            // =========================================================
            // [API Integration] 2. ส่งผลโหวตทั้งหมด (POST Batch)
            // =========================================================
            /*
            const token = localStorage.getItem("accessToken");
            
            // เตรียม Payload: ส่งไปเป็น Array ของ { nominationId, vote }
            const payload = {
                votes: votedCandidates.map(c => ({
                    nominationId: c.id,
                    voteType: c.myVote // 'approve', 'reject', 'abstain'
                }))
            };

            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/committee/votes/batch`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) throw new Error("Failed to submit votes");

            alert("บันทึกผลการลงคะแนนเรียบร้อยแล้ว!");
            // อาจจะ Refresh Data หรือ Disable ปุ่มโหวต
            */

            // Mockup Logic
            console.log("Submitting votes:", votedCandidates.map(c => ({ id: c.id, vote: c.myVote })));
            alert("บันทึกผลการลงคะแนนเรียบร้อยแล้ว! (Mockup)");

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

  // --- Filter Logic ---
  const filteredData = candidates.filter(item => {
    const matchSearch = item.name.includes(searchTerm) || item.studentId.includes(searchTerm);
    const matchCategory = filterCategory ? item.category === filterCategory : true;
    return matchSearch && matchCategory;
  });

  // --- Pagination Logic ---
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentItems = filteredData.slice(startIndex, startIndex + itemsPerPage);

  const votedCount = candidates.filter(c => c.myVote).length;

  return (
    <div className="min-h-screen bg-gray-50 p-8 font-sans pb-24">
      
      {/* ... (UI ส่วน Header) ... */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">พิจารณาคัดเลือกนิสิตดีเด่น (Committee Voting)</h1>
        <p className="text-sm text-gray-500 mt-1">กรุณาพิจารณาข้อมูลและลงคะแนนเสียง (ผลการลงคะแนนจะเป็นความลับ)</p>
      </div>

      {/* Main Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col min-h-[600px]">
        
        {/* Toolbar */}
        <div className="p-5 border-b border-gray-100 bg-gray-50/50 flex gap-4">
            <input 
                type="text" placeholder="ค้นหาชื่อ หรือ รหัสนิสิต..." 
                className="flex-1 bg-white border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
            />
            <select 
                className="bg-white border border-gray-300 rounded-lg px-4 py-2 text-sm outline-none cursor-pointer"
                value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}
            >
                <option value="">ทุกประเภทรางวัล</option>
                <option value="ด้านนวัตกรรม">ด้านนวัตกรรม</option>
                <option value="ด้านความประพฤติดี">ด้านความประพฤติดี</option>
                <option value="ด้านกิจกรรม">ด้านกิจกรรม</option>
            </select>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-x-auto">
            <table className="w-full text-left border-collapse">
            <thead className="bg-gray-100 text-gray-600 text-xs uppercase tracking-wider font-semibold">
                <tr>
                <th className="p-4 w-[5%] text-center">#</th>
                <th className="p-4 w-[25%]">ผู้ได้รับการเสนอชื่อ</th>
                <th className="p-4 text-center w-[15%]">รายละเอียด</th>
                <th className="p-4 text-center w-[20%]">สถานะการเลือก</th>
                <th className="p-4 text-center w-[35%]">ลงคะแนน</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
                {loading ? (
                <tr><td colSpan={5} className="p-8 text-center text-gray-400">กำลังโหลดข้อมูล...</td></tr>
                ) : currentItems.length === 0 ? (
                <tr><td colSpan={5} className="p-8 text-center text-gray-400">ไม่พบรายการ</td></tr>
                ) : (
                    currentItems.map((item, index) => (
                        <tr key={item.id} className={`transition-colors ${item.myVote ? 'bg-blue-50/30' : 'hover:bg-gray-50'}`}>
                            <td className="p-4 text-center text-gray-400">{startIndex + index + 1}</td>
                            
                            <td className="p-4">
                                <div className="font-bold text-gray-800">{item.name}</div>
                                <div className="text-xs text-gray-500 mt-0.5">{item.studentId} | {item.faculty}</div>
                                <div className="text-xs text-blue-600 mt-1 bg-blue-50 inline-block px-1.5 py-0.5 rounded">{item.category}</div>
                            </td>

                            <td className="p-4 text-center align-middle">
                                <button onClick={() => handleViewDetail(item)} className="text-gray-400 hover:text-blue-600 p-2 rounded-full hover:bg-blue-50 transition-all">
                                    <svg className="w-5 h-5 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                </button>
                            </td>

                            <td className="p-4 text-center align-middle">
                                {item.myVote ? (
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold border 
                                        ${item.myVote === 'approve' ? 'bg-green-50 text-green-700 border-green-200' : 
                                          item.myVote === 'reject' ? 'bg-red-50 text-red-700 border-red-200' : 
                                          'bg-gray-100 text-gray-600 border-gray-200'}`}>
                                        {item.myVote === 'approve' && 'เห็นชอบ'}
                                        {item.myVote === 'reject' && 'ไม่เห็นชอบ'}
                                        {item.myVote === 'abstain' && 'งดออกเสียง'}
                                    </span>
                                ) : (
                                    <span className="text-xs text-gray-400 font-medium">- ยังไม่เลือก -</span>
                                )}
                            </td>

                            <td className="p-4 align-middle">
                                <div className="flex justify-center gap-2">
                                    <button onClick={() => handleVote(item.id, 'approve')} className={`flex-1 px-3 py-1.5 rounded-md text-xs font-semibold transition-all border ${item.myVote === 'approve' ? 'bg-green-600 text-white border-green-600 shadow-md ring-2 ring-green-100 scale-105' : 'bg-white text-gray-600 border-gray-300 hover:border-green-500 hover:text-green-600'}`}>เห็นชอบ</button>
                                    <button onClick={() => handleVote(item.id, 'reject')} className={`flex-1 px-3 py-1.5 rounded-md text-xs font-semibold transition-all border ${item.myVote === 'reject' ? 'bg-red-600 text-white border-red-600 shadow-md ring-2 ring-red-100 scale-105' : 'bg-white text-gray-600 border-gray-300 hover:border-red-500 hover:text-red-600'}`}>ไม่เห็นชอบ</button>
                                    <button onClick={() => handleVote(item.id, 'abstain')} className={`flex-1 px-3 py-1.5 rounded-md text-xs font-semibold transition-all border ${item.myVote === 'abstain' ? 'bg-gray-600 text-white border-gray-600 shadow-md ring-2 ring-gray-100 scale-105' : 'bg-white text-gray-600 border-gray-300 hover:border-gray-500 hover:text-gray-700'}`}>งดออกเสียง</button>
                                </div>
                            </td>
                        </tr>
                    ))
                )}
            </tbody>
            </table>
        </div>

        {/* Pagination Footer */}
        <div className="flex justify-between items-center p-4 border-t border-gray-100 bg-gray-50">
            <div className="flex items-center gap-2">
                <button onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} disabled={currentPage === 1} className="w-8 h-8 flex items-center justify-center rounded bg-white border text-gray-500 hover:bg-gray-100 disabled:opacity-50">{'<'}</button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button key={page} onClick={() => setCurrentPage(page)} className={`w-8 h-8 rounded text-sm font-bold ${currentPage === page ? "bg-blue-600 text-white" : "bg-white border text-gray-600"}`}>{page}</button>
                ))}
                <button onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages || totalPages === 0} className="w-8 h-8 flex items-center justify-center rounded bg-white border text-gray-500 hover:bg-gray-100 disabled:opacity-50">{'>'}</button>
            </div>
            <div className="text-xs text-gray-500">แสดง {startIndex + 1} ถึง {Math.min(startIndex + itemsPerPage, filteredData.length)} จาก {filteredData.length} รายการ</div>
        </div>
      </div>

      {/* Floating Submit Bar */}
      <div className="fixed bottom-0 left-0 w-full bg-white border-t p-4 shadow-lg z-20">
        <div className="max-w-7xl mx-auto flex justify-between items-center pl-[300px]">
            <div className="text-sm text-gray-600">ลงคะแนนแล้ว <span className="font-bold text-black">{votedCount}</span> / {candidates.length} รายการ</div>
            <button onClick={handleSubmitVotes} disabled={votedCount === 0} className={`px-6 py-3 rounded-lg font-bold text-white shadow-lg transition-all flex items-center gap-2 ${votedCount > 0 ? 'bg-blue-600 hover:bg-blue-700 hover:scale-105' : 'bg-gray-300 cursor-not-allowed'}`}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                ยืนยันการส่งผลคะแนน ({votedCount})
            </button>
        </div>
      </div>

      <NominationDetailModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} data={modalData as any} />

    </div>
  );
}