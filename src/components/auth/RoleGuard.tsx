"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Swal from "sweetalert2";

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles: string[];
}

export default function RoleGuard({ children, allowedRoles }: RoleGuardProps) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.replace("/");
        return;
      }

      // 🔍 DEBUG: ขอดูไส้ในของ User หน่อยซิ ว่าหน้าตาเป็นยังไงแน่?
      console.log("🔍 [RoleGuard] User Data Loaded:", user);

      // ✅ แก้ไข: รองรับชื่อตัวแปรหลายรูปแบบ (กันพลาดเรื่องตัวพิมพ์เล็ก/ใหญ่)
      // @ts-ignore
      const userRoleId = user.role_id ?? user.roleId ?? user.RoleId ?? user.RoleID;

      // ถ้าหา Role ID ไม่เจอจริงๆ ค่อยดีดออก
      if (userRoleId === undefined || userRoleId === null) {
         console.warn("❌ [RoleGuard] Role ID missing! Raw user:", user);
         // อย่าเพิ่งดีดออกทันที ให้ User เห็น Log ก่อน (หรือดีดออกถ้ามั่นใจ)
         router.replace("/");
         return;
      }

      const userRoleStr = getRoleString(Number(userRoleId)); // แปลงเป็นตัวเลขให้ชัวร์
      console.log(`✅ [RoleGuard] Checking Role: ${userRoleStr} (ID: ${userRoleId})`);

      if (!allowedRoles.includes(userRoleStr)) {
        Swal.fire({
            icon: 'error',
            title: 'ไม่มีสิทธิ์เข้าถึง',
            text: `สิทธิ์ของคุณคือ ${userRoleStr} ไม่สามารถเข้าหน้านี้ได้`,
            timer: 2000,
            showConfirmButton: false
        });
        
        const dashboardMap: Record<string, string> = {
            student: "/student/student-nomination-form",
            admin: "/admin/users",
        };
        router.replace(dashboardMap[userRoleStr] || "/");
      }
    }
  }, [user, isLoading, router, allowedRoles]);

  const getRoleString = (id: number) => {
     switch(id) {
         case 1: return "student";
         case 2: return "admin";
         case 3: return "head_of_department"; 
         default: return "guest";
     }
  };

  if (isLoading || !user) {
    return <div className="flex h-screen w-full items-center justify-center">Loading...</div>;
  }

  return <>{children}</>;
}