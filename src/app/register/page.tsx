"use client";

import Link from "next/link";
import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
import axios from "axios";

// ==========================================
// 0. Configuration & Service Layer
// ==========================================

// ชี้ไปที่ Backend Go Fiber ของคุณ (Port 8080)
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

// --- Service Layer ---
const authService = {
  register: async (email: string, password: string) => {
    try {
      // ยิง POST Request ไปที่ Backend Go Fiber
      const response = await axios.post(`/api/auth/register`, {
        email: email,
        password: password,
        confirmPassword: password
      });
      return response.data;
    } catch (error: any) {
      // ดึง Error Message จาก Backend (Go Fiber มักจะส่งกลับมาใน field 'error' หรือ 'message')
      const errorMessage =
        error.response?.data?.error || // กรณี Backend ส่ง { error: "..." }
        error.response?.data?.message || // กรณี Backend ส่ง { message: "..." }
        error.message ||
        "การเชื่อมต่อเซิร์ฟเวอร์ล้มเหลว";

      throw errorMessage;
    }
  },

  googleLogin: () => {
    // Redirect ไปที่ Endpoint Google Login ของ Go Fiber
    window.location.href = `${API_BASE_URL}/auth/google/login`;
  },
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ==========================================
// 1. Components
// ==========================================

export default function RegisterPage() {
  const router = useRouter();

  // UI States
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // --- Password Validation Logic ---
  const passwordCriteria = useMemo(() => {
    return [
      { id: 1, label: "ความยาวอย่างน้อย 8 ตัวอักษร", valid: password.length >= 8 },
      { id: 2, label: "มีตัวเลขอย่างน้อย 1 ตัว (0-9)", valid: /\d/.test(password) },
      { id: 3, label: "มีอักขระพิเศษ (เช่น !@#$%)", valid: /[!@#$%^&*(),.?":{}|<>]/.test(password) },
      { id: 4, label: "มีตัวพิมพ์ใหญ่และเล็กผสมกัน (A-z)", valid: /[a-z]/.test(password) && /[A-Z]/.test(password) },
    ];
  }, [password]);

  const isPasswordValid = passwordCriteria.every((c) => c.valid);

  // Logic: Register
  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();

    // 1. Validate Email
    if (!EMAIL_REGEX.test(email)) {
      Swal.fire({
        icon: "warning",
        title: "อีเมลไม่ถูกต้อง",
        text: "กรุณาตรวจสอบรูปแบบอีเมล",
      });
      return;
    }

    // 2. Validate Password Rules (Strict)
    if (!isPasswordValid) {
      Swal.fire({
        icon: "warning",
        title: "รหัสผ่านไม่ปลอดภัย",
        text: "กรุณาตั้งรหัสผ่านให้ครบตามเงื่อนไขที่กำหนด",
      });
      return;
    }

    // 3. Validate Match
    if (password !== confirmPassword) {
      Swal.fire({
        icon: "warning",
        title: "รหัสผ่านไม่ตรงกัน",
        text: "กรุณาตรวจสอบการยืนยันรหัสผ่าน",
        confirmButtonColor: "#F59E0B",
      });
      return;
    }

    setLoading(true);
    try {
      // เรียกใช้ Service ที่เชื่อมต่อกับ Go Fiber จริง
      await authService.register(email, password);

      await Swal.fire({
        icon: "success",
        title: "สมัครสมาชิกสำเร็จ",
        text: "กำลังพาท่านไปหน้าเข้าสู่ระบบ...",
        timer: 2000,
        showConfirmButton: false,
      });

      // Redirect ไปหน้า Login
      router.push("/"); 
    } catch (err: any) {
      Swal.fire({
        icon: "error",
        title: "สมัครสมาชิกไม่สำเร็จ",
        text: typeof err === "string" ? err : "เกิดข้อผิดพลาดจากระบบ",
        confirmButtonColor: "#d33",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex w-full font-sans bg-gray-50">
      {/* Styles */}
      <style jsx global>{`
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes scaleUp { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
        .animate-fade-in-up { animation: fadeInUp 0.6s ease-out forwards; }
        .animate-scale-up { animation: scaleUp 0.5s ease-out forwards; }
      `}</style>

      {/* Left Side */}
      <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-[#006633] to-[#004d24] text-white flex-col justify-center px-16 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white opacity-5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 animate-pulse"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-green-400 opacity-10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>

        <div className="z-10 animate-fade-in-up">
          <h1 className="text-5xl font-extrabold mb-6 leading-tight tracking-tight drop-shadow-sm">
            ระบบคัดเลือก<br />นิสิตดีเด่น
          </h1>
          <p className="text-green-100 mb-12 text-lg font-light leading-relaxed max-w-lg">
            ระบบการเสนอชื่อและพิจารณานิสิตดีเด่นของมหาวิทยาลัยเกษตรศาสตร์ เพื่อส่งเสริมและยกย่องนิสิตที่มีผลงานโดดเด่น
          </p>
          <div className="space-y-8">
            <FeatureItem title="ระบบเสนอรายชื่อ" desc="เสนอชื่อนิสิตดีเด่นได้อย่างสะดวกรวดเร็ว" delay="0ms" />
            <FeatureItem title="ติดตามสถานะ" desc="ตรวจสอบสถานะการพิจารณาแบบเรียลไทม์" delay="150ms" />
            <FeatureItem title="ระบบอนุมัติหลายขั้นตอน" desc="กระบวนการพิจารณาที่โปร่งใสและมีมาตรฐาน" delay="300ms" />
          </div>
        </div>
      </div>

      {/* Right Side */}
      <div className="w-full lg:w-1/2 bg-white flex flex-col justify-center items-center p-8 lg:p-12 relative overflow-y-auto">
        <div className="w-full max-w-md animate-scale-up py-8">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-tr from-green-600 to-emerald-500 rounded-2xl rotate-3 mx-auto mb-6 flex items-center justify-center text-white font-bold text-2xl shadow-xl shadow-green-100 transform hover:rotate-0 transition-all duration-300">
              NDD
            </div>
            <h2 className="text-3xl font-bold text-gray-800 tracking-tight">สร้างบัญชีใหม่</h2>
            <p className="text-sm text-gray-500 mt-2">กรอกข้อมูลเพื่อลงทะเบียน</p>
          </div>

          <form onSubmit={onSubmit} className="space-y-5">
            {/* Email */}
            <div className="group">
              <label className="block text-sm font-medium text-gray-700 mb-1 ml-1 group-focus-within:text-green-600 transition-colors">
                อีเมล
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="name.s@ku.th"
                  className="w-full bg-gray-50 border border-gray-200 focus:bg-white focus:border-green-500 focus:ring-4 focus:ring-green-100 rounded-xl px-4 py-3.5 text-gray-700 transition-all outline-none"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            {/* Password */}
            <div className="group">
              <label className="block text-sm font-medium text-gray-700 mb-1 ml-1 group-focus-within:text-green-600 transition-colors">
                รหัสผ่าน
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className="w-full bg-gray-50 border border-gray-200 focus:bg-white focus:border-green-500 focus:ring-4 focus:ring-green-100 rounded-xl px-4 py-3.5 text-gray-700 transition-all outline-none"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-green-600 transition-colors"
                >
                  {showPassword ? <EyeOpenIcon /> : <EyeClosedIcon />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div className="group">
              <label className="block text-sm font-medium text-gray-700 mb-1 ml-1 group-focus-within:text-green-600 transition-colors">
                ยืนยันรหัสผ่าน
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className="w-full bg-gray-50 border border-gray-200 focus:bg-white focus:border-green-500 focus:ring-4 focus:ring-green-100 rounded-xl px-4 py-3.5 text-gray-700 transition-all outline-none"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-green-600 transition-colors"
                >
                  {showConfirmPassword ? <EyeOpenIcon /> : <EyeClosedIcon />}
                </button>
              </div>

              {/* Password Strength Indicators */}
              <div className="mt-3 grid grid-cols-1 gap-2 bg-gray-50 p-3 rounded-lg border border-gray-100">
                <p className="text-xs font-semibold text-gray-500 mb-1">เงื่อนไขรหัสผ่าน:</p>
                {passwordCriteria.map((item) => (
                  <div
                    key={item.id}
                    className={`flex items-center gap-2 text-xs transition-colors duration-300 ${
                      item.valid ? "text-green-600 font-medium" : "text-gray-400"
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full flex items-center justify-center border ${
                        item.valid ? "bg-green-100 border-green-500" : "bg-gray-100 border-gray-300"
                      }`}
                    >
                      {item.valid && (
                        <svg className="w-2.5 h-2.5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    {item.label}
                  </div>
                ))}
              </div>
            </div>

            {/* Submit */}
            <div className="space-y-4 pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gray-900 hover:bg-black text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-gray-200 disabled:bg-gray-400 disabled:cursor-not-allowed transform active:scale-[0.98]"
              >
                {loading ? "กำลังสมัครสมาชิก..." : "สมัครสมาชิก"}
              </button>
              <button
                type="button"
                onClick={authService.googleLogin}
                className="w-full bg-[#00c535] hover:bg-[#00a82d] text-white font-medium py-3.5 rounded-xl transition-colors shadow-lg shadow-green-100 flex justify-center items-center gap-2 transform active:scale-[0.98]"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M21.35 11.1h-9.17v2.73h6.51c-.33 3.81-3.5 5.44-6.5 5.44C8.36 19.27 5 16.25 5 12c0-4.1 3.2-7.27 7.2-7.27 3.09 0 4.9 1.97 4.9 1.97L19 4.72S16.56 2 12.1 2C6.42 2 2.03 6.8 2.03 12c0 5.05 4.13 10 10.22 10 5.35 0 9.25-3.67 9.25-9.09 0-1.15-.15-1.81-.15-1.81Z" />
                </svg>
                สมัครด้วย Google
              </button>
            </div>
          </form>

          <div className="mt-8 text-center text-sm text-gray-500">
            มีบัญชีผู้ใช้แล้ว ?{" "}
            <Link href="/" className="text-green-600 font-medium hover:underline">
              เข้าสู่ระบบ
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 2. Sub-Components (Icons & FeatureItem)
// ==========================================

function FeatureItem({ title, desc, delay }: { title: string; desc: string; delay: string }) {
  return (
    <div
      className="flex items-start space-x-4 group hover:translate-x-2 transition-transform duration-300"
      style={{ animationDelay: delay }}
    >
      <div className="mt-1 flex-shrink-0 w-6 h-6 rounded-full border-2 border-green-300 flex items-center justify-center group-hover:bg-green-500 group-hover:border-green-500 transition-all duration-300 shadow-sm">
        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path>
        </svg>
      </div>
      <div>
        <h4 className="font-semibold text-lg">{title}</h4>
        <p className="text-green-100 text-sm font-light opacity-90">{desc}</p>
      </div>
    </div>
  );
}

function EyeClosedIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className="w-5 h-5"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88"
      />
    </svg>
  );
}

function EyeOpenIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className="w-5 h-5"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
      />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}