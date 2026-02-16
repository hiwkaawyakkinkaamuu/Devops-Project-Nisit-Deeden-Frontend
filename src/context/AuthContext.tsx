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
      const token = localStorage.getItem("token");

      // 1. ถ้าไม่มี Token และไม่ได้อยู่หน้า Login/Register ให้เด้งออกทันที
      if (!token) {
        if (pathname !== "/" && pathname !== "/register") {
          router.push("/");
        }
        setIsLoading(false);
        return;
      }

      // 2. ถ้ามี Token ให้ลองตรวจสอบกับ Backend
      try {
        // Optimization: ถ้ามี User State อยู่แล้ว ไม่ต้อง Fetch ใหม่ทุกครั้งที่เปลี่ยนหน้า (Optional)
        // แต่ถ้าต้องการความชัวร์ (Security) ให้ Fetch ทุกครั้งแบบเดิมดีแล้วครับ
        
        const res = await axios.get(`${API_BASE_URL}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (res.data && res.data.user) {
           // update state ด้วยข้อมูลล่าสุดจาก server
           setUser((prev: any) => ({ ...res.data.user, token })); 
        } else if (res.data) {
           setUser((prev: any) => ({ ...res.data, token }));
        }

      } catch (error: any) {
        console.warn("Session expired or invalid token:", error.message);
        
        // ถ้าเป็น 401 (Unauthorized) แสดงว่า Token ใช้ไม่ได้แล้ว -> บังคับ Logout
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