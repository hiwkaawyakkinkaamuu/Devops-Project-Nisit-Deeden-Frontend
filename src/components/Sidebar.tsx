"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";

// รวมไอคอนทั้งหมด
const Icons = {
  CheckUser: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
  ),
  History: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
  ),
  // ไอคอนนิสิต
  Badge: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138z" /></svg>
  ),
  Track: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
  ),
  Edit: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
  ),
  User: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0c0 .884-.5 2-2 2h4c-1.5 0-2-1.116-2-2z" /></svg>
  ),
  DocumentCheck: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
  ),
  UsersGroup: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
  )
};

// Config เมนู
type UserRole = "student" | "head_of_department" | "dean" | "associate_dean" | "chairman_of_student_development_committee" | "student_development_committee" | "student_development"; 

interface MenuItemType {
  href: string;
  label: string;
  icon: ReactNode;
}

const MENU_CONFIG: Record<UserRole, MenuItemType[]> = {
  student: [
    { href: "/student/student-nomination-form", label: "เสนอรายชื่อนิสิตดีเด่น", icon: Icons.Badge },
    { href: "/student/trace-nomination", label: "ติดตามสถานะ", icon: Icons.Track },
    { href: "/student/edit-student-nomination-form", label: "แก้ไขข้อมูลการเสนอ", icon: Icons.Edit },
    { href: "/student/profile", label: "โปรไฟล์ผู้ใช้", icon: Icons.User },
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
    { href: "/student-development-committee/consider", label: "อนุมัติเห็นชอบ/ไม่ชอบ", icon: Icons.CheckUser }
  ],

  student_development: [
    { href: "/student-development/verify-submit", label: "ตรวจสอบความถูกต้องและส่งรายชื่อ", icon: Icons.DocumentCheck },
    { href: "/student-development/committee-setup", label: "ตั้งค่าและจัดการคณะกรรมการ", icon: Icons.UsersGroup },
    { href: "/student-development/history-verify-submit", label: "ประวัติการเเก้ไขประเภท", icon: Icons.History },
    { href: "/student-development/manage-account", label: "จัดการบัญชีผู้ใช้", icon: Icons.DocumentCheck },
    { href: "/student-development/master-data", label: "จัดการคณะเเละสาขาวิชา", icon: Icons.UsersGroup },
    { href: "/student-development/setting", label: "ตั้งค่าและจัดการเวลาเปิด-ปิด", icon: Icons.History },
  ],

};

// Component Sidebar หลัก
export default function Sidebar({ role = "student" }: { role?: UserRole }) {
  const pathname = usePathname();
  const menuItems = MENU_CONFIG[role] || [];

  const isActive = (path: string) => {
      if (path === "/" && pathname !== "/") return false;
      return pathname === path || pathname.startsWith(path + "/");
  };

  return (
    <aside className="w-[300px] bg-white h-screen fixed left-0 top-0 flex flex-col z-30 border-r border-gray-100 shadow-[0_0_15px_rgba(0,0,0,0.05)] font-sans">
      
      {/* Logo */}
      <div className="p-6 pb-4">
          <div className="flex items-center gap-3">
              <div className="text-green-600"> 
                  <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M20 0L37.3205 10V30L20 40L2.67949 30V10L20 0Z" fill="#22C55E" fillOpacity="0.2"/>
                      <path d="M20 5L32.9904 12.5V27.5L20 35L7.00962 27.5V12.5L20 5Z" fill="#22C55E"/>
                      <text x="50%" y="54%" dominantBaseline="middle" textAnchor="middle" fill="white" fontSize="9" fontWeight="bold">NDD</text>
                  </svg>
              </div>
              <div>
                  <h1 className="font-bold text-base text-gray-800 leading-tight">ระบบนิสิตดีเด่น</h1>
                  <p className="text-[11px] text-gray-400 mt-0.5 capitalize">
                    {role === 'student' ? 'Student Portal' : 
                    role === 'head_of_department' ? 'Head of Department' : role === 'associate_dean' ? 'Associate Dean' : role === 'student_development' ? 'Student Development Division' : role === 'dean' ? 'Dean of Faculty' : role === 'chairman_of_student_development_committee' ? 'Committee Chairperson' : role === 'student_development_committee' ? 'Selection Committee' : role}
                  </p>
              </div>
          </div>
      </div>

      {/* Menu Items */}
      <nav className="flex-1 px-4 space-y-1.5 mt-2">
          {menuItems.map((item, index) => (
              <MenuItem 
                  key={index}
                  href={item.href} 
                  label={item.label} 
                  active={isActive(item.href)} 
                  icon={item.icon} 
              />
          ))}
      </nav>

      {/* User Profile */}
      <div className="p-4 mt-auto border-t border-gray-50">
          <div className="bg-gray-50 rounded-xl p-3 flex items-center gap-3 border border-transparent hover:border-gray-200 hover:shadow-sm transition-all cursor-pointer group">
              <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-gray-400 overflow-hidden group-hover:bg-white transition-all shadow-sm">
                   <svg className="w-12 h-12 -mt-2" fill="currentColor" viewBox="0 0 24 24"><path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
              </div>
              <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-900 truncate">ชื่อ นามสกุล</p>
                  <p className="text-[11px] text-gray-500 capitalize">{role}</p>
              </div>

              <Link href="/" className="text-gray-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 transition-all" title="ออกจากระบบ">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
                  </svg>
              </Link>
          </div>
      </div>
    </aside>
  );
}

// Helper MenuItem
function MenuItem({ href, label, icon, active }: any) {
    return (
        <Link 
            href={href} 
            className={`group flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                active 
                ? 'bg-[#95F2AD] text-green-900 shadow-sm' 
                : 'text-gray-500 hover:text-green-700 hover:bg-green-50'
            }`}
        >
            <span className={`transition-colors duration-200 ${
                active 
                ? 'text-green-900' 
                : 'text-gray-400 group-hover:text-green-700'
            }`}>
                {icon}
            </span>
            {label}
        </Link>
    )
}