"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "@/lib/axios"; // ✅ กลับมาใช้ Axios ส่วนกลางของโปรเจกต์
import { Search, ChevronDown, CheckCircle2, History, User, ChevronLeft, ChevronRight } from "lucide-react";

// ==========================================
// 0. Configuration & Interfaces
// ==========================================

const USE_MOCK_DATA = false;
const ITEMS_PER_PAGE = 8;

export interface LogEntry {
  log_id: number;
  form_id: number;
  changed_by: number;
  field_name: string;
  old_value: string;
  new_value: string;
  created_at: string;
  
  // Custom Fields (Mapped from API)
  operator_name?: string;
  target_student_name?: string;
  target_student_id?: string;
  action_type?: string;
  detail_text?: string;
}

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
        submit_committee: { bg: "bg-purple-50", text: "text-purple-600", border: "border-purple-200", label: "เปลี่ยนสถานะ", dot: "bg-purple-500" },
        reject_student: { bg: "bg-rose-50", text: "text-rose-600", border: "border-rose-200", label: "ตีกลับ/ปฏิเสธ", dot: "bg-rose-500" },
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
        let isMounted = true;

        const fetchData = async () => {
            setLoading(true);
            try {
                if (USE_MOCK_DATA) return;

                // ✅ 1. ใช้ api.get() ของ Axios (ระบบจะแนบ Token ให้อัตโนมัติจาก Interceptor)
                // ใส่ .catch เอาไว้กันหน้าพังกรณีที่ API บางตัว Error
                const [userRes, statusRes, formRes] = await Promise.all([
                    api.get("/users").catch(() => ({ data: { data: [] } })),
                    api.get("/form-statuses").catch(() => ({ data: { data: [] } })),
                    api.get("/awards/search?limit=1000").catch(() => ({ data: { data: [] } }))
                ]);

                // รองรับโครงสร้าง Response แบบ { data: [...] }
                const usersList = userRes.data?.data || userRes.data || [];
                const statusList = statusRes.data?.data || statusRes.data || [];
                const formsList = formRes.data?.data || formRes.data || [];

                // ✅ 2. ดึง Log ของแต่ละฟอร์ม (ดักจับ 404 ให้คืนค่าเป็น Array ว่างอย่างนุ่มนวล)
                const logPromises = formsList.map((form: any) => 
                    api.get(`/awards/${form.form_id}/logs`)
                        .then(res => res.data?.data || res.data || [])
                        .catch(() => []) 
                );

                const logsArrays = await Promise.all(logPromises);
                
                // รวม Array ที่ได้มาเป็นก้อนเดียว
                const rawLogs = logsArrays
                    .flat()
                    .filter(log => log && typeof log === 'object');

                // ✅ 3. Mapping ข้อมูล (จับคู่ ID ของ User กับชื่อ)
                const mappedLogs = rawLogs.map((log: any) => {
                    const operator = usersList.find((u: any) => u.user_id === log.changed_by);
                    const form = formsList.find((f: any) => f.form_id === log.form_id);
                    
                    let actionType = "other";
                    let detailText = `เปลี่ยน ${log.field_name} เป็น ${log.new_value}`;

                    // วิเคราะห์ Action จาก Field Name
                    if (log.field_name === "form_status" || log.field_name === "form_status_id") {
                        actionType = "submit_committee";
                        const oldStatus = statusList.find((s: any) => String(s.form_status_id) === String(log.old_value))?.form_status_name || log.old_value;
                        const newStatus = statusList.find((s: any) => String(s.form_status_id) === String(log.new_value))?.form_status_name || log.new_value;
                        detailText = `เปลี่ยนสถานะเป็น: ${newStatus ? newStatus.replace(/_/g, ' ') : log.new_value}`;
                        
                        // ถ้ารหัสสถานะตรงกับการตีกลับ
                        if (['3', '5', '7', '9', '11'].includes(String(log.new_value))) {
                            actionType = "reject_student";
                        } else if (String(log.new_value) === '8') {
                            actionType = "verify_student";
                        }
                    } else if (log.field_name === "award_type" || log.field_name === "award_type_id") {
                        actionType = "update_category";
                        detailText = `แก้ไขประเภทรางวัล: ${log.old_value} -> ${log.new_value}`;
                    }

                    // เอาชื่อ User มาใส่ ถ้าไม่เจอจริงๆ ค่อยโชว์เป็น ID
                    const operatorDisplayName = operator 
                        ? `${operator.firstname} ${operator.lastname}` 
                        : `รหัสผู้ดำเนินการ: ${log.changed_by}`;

                    return {
                        ...log,
                        operator_name: operatorDisplayName,
                        target_student_name: form ? `${form.student_firstname} ${form.student_lastname}` : `Form #${log.form_id}`,
                        target_student_id: form ? form.student_number : "-",
                        action_type: actionType,
                        detail_text: detailText
                    };
                });

                if (isMounted) setLogs(mappedLogs);

            } catch (error) {
                console.error("Failed to fetch logs:", error);
            } finally {
                if (isMounted) setLoading(false);
            }
        };
        fetchData();
        return () => { isMounted = false; };
    }, []);

    // Logic: Filter & Sort
    const processedLogs = useMemo(() => {
        let result = logs.filter(log => {
            const searchLower = searchTerm.toLowerCase();
            const matchSearch = (log.operator_name || "").toLowerCase().includes(searchLower) || 
                                (log.target_student_name || "").toLowerCase().includes(searchLower) ||
                                (log.target_student_id || "").includes(searchLower) ||
                                (String(log.form_id)).includes(searchLower);
            
            const matchAction = filterAction === "all" ? true : log.action_type === filterAction;
            return matchSearch && matchAction;
        });

        // Sort
        result.sort((a, b) => {
            if (sortBy === 'date_desc') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
            if (sortBy === 'date_asc') return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
            return 0;
        });

        return result;
    }, [logs, searchTerm, filterAction, sortBy]);

    const totalPages = Math.ceil(processedLogs.length / ITEMS_PER_PAGE);
    const paginatedLogs = processedLogs.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    // ==========================================
    // Render UI
    // ==========================================
    return (
        <div className="min-h-screen bg-[#F8FAFC] p-6 pt-24 lg:p-10 lg:pt-28 font-sans pb-32 relative overflow-hidden">
            
            {/* Abstract Background */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-400/10 blur-[120px] rounded-full pointer-events-none z-0" />
            <div className="absolute bottom-[-10%] right-[-5%] w-[30%] h-[50%] bg-indigo-400/10 blur-[120px] rounded-full pointer-events-none z-0" />

            <style jsx global>{`
                @keyframes fadeInUp { from { opacity: 0; transform: translateY(15px); } to { opacity: 1; transform: translateY(0); } }
                .animate-fade-in-up { animation: fadeInUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
            `}</style>

            <div className="max-w-7xl mx-auto space-y-8 relative z-10">
                
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 bg-white/70 backdrop-blur-xl p-8 rounded-[32px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/80 animate-fade-in-up">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-100 mb-3 text-blue-600">
                            <History className="w-4 h-4" />
                            <span className="text-[11px] font-black uppercase tracking-[0.15em]">System Audit Trail</span>
                        </div>
                        <h1 className="text-3xl lg:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-700 to-indigo-600 flex items-center gap-3 tracking-tight">
                           ประวัติการดำเนินการ
                        </h1>
                        <p className="text-slate-500 mt-2 font-medium flex items-center gap-2">
                           ติดตามสถานะการแก้ไข ตรวจสอบ และการส่งต่อข้อมูลในระบบทั้งหมด
                        </p>
                    </div>
                </div>

                {/* Main Card */}
                <div className="bg-white/90 backdrop-blur-xl rounded-[32px] shadow-[0_10px_40px_rgb(0,0,0,0.05)] border border-slate-100 flex flex-col overflow-hidden min-h-[600px] animate-fade-in-up" style={{ animationDelay: '100ms' }}>
                    
                    {/* Filters Bar */}
                    <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex flex-col lg:flex-row gap-4 justify-between sticky top-0 z-10 backdrop-blur-md">
                        <div className="flex flex-col md:flex-row gap-4 w-full lg:w-auto">
                            {/* Search */}
                            <div className="relative w-full md:w-80 group">
                                <Search className="w-4 h-4 absolute left-4 top-3.5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                                <input 
                                    type="text" 
                                    placeholder="ค้นหาชื่อเจ้าหน้าที่, นิสิต, หรือ ID..." 
                                    className="w-full bg-white border border-slate-200/80 rounded-2xl pl-11 pr-4 py-3 text-sm font-medium focus:ring-4 focus:ring-blue-500/10 focus:border-blue-400 outline-none transition-all shadow-sm"
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                />
                            </div>

                            {/* Action Filter */}
                            <div className="relative group w-full md:w-64">
                                <select 
                                    className="w-full bg-white border border-slate-200/80 rounded-2xl pl-5 pr-10 py-3 text-sm font-medium outline-none cursor-pointer focus:ring-4 focus:ring-blue-500/10 focus:border-blue-400 transition-all shadow-sm appearance-none text-slate-600"
                                    value={filterAction}
                                    onChange={e => setFilterAction(e.target.value)}
                                >
                                    <option value="all">ทุกกิจกรรม</option>
                                    <option value="verify_student">การตรวจสอบ (Verify)</option>
                                    <option value="submit_committee">เปลี่ยนสถานะ</option>
                                    <option value="reject_student">ตีกลับ/ปฏิเสธ</option>
                                    <option value="update_category">แก้ไขข้อมูล</option>
                                </select>
                                <ChevronDown className="w-4 h-4 absolute right-4 top-3.5 text-slate-400 pointer-events-none" />
                            </div>
                        </div>

                        {/* Sort Filter */}
                        <div className="relative group w-full lg:w-48">
                            <select 
                                className="w-full bg-white border border-slate-200/80 rounded-2xl pl-5 pr-10 py-3 text-sm font-medium outline-none cursor-pointer focus:ring-2 focus:ring-blue-500 transition-all shadow-sm appearance-none text-slate-600"
                                value={sortBy}
                                onChange={e => setSortBy(e.target.value)}
                            >
                                <option value="date_desc">ล่าสุดก่อน</option>
                                <option value="date_asc">เก่าสุดก่อน</option>
                            </select>
                            <ChevronDown className="w-4 h-4 absolute right-4 top-3.5 text-slate-400 pointer-events-none" />
                        </div>
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto flex-1">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50/50 border-b border-slate-100 text-[11px] uppercase text-slate-500 font-extrabold tracking-widest">
                                    <th className="p-6 w-[18%]">วัน-เวลา</th>
                                    <th className="p-6 w-[20%]">ผู้ทำรายการ</th>
                                    <th className="p-6 w-[15%] text-center">กิจกรรม</th>
                                    <th className="p-6 w-[20%]">เอกสารเป้าหมาย</th>
                                    <th className="p-6 w-[27%]">รายละเอียด</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 bg-transparent text-sm">
                                {loading ? (
                                    [...Array(5)].map((_, i) => (
                                        <tr key={i} className="animate-pulse">
                                            <td className="p-6"><div className="h-4 bg-slate-200 rounded-md w-24 mb-2"></div><div className="h-3 bg-slate-100 rounded-md w-12"></div></td>
                                            <td className="p-6"><div className="h-4 bg-slate-200 rounded-md w-32"></div></td>
                                            <td className="p-6"><div className="h-6 bg-slate-200 rounded-full w-24 mx-auto"></div></td>
                                            <td className="p-6"><div className="h-4 bg-slate-200 rounded-md w-32 mb-2"></div><div className="h-3 bg-slate-100 rounded-md w-20"></div></td>
                                            <td className="p-6"><div className="h-4 bg-slate-200 rounded-md w-48"></div></td>
                                        </tr>
                                    ))
                                ) : paginatedLogs.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="p-20 text-center text-slate-400 flex flex-col items-center">
                                            <span className="bg-slate-50 p-5 rounded-full mb-4 shadow-sm border border-slate-100">
                                                <History className="w-10 h-10 text-slate-300" strokeWidth={1.5} />
                                            </span>
                                            <p className="text-xl font-bold text-slate-700">ไม่พบประวัติการดำเนินการ</p>
                                        </td>
                                    </tr>
                                ) : (
                                    <AnimatePresence>
                                        {paginatedLogs.map((log, index) => (
                                            <motion.tr 
                                                key={`${log.log_id}-${index}`}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0 }}
                                                transition={{ delay: index * 0.05 }}
                                                className="group hover:bg-blue-50/20 transition-colors"
                                            >
                                                <td className="p-6 align-middle">
                                                    <div className="font-extrabold text-slate-700 text-sm group-hover:text-blue-700 transition-colors">{formatDateTh(log.created_at)}</div>
                                                    <div className="text-xs text-slate-400 mt-1 font-mono tracking-wide">{formatTimeTh(log.created_at)} น.</div>
                                                </td>
                                                <td className="p-6 align-middle">
                                                    <div className="font-bold text-slate-800 flex items-center gap-2">
                                                        <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 shrink-0"><User size={12}/></div>
                                                        <span className={log.operator_name?.includes("รหัสผู้ดำเนินการ") ? "font-mono text-slate-500 text-xs" : ""}>
                                                            {log.operator_name}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="p-6 text-center align-middle">
                                                    <ActionBadge action={log.action_type || "other"} />
                                                </td>
                                                <td className="p-6 align-middle">
                                                    <div className="font-medium text-slate-800 text-[13px]">{log.target_student_name}</div>
                                                    <div className="text-[11px] text-slate-400 font-mono tracking-wide mt-1 bg-slate-50 px-2 py-0.5 rounded w-fit border border-slate-100">ID: {log.target_student_id !== "-" ? log.target_student_id : `Form #${log.form_id}`}</div>
                                                </td>
                                                <td className="p-6 text-[13px] font-medium text-slate-600 leading-relaxed align-middle">
                                                    {log.detail_text}
                                                </td>
                                            </motion.tr>
                                        ))}
                                    </AnimatePresence>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination Footer */}
                    <div className="flex justify-between items-center p-5 border-t border-slate-100 bg-slate-50/80">
                        <div className="flex items-center gap-2">
                            <button 
                                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} 
                                disabled={currentPage === 1}
                                className="flex items-center justify-center p-2.5 rounded-xl bg-white border border-slate-200 text-slate-500 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
                            >
                                <ChevronLeft size={16} />
                            </button>
                            <span className="text-sm font-bold text-slate-600 px-5 py-2.5 bg-white rounded-xl border border-slate-200 shadow-sm">
                                หน้า {currentPage} / {Math.max(totalPages, 1)}
                            </span>
                            <button 
                                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} 
                                disabled={currentPage === totalPages || totalPages === 0}
                                className="flex items-center justify-center p-2.5 rounded-xl bg-white border border-slate-200 text-slate-500 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
                            >
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}