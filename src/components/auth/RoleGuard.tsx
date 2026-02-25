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

      // ✅ แก้ไข: เช็คว่าถ้าข้อมูลโดนห่อด้วยคำว่า user อีกชั้น ให้ดึงตัวข้างในออกมา
      const actualUser = user.user ? user.user : user;

      // รองรับชื่อตัวแปรหลายรูปแบบ (กันพลาดเรื่องตัวพิมพ์เล็ก/ใหญ่)
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
      console.log(`[RoleGuard] Checking Role: ${userRoleStr} (ID: ${userRoleId})`);

      if (!allowedRoles.includes(userRoleStr)) {
        Swal.fire({
            icon: 'error',
            title: 'ไม่มีสิทธิ์เข้าถึง',
            text: `สิทธิ์ของคุณคือ ${userRoleStr} ไม่สามารถเข้าหน้านี้ได้`,
            timer: 2000,
            showConfirmButton: false
        });
        
        // เพิ่มหน้าหลักของ role 8 และ 9
        const dashboardMap: Record<string, string> = {
            student: "/student/main/student-nomination-form",
            student_development: "/student-development/setting",
            head_of_department: "/head-of-department/consider",
            associate_dean: "/associate-dean/consider",
            dean: "/dean/consider",
            student_development_committee: "/student-development-committee/consider",
            chairman_of_student_development_committee: "/chairman-of-student-development-committee/consider",
            chancellor: "/chancellor/dashboard", // Role 8
            organization: "/organization/main/organization-nomination-form" // Role 9
        };
        router.replace(dashboardMap[userRoleStr] || "/");
      }
    }
  }, [user, isLoading, router, allowedRoles]);

  const getRoleString = (id: number) => {
     switch(id) {
        case 1: return "student";
        case 2: return "head_of_department";
        case 3: return "associate_dean";
        case 4: return "dean";
        case 5: return "student_development";
        case 6: return "student_development_committee";
        case 7: return "chairman_of_student_development_committee";
        case 8: return "chancellor";
        case 9: return "organization";
        
        default: return "student";
     }
  };

  if (isLoading || !user) {
    return <div className="flex h-screen w-full items-center justify-center">Loading...</div>;
  }

  return <>{children}</>;
}