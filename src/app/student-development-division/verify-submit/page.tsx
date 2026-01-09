"use client";

import { useState, useEffect } from "react";
import NominationDetailModal from "../../../components/nomination-detail-modal";

interface Nomination {
  id: number;
  name: string;
  studentId: string;
  year: string;
  category: string;
  status: string;
  date: string;
  
  // Modal Data
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
  
  // Internal Logic
  sddStatus?: "pending_check" | "verified" | "submitted" | "rejected";
  actionReason?: string; // เก็บเหตุผลล่าสุด
}

export default function SDDManagePage() {
  // --- State ---
  const [candidates, setCandidates] = useState<Nomination[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all"); 

  // Detail Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalData, setModalData] = useState<Nomination | null>(null);

  // --- Action/Reason Modal State ---
  const [isReasonModalOpen, setIsReasonModalOpen] = useState(false);
  const [actionTarget, setActionTarget] = useState<{
    id: number;
    type: "reject" | "edit_category";
    payload?: string;
  } | null>(null);
  const [reasonText, setReasonText] = useState("");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // --- Reset Pagination ---
  useEffect(() => { setCurrentPage(1); }, [searchTerm, filterStatus]);

  // --- Fetch Data ---
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // =========================================================
        // [API Integration] ดึงข้อมูลนิสิต (GET)
        // =========================================================
        /*
        const token = localStorage.getItem("accessToken");
        const params = new URLSearchParams();
        if (searchTerm) params.append("search", searchTerm);
        if (filterStatus !== 'all') params.append("status", filterStatus);
        
        // Pagination
        params.append("page", currentPage.toString());
        params.append("limit", itemsPerPage.toString());

        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/sdd/nominations?${params.toString()}`, {
           method: "GET",
           headers: { 
             "Content-Type": "application/json",
             "Authorization": `Bearer ${token}` 
           }
        });

        if (!response.ok) throw new Error("Failed to fetch data");
        const result = await response.json();
        
        // setCandidates(result.data); // ใช้ข้อมูลจริง
        */

        // =========================================================
        // [MOCKUP DATA]
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

  // ==========================================
  // Logic การจัดการ Action
  // ==========================================

  const initiateCategoryChange = (id: number, newCategory: string) => {
    setActionTarget({ id, type: "edit_category", payload: newCategory });
    setReasonText(""); 
    setIsReasonModalOpen(true);
  };

  const initiateReject = (id: number) => {
    setActionTarget({ id, type: "reject" });
    setReasonText("");
    setIsReasonModalOpen(true);
  };

  // --- Confirm Action (Submit Modal) ---
  const confirmAction = async () => {
    if (!actionTarget) return;
    if (!reasonText.trim()) {
        alert("กรุณาระบุเหตุผลการดำเนินการ");
        return;
    }

    try {
        const token = localStorage.getItem("accessToken");

        if (actionTarget.type === "edit_category" && actionTarget.payload) {
            // =========================================================
            // [API Integration] แก้ไข Category (PATCH)
            // =========================================================
            /*
            await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/sdd/nominations/${actionTarget.id}/category`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
                body: JSON.stringify({ category: actionTarget.payload, reason: reasonText })
            });
            */

            // Mock Update
            setCandidates(prev => prev.map(item => 
                item.id === actionTarget.id 
                    ? { ...item, category: actionTarget.payload!, actionReason: reasonText } 
                    : item
            ));
        } 
        else if (actionTarget.type === "reject") {
            // =========================================================
            // [API Integration] ตีกลับใบสมัคร (PATCH/PUT)
            // =========================================================
            /*
            await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/sdd/nominations/${actionTarget.id}/reject`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
                body: JSON.stringify({ reason: reasonText })
            });
            */

            // Mock Update
            setCandidates(prev => prev.map(item => 
                item.id === actionTarget.id 
                    ? { ...item, status: "rejected", sddStatus: "rejected", actionReason: reasonText } 
                    : item
            ));
        }

        setIsReasonModalOpen(false);
        setActionTarget(null);

    } catch (error) {
        console.error("Action error:", error);
        alert("เกิดข้อผิดพลาดในการบันทึก");
    }
  };

  // --- Verify Toggle ---
  const handleVerifyToggle = async (id: number) => {
    try {
        // =========================================================
        // [API Integration] อัปเดตสถานะ Verify (PATCH)
        // =========================================================
        /*
        const token = localStorage.getItem("accessToken");
        const currentItem = candidates.find(c => c.id === id);
        const newStatus = currentItem?.status === "verified" ? "pending" : "verified";

        await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/sdd/nominations/${id}/verify`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
            body: JSON.stringify({ status: newStatus })
        });
        */

        // Mock Update
        setCandidates(prev => prev.map(item => {
            if (item.id === id) {
                return { 
                    ...item, 
                    status: item.status === "verified" ? "pending" : "verified" 
                };
            }
            return item;
        }));

    } catch (error) {
        console.error("Verify error:", error);
    }
  };

  // --- Submit All ---
  const handleSubmitToCommittee = async () => {
    const verifiedCandidates = candidates.filter(c => c.status === "verified");
    if (verifiedCandidates.length === 0) return;

    if (confirm(`ยืนยันการส่งรายชื่อนิสิต ${verifiedCandidates.length} คน?`)) {
      try {
        // =========================================================
        // [API Integration] ส่งรายชื่อทั้งหมด (POST)
        // =========================================================
        /*
        const token = localStorage.getItem("accessToken");
        const ids = verifiedCandidates.map(c => c.id);

        await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/sdd/nominations/submit`, {
            method: "POST",
            headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
            body: JSON.stringify({ nominationIds: ids })
        });
        */

        // Mock Update
        setCandidates(prev => prev.map(item => 
            item.status === "verified" ? { ...item, status: "submitted" } : item
        ));
        alert("ส่งข้อมูลเรียบร้อยแล้ว!");

      } catch (error) {
        console.error("Submit error:", error);
        alert("ไม่สามารถส่งข้อมูลได้");
      }
    }
  };

  // --- Filtering ---
  const filteredData = candidates.filter(item => {
    if (item.status === 'submitted') return false;
    const matchSearch = item.name.includes(searchTerm) || item.studentId.includes(searchTerm);
    
    let matchStatus = true;
    if (filterStatus === "verified") matchStatus = item.status === "verified";
    if (filterStatus === "pending_check") matchStatus = item.status === "pending";
    if (filterStatus === "rejected") matchStatus = item.status === "rejected";

    return matchSearch && matchStatus;
  });

  const verifiedCount = candidates.filter(c => c.status === "verified").length;

  // --- Pagination ---
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentItems = filteredData.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="min-h-screen bg-gray-50 p-8 font-sans pb-24">
      {/* ... (UI Components เหมือนเดิม) ... */}
      
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">ตรวจสอบและคัดกรอง (Verification)</h1>
          <p className="text-sm text-gray-500 mt-1">ตรวจสอบความถูกต้อง แก้ไขประเภทรางวัล หรือตีกลับเอกสาร</p>
        </div>
        <div className="text-right">
            <div className="text-sm font-bold text-gray-600">พร้อมส่งให้กรรมการ</div>
            <div className="text-3xl font-bold text-blue-600">{verifiedCount} <span className="text-sm font-normal text-gray-400">คน</span></div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col min-h-[600px]">
        
        {/* Filters */}
        <div className="p-5 border-b border-gray-100 bg-gray-50/50 flex gap-4 items-center">
            <input type="text" placeholder="ค้นหาชื่อ, รหัสนิสิต..." className="flex-1 bg-white border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            <select className="bg-white border border-gray-300 rounded-lg px-4 py-2 text-sm outline-none cursor-pointer" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                <option value="all">แสดงสถานะทั้งหมด</option>
                <option value="pending_check">รอตรวจสอบ (Pending)</option>
                <option value="verified">ตรวจสอบแล้ว (Verified)</option>
                <option value="rejected">ตีกลับแล้ว (Rejected)</option>
            </select>
        </div>

        {/* Table Content */}
        <div className="flex-1 overflow-x-auto">
            <table className="w-full text-left border-collapse">
            <thead className="bg-gray-100 text-gray-600 text-xs uppercase tracking-wider font-semibold">
                <tr>
                <th className="p-4 w-[5%] text-center">#</th>
                <th className="p-4 w-[25%]">ข้อมูลนิสิต</th>
                <th className="p-4 w-[20%]">ประเภทรางวัล (แก้ไขได้)</th>
                <th className="p-4 w-[10%] text-center">เอกสาร</th>
                <th className="p-4 w-[10%] text-center">สถานะ</th>
                <th className="p-4 w-[30%] text-center">การดำเนินการ</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
                {loading ? (
                <tr><td colSpan={6} className="p-8 text-center text-gray-400">กำลังโหลดข้อมูล...</td></tr>
                ) : currentItems.length === 0 ? (
                <tr><td colSpan={6} className="p-8 text-center text-gray-400">ไม่พบรายการ</td></tr>
                ) : (
                    currentItems.map((item, index) => (
                        <tr key={item.id} className={`transition-colors ${item.status === 'verified' ? 'bg-blue-50/30' : item.status === 'rejected' ? 'bg-red-50/30' : 'hover:bg-gray-50'}`}>
                            <td className="p-4 text-center text-gray-400">{startIndex + index + 1}</td>
                            
                            <td className="p-4">
                                <div className="font-bold text-gray-800">{item.name}</div>
                                <div className="text-xs text-gray-500 mt-0.5">{item.studentId} | {item.faculty}</div>
                                {item.actionReason && (
                                    <div className="mt-1 text-[10px] text-orange-600 bg-orange-50 px-2 py-1 rounded border border-orange-100 inline-block max-w-full truncate">
                                        Note: {item.actionReason}
                                    </div>
                                )}
                            </td>

                            <td className="p-4">
                                <select 
                                    className={`w-full border rounded px-2 py-1.5 text-xs outline-none cursor-pointer transition-colors ${item.status === 'verified' ? 'bg-gray-100 text-gray-500 border-gray-200' : 'bg-white border-gray-300 focus:border-blue-500'}`}
                                    value={item.category}
                                    onChange={(e) => initiateCategoryChange(item.id, e.target.value)}
                                    disabled={item.status === 'verified' || item.status === 'rejected'} 
                                >
                                    <option value="ด้านความคิดสร้างสรรค์และนวัตกรรม">ด้านความคิดสร้างสรรค์และนวัตกรรม</option>
                                    <option value="ด้านความประพฤติดี">ด้านความประพฤติดี</option>
                                    <option value="ด้านกิจกรรมเสริมหลักสูตร">ด้านกิจกรรมเสริมหลักสูตร</option>
                                </select>
                            </td>

                            <td className="p-4 text-center">
                                <button onClick={() => { setModalData(item); setIsModalOpen(true); }} className="text-gray-500 hover:text-blue-600 underline text-xs">ดูรายละเอียด</button>
                            </td>

                            <td className="p-4 text-center">
                                {item.status === 'verified' ? (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-green-100 text-green-700 border border-green-200">ตรวจสอบแล้ว</span>
                                ) : item.status === 'rejected' ? (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-700 border border-red-200">ตีกลับแล้ว</span>
                                ) : (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-yellow-100 text-yellow-700 border border-yellow-200">รอตรวจสอบ</span>
                                )}
                            </td>

                            <td className="p-4 text-center">
                                <div className="flex justify-center gap-2">
                                    <button 
                                        onClick={() => initiateReject(item.id)}
                                        disabled={item.status === 'verified' || item.status === 'rejected'}
                                        className={`px-3 py-1.5 rounded text-xs font-bold border transition-all ${item.status === 'verified' || item.status === 'rejected' ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed' : 'bg-white text-red-600 border-red-200 hover:bg-red-50 hover:border-red-400'}`}
                                    >
                                        ตีกลับ
                                    </button>
                                    <button 
                                        onClick={() => handleVerifyToggle(item.id)}
                                        disabled={item.status === 'rejected'}
                                        className={`px-3 py-1.5 rounded text-xs font-bold transition-all shadow-sm w-20 ${item.status === 'verified' ? 'bg-gray-500 text-white hover:bg-gray-600' : item.status === 'rejected' ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
                                    >
                                        {item.status === 'verified' ? 'ยกเลิก' : 'อนุมัติ'}
                                    </button>
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
            <div className="text-sm text-gray-600">เลือกแล้ว <span className="font-bold text-black">{verifiedCount}</span> รายการ</div>
            <button onClick={handleSubmitToCommittee} disabled={verifiedCount === 0} className={`px-6 py-3 rounded-lg font-bold text-white shadow-lg flex items-center gap-2 ${verifiedCount > 0 ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-300 cursor-not-allowed'}`}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
                ส่งรายชื่อให้คณะกรรมการ ({verifiedCount})
            </button>
        </div>
      </div>

      <NominationDetailModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} data={modalData as any} />

      {/* Modal 2: Reason/Note */}
      {isReasonModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsReasonModalOpen(false)}></div>
            <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in-up">
                <div className={`px-6 py-4 flex items-center gap-3 ${actionTarget?.type === 'reject' ? 'bg-red-50 text-red-800' : 'bg-blue-50 text-blue-800'}`}>
                    <div className={`p-2 rounded-full ${actionTarget?.type === 'reject' ? 'bg-red-100' : 'bg-blue-100'}`}>
                        {actionTarget?.type === 'reject' 
                            ? <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
                            : <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                        }
                    </div>
                    <h3 className="text-lg font-bold">{actionTarget?.type === 'reject' ? 'ระบุสาเหตุการตีกลับ' : 'ระบุสาเหตุการแก้ไข'}</h3>
                </div>
                
                <div className="p-6">
                    <p className="text-sm text-gray-500 mb-2">
                        {actionTarget?.type === 'reject' 
                            ? 'กรุณาระบุเหตุผลที่ต้องการตีกลับใบสมัครนี้ เพื่อให้นิสิตรับทราบและแก้ไข' 
                            : `คุณกำลังจะเปลี่ยนประเภทรางวัลเป็น "${actionTarget?.payload}" กรุณาระบุเหตุผล`}
                    </p>
                    <textarea 
                        className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none h-32 resize-none"
                        placeholder="พิมพ์เหตุผลที่นี่..."
                        value={reasonText}
                        onChange={(e) => setReasonText(e.target.value)}
                    ></textarea>
                </div>

                <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3">
                    <button onClick={() => setIsReasonModalOpen(false)} className="px-4 py-2 text-gray-600 text-sm font-bold hover:bg-gray-100 rounded-lg">ยกเลิก</button>
                    <button 
                        onClick={confirmAction}
                        className={`px-6 py-2 text-white text-sm font-bold rounded-lg shadow-sm transition-all
                            ${actionTarget?.type === 'reject' ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'}`}
                    >
                        ยืนยันบันทึก
                    </button>
                </div>
            </div>
        </div>
      )}

    </div>
  );
}