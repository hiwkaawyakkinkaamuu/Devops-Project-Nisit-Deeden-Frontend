"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createApiUrl } from "../../api/createApiUrl";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  // State สำหรับปุ่มลูกตา (แยกกันระหว่างรหัสผ่านกับยืนยันรหัสผ่าน)
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    // 1. เช็คว่ารหัสผ่านตรงกันไหม
    if (password !== confirmPassword) {
        setError("รหัสผ่านไม่ตรงกัน กรุณาตรวจสอบอีกครั้ง");
        return;
    }

    setLoading(true);
    try {
      // 2. ยิง API สมัครสมาชิก
      const url = createApiUrl("/auth/register"); // <-- แก้ path API ตามหลังบ้านของคุณ
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Registration failed");
      }

      // 3. ถ้าสำเร็จ ให้เด้งไปหน้า Login หรือหน้าแจ้งเตือน
      alert("สมัครสมาชิกสำเร็จ! กรุณาเข้าสู่ระบบ");
      router.push("/"); 
      
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex w-full font-sans">
      
      {/* --- ฝั่งซ้าย (สีเขียว - เหมือนหน้า Login) --- */}
      <div className="hidden lg:flex w-1/2 bg-[#005c30] text-white flex-col justify-center px-16 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        <div className="z-10">
            <h1 className="text-4xl font-bold mb-4">ยินดีต้อนรับเข้าสู่ระบบนิสิตดีเด่น</h1>
            <p className="text-green-100 mb-10 text-lg font-light leading-relaxed">
            ระบบการเสนอชื่อและพิจารณานิสิตดีเด่นของมหาวิทยาลัยเกษตรศาสตร์ <br/>
            เพื่อส่งเสริมและยกย่องนิสิตที่มีผลงานโดดเด่น
            </p>
            <div className="space-y-6">
                <FeatureItem title="ระบบเสนอรายชื่อ" desc="เสนอชื่อนิสิตดีเด่นได้อย่างสะดวกรวดเร็ว" />
                <FeatureItem title="ติดตามสถานะ" desc="ตรวจสอบสถานะการพิจารณาแบบเรียลไทม์" />
                <FeatureItem title="ระบบอนุมัติหลายขั้นตอน" desc="กระบวนการพิจารณาที่โปร่งใสและมีมาตรฐาน" />
            </div>
        </div>
      </div>

      {/* --- ฝั่งขวา (ฟอร์ม Register) --- */}
      <div className="w-full lg:w-1/2 bg-white flex flex-col justify-center items-center p-8">
        <div className="w-full max-w-md">
            
            {/* Logo Area */}
            <div className="text-center mb-8">
                <div className="w-16 h-16 bg-green-600 rounded-lg rotate-3 mx-auto mb-4 flex items-center justify-center text-white font-bold text-xl shadow-lg">
                    NDD
                </div>
                <h2 className="text-2xl font-bold text-gray-800">ระบบนิสิตดีเด่น</h2>
                <p className="text-sm text-gray-500 mt-1">มหาวิทยาลัยเกษตรศาสตร์</p>
                <p className="text-xs text-gray-400">Kasetsart University Outstanding Student System</p>
            </div>

            <h3 className="text-xl font-semibold text-gray-900 mb-6">สร้างบัญชีใหม่</h3>

            {error && <div className="bg-red-50 text-red-600 p-3 rounded mb-4 text-sm border border-red-100">{error}</div>}

            <form onSubmit={onSubmit} className="space-y-4">
                {/* Email */}
                <div>
                    <input 
                        type="text" 
                        placeholder="อีเมล" 
                        className="w-full bg-gray-100 border-transparent focus:bg-white focus:border-green-500 focus:ring-0 rounded-md px-4 py-3 text-gray-700 transition-all placeholder-gray-400"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                </div>

                {/* Password */}
                <div className="relative">
                    <input 
                        type={showPassword ? "text" : "password"} 
                        placeholder="รหัสผ่าน" 
                        className="w-full bg-gray-100 border-transparent focus:bg-white focus:border-green-500 focus:ring-0 rounded-md px-4 py-3 text-gray-700 transition-all placeholder-gray-400"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                    <button 
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                        {showPassword ? <EyeOpenIcon /> : <EyeClosedIcon />}
                    </button>
                </div>

                {/* Confirm Password */}
                <div className="relative">
                    <input 
                        type={showConfirmPassword ? "text" : "password"} 
                        placeholder="ยืนยันรหัสผ่าน" 
                        className="w-full bg-gray-100 border-transparent focus:bg-white focus:border-green-500 focus:ring-0 rounded-md px-4 py-3 text-gray-700 transition-all placeholder-gray-400"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                    />
                    <button 
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                        {showConfirmPassword ? <EyeOpenIcon /> : <EyeClosedIcon />}
                    </button>
                </div>

                {/* Buttons */}
                <div className="space-y-3 mt-6">
                    <button 
                        type="submit" 
                        disabled={loading}
                        className="w-full bg-gray-900 hover:bg-black text-white font-medium py-3 rounded-md transition-colors shadow-lg shadow-gray-200"
                    >
                        {loading ? "กำลังสร้างบัญชี..." : "สร้างบัญชีผู้ใช้"}
                    </button>
                    
                    <button 
                        type="button"
                        className="w-full bg-[#00c535] hover:bg-[#00a82d] text-white font-medium py-3 rounded-md transition-colors shadow-lg shadow-green-100"
                    >
                        KU ALL-Login
                    </button>
                </div>
            </form>

            <div className="mt-8 text-center text-sm text-gray-500">
                มีบัญชีผู้ใช้แล้ว ? <Link href="/" className="text-green-600 font-medium hover:underline">เข้าสู่ระบบ</Link>
            </div>

        </div>
      </div>
    </div>
  );
}

// --- Components ย่อย (ก๊อปมาวางเพื่อความชัวร์) ---

function FeatureItem({ title, desc }: { title: string, desc: string }) {
    return (
        <div className="flex items-start space-x-4">
            <div className="mt-1 flex-shrink-0 w-6 h-6 rounded-full border-2 border-green-300 flex items-center justify-center">
                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
            </div>
            <div>
                <h4 className="font-semibold text-lg">{title}</h4>
                <p className="text-green-200 text-sm font-light">{desc}</p>
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