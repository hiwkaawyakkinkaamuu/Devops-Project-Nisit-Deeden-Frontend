"use client";

import { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";

// ==========================================
// 0. Configuration & Service Layer
// ==========================================

const USE_MOCK_DATA = true; // Set FALSE to use Real API
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";
const ITEMS_PER_PAGE = 8;

// --- Validation Schema (Zod) ---
const LogEntrySchema = z.object({
  id: z.number(),
  timestamp: z.string(),
  operator: z.string(),
  action: z.enum(["update_category", "verify_student", "submit_committee", "reject_student", "other"]).or(z.string()),
  targetStudent: z.string().optional().nullable(),
  targetStudentId: z.string().optional().nullable(),
  details: z.string(),
});

type LogEntry = z.infer<typeof LogEntrySchema>;

// --- Mock Data ---
const MOCK_DATA: LogEntry[] = [
    { id: 1, timestamp: "2024-02-20T10:30:00", operator: "เจ้าหน้าที่ สมศรี", action: "submit_committee", details: "ส่งรายชื่อนิสิต 15 คน ให้คณะกรรมการพิจารณา" },
    { id: 2, timestamp: "2024-02-20T09:15:00", operator: "เจ้าหน้าที่ สมศรี", action: "verify_student", targetStudent: "นายสมชาย ใจดี", targetStudentId: "6610401234", details: "เปลี่ยนสถานะเป็น: ตรวจสอบแล้ว (Verified)" },
    { id: 3, timestamp: "2024-02-19T14:20:00", operator: "เจ้าหน้าที่ มานะ", action: "update_category", targetStudent: "นางสาวสมหญิง รักเรียน", targetStudentId: "6610405678", details: "แก้ไขประเภท: ด้านกิจกรรม -> ด้านนวัตกรรม" },
    { id: 4, timestamp: "2024-02-19T14:15:00", operator: "เจ้าหน้าที่ มานะ", action: "update_category", targetStudent: "นายเก่ง กล้าหาญ", targetStudentId: "6510409999", details: "แก้ไขประเภท: ด้านความประพฤติดี -> ด้านกิจกรรม" },
    { id: 5, timestamp: "2024-02-18T16:00:00", operator: "System Admin", action: "reject_student", targetStudent: "นายดื้อ รั้น", targetStudentId: "6710400000", details: "ตีกลับใบสมัคร (เอกสารไม่ครบ)" },
    { id: 6, timestamp: "2024-02-18T09:00:00", operator: "เจ้าหน้าที่ สมศรี", action: "verify_student", targetStudent: "นางสาวฟ้าใส", targetStudentId: "6710403333", details: "เปลี่ยนสถานะเป็น: ตรวจสอบแล้ว (Verified)" },
    { id: 7, timestamp: "2024-02-17T10:00:00", operator: "เจ้าหน้าที่ A", action: "verify_student", targetStudent: "Student A", targetStudentId: "6610401111", details: "ตรวจสอบเอกสารเรียบร้อย" },
    { id: 8, timestamp: "2024-02-16T11:20:00", operator: "เจ้าหน้าที่ B", action: "reject_student", targetStudent: "Student B", targetStudentId: "6610402222", details: "ปฏิเสธเนื่องจากคุณสมบัติไม่ผ่าน" }
];

// --- Service Object ---
const logService = {
  getLogs: async (params?: any) => {
    if (USE_MOCK_DATA) {
      await new Promise(resolve => setTimeout(resolve, 800)); // Simulate Delay
      // Validate Mock Data with Zod
      return z.array(LogEntrySchema).parse(MOCK_DATA);
    } else {
      // Real API Call
      try {
        const res = await axios.get(`${API_BASE_URL}/sdd/logs`, { params });
        // Validate API Response with Zod
        return z.array(LogEntrySchema).parse(res.data.data); 
      } catch (error) {
        throw error;
      }
    }
  }
};

// ==========================================
// 1. Helper Functions
// ==========================================

const formatDateTh = (isoDate: string) => {
    if (!isoDate) return "-";
    return new Date(isoDate).toLocaleDateString('th-TH', { 
        year: 'numeric', month: 'short', day: 'numeric' 
    });
};

const formatTimeTh = (isoDate: string) => {
    if (!isoDate) return "-";
    return new Date(isoDate).toLocaleTimeString('th-TH', { 
        hour: '2-digit', minute: '2-digit' 
    });
};

// ==========================================
// 2. Components
// ==========================================

const ActionBadge = ({ action }: { action: string }) => {
    const config: Record<string, { bg: string, text: string, border: string, label: string, dot: string }> = {
        update_category: { bg: "bg-blue-50", text: "text-blue-600", border: "border-blue-200", label: "แก้ไขข้อมูล", dot: "bg-blue-500" },
        verify_student: { bg: "bg-emerald-50", text: "text-emerald-600", border: "border-emerald-200", label: "ตรวจสอบแล้ว", dot: "bg-emerald-500" },
        submit_committee: { bg: "bg-purple-50", text: "text-purple-600", border: "border-purple-200", label: "ส่งต่อกรรมการ", dot: "bg-purple-500" },
        reject_student: { bg: "bg-red-50", text: "text-red-600", border: "border-red-200", label: "ตีกลับ/ปฏิเสธ", dot: "bg-red-500" },
        other: { bg: "bg-gray-50", text: "text-gray-600", border: "border-gray-200", label: "อื่นๆ", dot: "bg-gray-400" }
    };

    const style = config[action] || config.other;

    return (
        <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold border ${style.bg} ${style.text} ${style.border}`}>
            <span className={`w-1.5 h-1.5 rounded-full mr-2 ${style.dot}`}></span>
            {style.label}
        </span>
    );
};

// ==========================================
// 3. Main Page Component
// ==========================================

export default function SDDHistoryPage() {
    // State
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [loading, setLoading] = useState(true);
    
    // Filters
    const [searchTerm, setSearchTerm] = useState("");
    const [filterAction, setFilterAction] = useState("all");
    const [sortBy, setSortBy] = useState("date_desc");

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);

    // Reset Page on Filter Change
    useEffect(() => { setCurrentPage(1); }, [searchTerm, filterAction, sortBy]);

    // Fetch Data
    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            try {
                const data = await logService.getLogs();
                setLogs(data);
            } catch (error) {
                console.error("Failed to fetch logs:", error);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, []);

    // Logic: Filter & Sort
    const processedLogs = useMemo(() => {
        let result = logs.filter(log => {
            const searchLower = searchTerm.toLowerCase();
            const matchSearch = log.operator.toLowerCase().includes(searchLower) || 
                                (log.targetStudent?.toLowerCase().includes(searchLower)) ||
                                (log.targetStudentId?.includes(searchLower));
            
            const matchAction = filterAction === "all" ? true : log.action === filterAction;
            return matchSearch && matchAction;
        });

        // Sort
        result.sort((a, b) => {
            if (sortBy === 'date_desc') return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
            if (sortBy === 'date_asc') return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
            return 0;
        });

        return result;
    }, [logs, searchTerm, filterAction, sortBy]);

    // Pagination Logic
    const totalPages = Math.ceil(processedLogs.length / ITEMS_PER_PAGE);
    const paginatedLogs = processedLogs.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    // ==========================================
    // Render UI
    // ==========================================
    return (
        <div className="min-h-screen bg-[#F8F9FC] p-8 pb-32 font-sans text-gray-800">
            
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">ประวัติการดำเนินการ</h1>
                    <p className="text-gray-500 mt-1">
                        {USE_MOCK_DATA && <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded mr-2">MOCK MODE</span>}
                        ติดตามสถานะการแก้ไข ตรวจสอบ และการส่งต่อข้อมูลในระบบ
                    </p>
                </div>
            </div>

            {/* Main Card */}
            <div className="bg-white rounded-[24px] shadow-[0_2px_20px_rgba(0,0,0,0.04)] border border-gray-100 flex flex-col overflow-hidden min-h-[600px]">
                
                {/* Filters Bar */}
                <div className="p-5 border-b border-gray-100 bg-gray-50/50 flex flex-col lg:flex-row gap-4 justify-between sticky top-0 z-10 backdrop-blur-sm">
                    <div className="flex flex-col md:flex-row gap-4 w-full lg:w-auto">
                        {/* Search */}
                        <div className="relative w-full md:w-80 group">
                            <input 
                                type="text" 
                                placeholder="ค้นหาชื่อเจ้าหน้าที่, นิสิต..." 
                                className="w-full bg-white border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all shadow-sm"
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                            <svg className="w-5 h-5 absolute left-3 top-2.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
                        </div>

                        {/* Action Filter */}
                        <div className="relative group w-full md:w-64">
                            <select 
                                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none cursor-pointer focus:ring-2 focus:ring-blue-500 transition-all shadow-sm appearance-none text-gray-600"
                                value={filterAction}
                                onChange={e => setFilterAction(e.target.value)}
                            >
                                <option value="all">ทุกกิจกรรม</option>
                                <option value="verify_student">การตรวจสอบ (Verify)</option>
                                <option value="submit_committee">ส่งต่อกรรมการ</option>
                                <option value="reject_student">ตีกลับ/ปฏิเสธ</option>
                                <option value="update_category">แก้ไขข้อมูล</option>
                            </select>
                            <svg className="w-4 h-4 absolute right-4 top-3 text-gray-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/></svg>
                        </div>
                    </div>

                    {/* Sort Filter */}
                    <div className="relative group w-full lg:w-48">
                        <select 
                            className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none cursor-pointer focus:ring-2 focus:ring-blue-500 transition-all shadow-sm appearance-none text-gray-600"
                            value={sortBy}
                            onChange={e => setSortBy(e.target.value)}
                        >
                            <option value="date_desc">ล่าสุดก่อน</option>
                            <option value="date_asc">เก่าสุดก่อน</option>
                        </select>
                        <svg className="w-4 h-4 absolute right-4 top-3 text-gray-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/></svg>
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto flex-1">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50/50 border-b border-gray-100 text-xs uppercase text-gray-400 font-bold tracking-wider">
                                <th className="p-6 w-[18%]">วัน-เวลา</th>
                                <th className="p-6 w-[20%]">ผู้ทำรายการ</th>
                                <th className="p-6 w-[15%] text-center">กิจกรรม</th>
                                <th className="p-6 w-[20%]">เป้าหมาย</th>
                                <th className="p-6 w-[27%]">รายละเอียด</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {loading ? (
                                [...Array(5)].map((_, i) => (
                                    <tr key={i} className="animate-pulse border-b border-gray-50">
                                        <td className="p-6"><div className="h-4 bg-gray-100 rounded w-24 mb-1"></div><div className="h-3 bg-gray-50 rounded w-12"></div></td>
                                        <td className="p-6"><div className="h-4 bg-gray-100 rounded w-32"></div></td>
                                        <td className="p-6"><div className="h-6 bg-gray-100 rounded-full w-20 mx-auto"></div></td>
                                        <td className="p-6"><div className="h-4 bg-gray-100 rounded w-24"></div></td>
                                        <td className="p-6"><div className="h-4 bg-gray-100 rounded w-48"></div></td>
                                    </tr>
                                ))
                            ) : paginatedLogs.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="p-20 text-center text-gray-400 flex flex-col items-center">
                                        <span className="bg-gray-50 p-4 rounded-full mb-3"><svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg></span>
                                        ไม่พบประวัติการดำเนินการ
                                    </td>
                                </tr>
                            ) : (
                                <AnimatePresence>
                                    {paginatedLogs.map((log, index) => (
                                        <motion.tr 
                                            key={log.id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0 }}
                                            transition={{ delay: index * 0.05 }}
                                            className="group hover:bg-gray-50/80 transition-colors border-b border-gray-50 last:border-0"
                                        >
                                            <td className="p-6">
                                                <div className="font-bold text-gray-700 text-sm">{formatDateTh(log.timestamp)}</div>
                                                <div className="text-xs text-gray-400 mt-0.5 font-mono">{formatTimeTh(log.timestamp)} น.</div>
                                            </td>
                                            <td className="p-6">
                                                <div className="font-bold text-gray-800">{log.operator}</div>
                                            </td>
                                            <td className="p-6 text-center">
                                                <ActionBadge action={log.action} />
                                            </td>
                                            <td className="p-6">
                                                {log.targetStudent ? (
                                                    <div>
                                                        <div className="font-medium text-gray-800 text-sm">{log.targetStudent}</div>
                                                        <div className="text-[10px] text-gray-400 font-mono tracking-wide">{log.targetStudentId}</div>
                                                    </div>
                                                ) : <span className="text-gray-300 text-xs italic">- System -</span>}
                                            </td>
                                            <td className="p-6 text-sm text-gray-600 leading-relaxed">
                                                {log.details}
                                            </td>
                                        </motion.tr>
                                    ))}
                                </AnimatePresence>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Footer */}
                <div className="flex justify-between items-center p-5 border-t border-gray-100 bg-gray-50">
                      <div className="flex items-center gap-2">
                        <button 
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} 
                            disabled={currentPage === 1}
                            className="flex items-center justify-center px-4 py-2 rounded-lg bg-white border border-gray-200 text-gray-500 text-sm font-bold hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
                        >
                            &lt;
                        </button>
                        <span className="text-xs font-semibold text-gray-500 px-3 py-1.5 bg-gray-100 rounded-lg">
                            หน้า {currentPage} / {Math.max(totalPages, 1)}
                        </span>
                        <button 
                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} 
                            disabled={currentPage === totalPages || totalPages === 0}
                            className="flex items-center justify-center px-4 py-2 rounded-lg bg-white border border-gray-200 text-gray-500 text-sm font-bold hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
                        >
                            &gt;
                        </button>
                      </div>
                </div>
            </div>
        </div>
    );
}