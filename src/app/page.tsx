"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Swal from "sweetalert2";
import axios from "axios";
import { useAuth } from "@/context/AuthContext";

// ==========================================
// 0. Configuration & Service Layer
// ==========================================

const USE_MOCK_DATA = false;
// ปรับให้ดึงจาก Env หรือ Default ตามความเหมาะสม
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api";

// Interface
interface LoginResponse {
  token: string;
  role: string;
  user: {
    firstname: string;
    lastname: string;
    role_id: number;
    is_first_login: boolean; 
  };
}

const mapRoleIdToRoleName = (roleId: number): string => {
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

// ==========================================
// 1. Main Component
// ==========================================

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();

  // UI States
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // --- Logic: Google Login ---
  const handleGoogleLogin = () => {
    // 🔥 1. ล้างทุกอย่างทิ้งก่อนไป Google (ป้องกันปัญหา Session ค้าง)
    localStorage.clear(); // ล้างทิ้งทั้งหมดในครั้งเดียว
    
    // ล้าง Cookie ทั้งหมด
    document.cookie.split(";").forEach((c) => {
      document.cookie = c
        .replace(/^ +/, "")
        .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
    });

    // 2. ไปหน้า Google Login (ใช้ API_BASE_URL เพื่อความยืดหยุ่น)
    window.location.href = `${API_BASE_URL}/auth/google/login`;
  };

  // Helper: Role-based Redirect พร้อม Logic First Login
  const handleRedirect = (role: string, firstLogin: boolean) => {
    if (role === "student" && firstLogin) {
      router.push("/student/auth/first-login");
      return;
    }

    const routes: Record<string, string> = {
      head_of_department: "/head-of-department/consider",
      dean: "/dean/consider",
      associate_dean: "/associate-dean/consider",
      chairman_of_student_development_committee: "/chairman-of-student-development-committee/consider",
      student_development_committee: "/student-development-committee/consider",
      student_development: "/student-development/verify-submit",
      student: "/student/main/student-nomination-form",
    };
    
    router.push(routes[role] || "/");
  };

  // Logic: Manual Login (Email/Password)
  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      Swal.fire({ icon: 'warning', title: 'ข้อมูลไม่ครบ', text: 'กรุณากรอกอีเมลและรหัสผ่าน' });
      return;
    }

    setLoading(true);

    try {
      // 1. ล้างข้อมูลเก่าก่อน Login ใหม่ (กันเหนียว)
      localStorage.removeItem("token");
      localStorage.removeItem("role");

      const response = await axios.post(
        `${API_BASE_URL}/auth/login`, 
        { email, password },
        { 
          // withCredentials: true,
          headers: { "Content-Type": "application/json" }
        }
      );
      
      const backendData = response.data;
      const roleName = mapRoleIdToRoleName(backendData.user.role_id);

      // 2. บันทึกข้อมูลผ่าน Context
      login(backendData.token, roleName, backendData.user);

      await Swal.fire({
        icon: "success",
        title: "เข้าสู่ระบบสำเร็จ",
        text: `ยินดีต้อนรับคุณ ${backendData.user.firstname}`,
        timer: 1500,
        showConfirmButton: false,
      });

      // 3. Redirect (ใช้อันเดิมจาก backend ตรงๆ)
      handleRedirect(roleName, backendData.user.is_first_login);

    } catch (err: any) {
      console.error("Login Error:", err);
      let errorMessage = "เกิดข้อผิดพลาดในการเข้าสู่ระบบ";
      
      // ดึง Error Message จาก Backend
      const backendError = err.response?.data?.error || err.response?.data?.message;
      if (backendError === "invalid credentials" || backendError === "record not found") {
          errorMessage = "อีเมลหรือรหัสผ่านไม่ถูกต้อง";
      }

      Swal.fire({
        icon: "error",
        title: "เข้าสู่ระบบไม่สำเร็จ",
        text: errorMessage,
        confirmButtonColor: "#d33",
        confirmButtonText: "ลองใหม่อีกครั้ง",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex w-full font-sans bg-gray-50">
      <style jsx global>{`
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes scaleUp { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
        .animate-fade-in-up { animation: fadeInUp 0.6s ease-out forwards; }
        .animate-scale-up { animation: scaleUp 0.5s ease-out forwards; }
      `}</style>

      {/* Left Side (Green Banner) */}
      <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-[#006633] to-[#004d24] text-white flex-col justify-center px-16 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white opacity-5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 animate-pulse"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-green-400 opacity-10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
        
        <div className="z-10 animate-fade-in-up">
            <h1 className="text-5xl font-extrabold mb-6 leading-tight tracking-tight drop-shadow-sm">
                ระบบคัดเลือก<br/>นิสิตดีเด่น
            </h1>
            <p className="text-green-100 mb-12 text-lg font-light leading-relaxed max-w-lg">
            ระบบการเสนอชื่อและพิจารณานิสิตดีเด่นของมหาวิทยาลัยเกษตรศาสตร์ เพื่อส่งเสริมและยกย่องนิสิตที่มีผลงานโดดเด่นและเป็นแบบอย่างที่ดี
            </p>

            <div className="space-y-8">
                <FeatureItem title="เสนอรายชื่อออนไลน์" desc="ลดขั้นตอนเอกสาร สะดวก รวดเร็ว ใช้งานง่าย" delay="0ms" />
                <FeatureItem title="ติดตามสถานะได้ทันที" desc="ตรวจสอบผลการพิจารณาได้แบบ Real-time" delay="150ms" />
                <FeatureItem title="โปร่งใสและตรวจสอบได้" desc="กระบวนการพิจารณาเป็นระบบและมีมาตรฐาน" delay="300ms" />
            </div>
        </div>
      </div>

      {/* Right Side (Login Form) */}
      <div className="w-full lg:w-1/2 bg-white flex flex-col justify-center items-center p-8 lg:p-12 relative">
        <div className="w-full max-w-md animate-scale-up">
            <div className="text-center mb-10">
                <div className="w-20 h-20 bg-gradient-to-tr from-green-600 to-emerald-500 rounded-2xl rotate-3 mx-auto mb-6 flex items-center justify-center text-white font-bold text-2xl shadow-xl shadow-green-100 transform hover:rotate-0 transition-all duration-300">
                    KU
                </div>
                <h2 className="text-3xl font-bold text-gray-800 tracking-tight">เข้าสู่ระบบ</h2>
                <p className="text-sm text-gray-500 mt-2">
                    กรุณากรอกข้อมูลเพื่อเข้าใช้งานระบบ
                </p>
            </div>

            <form onSubmit={onSubmit} className="space-y-5">
                <div className="group">
                    <label className="block text-sm font-medium text-gray-700 mb-1 ml-1 group-focus-within:text-green-600 transition-colors">อีเมลมหาวิทยาลัย</label>
                    <div className="relative">
                        <input 
                            type="text" 
                            placeholder="name.s@ku.th" 
                            className="w-full bg-gray-50 border border-gray-200 focus:bg-white focus:border-green-500 focus:ring-4 focus:ring-green-100 rounded-xl px-4 py-3.5 text-gray-700 transition-all placeholder-gray-400 outline-none"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                        <span className="absolute right-4 top-3.5 text-gray-400 group-focus-within:text-green-500 transition-colors">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" /></svg>
                        </span>
                    </div>
                </div>

                <div className="group">
                    <label className="block text-sm font-medium text-gray-700 mb-1 ml-1 group-focus-within:text-green-600 transition-colors">รหัสผ่าน</label>
                    <div className="relative">
                        <input 
                            type={showPassword ? "text" : "password"} 
                            placeholder="••••••••" 
                            className="w-full bg-gray-50 border border-gray-200 focus:bg-white focus:border-green-500 focus:ring-4 focus:ring-green-100 rounded-xl px-4 py-3.5 text-gray-700 transition-all placeholder-gray-400 outline-none"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                        <button 
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-full transition-colors focus:outline-none"
                        >
                            {showPassword ? <EyeOpenIcon /> : <EyeClosedIcon />}
                        </button>
                    </div>
                </div>

                <div className="space-y-4 pt-4">
                    <button 
                        type="submit" 
                        disabled={loading}
                        className="w-full bg-gray-900 hover:bg-black text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-gray-200 disabled:bg-gray-400 disabled:cursor-not-allowed transform active:scale-[0.98] hover:shadow-xl"
                    >
                        {loading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
                    </button>
                    
                    <button 
                        type="button"
                        onClick={handleGoogleLogin} 
                        className="w-full bg-[#00c535] hover:bg-[#00a82d] text-white font-medium py-3.5 rounded-xl transition-colors shadow-lg shadow-green-100 flex justify-center items-center gap-2 transform active:scale-[0.98] hover:shadow-green-200"
                    >
                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M21.35 11.1h-9.17v2.73h6.51c-.33 3.81-3.5 5.44-6.5 5.44C8.36 19.27 5 16.25 5 12c0-4.1 3.2-7.27 7.2-7.27 3.09 0 4.9 1.97 4.9 1.97L19 4.72S16.56 2 12.1 2C6.42 2 2.03 6.8 2.03 12c0 5.05 4.13 10 10.22 10 5.35 0 9.25-3.67 9.25-9.09 0-1.15-.15-1.81-.15-1.81Z" />
                        </svg>
                        เข้าสู่ระบบด้วย Google
                    </button>
                </div>
            </form>

            <div className="mt-8 text-center text-sm text-gray-500">
              ยังไม่มีบัญชีผู้ใช้ ? <Link href="/register" className="text-green-600 font-medium hover:underline hover:text-green-700 transition-colors">สมัครสมาชิก</Link>
            </div>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 2. Sub-Components
// ==========================================

function FeatureItem({ title, desc, delay }: { title: string, desc: string, delay: string }) {
    return (
        <div className="flex items-start space-x-4 group hover:translate-x-2 transition-transform duration-300" style={{ animationDelay: delay }}>
            <div className="mt-1 flex-shrink-0 w-6 h-6 rounded-full border-2 border-green-300 flex items-center justify-center group-hover:bg-green-500 group-hover:border-green-500 transition-all duration-300 shadow-sm">
                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
            </div>
            <div>
                <h4 className="font-semibold text-lg">{title}</h4>
                <p className="text-green-100 text-sm font-light opacity-90">{desc}</p>
            </div>
        </div>
    )
}

function EyeClosedIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
        </svg>
    )
}

function EyeOpenIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
    )
}