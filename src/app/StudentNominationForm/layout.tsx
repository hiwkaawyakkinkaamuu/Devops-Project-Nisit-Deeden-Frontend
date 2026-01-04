"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function StudentNominationFormLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // ฟังก์ชันเช็คว่าเมนูไหน active
  const isActive = (path: string) => {
    if (pathname === "/StudentNominationForm") {
      return true;
    }
    return pathname === path;
  };

  return (
    <div className="flex min-h-screen bg-gray-50 font-sans text-gray-800">
      
      {/* --- Sidebar (เมนูซ้าย) --- */}
      <aside className="w-[280px] bg-white h-screen fixed left-0 top-0 flex flex-col z-30 border-r border-gray-100 shadow-[0_0_15px_rgba(0,0,0,0.05)]">
        
        {/* Logo Area */}
        <div className="p-8 pb-6">
            <div className="flex items-center gap-3">
                <div className="text-green-600"> {/* ปรับ Logo ให้เขียวสวยขึ้น */}
                    <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M20 0L37.3205 10V30L20 40L2.67949 30V10L20 0Z" fill="#22C55E" fillOpacity="0.2"/>
                        <path d="M20 5L32.9904 12.5V27.5L20 35L7.00962 27.5V12.5L20 5Z" fill="#22C55E"/>
                        <text x="50%" y="54%" dominantBaseline="middle" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">NDD</text>
                    </svg>
                </div>
                <h1 className="font-bold text-lg text-gray-800 tracking-tight">ระบบนิสิตดีเด่น</h1>
            </div>
        </div>

        {/* Menu Items */}
        <nav className="flex-1 px-6 space-y-2 mt-2">
            <MenuItem 
                href="/StudentNominationForm" 
                label="เสนอรายชื่อนิสิตดีเด่น" 
                active={isActive("/StudentNominationForm")} 
                icon={<IconBadge />} 
            />
            <MenuItem 
                href="/tracking" 
                label="ติดตามสถานะ" 
                active={pathname === "/tracking"} 
                icon={<IconTrack />} 
            />
            <MenuItem 
                href="/edit" 
                label="แก้ไขข้อมูลการเสนอ" 
                active={pathname === "/edit"} 
                icon={<IconEdit />} 
            />
            <MenuItem 
                href="/profile" 
                label="โปรไฟล์ผู้ใช้" 
                active={pathname === "/profile"} 
                icon={<IconUser />} 
            />
        </nav>

        {/* User Profile (Bottom) */}
        <div className="p-6 mt-auto">
            <div className="bg-gray-50 rounded-xl p-3 flex items-center gap-3 border border-transparent hover:border-gray-200 hover:shadow-sm transition-all cursor-pointer group">
                <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-gray-400 overflow-hidden group-hover:bg-white transition-all">
                     <svg className="w-12 h-12 -mt-2" fill="currentColor" viewBox="0 0 24 24"><path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-900 truncate">ชื่อ นามสกุล</p>
                    <p className="text-xs text-gray-500">นิสิต</p>
                </div>

                {/* --- แก้ตรงนี้ครับ: เปลี่ยน Button เป็น Link เพื่อ Logout --- */}
                <Link href="/" className="text-gray-400 hover:text-red-500 p-2 rounded-full hover:bg-red-50 transition-all" title="ออกจากระบบ">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
                    </svg>
                </Link>
                {/* ----------------------------------------------------- */}

            </div>
        </div>
      </aside>

      {/* --- Main Content Area --- */}
      <main className="flex-1 ml-[280px] p-10 pb-20">
        <div className="flex justify-end mb-8">
            <span className="text-xs font-semibold text-gray-500 bg-white px-4 py-1.5 rounded-full shadow-sm border border-gray-100">
                ปีการศึกษา 2568 ภาคเรียนที่ 2
            </span>
        </div>
        
        {children}
      </main>
    </div>
  );
}

// ✨ ส่วนที่ปรับแก้: Logic การเปลี่ยนสีเมนู ✨
function MenuItem({ href, label, icon, active }: any) {
    return (
        <Link 
            href={href} 
            className={`group flex items-center gap-3 px-4 py-3.5 rounded-lg text-sm transition-all duration-200 ${
                active 
                ? 'bg-[#95F2AD] text-green-800 font-bold shadow-sm'   // Active: พื้นเขียว + ตัวหนังสือเขียวเข้ม (green-800) + หนา
                : 'text-gray-500 font-medium hover:text-green-700 hover:font-bold hover:bg-green-50' // Inactive: เทา -> Hover: เขียวเข้ม + หนา + พื้นจางๆ
            }`}
        >
            {/* Icon Color Logic */}
            <span className={`transition-colors duration-200 ${
                active 
                ? 'text-green-800' // Active: ไอคอนเขียวเข้ม
                : 'text-gray-400 group-hover:text-green-700' // Hover: ไอคอนเปลี่ยนเป็นเขียวเข้มด้วย
            }`}>
                {icon}
            </span>
            {label}
        </Link>
    )
}

// Icons (เหมือนเดิม)
const IconBadge = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138z" /></svg>
const IconTrack = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
const IconEdit = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
const IconUser = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0c0 .884-.5 2-2 2h4c-1.5 0-2-1.116-2-2z" /></svg>