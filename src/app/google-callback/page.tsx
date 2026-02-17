"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function GoogleCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();
  
  const [isRedirecting, setIsRedirecting] = useState(false);
  const processedRef = useRef(false);

  useEffect(() => {
    if (processedRef.current) return;

    // 1. 🔥 กฎเหล็ก: ล้างทุกอย่างของ "คนเก่า" ทิ้งทันทีที่เข้าหน้านี้
    // ทำก่อนจะไปดึง Token ใหม่จาก URL ด้วยซ้ำ
    localStorage.clear(); // ล้างทิ้งทั้งหมด (รวมถึง token และ role)
    sessionStorage.clear();
    
    // ล้าง Cookie ทิ้งให้หมด (เน้นตัวที่ชื่อ token)
    document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT; SameSite=Lax";

    const token = searchParams.get("token");
    const role = searchParams.get("role");
    const firstLogin = searchParams.get("first_login") === "true"; 
    const firstname = searchParams.get("firstname");

    if (token) {
      processedRef.current = true;
      setIsRedirecting(true);

      // 2. 💾 บันทึกของ "คนใหม่" ลงไป
      const expires = new Date();
      expires.setTime(expires.getTime() + (24 * 60 * 60 * 1000));
      
      // ฝัง Cookie ใหม่
      document.cookie = `token=${token}; expires=${expires.toUTCString()}; path=/; SameSite=Lax`;
      
      // ฝัง LocalStorage ใหม่
      localStorage.setItem("token", token);
      localStorage.setItem("role", role || "student");
      
      // 3. 🛡️ อัปเดต Context 
      // การเรียก login ตรงนี้สำคัญเพื่อให้ตัวแปรใน App เปลี่ยนตามทันที
      login(token, role || "student", { 
        firstname: firstname || "", 
        role_id: role === "student" ? 1 : 2, // ปรับตาม Role จริง
        is_first_login: firstLogin 
      });

      console.log("✅ New session established for:", firstname);

      // 4. 🚀 ไม้ตาย: หน่วงเวลานิดเดียวแล้ว Force Refresh หน้าใหม่ด้วย href
      // ห้ามใช้ router.push เพราะเราต้องการให้ Middleware/Context เริ่มนับหนึ่งใหม่จริงๆ
      setTimeout(() => {
        if (firstLogin) {
          window.location.href = "/student/auth/first-login";
        } else {
          // ถ้าไม่ใช่ First Login ให้ส่งไปหน้า Main
          window.location.href = "/student/main/student-nomination-form";
        }
      }, 200); // 200ms เพียงพอสำหรับการเขียนไฟล์ลง Storage

    } else {
       console.error("❌ No token found in URL");
       window.location.href = "/"; 
    }
  }, [searchParams, login]); 

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white">
      <div className="relative">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-green-600"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 font-bold text-green-600">KU</div>
      </div>
      <h2 className="text-xl font-bold text-gray-800 mt-6">กำลังยืนยันตัวตน</h2>
      <p className="text-gray-500 mt-2 animate-pulse">
        {isRedirecting ? "จัดเตรียมข้อมูลผู้ใช้..." : "กรุณารอสักครู่"}
      </p>
    </div>
  );
}