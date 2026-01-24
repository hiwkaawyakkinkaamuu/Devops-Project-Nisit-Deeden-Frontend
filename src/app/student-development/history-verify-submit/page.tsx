"use client";

import { useState, useEffect } from "react";

// Type Definitions
type ActionType = "update_category" | "verify_student" | "submit_committee" | "reject_student";

interface LogEntry {
  id: number;
  timestamp: string;
  operator: string;
  action: ActionType;
  targetStudent?: string;
  targetStudentId?: string;
  details: string;
}

export default function SDDHistoryPage() {
  // State
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [filterAction, setFilterAction] = useState("all");
  const [filterDate, setFilterDate] = useState("");

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // Reset Pagination เมื่อ Filter เปลี่ยน 
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterAction, filterDate]);

  // Fetch Data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        //  [API] ดึงข้อมูล Logs (GET)
        /*
        const token = localStorage.getItem("accessToken");
        const params = new URLSearchParams();
        if (searchTerm) params.append("search", searchTerm);
        // ... params อื่นๆ ...

        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/sdd/logs?${params.toString()}`, {
           headers: { Authorization: `Bearer ${token}` }
        });
        const result = await response.json();
        setLogs(result.data);
        */

        // MOCKUP DATA
        const mockData: LogEntry[] = [
            { id: 1, timestamp: "2024-02-20T10:30:00", operator: "เจ้าหน้าที่ สมศรี", action: "submit_committee", details: "ส่งรายชื่อนิสิต 15 คน ให้คณะกรรมการพิจารณา" },
            { id: 2, timestamp: "2024-02-20T09:15:00", operator: "เจ้าหน้าที่ สมศรี", action: "verify_student", targetStudent: "นายสมชาย ใจดี", targetStudentId: "6610401234", details: "เปลี่ยนสถานะเป็น: ตรวจสอบแล้ว (Verified)" },
            { id: 3, timestamp: "2024-02-19T14:20:00", operator: "เจ้าหน้าที่ มานะ", action: "update_category", targetStudent: "นางสาวสมหญิง รักเรียน", targetStudentId: "6610405678", details: "แก้ไขประเภท: ด้านกิจกรรม -> ด้านนวัตกรรม" },
            { id: 4, timestamp: "2024-02-19T14:15:00", operator: "เจ้าหน้าที่ มานะ", action: "update_category", targetStudent: "นายเก่ง กล้าหาญ", targetStudentId: "6510409999", details: "แก้ไขประเภท: ด้านความประพฤติดี -> ด้านกิจกรรม" },
            { id: 5, timestamp: "2024-02-18T16:00:00", operator: "System Admin", action: "reject_student", targetStudent: "นายดื้อ รั้น", targetStudentId: "6710400000", details: "ตีกลับใบสมัคร (เอกสารไม่ครบ)" },
            { id: 6, timestamp: "2024-02-18T09:00:00", operator: "เจ้าหน้าที่ สมศรี", action: "verify_student", targetStudent: "นางสาวฟ้าใส", targetStudentId: "6710403333", details: "เปลี่ยนสถานะเป็น: ตรวจสอบแล้ว (Verified)" },
            // เพิ่มข้อมูล Mock เพื่อทดสอบ Pagination
            { id: 7, timestamp: "2024-02-17T10:00:00", operator: "เจ้าหน้าที่ A", action: "verify_student", targetStudent: "Student A", targetStudentId: "66xxxx", details: "Verified" },
            { id: 8, timestamp: "2024-02-17T11:00:00", operator: "เจ้าหน้าที่ B", action: "reject_student", targetStudent: "Student B", targetStudentId: "66xxxx", details: "Rejected" },
            { id: 9, timestamp: "2024-02-17T12:00:00", operator: "เจ้าหน้าที่ C", action: "update_category", targetStudent: "Student C", targetStudentId: "66xxxx", details: "Updated" },
            { id: 10, timestamp: "2024-02-16T13:00:00", operator: "เจ้าหน้าที่ D", action: "verify_student", targetStudent: "Student D", targetStudentId: "66xxxx", details: "Verified" },
            { id: 11, timestamp: "2024-02-16T14:00:00", operator: "เจ้าหน้าที่ E", action: "submit_committee", details: "Submitted batch 2" },
        ];
        
        setLogs(mockData);
        setLoading(false);

      } catch (error) {
        console.error("Error fetching logs:", error);
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Filter Logic
  const filteredLogs = logs.filter(log => {
    const matchSearch = log.operator.includes(searchTerm) || (log.targetStudent && log.targetStudent.includes(searchTerm));
    const matchAction = filterAction === "all" ? true : log.action === filterAction;
    const matchDate = filterDate ? log.timestamp.startsWith(filterDate) : true;
    return matchSearch && matchAction && matchDate;
  });

  // Pagination Logic (คำนวณใหม่ทุกครั้งที่ Filter เปลี่ยน)
  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedLogs = filteredLogs.slice(startIndex, endIndex); // ตัดข้อมูลมาแสดงเฉพาะหน้าปัจจุบัน

  // Helper: Render Badge
  const renderActionBadge = (action: ActionType) => {
    switch (action) {
        case "update_category": return <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-md text-xs font-bold border border-blue-200">แก้ไขข้อมูล</span>;
        case "verify_student": return <span className="px-2 py-1 bg-green-100 text-green-700 rounded-md text-xs font-bold border border-green-200">ตรวจสอบแล้ว</span>;
        case "submit_committee": return <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-md text-xs font-bold border border-purple-200">ส่งต่อกรรมการ</span>;
        case "reject_student": return <span className="px-2 py-1 bg-red-100 text-red-700 rounded-md text-xs font-bold border border-red-200">ตีกลับ/ปฏิเสธ</span>;
        default: return <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-md text-xs border border-gray-200">อื่นๆ</span>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8 font-sans">
      
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">ประวัติการดำเนินการ</h1>
        <p className="text-sm text-gray-500 mt-1">ตรวจสอบประวัติการแก้ไขข้อมูล การตรวจสอบ และการส่งรายชื่อ</p>
      </div>

      {/* Main Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col min-h-[600px]">
        
        {/* Filters */}
        <div className="p-5 border-b border-gray-100 bg-gray-50/50 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative col-span-2">
                <input 
                    type="text" placeholder="ค้นหาชื่อเจ้าหน้าที่ หรือ ชื่อนิสิต..." 
                    className="w-full bg-white border border-gray-300 rounded-lg pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                />
                <svg className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
            </div>
            <select className="bg-white border border-gray-300 rounded-lg px-4 py-2 text-sm outline-none cursor-pointer text-gray-600" value={filterAction} onChange={(e) => setFilterAction(e.target.value)}>
                <option value="all">ทุกกิจกรรม</option>
                <option value="update_category">การแก้ไขข้อมูล</option>
                <option value="verify_student">การตรวจสอบ (Verify)</option>
                <option value="submit_committee">การส่งต่อกรรมการ</option>
                <option value="reject_student">การตีกลับ/ปฏิเสธ</option>
            </select>
            <input type="date" className="bg-white border border-gray-300 rounded-lg px-4 py-2 text-sm outline-none text-gray-600" value={filterDate} onChange={(e) => setFilterDate(e.target.value)} />
        </div>

        {/* Table Content */}
        <div className="flex-1 overflow-x-auto">
            <table className="w-full text-left border-collapse">
                <thead className="bg-gray-100 text-gray-600 text-xs uppercase tracking-wider font-semibold">
                    <tr>
                        <th className="p-4 w-[15%]">วัน-เวลา</th>
                        <th className="p-4 w-[15%]">ผู้ทำรายการ</th>
                        <th className="p-4 w-[15%] text-center">กิจกรรม</th>
                        <th className="p-4 w-[20%]">ผู้ถูกกระทำ (นิสิต)</th>
                        <th className="p-4 w-[35%]">รายละเอียดการเปลี่ยนแปลง</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm">
                    {loading ? (
                        <tr><td colSpan={5} className="p-8 text-center text-gray-400">กำลังโหลดประวัติ...</td></tr>
                    ) : paginatedLogs.length === 0 ? (
                        <tr><td colSpan={5} className="p-8 text-center text-gray-400">ไม่พบข้อมูลประวัติ</td></tr>
                    ) : (
                        // Map จาก paginatedLogs (ข้อมูลที่ตัดมาแล้ว) แทนที่จะเป็น logs ทั้งหมด
                        paginatedLogs.map((log) => (
                            <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                                <td className="p-4 text-gray-500 whitespace-nowrap">
                                    {new Date(log.timestamp).toLocaleDateString('th-TH')} <br/>
                                    <span className="text-xs text-gray-400">{new Date(log.timestamp).toLocaleTimeString('th-TH')}</span>
                                </td>
                                <td className="p-4 font-medium text-gray-700">{log.operator}</td>
                                <td className="p-4 text-center">{renderActionBadge(log.action)}</td>
                                <td className="p-4">
                                    {log.targetStudent ? (
                                        <>
                                            <div className="font-bold text-gray-800">{log.targetStudent}</div>
                                            <div className="text-xs text-gray-400">{log.targetStudentId}</div>
                                        </>
                                    ) : <span className="text-gray-400">-</span>}
                                </td>
                                <td className="p-4 text-gray-600">{log.details}</td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>

        {/* Corrected Pagination Footer */}
        <div className="flex justify-between items-center p-4 border-t border-gray-100 bg-gray-50">
            {/* ซ้าย: ปุ่มเปลี่ยนหน้า */}
            <div className="flex items-center gap-2">
                <button 
                    onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} 
                    disabled={currentPage === 1} 
                    className="w-8 h-8 flex items-center justify-center rounded bg-white border border-gray-300 text-gray-500 hover:bg-gray-100 text-sm disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                >
                    {'<'}
                </button>

                {/* สร้างปุ่มตัวเลขตามจำนวนหน้า */}
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button 
                        key={page} 
                        onClick={() => setCurrentPage(page)} 
                        className={`w-8 h-8 flex items-center justify-center rounded text-sm font-bold transition-colors shadow-sm
                            ${currentPage === page 
                                ? "bg-blue-600 text-white border border-blue-600" 
                                : "bg-white border border-gray-300 text-gray-600 hover:bg-gray-100"}`}
                    >
                        {page}
                    </button>
                ))}

                <button 
                    onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} 
                    disabled={currentPage === totalPages || totalPages === 0} 
                    className="w-8 h-8 flex items-center justify-center rounded bg-white border border-gray-300 text-gray-500 hover:bg-gray-100 text-sm disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                >
                    {'>'}
                </button>
            </div>

            {/* ขวา: ข้อความแสดงจำนวน */}
            <div className="text-xs text-gray-500">
                แสดง {filteredLogs.length > 0 ? startIndex + 1 : 0} ถึง {Math.min(endIndex, filteredLogs.length)} จาก {filteredLogs.length} รายการ
            </div>
        </div>

      </div>
    </div>
  );
}