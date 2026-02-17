"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { api } from "@/lib/axios"; 

interface AuthContextType {
  user: any;
  login: (token: string, role: string, userData: any) => void;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const logout = () => {
    api.post("/auth/logout").catch(() => {}); 

    localStorage.removeItem("token");
    localStorage.removeItem("role");
    
    // ล้าง Cookie ฝั่ง Client (Clean up)
    document.cookie.split(";").forEach((c) => {
      document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
    });

    setUser(null);
    router.push("/");
  };

  const login = (token: string, role: string, userData: any) => {
    localStorage.setItem("token", token);
    localStorage.setItem("role", role);
    const actualUser = userData.user ? userData.user : userData;
    setUser({ ...actualUser, token, role });
  };

  useEffect(() => {
    const initAuth = async () => {
      // 1. ดักหน้า Google Callback
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

      // 3. ใช้ api instance ยิง request
      try {
        // ✅ ใช้ api.get แทน axios.get (ไม่ต้องใส่ URL เต็ม)
        // ✅ Header Authorization ยังใส่ไว้เพื่อความชัวร์ (Backend เช็ค Header เป็น Priority แรก)
        const res = await api.get("/auth/me", {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (res.data) {
          const userData = res.data.user || res.data;
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
  }, [pathname]);

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