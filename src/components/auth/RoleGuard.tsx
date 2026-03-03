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

  // แก้ไข: เพิ่ม Parameter isChairman เพื่อใช้แยกสิทธิ์
  const getRoleString = (id: number, isChairman: boolean) => {
     switch(id) {
        case 1: return "student";
        case 2: return "head_of_department";
        case 3: return "associate_dean";
        case 4: return "dean";
        case 5: return "student_development";
        case 6: return isChairman ? "chairman_of_student_development_committee" : "student_development_committee";
        case 7: return "chancellor";
        case 8: return "organization";
        default: return "student";
     }
  };

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.replace("/");
        return;
      }

      // DEBUG: ขอดูไส้ในของ User หน่อยซิ ว่าหน้าตาเป็นยังไงแน่?
      console.log("[RoleGuard] User Data Loaded:", user);

      // เช็คว่าถ้าข้อมูลโดนห่อด้วยคำว่า user อีกชั้น ให้ดึงตัวข้างในออกมา
      const actualUser = user.user ? user.user : user;

      // รองรับชื่อตัวแปรหลายรูปแบบ (กันพลาดเรื่องตัวพิมพ์เล็ก/ใหญ่)
      const userRoleId = actualUser.role_id ?? actualUser.roleId ?? actualUser.RoleId ?? actualUser.RoleID;

      // ถ้าหา Role ID ไม่เจอจริงๆ ค่อยดีดออก
      if (userRoleId === undefined || userRoleId === null) {
         console.warn("[RoleGuard] Role ID missing! Raw user:", user);
         // อย่าเพิ่งดีดออกทันที ให้ User เห็น Log ก่อน (หรือดีดออกถ้ามั่นใจ)
         router.replace("/");
         return;
      }

      // แก้ไข: เช็คสถานะประธานกรรมการ จากโครงสร้างของ Backend (committee_data.is_chairman)
      // เผื่อโครงสร้าง JSON เป็น is_chairman ที่ชั้นนอกสุดด้วย
      const isChairman = actualUser?.committee_data?.is_chairman || actualUser?.is_chairman || false;

      // ส่งสถานะ isChairman เข้าไปเช็คใน getRoleString
      const userRoleStr = getRoleString(Number(userRoleId), isChairman);
      console.log(`[RoleGuard] Checking Role: ${userRoleStr} (ID: ${userRoleId}, isChairman: ${isChairman})`);

      if (!allowedRoles.includes(userRoleStr)) {
        Swal.fire({
            icon: 'error',
            title: 'ไม่มีสิทธิ์เข้าถึง',
            text: `สิทธิ์ของคุณคือ ${userRoleStr} ไม่สามารถเข้าหน้านี้ได้`,
            timer: 2000,
            showConfirmButton: false
        });
        
        const dashboardMap: Record<string, string> = {
            student: "/student/main/hall-of-fame",
            student_development: "/student-development/hall-of-fame",
            head_of_department: "/head-of-department/hall-of-fame",
            associate_dean: "/associate-dean/hall-of-fame",
            dean: "/dean/hall-of-fame",
            student_development_committee: "/student-development-committee/hall-of-fame",
            chairman_of_student_development_committee: "/chairman-of-student-development-committee/hall-of-fame",
            chancellor: "/chancellor/hall-of-fame",
            organization: "/organization/main/hall-of-fame" // Role 9
        };
        
        // ส่งกลับไปยังหน้าแรกของสิทธิ์นั้นๆ
        router.replace(dashboardMap[userRoleStr] || "/");
      }
    }
  }, [user, isLoading, router, allowedRoles]);

  if (isLoading || !user) {
    return <div className="flex h-screen w-full items-center justify-center">Loading...</div>;
  }

  return <>{children}</>;
}