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

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("token");

      if (token) {
        try {
          // ✅ ดึงข้อมูลสดจาก Backend เพื่อให้ได้โครงสร้างข้อมูลที่ถูกต้อง
          const res = await axios.get(`${API_BASE_URL}/auth/me`, {
            headers: { Authorization: `Bearer ${token}` }
          });

          // ✅ สำคัญ: แกะเอาแค่ res.data.user (ตัดชั้นนอกที่เป็น { user: ... } ออก)
          if (res.data && res.data.user) {
            setUser({ ...res.data.user, token }); 
          }
        } catch (error: any) {
          console.error("Auth check failed:", error);
          if (error.response?.status === 401) {
             logout(); // ถ้า Token บูด (401) ให้ Logout ทันที
          }
        }
      } else {
        if (pathname !== "/" && pathname !== "/register") {
          router.push("/");
        }
      }
      setIsLoading(false);
    };

    checkAuth();
  }, [pathname]); // เอา router ออกจาก dependency เพื่อกัน loop ในบางเคส

  const login = (token: string, role: string, userData: any) => {
    localStorage.setItem("token", token);
    localStorage.setItem("role", role);
    
    // ✅ ถ้าตอน Login หลังบ้านส่ง user ซ้อนมา ให้แกะก่อนเก็บ
    const actualUser = userData.user ? userData.user : userData;
    setUser({ ...actualUser, token, role });
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    setUser(null);
    router.push("/");
  };

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