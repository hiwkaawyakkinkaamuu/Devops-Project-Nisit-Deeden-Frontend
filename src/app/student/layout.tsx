import RoleGuard from "@/components/auth/RoleGuard"; // Import เข้ามา
import StudentFormLayout from "@/components/layouts/StudentFormLayout"; // Layout ความสวยงามเดิมของคุณ

export default function StudentRootLayout({ children }: { children: React.ReactNode }) {
  return (
    // ครอบด้วย RoleGuard และระบุว่าหน้านี้ให้เข้าได้เฉพาะ "student"
    <RoleGuard allowedRoles={['student']}>
        <StudentFormLayout>
            {children}
        </StudentFormLayout>
    </RoleGuard>
  );
}