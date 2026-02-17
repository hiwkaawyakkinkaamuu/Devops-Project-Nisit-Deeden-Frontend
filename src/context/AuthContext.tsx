"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import axios from "axios";

interface AuthContextType {
  user: any;
  login: (token: string, role: string, userData: any) => void;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

const API_BASE_URL = "/api"; // ตรวจสอบให้แน่ใจว่า next.config.ts ทำ rewrite ไว้แล้ว

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  // ฟังก์ชัน Logout แยกออกมาเพื่อให้เรียกใช้ได้ง่าย
  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    setUser(null);
    router.push("/");
  };

  const login = (token: string, role: string, userData: any) => {
    localStorage.setItem("token", token);
    localStorage.setItem("role", role);
    
    // จัดการ user data ให้ format ตรงกันเสมอ
    const actualUser = userData.user ? userData.user : userData;
    setUser({ ...actualUser, token, role });
  };

  useEffect(() => {
    const initAuth = async () => {
      // 1. 🔥 ยุบรวมดักทางหน้า Google Callback: 
      // ถ้ากำลังอยู่ในหน้า Callback ให้ล้าง User ทิ้ง และหยุด Loading ทันที 
      // เพื่อรอให้หน้า Callback Page เป็นคนจัดการ Token ใหม่เอง
      const urlParams = new URLSearchParams(window.location.search);
      if (
        window.location.pathname.includes("/google-callback") || 
        urlParams.has("token") || 
        urlParams.has("code")
      ) {
        console.log("🛠️ AuthContext: Google process detected, skipping init...");
        setUser(null);
        setIsLoading(false);
        return;
      }
      
      const token = localStorage.getItem("token");

      // 2. ถ้าไม่มี Token และไม่ได้อยู่หน้า Login/Register ให้เด้งออก
      if (!token) {
        if (pathname !== "/" && pathname !== "/register") {
          router.push("/");
        }
        setIsLoading(false);
        return;
      }

      // 3. ถ้ามี Token ให้ลองตรวจสอบกับ Backend
      try {
        const res = await axios.get(`${API_BASE_URL}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (res.data) {
          const userData = res.data.user || res.data;
          // มั่นใจว่าได้ Token กลับไปด้วยใน State
          setUser({ ...userData, token });
        }
      } catch (error: any) {
        console.warn("Session expired or invalid token");
        if (error.response?.status === 401) {
           logout(); 
        }
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, [pathname]); // เช็คทุกครั้งที่เปลี่ยนหน้า

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};