"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Trophy, Medal, GraduationCap, 
  Sparkles, Award, CalendarDays, X, BookOpen, Info
} from "lucide-react";
import { api } from "@/lib/axios";

const USE_MOCK_DATA = true; 

const MAIN_CATEGORIES = [
  "ด้านกิจกรรมเสริมหลักสูตร",
  "ด้านความคิดสร้างสรรค์และนวัตกรรม",
  "ด้านประพฤติดี" 
];

const CATEGORY_DESCRIPTIONS: Record<string, string> = {
  "ด้านกิจกรรมเสริมหลักสูตร": "ผลงานที่แสดงถึงความเสียสละ ความเป็นผู้นํา และการทําประโยชน์เพื่อสังคมและส่วนรวม",
  "ด้านความคิดสร้างสรรค์และนวัตกรรม": "ผลงานที่เกิดจากการคิดค้น สิ่งประดิษฐ์ หรือแนวคิดใหม่ๆ ที่เป็นประโยชน์และเป็นที่ยอมรับ",
  "ด้านประพฤติดี": "ผลงานที่แสดงถึงความมีวินัย ความซื่อสัตย์ ความรับผิดชอบ และการเป็นแบบอย่างที่ดีในมหาวิทยาลัย",
  "ประเภทอื่นๆ": "ผลงานด้านอื่นๆ ที่นิสิตได้แสดงศักยภาพ สร้างชื่อเสียง และทําคุณประโยชน์ให้แก่มหาวิทยาลัย นอกเหนือจาก 3 ประเภทหลัก"
};

const mockFaculties: Record<number, string> = {
  1: "วิทยาศาสตร์", 2: "วิศวกรรมศาสตร์", 3: "สังคมศาสตร์", 4: "สถาปัตยกรรมศาสตร์", 5: "บริหารธุรกิจ",
};
const mockDepartments: Record<number, string> = {
  1: "วิทยาการคอมพิวเตอร์", 2: "วิศวกรรมซอฟต์แวร์", 3: "รัฐศาสตร์", 4: "สถาปัตยกรรมภายใน", 5: "การเงิน",
};
const mockAwards = [
  { form_id: 1, academic_year: 2567, semester: 2, form_status: 13, award_type_name: "ด้านกิจกรรมเสริมหลักสูตร", student_firstname: "ภูมิภัทร", student_lastname: "ชัยชนะ", faculty_id: 1, department_id: 1, gpa: 3.85, project_name: "ประธานค่ายอาสาพัฒนาชนบท" },
  { form_id: 2, academic_year: 2567, semester: 2, form_status: 13, award_type_name: "ด้านกิจกรรมเสริมหลักสูตร", student_firstname: "ณัฐณิชา", student_lastname: "รักเรียน", faculty_id: 2, department_id: 2, gpa: 3.92, project_name: "ผู้นําเชียร์มหาวิทยาลัย" },
  { form_id: 3, academic_year: 2567, semester: 2, form_status: 13, award_type_name: "ด้านความคิดสร้างสรรค์และนวัตกรรม", student_firstname: "สมชาย", student_lastname: "ยอดเยี่ยม", faculty_id: 2, department_id: 2, gpa: 3.75, project_name: "แอปพลิเคชัน AI ตรวจจับโรคพืช" }, 
  { form_id: 4, academic_year: 2567, semester: 1, form_status: 13, award_type_name: "ด้านประพฤติดี", student_firstname: "กฤติน", student_lastname: "ปัญญาเลิศ", faculty_id: 5, department_id: 5, gpa: 4.00, project_name: "ผู้นําชุมชนที่มีความซื่อสัตย์และมีวินัย" },
  { form_id: 5, academic_year: 2567, semester: 1, form_status: 13, award_type_name: "ด้านกีฬาและนันทนาการ (อื่นๆ)", student_firstname: "พัชรพล", student_lastname: "เข้มแข็ง", faculty_id: 3, department_id: 3, gpa: 3.50, project_name: "นักกีฬาทีมชาติไทย (เหรียญทอง)" },
  { form_id: 6, academic_year: 2566, semester: 2, form_status: 13, award_type_name: "ด้านกิจกรรมเสริมหลักสูตร", student_firstname: "อริสรา", student_lastname: "ใจดี", faculty_id: 4, department_id: 4, gpa: 3.88, project_name: "โครงการปลูกป่ารักษ์โลก" },
  { form_id: 7, academic_year: 2566, semester: 2, form_status: 13, award_type_name: "ด้านความคิดสร้างสรรค์และนวัตกรรม", student_firstname: "ธนวัฒน์", student_lastname: "สร้างสรรค์", faculty_id: 2, department_id: 2, gpa: 3.65, project_name: "หุ่นยนต์กู้ภัยอัจฉริยะ" },
  { form_id: 8, academic_year: 2566, semester: 1, form_status: 13, award_type_name: "ด้านประพฤติดี", student_firstname: "ชัญญา", student_lastname: "เรียนเยี่ยม", faculty_id: 1, department_id: 1, gpa: 3.98, project_name: "เหรียญทองโอลิมปิกวิชาการ" },
  { form_id: 9, academic_year: 2565, semester: 2, form_status: 13, award_type_name: "ด้านประพฤติดี", student_firstname: "ธีรเดช", student_lastname: "มุ่งมั่น", faculty_id: 5, department_id: 5, gpa: 3.95, project_name: "ชนะเลิศแผนธุรกิจ Startup" },
  { form_id: 10, academic_year: 2565, semester: 2, form_status: 13, award_type_name: "ด้านความคิดสร้างสรรค์และนวัตกรรม", student_firstname: "สุดา", student_lastname: "รักชาติ", faculty_id: 1, department_id: 1, gpa: 3.80, project_name: "นวัตกรรมบรรจุภัณฑ์ย่อยสลายได้" }, 
];

interface Period {
  year: number;
  semester: number;
  id: string; 
}

export default function HallOfFamePage() {
  const [loading, setLoading] = useState(true);
  const [awards, setAwards] = useState<any[]>([]);
  const [faculties, setFaculties] = useState<Record<number, string>>({});
  const [departments, setDepartments] = useState<Record<number, string>>({});
  const [periods, setPeriods] = useState<Period[]>([]);
  const [activePeriodId, setActivePeriodId] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);

  const [isFloating, setIsFloating] = useState(false);
  const [isNavVisible, setIsNavVisible] = useState(true);
  const lastScrollY = useRef(0);
  const navbarRef = useRef<HTMLDivElement>(null);

  // ==========================================
  // 1. Data Fetching
  // ==========================================
  useEffect(() => {
    let isMounted = true;
    const fetchAllData = async () => {
      setLoading(true);
      if (USE_MOCK_DATA) {
        setTimeout(() => {
          if (isMounted) processAndSetData(mockAwards, mockFaculties, mockDepartments);
        }, 800); 
        return;
      }
      try {
        const [facultyRes, departmentRes, awardsRes] = await Promise.all([
          api.get(`/faculty/`).catch(() => null),
          api.get(`/department/`).catch(() => null),
          api.get(`/awards/search`, { params: { limit: 3000 } }).catch(() => null)
        ]);
        const facultyMap: Record<number, string> = {};
        facultyRes?.data?.data?.forEach((f: any) => { facultyMap[f.faculty_id] = f.faculty_name; });
        const departmentMap: Record<number, string> = {};
        departmentRes?.data?.data?.forEach((d: any) => { departmentMap[d.department_id] = d.department_name; });
        const rawAwards = awardsRes?.data?.data || [];
        const approvedAwards = rawAwards.filter((item: any) => item.form_status === 13 || item.form_status_id === 13);
        if (isMounted) processAndSetData(approvedAwards, facultyMap, departmentMap);
      } catch (error) {
        console.error("Error fetching Hall of Fame:", error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchAllData();
    return () => { isMounted = false; };
  }, []);

  const processAndSetData = (dataList: any[], facultyMap: Record<number, string>, departmentMap: Record<number, string>) => {
    setFaculties(facultyMap);
    setDepartments(departmentMap);
    setAwards(dataList);
    const uniquePeriodsMap = new Map<string, Period>();
    dataList.forEach(item => {
      const s = item.semester || 1;
      const y = item.academic_year;
      if (y) {
        const id = `${y}-${s}`;
        uniquePeriodsMap.set(id, { year: y, semester: s, id });
      }
    });
    const sortedPeriods = Array.from(uniquePeriodsMap.values()).sort((a, b) => {
      if (a.year !== b.year) return b.year - a.year;
      return b.semester - a.semester;
    });
    setPeriods(sortedPeriods);
    if (sortedPeriods.length > 0) setActivePeriodId(sortedPeriods[0].id);
    setLoading(false);
  };

  // ==========================================
  // 2. Data Grouping
  // ==========================================
  const groupedData = useMemo(() => {
    const result: Record<string, Record<string, any[]>> = {};
    periods.forEach(p => {
      result[p.id] = { "ประเภทอื่นๆ": [] };
      MAIN_CATEGORIES.forEach(cat => result[p.id][cat] = []);
      const periodAwards = awards.filter(item => item.academic_year === p.year && (item.semester || 1) === p.semester);
      periodAwards.forEach(item => {
        const typeName = item.award_type_name || item.award_type;
        const mainCat = MAIN_CATEGORIES.find(cat => typeName.includes(cat));
        if (mainCat) result[p.id][mainCat].push(item);
        else result[p.id]["ประเภทอื่นๆ"].push(item);
      });
    });
    return result;
  }, [awards, periods]);

  const formatAwardeeName = (item: any) => {
    let fullName = `${item.student_firstname || ""} ${item.student_lastname !== "-" ? item.student_lastname : ""}`.trim();
    if (!fullName) fullName = item.organization_name || "นิสิต (ไม่ระบุชื่อ)";
    const facultyName = faculties[item.faculty_id];
    const departmentName = departments[item.department_id];
    return { name: fullName, faculty: facultyName, department: departmentName };
  };

  // ==========================================
  // 3. Scroll Logic — Floating Navbar
  // ==========================================
  const scrollToPeriod = (id: string) => {
    const element = document.getElementById(`section-${id}`);
    if (element) {
      const offset = 120;
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = element.getBoundingClientRect().top;
      window.scrollTo({ top: (elementRect - bodyRect) - offset, behavior: "smooth" });
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      const currentY = window.scrollY;
      lastScrollY.current = currentY;

      //  เปลี่ยนเป็น floating เมื่อ scroll เลย hero — แสดงตลอดทั้งขึ้นและลง
      setIsFloating(currentY > 350);

      // Track active section
      const scrollPosition = currentY + 200;
      for (const p of periods) {
        const element = document.getElementById(`section-${p.id}`);
        if (element) {
          const top = element.offsetTop;
          const bottom = top + element.offsetHeight;
          if (scrollPosition >= top && scrollPosition <= bottom) {
            setActivePeriodId(p.id);
            break;
          }
        }
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [periods]);

  // ==========================================
  // Render
  // ==========================================
  return (
    <div className="min-h-screen bg-slate-50/50 font-sans pb-40 selection:bg-emerald-200 relative">

      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      {/* Hero Section */}
      <div className="relative bg-white pt-36 pb-24 overflow-hidden border-b border-slate-200 shadow-sm">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-gradient-to-b from-emerald-50/80 to-transparent blur-[80px] pointer-events-none"></div>
        <div className="absolute -top-20 right-[5%] w-[400px] h-[400px] bg-yellow-50/50 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="max-w-5xl mx-auto px-6 relative z-10 text-center">
          <motion.div 
            initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 150, damping: 15 }}
            className="inline-flex items-center justify-center p-6 bg-white rounded-full mb-8 shadow-[0_15px_40px_-10px_rgba(16,185,129,0.2)] border border-emerald-100/50 relative"
          >
            <Trophy className="w-16 h-16 text-emerald-600 drop-shadow-sm" strokeWidth={1.2} />
            <Sparkles className="absolute -top-2 -right-4 w-10 h-10 text-yellow-400 animate-pulse" />
          </motion.div>
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }}>
            <h1 className="text-5xl md:text-7xl font-black text-slate-900 tracking-tight mb-6">
              ทําเนียบ<span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-500">นิสิตดีเด่น</span>
            </h1>
            <p className="text-slate-500 text-lg md:text-2xl font-light max-w-2xl mx-auto leading-relaxed">
              มหาวิทยาลัยเกษตรศาสตร์ ยกย่องและเชิดชูเกียรตินิสิต<br className="hidden md:block"/>ผู้สร้างชื่อเสียงและเป็นแบบอย่างที่ดีในแต่ละภาคการศึกษา
            </p>
          </motion.div>
        </div>
      </div>

      {/*  Navbar — ใช้ AnimatePresence + motion.div เพื่อ animate การเปลี่ยน layout */}
      <div className="h-[72px] relative z-[100]">
        <AnimatePresence mode="wait">
          {isFloating ? (
            // ============================
            // 🫧 FLOATING CAPSULE MODE
            // ============================
            <motion.div
              key="floating"
              ref={navbarRef}
              // เข้า: ลอยขึ้นมาจากด้านบน, ออก: หายขึ้นไป
              initial={{ y: -80, opacity: 0, scale: 0.95 }}
              animate={{ 
                y: 0, 
                opacity: 1,
                scale: 1
              }}
              exit={{ y: -80, opacity: 0, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 400, damping: 35, mass: 0.8 }}
              className="fixed top-4 z-[100]"
              //  offset sidebar ซ้าย 16rem ตาม layout ของโปรเจกต์
              style={{ left: "calc(16rem + 1rem)", right: "1rem" }}
            >
              <div className="max-w-3xl mx-auto">
                <div className="bg-white/85 backdrop-blur-2xl shadow-[0_8px_32px_-8px_rgba(0,0,0,0.18),0_0_0_1px_rgba(0,0,0,0.06)] rounded-full px-3 py-2 flex items-center gap-1.5">
                  
                  {/* Label แสดงตอน floating */}
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-100 shrink-0 mr-1">
                    <CalendarDays className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-[11px] font-black text-emerald-600 uppercase tracking-widest hidden sm:block">ปี/เทอม</span>
                  </div>

                  <div className="flex items-center gap-1 overflow-x-auto no-scrollbar flex-1">
                    {!loading && periods.map((p) => {
                      const isActive = activePeriodId === p.id;
                      return (
                        <button
                          key={p.id}
                          onClick={() => scrollToPeriod(p.id)}
                          className={`
                            relative px-4 py-2 rounded-full text-[13px] font-bold whitespace-nowrap transition-colors duration-200 shrink-0 z-10
                            ${isActive ? "text-emerald-900" : "text-slate-500 hover:text-slate-800"}
                          `}
                        >
                          {isActive && (
                            <motion.div
                              layoutId="nav-active-pill"
                              className="absolute inset-0 bg-emerald-100 border border-emerald-200/80 rounded-full -z-10 shadow-sm"
                              transition={{ type: "spring", stiffness: 500, damping: 40 }}
                            />
                          )}
                          ปี {p.year}/{p.semester}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </motion.div>

          ) : (
            // ============================
            // 📌 STICKY BANNER MODE
            // ============================
            <motion.div
              key="sticky"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="absolute top-0 w-full bg-white/80 backdrop-blur-md border-b border-slate-200/60 z-[90]"
            >
              <div className="flex items-center gap-2 px-6 py-4 overflow-x-auto no-scrollbar">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-full shrink-0 border border-slate-200 mr-1">
                  <CalendarDays className="w-4 h-4 text-slate-500" />
                  <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest hidden sm:block">ปี/เทอม</span>
                </div>

                {!loading && periods.map((p) => {
                  const isActive = activePeriodId === p.id;
                  return (
                    <button
                      key={p.id}
                      onClick={() => scrollToPeriod(p.id)}
                      className={`
                        relative px-5 py-2.5 rounded-full text-[14px] font-bold whitespace-nowrap transition-colors duration-200 shrink-0 z-10
                        ${isActive ? "text-emerald-900" : "text-slate-500 hover:text-slate-800"}
                      `}
                    >
                      {isActive && (
                        <motion.div
                          layoutId="nav-active-pill"
                          className="absolute inset-0 bg-emerald-100 border border-emerald-200/80 rounded-full -z-10 shadow-sm"
                          transition={{ type: "spring", stiffness: 500, damping: 40 }}
                        />
                      )}
                      ปี {p.year} / {p.semester}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-6 pt-16">
        {loading ? (
          <div className="space-y-24">
            {[1, 2].map(i => (
              <div key={i} className="animate-pulse">
                <div className="h-12 bg-slate-200 rounded-xl w-64 mb-10"></div>
                <div className="bg-white rounded-[32px] p-10 border border-slate-200">
                  <div className="h-8 bg-slate-100 rounded-lg w-1/3 mb-10"></div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="h-20 bg-slate-50 rounded-[20px] w-full"></div>
                    <div className="h-20 bg-slate-50 rounded-[20px] w-full"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : periods.length === 0 ? (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-[40px] p-24 text-center shadow-xl border border-slate-200">
            <div className="bg-slate-50 w-28 h-28 rounded-full flex items-center justify-center mx-auto mb-6 border border-slate-100">
              <Award className="w-12 h-12 text-slate-300" />
            </div>
            <h3 className="text-2xl font-bold text-slate-800 mb-2">ยังไม่มีข้อมูลทําเนียบในระบบ</h3>
            <p className="text-slate-500">รายชื่อผู้ได้รับรางวัลจะปรากฏที่นี่หลังจากการพิจารณาอนุมัติเสร็จสิ้น</p>
          </motion.div>
        ) : (
          <div className="space-y-32">
            {periods.map((p) => {
              const pGroups = groupedData[p.id];
              return (
                <section key={p.id} id={`section-${p.id}`} className="scroll-mt-32 relative">
                  <div className="absolute left-[23px] top-16 bottom-0 w-[3px] bg-emerald-100/50 hidden lg:block -z-10 rounded-full"></div>
                  <motion.div 
                    initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, margin: "-100px" }}
                    className="flex items-center gap-6 mb-12 relative"
                  >
                    <div className="w-12 h-12 shrink-0 bg-white border-[4px] border-emerald-500 rounded-full shadow-[0_0_15px_rgba(16,185,129,0.3)] hidden lg:flex items-center justify-center relative z-10">
                      <div className="w-4 h-4 bg-emerald-500 rounded-full"></div>
                    </div>
                    <div className="flex-1">
                      <h2 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight">ปีการศึกษา {p.year}</h2>
                      <p className="text-emerald-600 font-bold text-lg mt-1 tracking-wide">ภาคเรียนที่ {p.semester}</p>
                    </div>
                    <div className="h-[2px] flex-1 bg-gradient-to-r from-slate-200 to-transparent rounded-full mt-4 hidden md:block"></div>
                  </motion.div>

                  <div className="space-y-12 lg:pl-20">
                    {MAIN_CATEGORIES.map((category) => {
                      const items = pGroups[category] || [];
                      if (items.length === 0) return null;
                      return <CategoryCard key={category} title={category} items={items} formatName={formatAwardeeName} onClickUser={setSelectedUser} />;
                    })}
                    {pGroups["ประเภทอื่นๆ"]?.length > 0 && (
                      <CategoryCard title="ประเภทอื่นๆ" items={pGroups["ประเภทอื่นๆ"]} formatName={formatAwardeeName} onClickUser={setSelectedUser} />
                    )}
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </div>

      {/* User Details Modal */}
      <AnimatePresence>
        {selectedUser && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6"
            onClick={() => setSelectedUser(null)}
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }}
              onClick={(e) => e.stopPropagation()} 
              className="bg-white w-full max-w-2xl rounded-[32px] shadow-2xl overflow-hidden relative border border-white/50"
            >
              <div className="h-28 bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-400 relative">
                <button onClick={() => setSelectedUser(null)} className="absolute top-4 right-4 bg-black/20 hover:bg-black/40 text-white p-2 rounded-full backdrop-blur-md transition-colors">
                  <X className="w-5 h-5" />
                </button>
                <div className="absolute -bottom-10 left-8">
                  <div className="w-20 h-20 bg-white rounded-full p-1.5 shadow-lg border border-slate-100">
                    <div className="w-full h-full rounded-full bg-gradient-to-br from-emerald-100 to-yellow-100 flex items-center justify-center text-emerald-700 font-black text-2xl">
                      {formatAwardeeName(selectedUser).name.charAt(0)}
                    </div>
                  </div>
                </div>
              </div>
              <div className="pt-14 pb-8 px-8">
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <h2 className="text-3xl font-black text-slate-800 tracking-tight">{formatAwardeeName(selectedUser).name}</h2>
                    <div className="flex flex-wrap items-center gap-2 mt-3">
                      <span className="bg-emerald-50 text-emerald-700 text-sm font-bold px-3 py-1 rounded-lg border border-emerald-100">
                        {selectedUser.award_type_name || selectedUser.award_type}
                      </span>
                      {formatAwardeeName(selectedUser).faculty && (
                        <span className="text-slate-600 text-sm font-medium bg-slate-50 px-3 py-1 rounded-lg border border-slate-200">
                          คณะ{formatAwardeeName(selectedUser).faculty}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="bg-gradient-to-br from-yellow-300 to-yellow-500 p-[2px] rounded-2xl shadow-md shrink-0">
                    <div className="bg-white rounded-xl px-4 py-2 text-center">
                      <span className="block text-[10px] font-black text-slate-400 uppercase tracking-wider">GPA</span>
                      <span className="block text-xl font-black text-slate-800">{selectedUser.gpa ? selectedUser.gpa.toFixed(2) : "-"}</span>
                    </div>
                  </div>
                </div>
                <div className="h-[1px] w-full bg-slate-100 my-6"></div>
                <div>
                  <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <BookOpen className="w-4 h-4" /> ผลงานที่โดดเด่น
                  </h4>
                  <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-emerald-400"></div>
                    <p className="text-lg font-medium text-slate-700">
                      {selectedUser.project_name || "โครงงาน/กิจกรรมที่สร้างชื่อเสียงให้กับมหาวิทยาลัย"}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ==========================================
// Category Card Component
// ==========================================
function CategoryCard({ title, items, formatName, onClickUser }: { 
  title: string; 
  items: any[]; 
  formatName: (item: any) => { name: string; faculty: string | undefined; department: string | undefined }; 
  onClickUser: (user: any) => void;
}) {
  const description = CATEGORY_DESCRIPTIONS[title] || CATEGORY_DESCRIPTIONS["ประเภทอื่นๆ"];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-50px" }} transition={{ duration: 0.6, ease: "easeOut" }}
      className="bg-white rounded-[32px] shadow-[0_8px_30px_-12px_rgba(0,0,0,0.06)] border border-slate-200/80 relative group/card transition-all duration-300 hover:shadow-[0_15px_40px_-15px_rgba(16,185,129,0.15)] hover:border-emerald-300/60"
    >
      <div className="absolute top-0 left-0 w-full h-[4px] rounded-t-[32px] bg-gradient-to-r from-emerald-400 via-emerald-300 to-emerald-500 transform origin-left scale-x-0 group-hover/card:scale-x-100 transition-transform duration-500 ease-out"></div>

      <div className="px-8 pt-10 pb-6 border-b border-slate-100 bg-slate-50/50 rounded-t-[32px]">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-white shadow-sm border border-slate-200 rounded-2xl group-hover/card:scale-110 group-hover/card:rotate-3 transition-transform duration-300">
            <Medal className="w-7 h-7 text-emerald-600" />
          </div>
          <h3 className="text-[26px] font-extrabold text-slate-800 tracking-tight flex items-center gap-3">
            {title}
            <div className="relative group/tooltip flex items-center justify-center cursor-help z-50">
              <Info className="w-5 h-5 text-slate-300 hover:text-emerald-500 transition-colors" />
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-72 bg-slate-800 text-white text-sm font-medium p-4 rounded-xl opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all duration-200 shadow-2xl text-center pointer-events-none">
                {description}
                <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-slate-800 rotate-45"></div>
              </div>
            </div>
          </h3>
        </div>
      </div>

      <div className="p-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-10 gap-y-5">
          {items.map((item, index) => {
            const { name, faculty } = formatName(item);
            return (
              <motion.div 
                key={item.form_id} 
                onClick={() => onClickUser(item)} 
                whileHover={{ x: 6, backgroundColor: "#f8fafc" }}
                className="flex items-start gap-5 p-4 rounded-[20px] border border-transparent hover:border-slate-200 transition-all duration-300 cursor-pointer shadow-sm hover:shadow-md group/item"
              >
                <div className="w-12 h-12 shrink-0 bg-gradient-to-br from-slate-100 to-slate-200 text-slate-500 font-black text-xl rounded-[14px] flex items-center justify-center border border-slate-300 shadow-sm relative overflow-hidden group-hover/item:text-emerald-700 group-hover/item:border-emerald-200 transition-colors">
                  <div className="absolute inset-0 bg-white/40"></div>
                  <span className="relative z-10">{index + 1}</span>
                </div>
                <div className="flex-1 pt-1">
                  <h4 className="text-[18px] font-bold text-slate-800 leading-snug group-hover/item:text-emerald-700 transition-colors">{name}</h4>
                  {faculty && (
                    <div className="mt-2.5 flex items-center gap-1.5 text-[14px] text-slate-500 font-medium">
                      <GraduationCap className="w-4 h-4 text-emerald-500" />
                      <span>คณะ{faculty}</span>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}