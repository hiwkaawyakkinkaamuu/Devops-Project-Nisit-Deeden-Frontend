"use client";

import { useState, useEffect, useMemo } from "react";
import { api } from "@/lib/axios"; // ✅ ใช้ api กลางเพื่อจัดการ Token และ CORS
import Swal from "sweetalert2";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";

// ==========================================
// 0. Configuration & Service Layer
// ==========================================

const USE_MOCK_DATA = false; // ✅ ปิด Mock เพื่อใช้ API จริง
const ITEMS_PER_PAGE = 6;
const CENTRAL_ID = 99;

// --- Role Options & Mapping ---
const ROLE_OPTIONS = [
  { value: "student", label: "นิสิต", style: "bg-gray-100 text-gray-600 border-gray-200" },
  { value: "head_of_department", label: "หัวหน้าภาควิชา", style: "bg-indigo-50 text-indigo-600 border-indigo-100" },
  { value: "associate_dean", label: "รองคณบดี", style: "bg-amber-50 text-amber-600 border-amber-100" },
  { value: "dean", label: "คณบดี", style: "bg-orange-50 text-orange-600 border-orange-100" },
  { value: "student_development", label: "กองพัฒนานิสิต", style: "bg-blue-50 text-blue-600 border-blue-100" },
  { value: "student_development_committee", label: "คณะกรรมการฯ", style: "bg-teal-50 text-teal-600 border-teal-100" },
  { value: "chairman_of_student_development_committee", label: "ประธานคณะกรรมการฯ", style: "bg-emerald-50 text-emerald-600 border-emerald-100" },
  { value: "organization", label: "หน่วยงานภายนอก", style: "bg-rose-50 text-rose-600 border-rose-100" }
];

// แปลง Role ID (Backend) เป็น Role Code (Frontend)
const mapRoleIdToCode = (id: number): string => {
  const map: Record<number, string> = {
    1: "student", 2: "head_of_department", 3: "associate_dean", 4: "dean",
    5: "student_development", 6: "student_development_committee", 
    7: "chairman_of_student_development_committee", 8: "chancellor", 9: "organization"
  };
  return map[id] || "student";
};

// แปลง Role Code (Frontend) เป็น Role ID (Backend)
const mapCodeToRoleId = (code: string): number => {
  const map: Record<string, number> = {
    "student": 1, "head_of_department": 2, "associate_dean": 3, "dean": 4,
    "student_development": 5, "student_development_committee": 6, 
    "chairman_of_student_development_committee": 7, "chancellor": 8, "organization": 9
  };
  return map[code] || 1;
};

// --- Hardcoded Faculties ---
const KU_FACULTIES = [
    {id: 1, name: "คณะวิศวกรรมศาสตร์", departments: [{ id: 101, name: "วิศวกรรมโยธา" }, { id: 102, name: "วิศวกรรมไฟฟ้า" }, { id: 105, name: "วิศวกรรมคอมพิวเตอร์" }]},
    {id: 2, name: "คณะวิทยาศาสตร์", departments: [{ id: 201, name: "คณิตศาสตร์" }, { id: 202, name: "เคมี" }, { id: 206, name: "วิทยาการคอมพิวเตอร์" }]},
    {id: 3, name: "คณะเกษตร", departments: [{ id: 301, name: "กีฏวิทยา" }, { id: 304, name: "พืชไร่" }]},
    {id: 4, name: "คณะบริหารธุรกิจ", departments: [{ id: 401, name: "การเงิน" }, { id: 402, name: "การจัดการ" }, { id: 403, name: "การตลาด" }]},
    {id: 5, name: "คณะมนุษยศาสตร์", departments: [{ id: 501, name: "ภาษาไทย" }, { id: 502, name: "ภาษาอังกฤษ" }]},
    {id: 99, name: "กองพัฒนานิสิต (ส่วนกลาง)", departments: [{ id: 9901, name: "งานบริการและสวัสดิการ" }, { id: 9902, name: "งานกิจกรรมนิสิต" }]}
];

// --- Interfaces ---
interface User {
  user_id: number;
  firstname: string;
  lastname: string;
  email: string;
  password?: string;
  role_code: string;
  student_number?: string;
  faculty_id?: number;
  department_id?: number;
  faculty_name?: string;
  department_name?: string;
  avatarColor?: string;
}

// --- Validation Schemas (Zod) ---
const UserSchema = z.object({
  firstname: z.string().min(1, "กรุณากรอกชื่อจริง"),
  lastname: z.string().min(1, "กรุณากรอกนามสกุล"),
  email: z.string().email("รูปแบบอีเมลไม่ถูกต้อง"),
  role_code: z.string(),
  password: z.string().optional(),
  student_number: z.string().optional(),
  faculty_id: z.number().min(1, "กรุณาเลือกสังกัด/คณะ"),
  department_id: z.number().optional(),
}).superRefine((data, ctx) => {
  if (data.role_code === 'student') {
    if (!data.student_number || !/^\d{10}$/.test(data.student_number)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "รหัสนิสิตต้องเป็นตัวเลข 10 หลัก", path: ["student_number"] });
    }
    if (!data.department_id) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "กรุณาเลือกสาขา", path: ["department_id"] });
    }
  }
  if (data.role_code === 'student_development' && data.faculty_id !== CENTRAL_ID) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "กองพัฒนานิสิต ต้องสังกัดส่วนกลางเท่านั้น", path: ["faculty_id"] });
  }
  if (data.role_code !== 'student_development' && data.faculty_id === CENTRAL_ID) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "ตำแหน่งนี้ไม่สามารถเลือกสังกัดส่วนกลางได้", path: ["faculty_id"] });
  }
});

// --- Service Layer (Connected to API) ---
const Toast = Swal.mixin({
    toast: true, position: 'top-end', showConfirmButton: false, timer: 3000, timerProgressBar: true
});

const userService = {
  getUsers: async (): Promise<User[]> => {
    try {
      const res = await api.get(`/users`);
      const usersData = res.data?.data || res.data || [];
      
      // ✅ แปลงข้อมูลจาก Backend ให้อยู่ในฟอร์แมตที่ Frontend ต้องการ
      return usersData.map((u: any) => ({
        user_id: u.user_id || u.UserID,
        firstname: u.firstname || u.Firstname || "ไม่มีชื่อ",
        lastname: u.lastname || u.Lastname || "",
        email: u.email || u.Email || "-",
        role_code: mapRoleIdToCode(u.role_id || u.RoleID),
        faculty_id: u.campus_id || u.CampusID || 1, // ใช้ campus_id เทียบเคียง faculty ชั่วคราว
        faculty_name: KU_FACULTIES.find(f => f.id === (u.campus_id || u.CampusID || 1))?.name || "ระบุไม่ได้",
        student_number: u.student_number || "",
        avatarColor: "bg-blue-500" // สุ่มสีได้ตามต้องการ
      }));
    } catch (error) {
      throw error;
    }
  },
  createUser: async (data: Partial<User>) => {
    // แปลง role_code กลับเป็น role_id ส่งให้ Backend
    const payload = { 
        ...data, 
        role_id: mapCodeToRoleId(data.role_code!),
        campus_id: data.faculty_id // ส่งค่า faculty เข้า campus_id 
    };
    
    // ⚠️ ปกติระบบหลังบ้านมักจะใช้ /auth/register ในการสร้าง User
    const res = await api.post(`/auth/register`, payload);
    return res.data;
  },
  updateUser: async (id: number, data: Partial<User>) => {
    const payload = { 
        ...data, 
        role_id: mapCodeToRoleId(data.role_code!),
        campus_id: data.faculty_id
    };
    // ลบ password ออกถ้าไม่มีการแก้
    if (!payload.password) delete payload.password;

    const res = await api.put(`/users/${id}`, payload);
    return res.data;
  },
  deleteUser: async (id: number) => {
    try {
        await api.delete(`/users/${id}`);
        return true;
    } catch (error: any) {
        // ดัก Error ว่าถ้าหลังบ้านยังไม่ทำ API Delete ให้แจ้งเตือนแทนหน้าพัง
        if (error.response?.status === 404) {
            throw new Error("ยังไม่มีระบบลบบัญชีในฝั่งหลังบ้าน (API Not Found)");
        }
        throw error;
    }
  }
};

// ==========================================
// 1. Helper Components
// ==========================================

const RoleBadge = ({ role }: { role: string }) => {
  const config = ROLE_OPTIONS.find(r => r.value === role) || { label: role, style: "bg-gray-100 text-gray-600 border-gray-200" };
  return <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border uppercase tracking-wide ${config.style}`}>{config.label}</span>;
};

// ==========================================
// 2. Main Page Component
// ==========================================

export default function StudentDevelopmentPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [formData, setFormData] = useState<Partial<User>>({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await userService.getUsers();
      setUsers(data);
    } catch (error) {
      Swal.fire({ icon: 'error', title: 'Error', text: 'ไม่สามารถโหลดข้อมูลผู้ใช้งานได้ อาจไม่มีสิทธิ์เข้าถึงหรือเกิดข้อผิดพลาด' });
    } finally {
      setLoading(false);
    }
  };

  // --- Handlers ---
  const handleOpenCreate = () => {
    setModalMode("create");
    setFormData({ role_code: "student", avatarColor: "bg-gray-400" });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (user: User) => {
    setModalMode("edit");
    setFormData({ ...user, password: "" }); // Clear password
    setIsModalOpen(true);
  };

  const handleRoleChange = (role: string) => {
      if (role === 'student_development') {
          setFormData(prev => ({ ...prev, role_code: role, faculty_id: CENTRAL_ID, department_id: undefined }));
      } else {
          setFormData(prev => ({ 
              ...prev, 
              role_code: role, 
              faculty_id: prev.faculty_id === CENTRAL_ID ? undefined : prev.faculty_id,
              department_id: undefined 
          }));
      }
  };

  const handleDelete = async (id: number, name: string) => {
    const result = await Swal.fire({
      title: 'ยืนยันการลบ?',
      html: `คุณต้องการลบบัญชีของ <b>${name}</b> ใช่หรือไม่?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'ลบข้อมูล',
      cancelButtonText: 'ยกเลิก',
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#e5e7eb',
    });

    if (result.isConfirmed) {
      try {
        await userService.deleteUser(id);
        setUsers(prev => prev.filter(u => u.user_id !== id));
        Toast.fire({ icon: 'success', title: 'ดำเนินการสำเร็จ', text: `ลบบัญชี ${name} เรียบร้อยแล้ว` });
      } catch (error: any) {
        Swal.fire({ icon: 'error', title: 'Error', text: error.message || 'ลบข้อมูลไม่สำเร็จ' });
      }
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Zod Validation
    const validation = UserSchema.safeParse(formData);
    if (!validation.success) {
      const errorMsg = validation.error.issues[0].message;
      Swal.fire({ icon: 'warning', title: 'ข้อมูลไม่ถูกต้อง', text: errorMsg, confirmButtonColor: '#F59E0B' });
      return;
    }

    setIsSaving(true);
    const fullName = `${formData.firstname} ${formData.lastname}`;

    try {
      const faculty = KU_FACULTIES.find(f => f.id === formData.faculty_id);
      const department = faculty?.departments.find(d => d.id === formData.department_id);
      
      const payload = { 
        ...formData, 
        faculty_name: faculty?.name || "", 
        department_name: department?.name || "" 
      };

      if (modalMode === 'create') {
        await userService.createUser(payload);
        Toast.fire({ icon: 'success', title: 'สร้างบัญชีสำเร็จ', text: `กรุณารีเฟรชหน้าเว็บเพื่อดูการเปลี่ยนแปลง` });
      } else {
        await userService.updateUser(formData.user_id!, payload);
        Toast.fire({ icon: 'success', title: 'แก้ไขสำเร็จ', text: `ข้อมูลบัญชี ${fullName} อัปเดตแล้ว` });
      }

      setIsModalOpen(false);
      fetchData(); // รีโหลดข้อมูลใหม่

    } catch (error: any) {
      console.error(error);
      const errText = error.response?.data?.error || 'เกิดข้อผิดพลาดในการบันทึก กรุณาตรวจสอบ Console';
      Swal.fire({ icon: 'error', title: 'บันทึกไม่สำเร็จ', text: errText });
    } finally {
      setIsSaving(false);
    }
  };

  // --- Filter & Pagination ---
  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      const fullSearch = `${u.firstname} ${u.lastname} ${u.email} ${u.student_number || ''}`.toLowerCase();
      const matchSearch = fullSearch.includes(searchTerm.toLowerCase());
      const matchRole = filterRole === 'all' ? true : u.role_code === filterRole;
      return matchSearch && matchRole;
    });
  }, [users, searchTerm, filterRole]);

  const totalPages = Math.ceil(filteredUsers.length / ITEMS_PER_PAGE);
  const paginatedUsers = filteredUsers.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  // ==========================================
  // 3. Render UI
  // ==========================================

  return (
    <div className="min-h-screen bg-[#F0F2F5] p-8 pb-32 font-sans text-gray-800">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
        <div>
          <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">จัดการผู้ใช้งาน</h1>
          <p className="text-gray-500 mt-2 font-medium">บริหารจัดการบัญชี กำหนดสิทธิ์ และหน่วยงาน</p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="bg-gray-900 hover:bg-black text-white px-6 py-3.5 rounded-2xl font-bold shadow-xl hover:shadow-2xl transition-all flex items-center gap-3 active:scale-95 border border-gray-800 transform hover:-translate-y-1"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
          สร้างบัญชีใหม่
        </button>
      </div>

      {/* Main Content */}
      <div className="space-y-6">
        
        {/* Filters */}
        <div className="bg-white rounded-3xl p-2 shadow-sm border border-gray-100 flex flex-col md:flex-row gap-2">
            <div className="relative flex-1">
                <input 
                    type="text" 
                    placeholder="ค้นหาชื่อ, อีเมล, รหัสนิสิต..." 
                    className="w-full pl-12 pr-4 py-3.5 bg-gray-50 hover:bg-gray-100 focus:bg-white border border-transparent focus:border-blue-200 rounded-2xl text-sm font-medium focus:ring-4 focus:ring-blue-50 outline-none transition-all placeholder:text-gray-400"
                    value={searchTerm}
                    onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                />
                <svg className="w-5 h-5 absolute left-4 top-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </div>
            <div className="relative w-full md:w-64">
                <select 
                    className="w-full px-4 pl-4 pr-10 py-3.5 bg-gray-50 hover:bg-gray-100 focus:bg-white border border-transparent focus:border-blue-200 rounded-2xl text-sm font-bold text-gray-600 outline-none focus:ring-4 focus:ring-blue-50 cursor-pointer appearance-none transition-all"
                    value={filterRole}
                    onChange={e => { setFilterRole(e.target.value); setCurrentPage(1); }}
                >
                    <option value="all">ทุกตำแหน่ง</option>
                    {ROLE_OPTIONS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
                <svg className="w-4 h-4 absolute right-4 top-4 text-gray-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
            </div>
        </div>

        {/* User Grid */}
        <div className="grid gap-4">
            {loading ? (
                [...Array(3)].map((_, i) => (
                    <div key={i} className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex items-center gap-6 animate-pulse">
                        <div className="w-14 h-14 bg-gray-100 rounded-full shrink-0"></div>
                        <div className="flex-1 space-y-3">
                            <div className="w-1/3 h-4 bg-gray-100 rounded-lg"></div>
                            <div className="w-1/4 h-3 bg-gray-50 rounded-lg"></div>
                        </div>
                    </div>
                ))
            ) : paginatedUsers.length === 0 ? (
                <div className="bg-white rounded-3xl p-16 text-center shadow-sm border border-dashed border-gray-200 text-gray-400 font-medium">
                    ไม่พบข้อมูลผู้ใช้งาน
                </div>
            ) : (
                <AnimatePresence>
                    {paginatedUsers.map((user, index) => (
                        <motion.div 
                            key={user.user_id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="group bg-white rounded-3xl p-5 shadow-[0_2px_12px_rgba(0,0,0,0.03)] border border-gray-100 hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] hover:border-blue-100 transition-all duration-300 flex flex-col md:flex-row md:items-center gap-6"
                        >
                            {/* Avatar & Name */}
                            <div className="flex items-center gap-5 flex-1 min-w-0">
                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-xl text-white font-bold shadow-lg shadow-gray-200 transform group-hover:scale-105 transition-transform ${user.avatarColor || 'bg-gray-400'}`}>
                                    {user.firstname.charAt(0).toUpperCase()}
                                </div>
                                <div className="min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <h3 className="font-bold text-gray-800 text-lg truncate">{user.firstname} {user.lastname}</h3>
                                        {user.role_code === 'student' && user.student_number && (
                                            <span className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-md font-mono border border-gray-200">
                                                {user.student_number}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-sm text-gray-400 font-medium flex items-center gap-1.5 truncate">
                                        {user.email}
                                    </p>
                                </div>
                            </div>

                            {/* Role & Org */}
                            <div className="flex-1 md:border-l md:border-gray-50 md:pl-6 min-w-0">
                                <div className="flex flex-col items-start gap-1.5">
                                    <RoleBadge role={user.role_code} />
                                    <div className="text-xs text-gray-500 font-medium truncate w-full">
                                        {user.faculty_name}
                                        {user.department_name && <span className="text-gray-300 mx-1">/</span>}
                                        {user.department_name}
                                    </div>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-2 pt-4 md:pt-0 border-t md:border-t-0 border-gray-50 justify-end">
                                <button onClick={() => handleOpenEdit(user)} className="p-2.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all active:scale-95">
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                </button>
                                <button onClick={() => handleDelete(user.user_id, `${user.firstname} ${user.lastname}`)} className="p-2.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all active:scale-95">
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                </button>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            )}
        </div>

        {/* Pagination */}
        <div className="flex justify-center items-center gap-4 pt-4">
            <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1} className="w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-50 transition-all shadow-sm">
                &lt;
            </button>
            <span className="text-sm font-bold text-gray-600">หน้า {currentPage} / {Math.max(totalPages, 1)}</span>
            <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages || totalPages === 0} className="w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-50 transition-all shadow-sm">
                &gt;
            </button>
        </div>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-gray-900/30 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
            <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} className="relative bg-white w-full max-w-lg h-auto max-h-[90vh] rounded-[32px] shadow-2xl flex flex-col overflow-hidden">
                
                {/* Modal Header */}
                <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-white/80 backdrop-blur-md z-10 sticky top-0">
                    <div>
                        <h3 className="text-xl font-extrabold text-gray-900">{modalMode === 'create' ? 'สร้างบัญชีใหม่' : 'แก้ไขข้อมูล'}</h3>
                        <p className="text-xs text-gray-400 font-medium mt-0.5">กรอกข้อมูลให้ครบถ้วนเพื่อบันทึก</p>
                    </div>
                    <button onClick={() => setIsModalOpen(false)} className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                {/* Form Body */}
                <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar">
                    <div className="grid grid-cols-2 gap-5">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-wide">ชื่อจริง <span className="text-red-500">*</span></label>
                            <input type="text" className="w-full bg-gray-50 hover:bg-white focus:bg-white border border-transparent focus:border-blue-200 rounded-2xl px-4 py-3 text-sm focus:ring-4 focus:ring-blue-50 outline-none transition-all font-medium" value={formData.firstname || ''} onChange={e => setFormData({...formData, firstname: e.target.value})} />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-wide">นามสกุล <span className="text-red-500">*</span></label>
                            <input type="text" className="w-full bg-gray-50 hover:bg-white focus:bg-white border border-transparent focus:border-blue-200 rounded-2xl px-4 py-3 text-sm focus:ring-4 focus:ring-blue-50 outline-none transition-all font-medium" value={formData.lastname || ''} onChange={e => setFormData({...formData, lastname: e.target.value})} />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wide">ตำแหน่ง <span className="text-red-500">*</span></label>
                        <select 
                            className="w-full bg-gray-50 hover:bg-white focus:bg-white border border-transparent focus:border-blue-200 rounded-2xl px-4 py-3 text-sm focus:ring-4 focus:ring-blue-50 outline-none transition-all font-bold text-gray-700 cursor-pointer"
                            value={formData.role_code} 
                            onChange={e => handleRoleChange(e.target.value)}
                        >
                            {ROLE_OPTIONS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                        </select>
                    </div>

                    {formData.role_code === 'student' && (
                        <div className="space-y-2 animate-fade-in-up">
                            <label className="text-xs font-bold text-blue-600 uppercase tracking-wide">รหัสนิสิต <span className="text-red-500">*</span></label>
                            <input type="text" maxLength={10} className="w-full bg-blue-50/50 border border-blue-100 rounded-2xl px-4 py-3 text-sm focus:ring-4 focus:ring-blue-50 focus:border-blue-300 outline-none font-mono text-blue-800 font-bold placeholder-blue-300/70" value={formData.student_number || ''} onChange={e => setFormData({...formData, student_number: e.target.value.replace(/\D/g, "")})} placeholder="6xxxxxxxxxx" />
                        </div>
                    )}

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wide">อีเมล <span className="text-red-500">*</span></label>
                        <input type="email" className="w-full bg-gray-50 hover:bg-white focus:bg-white border border-transparent focus:border-blue-200 rounded-2xl px-4 py-3 text-sm focus:ring-4 focus:ring-blue-50 outline-none transition-all" value={formData.email || ''} onChange={e => setFormData({...formData, email: e.target.value})} />
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wide">รหัสผ่าน {modalMode === 'create' && <span className="text-red-500">*</span>}</label>
                        <input type="password" className="w-full bg-gray-50 hover:bg-white focus:bg-white border border-transparent focus:border-blue-200 rounded-2xl px-4 py-3 text-sm focus:ring-4 focus:ring-blue-50 outline-none transition-all" value={formData.password || ''} onChange={e => setFormData({...formData, password: e.target.value})} placeholder={modalMode === 'edit' ? "เว้นว่างไว้หากไม่ต้องการเปลี่ยน" : "กำหนดรหัสผ่าน"} />
                    </div>

                    <div className="pt-6 border-t border-gray-100 grid grid-cols-2 gap-5">
                        <div className="space-y-2 col-span-2">
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-wide">สังกัด / คณะ <span className="text-red-500">*</span></label>
                            <select 
                                className="w-full bg-gray-50 hover:bg-white focus:bg-white border border-transparent focus:border-blue-200 rounded-2xl px-4 py-3 text-sm focus:ring-4 focus:ring-blue-50 outline-none transition-all cursor-pointer disabled:bg-gray-100 disabled:text-gray-400" 
                                value={formData.faculty_id || ''} 
                                onChange={e => setFormData({...formData, faculty_id: Number(e.target.value), department_id: undefined})}
                                disabled={formData.role_code === 'student_development'}
                            >
                                <option value="">-- เลือกคณะ --</option>
                                {KU_FACULTIES.map(f => (
                                    <option key={f.id} value={f.id} disabled={formData.role_code !== 'student_development' && f.id === CENTRAL_ID}>
                                        {f.name}
                                    </option>
                                ))}
                            </select>
                            {formData.role_code === 'student_development' && <p className="text-[10px] text-blue-500 font-medium pl-1">* กองพัฒนานิสิต ต้องเลือกส่วนกลางเท่านั้น</p>}
                        </div>
                        {formData.role_code !== 'student_development' && (
                            <div className="space-y-2 col-span-2 animate-fade-in-up">
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-wide">ภาควิชา / หน่วยงาน</label>
                                <select className="w-full bg-gray-50 hover:bg-white focus:bg-white border border-transparent focus:border-blue-200 rounded-2xl px-4 py-3 text-sm focus:ring-4 focus:ring-blue-50 outline-none transition-all cursor-pointer disabled:bg-gray-100 disabled:text-gray-400" value={formData.department_id || ''} onChange={e => setFormData({...formData, department_id: Number(e.target.value)})} disabled={!formData.faculty_id}>
                                    <option value="">-- เลือกสาขา --</option>
                                    {KU_FACULTIES.find(f => f.id === formData.faculty_id)?.departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                                </select>
                            </div>
                        )}
                    </div>
                </form>

                {/* Footer Actions */}
                <div className="p-6 border-t border-gray-100 bg-white flex justify-end gap-3 z-10 sticky bottom-0">
                    <button onClick={() => setIsModalOpen(false)} className="px-6 py-3 text-sm font-bold text-gray-500 bg-white border border-gray-200 rounded-2xl hover:bg-gray-50 transition-colors shadow-sm">ยกเลิก</button>
                    <button onClick={handleSave} disabled={isSaving} className="px-8 py-3 text-sm font-bold text-white bg-gray-900 rounded-2xl shadow-xl hover:shadow-2xl hover:bg-black transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2">
                        {isSaving ? 'กำลังบันทึก...' : 'บันทึกข้อมูล'}
                    </button>
                </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}