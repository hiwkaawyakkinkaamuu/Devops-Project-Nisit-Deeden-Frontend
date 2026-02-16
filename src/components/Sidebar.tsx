"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode, useState, useEffect } from "react";
import Swal from "sweetalert2";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/context/AuthContext";

// ==========================================
// 1. Interfaces & Types
// ==========================================

type UserRole = "student" | "head_of_department" | "dean" | "associate_dean" | "chairman_of_student_development_committee" | "student_development_committee" | "student_development" | "admin";

interface UserProfileData {
  user_id: number;
  firstname: string;
  lastname: string;
  email: string;
  role_id: number;
  campus_id: number;
  image_path?: string;
  // รองรับโครงสร้างข้อมูลจาก Backend (อาจเป็น Student, student หรือ student_data)
  Student?: any;
  student?: any;
  student_data?: any;
}

interface MenuItemType {
  href: string;
  label: string;
  icon: ReactNode;
  isAction?: boolean;
}

interface SidebarProps {
  isCollapsed: boolean;
  toggleSidebar: () => void;
}

// ==========================================
// 2. Constants & Helpers
// ==========================================

const getRoleKey = (roleId: number | undefined): UserRole => {
  switch (roleId) {
    case 1: return "student";
    case 2: return "head_of_department";
    case 3: return "dean";
    case 4: return "associate_dean";
    case 5: return "student_development";
    case 6: return "student_development_committee";
    case 7: return "chairman_of_student_development_committee";
    default: return "student";
  }
};

const getCampusName = (campusId: number | undefined) => {
    switch (campusId) {
        case 1: return "วิทยาเขตบางเขน";
        case 2: return "วิทยาเขตกำแพงแสน";
        case 3: return "วิทยาเขตศรีราชา";
        case 4: return "วิทยาเขตเฉลิมพระเกียรติ จ.สกลนคร";
        case 5: return "โครงการจัดตั้งวิทยาเขตสุพรรณบุรี";
        default: return "ไม่ระบุวิทยาเขต";
    }
};

const Icons = {
    CheckUser: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
    History: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>,
    Badge: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 01-3.138-3.138z" /></svg>,
    Track: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
    Edit: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>,
    User: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0c0 .884-.5 2-2 2h4c-1.5 0-2-1.116-2-2z" /></svg>,
    DocumentCheck: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>,
    UsersGroup: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>,
    Menu: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" /></svg>,
    MenuClose: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>,
    Logout: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>,
    Close: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>,
    School: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>,
    BookOpen: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
};

const MENU_CONFIG: Record<string, MenuItemType[]> = {
  student: [
    { href: "/student/main/student-nomination-form", label: "เสนอรายชื่อนิสิตดีเด่น", icon: Icons.Badge },
    { href: "/student/main/trace-nomination", label: "ติดตามสถานะ", icon: Icons.Track },
    { href: "/student/main/nomination-history", label: "ประวัติการเสนอ", icon: Icons.History },
  ],
  head_of_department: [
    { href: "/head-of-department/consider", label: "อนุมัติเห็นชอบ/ไม่ชอบ", icon: Icons.CheckUser },
    { href: "/head-of-department/consider-history", label: "ประวัติการพิจารณา", icon: Icons.History },
  ],
  dean: [
    { href: "/dean/consider", label: "อนุมัติเห็นชอบ/ไม่ชอบ", icon: Icons.CheckUser },
    { href: "/dean/consider-history", label: "ประวัติการพิจารณา", icon: Icons.History },
  ],
  associate_dean: [
    { href: "/associate-dean/consider", label: "อนุมัติเห็นชอบ/ไม่ชอบ", icon: Icons.CheckUser },
    { href: "/associate-dean/consider-history", label: "ประวัติการพิจารณา", icon: Icons.History },
  ],
  chairman_of_student_development_committee: [
    { href: "/chairman-of-student-development-committee/consider", label: "รับรองผลการคัดเลือก", icon: Icons.CheckUser }
  ],
  student_development_committee: [
    { href: "/student-development-committee/consider", label: "อนุมัติเห็นชอบ/ไม่ชอบ", icon: Icons.CheckUser },
    { href: "/student-development-committee/consider-history", label: "ประวัติการพิจารณา", icon: Icons.History }
  ],
  student_development: [
    { href: "/student-development/verify-submit", label: "ตรวจสอบความถูกต้อง", icon: Icons.DocumentCheck },
    { href: "/student-development/history-verify-submit", label: "ประวัติการเเก้ไขประเภท", icon: Icons.History },
    { href: "/student-development/committee-setup", label: "จัดการคณะกรรมการ", icon: Icons.UsersGroup },
    { href: "/student-development/manage-account", label: "จัดการบัญชีผู้ใช้", icon: Icons.DocumentCheck },
    { href: "/student-development/master-data", label: "จัดการคณะเเละสาขา", icon: Icons.UsersGroup },
    { href: "/student-development/setting", label: "ตั้งค่าช่วงเวลารับสมัคร", icon: Icons.History },
  ]
};

// ==========================================
// 3. Sub-Components (Enhanced Design)
// ==========================================

function MenuItem({ href, label, icon, active, collapsed, onClick, index }: any) {
  return (
    <Link href={href} onClick={onClick} className="relative block mb-1">
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: index * 0.05, duration: 0.3 }}
        className={`
            group flex items-center px-3 py-3 rounded-2xl text-sm font-medium transition-all duration-300 cursor-pointer overflow-hidden relative
            ${active 
                ? 'text-emerald-700 font-bold' 
                : 'text-gray-500 hover:text-emerald-700 hover:bg-emerald-50/50'
            }
            ${collapsed ? 'justify-center' : 'gap-3'}
        `}
        title={collapsed ? label : ""}
      >
        {/* Active Indicator Background (Floating Effect) */}
        {active && (
          <motion.div
            layoutId="active-menu-bg"
            className="absolute inset-0 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl border border-emerald-100/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          />
        )}

        {/* Active Left Pill */}
        {active && (
            <motion.div 
                layoutId="active-pill"
                className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-emerald-500 rounded-r-full"
            />
        )}

        {/* Icon with Hover Effect */}
        <span className={`relative z-10 shrink-0 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3 ${active ? 'text-emerald-600' : 'text-gray-400 group-hover:text-emerald-600'}`}>
          {icon}
        </span>

        {/* Label */}
        {!collapsed && (
          <span className="relative z-10 truncate tracking-wide">{label}</span>
        )}
      </motion.div>
    </Link>
  )
}

const ProfileSkeleton = ({ isCollapsed }: { isCollapsed: boolean }) => (
  <div className={`flex items-center gap-3 animate-pulse ${isCollapsed ? 'justify-center' : 'w-full'}`}>
    <div className="w-10 h-10 bg-gray-200 rounded-full shrink-0"></div>
    {!isCollapsed && (
      <div className="flex-1 space-y-2 min-w-0">
        <div className="h-3 bg-gray-200 rounded w-2/3"></div>
        <div className="h-2 bg-gray-200 rounded w-1/2"></div>
      </div>
    )}
  </div>
);

// Profile Modal: แสดงข้อมูลครบถ้วน
function ProfileModal({ isOpen, onClose, data }: { isOpen: boolean; onClose: () => void; data: UserProfileData | null }) {
  if (!isOpen || !data) return null;

  const roleName = getRoleKey(data.role_id).replace(/_/g, ' ').toUpperCase();
  const campusName = getCampusName(data.campus_id);

  // ดึงข้อมูลนิสิต (รองรับหลาย Case ที่ Backend อาจส่งมา)
  const student = data.Student || data.student || data.student_data;
  const studentNumber = student?.student_number;
  // ดึงชื่อคณะ/สาขา (รองรับทั้ง Object และ String)
  const facultyName = student?.Faculty?.faculty_name || student?.faculty?.faculty_name || student?.faculty_id;
  const departmentName = student?.Department?.department_name || student?.department?.department_name || student?.department_id;

  return (
    <AnimatePresence>
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop Blur */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-slate-900/30 backdrop-blur-md"
                onClick={onClose}
            />
            
            {/* Modal Card */}
            <motion.div
                initial={{ scale: 0.85, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                transition={{ type: "spring", stiffness: 350, damping: 25 }}
                className="relative bg-white rounded-[32px] shadow-2xl w-full max-w-sm overflow-hidden z-10 border border-white/50"
            >
                {/* Header with Pattern */}
                <div className="h-32 bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-full opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
                    <button 
                        onClick={onClose} 
                        className="absolute top-4 right-4 p-2 bg-white/20 hover:bg-white/40 text-white rounded-full transition-all backdrop-blur-sm"
                    >
                        {Icons.Close}
                    </button>
                </div>

                <div className="px-8 pb-8 relative">
                    {/* Avatar with Ring */}
                    <div className="-mt-14 mb-5 flex justify-center">
                        <div className="w-28 h-28 rounded-full p-1.5 bg-white shadow-xl">
                            <div className="w-full h-full rounded-full bg-gray-50 overflow-hidden relative border border-gray-100">
                                {data.image_path ? (
                                    <img src={data.image_path} alt="Profile" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-emerald-50 text-emerald-600 text-4xl font-bold">
                                        {data.firstname ? data.firstname.charAt(0) : "U"}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                    
                    {/* Main Info */}
                    <div className="text-center mb-8">
                        <h2 className="text-2xl font-extrabold text-gray-800 tracking-tight">{data.firstname} {data.lastname}</h2>
                        <div className="flex justify-center gap-2 mt-2">
                            <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full">
                                {roleName}
                            </span>
                        </div>
                        <p className="mt-3 text-sm text-gray-500 font-medium">{campusName}</p>
                    </div>

                    {/* Info Card List */}
                    <div className="space-y-3">
                        {/* Email */}
                        <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-2xl border border-gray-100 hover:border-emerald-100 transition-colors">
                            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-emerald-500 shadow-sm border border-gray-100 shrink-0">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
                            </div>
                            <div className="overflow-hidden">
                                <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wide">อีเมลมหาวิทยาลัย</p>
                                <p className="text-sm text-gray-800 font-bold truncate">{data.email}</p>
                            </div>
                        </div>
                        
                        {/* Student ID */}
                        {studentNumber && (
                            <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-2xl border border-gray-100 hover:border-emerald-100 transition-colors">
                                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-emerald-500 shadow-sm border border-gray-100 shrink-0">
                                    {Icons.User}
                                </div>
                                <div className="overflow-hidden">
                                    <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wide">รหัสนิสิต</p>
                                    <p className="text-sm text-gray-800 font-mono font-bold tracking-wider">{studentNumber}</p>
                                </div>
                            </div>
                        )}

                        {/* Faculty */}
                        {facultyName && (
                            <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-2xl border border-gray-100 hover:border-emerald-100 transition-colors">
                                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-emerald-500 shadow-sm border border-gray-100 shrink-0">
                                    {Icons.School}
                                </div>
                                <div className="overflow-hidden">
                                    <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wide">คณะ</p>
                                    <p className="text-sm text-gray-800 font-bold truncate">{facultyName}</p>
                                </div>
                            </div>
                        )}

                        {/* Department */}
                        {departmentName && (
                            <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-2xl border border-gray-100 hover:border-emerald-100 transition-colors">
                                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-emerald-500 shadow-sm border border-gray-100 shrink-0">
                                    {Icons.BookOpen}
                                </div>
                                <div className="overflow-hidden">
                                    <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wide">สาขาวิชา</p>
                                    <p className="text-sm text-gray-800 font-bold truncate">{departmentName}</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </motion.div>
        </div>
    </AnimatePresence>
  );
}

// ==========================================
// 4. Main Sidebar Component
// ==========================================

export default function Sidebar({ isCollapsed, toggleSidebar }: SidebarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [fullProfile, setFullProfile] = useState<UserProfileData | null>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // คำนวณ Role และเมนู
  const roleKey = getRoleKey(user?.role_id);
  const menuItems = MENU_CONFIG[roleKey] || [];

  const isActive = (path: string) => {
    return pathname === path || (path !== "/" && pathname.startsWith(path));
  };

  // Fetch Full Profile
  useEffect(() => {
    const fetchFullProfile = async () => {
        if (!user) return;
        
        setLoading(true);
        try {
            const token = localStorage.getItem("token");
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || "/api";
            
            const response = await axios.get(`${apiUrl}/auth/me`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if(response.data && response.data.user) {
                setFullProfile(response.data.user);
            }
        } catch (error) {
            console.error("Failed to fetch full profile:", error);
            // @ts-ignore
            setFullProfile(user); 
        } finally {
            setLoading(false);
        }
    };

    fetchFullProfile();
  }, [user]);

  const confirmLogout = () => {
    Swal.fire({
      title: 'ยืนยันการออกจากระบบ?',
      text: "คุณต้องการออกจากระบบใช่หรือไม่",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#afafaf',
      confirmButtonText: 'ออกจากระบบ',
      cancelButtonText: 'ยกเลิก',
      customClass: {
         popup: 'rounded-3xl shadow-2xl font-sans',
         title: 'text-xl font-bold text-gray-800',
         confirmButton: 'rounded-xl px-6 py-3 font-bold shadow-lg shadow-red-200 hover:shadow-red-300 transition-all',
         cancelButton: 'rounded-xl px-6 py-3 font-bold text-gray-600 hover:bg-gray-200 transition-all'
      }
    }).then((result) => {
      if (result.isConfirmed) {
        logout();
      }
    });
  };

  return (
    <>
      <ProfileModal isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} data={fullProfile} />

      <motion.aside
        initial={false}
        animate={{ width: isCollapsed ? 90 : 280 }}
        transition={{ type: "spring", stiffness: 300, damping: 30, mass: 0.8 }}
        className="bg-white h-screen fixed left-0 top-0 flex flex-col z-50 border-r border-gray-100 shadow-[4px_0_40px_rgba(0,0,0,0.03)] overflow-hidden"
      >
        {/* Header Section */}
        <div className="h-[90px] flex items-center justify-between px-6 shrink-0 relative bg-gradient-to-b from-white to-gray-50/50">
          <AnimatePresence>
            {!isCollapsed && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10, transition: { duration: 0.1 } }}
                className="flex items-center gap-3 overflow-hidden whitespace-nowrap"
              >
                {/* Logo Icon */}
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shrink-0 shadow-lg shadow-emerald-200">
                   <svg width="24" height="24" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M20 0L37.3205 10V30L20 40L2.67949 30V10L20 0Z" fill="white" fillOpacity="0.2"/>
                      <path d="M20 5L32.9904 12.5V27.5L20 35L7.00962 27.5V12.5L20 5Z" fill="white"/>
                   </svg>
                </div>
                <div>
                   <h1 className="font-black text-base text-gray-800 tracking-tight leading-none">ระบบนิสิตดีเด่น</h1>
                   <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider">มหาวิทยาลัยเกษตรศาสตร์</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <button
            onClick={toggleSidebar}
            className={`p-2.5 rounded-xl text-gray-400 hover:bg-white hover:text-emerald-600 hover:shadow-md transition-all absolute ${isCollapsed ? 'left-1/2 -translate-x-1/2' : 'right-4'}`}
          >
            {isCollapsed ? Icons.Menu : Icons.MenuClose}
          </button>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto custom-scrollbar">
          {menuItems.map((item, index) => (
            <MenuItem
              key={item.href}
              index={index}
              href={item.href}
              label={item.label}
              active={isActive(item.href)}
              icon={item.icon}
              collapsed={isCollapsed}
              onClick={item.isAction ? (e: any) => { e.preventDefault(); setIsProfileOpen(true); } : undefined}
            />
          ))}
        </nav>

        {/* User Profile Footer */}
        <div className="p-5 border-t border-gray-100 bg-gray-50/30 z-10 shrink-0">
          <div
            onClick={() => !loading && setIsProfileOpen(true)}
            className={`
                group relative flex items-center rounded-2xl cursor-pointer transition-all duration-300 border
                ${isCollapsed 
                    ? 'justify-center p-3 bg-white border-gray-200 hover:border-emerald-300' 
                    : 'p-3 bg-white border-gray-200 hover:border-emerald-200 hover:shadow-lg hover:shadow-emerald-100/50 hover:-translate-y-1'
                }
            `}
          >
            {loading ? (
              <ProfileSkeleton isCollapsed={isCollapsed} />
            ) : (
              <>
                <div className="relative shrink-0">
                   <div className="w-10 h-10 rounded-full p-[2px] bg-gradient-to-br from-emerald-400 to-cyan-500 shadow-sm">
                      <div className="w-full h-full rounded-full bg-white flex items-center justify-center overflow-hidden">
                          {fullProfile?.image_path ? (
                              <img src={fullProfile.image_path} alt="User" className="w-full h-full object-cover" />
                          ) : (
                              <span className="text-sm font-black text-transparent bg-clip-text bg-gradient-to-br from-emerald-500 to-cyan-600">
                                {fullProfile?.firstname?.charAt(0) || 'U'}
                              </span>
                          )}
                      </div>
                   </div>
                   <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                </div>

                {!isCollapsed && (
                  <motion.div 
                    initial={{ opacity: 0, width: 0 }} 
                    animate={{ opacity: 1, width: "auto" }} 
                    className="ml-3 flex-1 min-w-0"
                  >
                    <p className="text-sm font-bold text-gray-700 truncate group-hover:text-emerald-700 transition-colors">
                      {fullProfile?.firstname} {fullProfile?.lastname}
                    </p>
                    <p className="text-[10px] text-gray-400 truncate font-bold uppercase tracking-wider">
                      {roleKey.replace(/_/g, ' ')}
                    </p>
                  </motion.div>
                )}

                {!isCollapsed && (
                   <button 
                      onClick={(e) => { e.stopPropagation(); confirmLogout(); }}
                      className="ml-1 p-2 rounded-xl text-gray-300 hover:bg-red-50 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100"
                      title="ออกจากระบบ"
                   >
                     {Icons.Logout}
                   </button>
                )}
              </>
            )}
          </div>
        </div>
      </motion.aside>
    </>
  );
}