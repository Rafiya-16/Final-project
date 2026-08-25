import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { poolService } from "@/services/poolService";
import { projectService } from "@/services/projectService";
import { reportService } from "@/services/reportService";

/* ─── Animated counter hook ─── */
function useCountUp(target: number, duration = 900) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (target === 0) {
      setValue(0);
      return;
    }
    const start = performance.now();
    const raf = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(ease * target));
      if (progress < 1) requestAnimationFrame(raf);
    };
    requestAnimationFrame(raf);
  }, [target, duration]);
  return value;
}

/* ─── Arc progress component ─── */
function ArcProgress({ value, total }: { value: number; total: number }) {
  const pct = total > 0 ? value / total : 0;
  const r = 42;
  const circ = 2 * Math.PI * r;
  const dash = pct * circ;

  return (
    <svg
      width="110"
      height="110"
      viewBox="0 0 110 110"
      style={{ transform: "rotate(-90deg)" }}
    >
      <circle
        cx="55"
        cy="55"
        r={r}
        fill="none"
        stroke="#E8DCC8"
        strokeWidth="9"
      />
      <circle
        cx="55"
        cy="55"
        r={r}
        fill="none"
        stroke="url(#arcGrad)"
        strokeWidth="9"
        strokeDasharray={`${dash} ${circ}`}
        strokeLinecap="round"
        style={{ transition: "stroke-dasharray 1s cubic-bezier(0.4,0,0.2,1)" }}
      />
      <defs>
        <linearGradient id="arcGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#D4A574" />
          <stop offset="100%" stopColor="#C49A6C" />
        </linearGradient>
      </defs>
    </svg>
  );
}

/* ─── Stat card ─── */
interface CardProps {
  label: string;
  value: number;
  icon: React.ReactNode;
  color: string;
  gradient: string;
  delay: number;
  onClick: () => void;
  subtitle?: string;
}

function StatCard({
  label,
  value,
  icon,
  color,
  gradient,
  delay,
  onClick,
  subtitle,
}: CardProps) {
  const displayed = useCountUp(value);

  return (
    <button
      onClick={onClick}
      style={{
        all: "unset",
        cursor: "pointer",
        display: "block",
        background: "#FFFFFF",
        borderRadius: "28px",
        padding: "24px 24px",
        border: "1px solid #E8DCC8",
        boxShadow:
          "0 8px 20px -6px rgba(94, 60, 30, 0.08), 0 0 0 1px rgba(212, 165, 116, 0.08)",
        position: "relative",
        overflow: "hidden",
        animation: `slideUp 0.5s ease both`,
        animationDelay: `${delay}ms`,
        transition: "all 0.3s cubic-bezier(0.2, 0.9, 0.4, 1.1)",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-6px)";
        e.currentTarget.style.boxShadow =
          "0 20px 35px -12px rgba(94, 60, 30, 0.15), 0 0 0 1px rgba(212, 165, 116, 0.25)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow =
          "0 8px 20px -6px rgba(94, 60, 30, 0.08), 0 0 0 1px rgba(212, 165, 116, 0.08)";
      }}
    >
      <div
        style={{
          position: "absolute",
          top: -30,
          right: -30,
          width: 120,
          height: 120,
          borderRadius: "50%",
          background: gradient,
          opacity: 0.06,
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 20,
        }}
      >
        <div>
          <span
            style={{
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              color: "#A0845C",
            }}
          >
            {label}
          </span>
          {subtitle && (
            <p style={{ fontSize: 11, color: "#C4A484", marginTop: 4 }}>
              {subtitle}
            </p>
          )}
        </div>
        <div
          style={{
            width: 46,
            height: 46,
            borderRadius: 20,
            background: gradient,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: `0 8px 16px -6px ${color}60`,
            transition: "transform 0.2s",
          }}
        >
          {icon}
        </div>
      </div>

      <div
        style={{
          fontSize: 44,
          fontWeight: 800,
          color: "#4A3728",
          lineHeight: 1,
          fontVariantNumeric: "tabular-nums",
          fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
          letterSpacing: "-0.02em",
        }}
      >
        {displayed.toLocaleString()}
      </div>

      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: 4,
          background: gradient,
          borderRadius: "0 0 28px 28px",
        }}
      />
    </button>
  );
}

/* ─── Modal Component for Student Lists ─── */
interface StudentListModalProps {
  title: string;
  students: any[];
  onClose: () => void;
  type: "all" | "unassigned";
}

function StudentListModal({
  title,
  students,
  onClose,
  type,
}: StudentListModalProps) {
  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(0, 0, 0, 0.5)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        padding: "20px",
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "#FFFFFF",
          borderRadius: "28px",
          maxWidth: "900px",
          width: "100%",
          maxHeight: "80vh",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: "24px 28px",
            borderBottom: "1px solid #E8DCC8",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            background: "linear-gradient(135deg, #FDF8F0, #F9F2E7)",
            borderRadius: "28px 28px 0 0",
          }}
        >
          <div>
            <h2
              style={{
                fontSize: 24,
                fontWeight: 700,
                color: "#4A3728",
                margin: 0,
              }}
            >
              {title}
            </h2>
            <p style={{ fontSize: 14, color: "#8B7355", marginTop: 4 }}>
              Total: {students.length} students
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "rgba(212, 165, 116, 0.1)",
              border: "none",
              borderRadius: "50%",
              width: 40,
              height: 40,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(212, 165, 116, 0.2)";
              e.currentTarget.style.transform = "scale(1.05)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(212, 165, 116, 0.1)";
              e.currentTarget.style.transform = "scale(1)";
            }}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#4A3728"
              strokeWidth="2"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Modal Content */}
        <div style={{ padding: "24px 28px", overflowY: "auto", flex: 1 }}>
          {students.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px" }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>🎉</div>
              <p style={{ fontSize: 16, color: "#4A3728", fontWeight: 500 }}>
                No students found
              </p>
            </div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid #E8DCC8" }}>
                  <th
                    style={{
                      textAlign: "left",
                      padding: "12px 8px",
                      color: "#A0845C",
                      fontWeight: 600,
                      fontSize: 13,
                    }}
                  >
                    #
                  </th>
                  <th
                    style={{
                      textAlign: "left",
                      padding: "12px 8px",
                      color: "#A0845C",
                      fontWeight: 600,
                      fontSize: 13,
                    }}
                  >
                    Name
                  </th>
                  <th
                    style={{
                      textAlign: "left",
                      padding: "12px 8px",
                      color: "#A0845C",
                      fontWeight: 600,
                      fontSize: 13,
                    }}
                  >
                    Enrollment No
                  </th>
                  <th
                    style={{
                      textAlign: "left",
                      padding: "12px 8px",
                      color: "#A0845C",
                      fontWeight: 600,
                      fontSize: 13,
                    }}
                  >
                    Email
                  </th>
                  <th
                    style={{
                      textAlign: "left",
                      padding: "12px 8px",
                      color: "#A0845C",
                      fontWeight: 600,
                      fontSize: 13,
                    }}
                  >
                    Section
                  </th>
                </tr>
              </thead>
              <tbody>
                {students.map((student, idx) => (
                  <tr
                    key={student.id}
                    style={{
                      borderBottom: "1px solid #F0E8DC",
                      background:
                        type === "unassigned" && idx % 2 === 0
                          ? "rgba(239, 68, 68, 0.02)"
                          : "transparent",
                    }}
                  >
                    <td style={{ padding: "12px 8px", color: "#8B7355" }}>
                      {idx + 1}
                    </td>
                    <td
                      style={{
                        padding: "12px 8px",
                        fontWeight: 500,
                        color: "#4A3728",
                      }}
                    >
                      {student.firstName} {student.lastName}
                    </td>
                    <td
                      style={{
                        padding: "12px 8px",
                        fontFamily: "monospace",
                        color: "#8B7355",
                      }}
                    >
                      {student.enrollmentNo || "—"}
                    </td>
                    <td style={{ padding: "12px 8px", color: "#8B7355" }}>
                      {student.email}
                    </td>
                    <td style={{ padding: "12px 8px", color: "#8B7355" }}>
                      {student.section || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Modal Footer */}
        <div
          style={{
            padding: "16px 28px",
            borderTop: "1px solid #E8DCC8",
            display: "flex",
            justifyContent: "flex-end",
            background: "#FDF8F0",
            borderRadius: "0 0 28px 28px",
          }}
        >
          <button
            onClick={onClose}
            style={{
              padding: "10px 24px",
              background: "linear-gradient(135deg, #D4A574, #C49A6C)",
              border: "none",
              borderRadius: "12px",
              color: "white",
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow =
                "0 4px 12px rgba(212, 165, 116, 0.3)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Main Page ─── */
const DashboardPage = () => {
  const [facultyList, setFacultyList] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedPool, setSelectedPool] = useState("");
  const [pools, setPools] = useState<any[]>([]);
  const [loaded, setLoaded] = useState(false);

  // State for report summary data
  const [summary, setSummary] = useState<any>(null);
  const [teamReport, setTeamReport] = useState<any>(null);
  const [unassigned, setUnassigned] = useState<any[]>([]);
  const [allStudents, setAllStudents] = useState<any[]>([]);

  // Modal states
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [showUnassignedModal, setShowUnassignedModal] = useState(false);
  const [studentList, setStudentList] = useState<any[]>([]);
  const [modalTitle, setModalTitle] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    poolService.list().then((res) => {
      if (res.data?.length) {
        setPools(res.data);
        setSelectedPool(res.data[0].id);
      }
    });
  }, []);

  useEffect(() => {
    if (!selectedPool) return;
    setLoaded(false);
    Promise.all([
      projectService
        .getFacultyStatus(selectedPool)
        .then((res) => setFacultyList(res || [])),
      projectService
        .listByPool(selectedPool)
        .then((res) => setProjects(res || [])),
      reportService.summary(selectedPool).then((res) => setSummary(res)),
      reportService.teamReport(selectedPool).then((res) => setTeamReport(res)),
      reportService
        .unassigned(selectedPool)
        .then((res) => setUnassigned(res || [])),
      // Fetch all students from the pool
      // reportService.getAllStudents?.(selectedPool).then((res) => setAllStudents(res || [])) ||
      //   Promise.resolve([]),
    ]).then(() => setLoaded(true));
  }, [selectedPool]);

  const total = facultyList.length;
  const submitted = facultyList.filter((f) => f.hasSubmitted).length;
  const pending = total - submitted;
  const totalProjects = projects.length;
  const submissionRate = total > 0 ? Math.round((submitted / total) * 100) : 0;

  // Get summary values with fallbacks
  const totalStudents = summary?.totalStudents || allStudents.length || 0;
  const approvedProjects = summary?.approvedCount || 0;
  const teamsFormed = summary?.totalTeams || 0;
  const frozenTeams = summary?.frozenTeams || 0;
  const unassignedStudents =
    summary?.unassignedStudents || unassigned?.length || 0;

  // Handle Total Students click - show all students
  const handleTotalStudentsClick = async () => {
    try {
      let students = allStudents;
      // if (students.length === 0 && reportService.getAllStudents) {
      //   students = await reportService.getAllStudents(selectedPool);
      //   setAllStudents(students);
      // }
      setStudentList(students);
      setModalTitle("All Students");
      setShowStudentModal(true);
    } catch (error) {
      console.error("Error fetching students:", error);
    }
  };

  // Handle Unassigned Students click - show unassigned students
  const handleUnassignedClick = async () => {
    try {
      let unassignedList = unassigned;
      if (unassignedList.length === 0) {
        unassignedList = await reportService.unassigned(selectedPool);
        setUnassigned(unassignedList);
      }
      setStudentList(unassignedList);
      setModalTitle(`Unassigned Students (${unassignedList.length})`);
      setShowUnassignedModal(true);
    } catch (error) {
      console.error("Error fetching unassigned students:", error);
    }
  };

  const cards = [
    {
      label: "Total Faculty",
      value: total,
      gradient: "linear-gradient(135deg, #D4A574, #C49A6C)",
      color: "#D4A574",
      icon: <FacultyIcon />,
      onClick: () => navigate("/faculty"),
      subtitle: "Active members",
    },
    {
      label: "Submitted",
      value: submitted,
      gradient: "linear-gradient(135deg, #A8C3A4, #8FB28A)",
      color: "#A8C3A4",
      icon: <CheckIcon />,
      onClick: () => navigate("/faculty?status=submitted"),
      subtitle: "Completed proposals",
    },
    {
      label: "Pending",
      value: pending,
      gradient: "linear-gradient(135deg, #E8C4A0, #DCB48C)",
      color: "#E8C4A0",
      icon: <PendingIcon />,
      onClick: () => navigate("/faculty?status=pending"),
      subtitle: "Awaiting review",
    },
    {
      label: "Total Projects",
      value: totalProjects,
      gradient: "linear-gradient(135deg, #B8A99A, #A89582)",
      color: "#B8A99A",
      icon: <ProjectIcon />,
      onClick: () => navigate("/admin-projects"),
      subtitle: "Active projects",
    },
  ];

  const summaryCards = [
    {
      label: "Total Students",
      value: totalStudents,
      gradient: "linear-gradient(135deg, #667eea, #764ba2)",
      color: "#667eea",
      icon: <UsersIcon />,
      onClick: handleTotalStudentsClick,
      subtitle: "Enrolled students",
    },
    {
      label: "Approved Projects",
      value: approvedProjects,
      gradient: "linear-gradient(135deg, #10B981, #059669)",
      color: "#10B981",
      icon: <CheckCircleIcon />,
      onClick: () => navigate("/admin-projects?status=approved"),
      subtitle: "Approved for execution",
    },
    {
      label: "Teams Formed",
      value: teamsFormed,
      gradient: "linear-gradient(135deg, #3B82F6, #2563EB)",
      color: "#3B82F6",
      icon: <TeamsIcon />,
      onClick: () => navigate("/teams"),
      subtitle: "Active teams",
    },
    {
      label: "Frozen Teams",
      value: frozenTeams,
      gradient: "linear-gradient(135deg, #F59E0B, #D97706)",
      color: "#F59E0B",
      icon: <FreezeIcon />,
      onClick: () => navigate("/teams?status=frozen"),
      subtitle: "Completed teams",
    },
    {
      label: "Unassigned Students",
      value: unassignedStudents,
      gradient: "linear-gradient(135deg, #EF4444, #DC2626)",
      color: "#EF4444",
      icon: <UserXIcon />,
      onClick: handleUnassignedClick,
      subtitle: unassignedStudents > 0 ? "Need attention" : "All assigned",
    },
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:opsz,wght@14..32,300;14..32,400;14..32,500;14..32,600;14..32,700;14..32,800&family=Sora:wght@400;500;600;700&display=swap');

        @keyframes slideUp {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.98); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }

        body {
          background: #FDF8F0;
        }

        .dash-page * { 
          font-family: 'Inter', system-ui, -apple-system, sans-serif; 
          box-sizing: border-box; 
        }
        .dash-page h1, .dash-page h2, .dash-page h3 { 
          font-family: 'Sora', sans-serif; 
        }
        
        .dash-page select {
          appearance: none;
          background: #FFFFFF url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 12 12'%3E%3Cpath fill='%23D4A574' d='M6 8L1 3h10z'/%3E%3C/svg%3E") no-repeat right 14px center;
          border: 1px solid #E8DCC8;
          border-radius: 12px;
          padding: 10px 40px 10px 16px;
          font-size: 14px;
          font-weight: 500;
          color: #4A3728;
          cursor: pointer;
          transition: all 0.2s;
          background-color: #FFFFFF;
        }
        .dash-page select:hover { 
          border-color: #D4A574; 
          background-color: #FFFBF5;
        }
        .dash-page select:focus { 
          outline: none; 
          border-color: #D4A574; 
          box-shadow: 0 0 0 4px rgba(212, 165, 116, 0.12);
        }
        
        .dash-page .progress-track {
          transition: width 1.2s cubic-bezier(0.22, 0.97, 0.36, 1);
        }
      `}</style>

      <div
        className="dash-page"
        style={{
          minHeight: "100vh",
          background:
            "linear-gradient(135deg, #FDF8F0 0%, #F9F2E7 50%, #F5EDE1 100%)",
          padding: "40px 36px",
        }}
      >
        {/* Header Section */}
        <div style={{ animation: "fadeIn 0.5s ease both", marginBottom: 36 }}>
          <div
            style={{
              display: "flex",
              alignItems: "flex-end",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 20,
            }}
          >
            <div>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  background:
                    "linear-gradient(135deg, rgba(212,165,116,0.08), rgba(196,154,108,0.05))",
                  padding: "6px 14px",
                  borderRadius: 40,
                  marginBottom: 12,
                  border: "1px solid rgba(212,165,116,0.2)",
                }}
              >
                <span
                  style={{ fontSize: 12, fontWeight: 600, color: "#D4A574" }}
                >
                  ✦
                </span>
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    color: "#D4A574",
                  }}
                >
                  Welcome Back SubAdmin
                </span>
              </div>
              <h1
                style={{
                  fontSize: 38,
                  fontWeight: 700,
                  margin: 0,
                  letterSpacing: "-0.03em",
                  color: "#4A3728",
                }}
              >
                Dashboard
              </h1>
              <p
                style={{
                  fontSize: 15,
                  color: "#8B7355",
                  marginTop: 8,
                  fontWeight: 400,
                }}
              >
                Real-time overview • Faculty progress • Project insights
              </p>
            </div>

            {pools.length > 0 && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  background: "#FFFFFF",
                  padding: "6px 8px 6px 20px",
                  borderRadius: 60,
                  boxShadow:
                    "0 2px 8px rgba(94, 60, 30, 0.04), inset 0 0 0 1px rgba(212,165,116,0.1)",
                }}
              >
                <span
                  style={{ fontSize: 14, color: "#8B7355", fontWeight: 500 }}
                >
                  <span style={{ marginRight: 6 }}>🌾</span> Pool
                </span>
                <select
                  value={selectedPool}
                  onChange={(e) => setSelectedPool(e.target.value)}
                >
                  {pools.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name || p.id}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div
            style={{
              marginTop: 28,
              height: 1,
              background:
                "linear-gradient(90deg, #E8DCC8 0%, #D4A574 50%, transparent 100%)",
            }}
          />
        </div>

        {/* Faculty Stats Section Title */}
        <div style={{ marginBottom: 20 }}>
          <h2
            style={{
              fontSize: 20,
              fontWeight: 600,
              color: "#4A3728",
              marginBottom: 8,
            }}
          >
            Faculty Overview
          </h2>
          <p style={{ fontSize: 14, color: "#8B7355" }}>
            Track faculty submissions and project progress
          </p>
        </div>

        {/* Faculty Stat Cards Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: 24,
            marginBottom: 48,
          }}
        >
          {cards.map((c, i) => (
            <StatCard key={c.label} {...c} delay={i * 80} />
          ))}
        </div>

        {/* Program Stats Section Title */}
        <div style={{ marginBottom: 20 }}>
          <h2
            style={{
              fontSize: 20,
              fontWeight: 600,
              color: "#4A3728",
              marginBottom: 8,
            }}
          >
            Program Overview
          </h2>
          <p style={{ fontSize: 14, color: "#8B7355" }}>
            Student allocations, team formations, and project approvals
          </p>
        </div>

        {/* Summary Stats Cards Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: 24,
            marginBottom: 36,
          }}
        >
          {summaryCards.map((c, i) => (
            <StatCard key={c.label} {...c} delay={i * 80} />
          ))}
        </div>

        {/* Progress Panel */}
        <div
          style={{
            background: "#FFFFFF",
            borderRadius: 28,
            border: "1px solid #E8DCC8",
            boxShadow: "0 12px 28px -12px rgba(94, 60, 30, 0.08)",
            padding: "32px 36px",
            animation: "slideUp 0.5s 0.36s ease both",
            display: "flex",
            alignItems: "center",
            gap: 48,
            flexWrap: "wrap",
            marginBottom: 28,
          }}
        >
          <div style={{ position: "relative", flexShrink: 0 }}>
            <ArcProgress value={loaded ? submitted : 0} total={total} />
            <div
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                transform: "rotate(90deg)",
              }}
            >
              <span
                style={{
                  fontSize: 24,
                  fontWeight: 800,
                  color: "#4A3728",
                  fontFamily: "'Sora', sans-serif",
                  lineHeight: 1,
                }}
              >
                {submissionRate}%
              </span>
              <span
                style={{
                  fontSize: 11,
                  color: "#A0845C",
                  fontWeight: 600,
                  marginTop: 4,
                  letterSpacing: "0.3px",
                }}
              >
                completion
              </span>
            </div>
          </div>

          <div style={{ flex: 1, minWidth: 240 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 8,
              }}
            >
              <span style={{ fontSize: 20 }}>📊</span>
              <p
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  color: "#D4A574",
                  margin: 0,
                }}
              >
                Submission Progress
              </p>
            </div>
            <p
              style={{
                fontSize: 28,
                fontWeight: 700,
                color: "#4A3728",
                margin: "0 0 16px",
                fontFamily: "'Sora', sans-serif",
                letterSpacing: "-0.02em",
              }}
            >
              {submitted}{" "}
              <span style={{ fontSize: 18, fontWeight: 500, color: "#A0845C" }}>
                of {total} faculty
              </span>
            </p>

            <div
              style={{
                height: 10,
                borderRadius: 999,
                background: "#F0E8DC",
                overflow: "hidden",
              }}
            >
              <div
                className="progress-track"
                style={{
                  height: "100%",
                  width: `${submissionRate}%`,
                  borderRadius: 999,
                  background:
                    "linear-gradient(90deg, #D4A574, #C49A6C, #B8895E)",
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background:
                      "linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)",
                    animation: "shimmer 2s infinite",
                  }}
                />
              </div>
            </div>

            <div style={{ display: "flex", gap: 28, marginTop: 20 }}>
              <LegendItem color="#A8C3A4" label="Submitted" value={submitted} />
              <LegendItem color="#E8C4A0" label="Pending" value={pending} />
            </div>
          </div>

          <div
            style={{
              background: "linear-gradient(135deg, #FDF8F0, #F9F2E7)",
              borderRadius: 24,
              padding: "16px 24px",
              textAlign: "center",
              border: "1px solid #E8DCC8",
            }}
          >
            <div style={{ fontSize: 32, marginBottom: 8 }}>🌾</div>
            <p
              style={{
                fontWeight: 700,
                fontSize: 13,
                color: "#A0845C",
                marginBottom: 4,
              }}
            >
              Active Projects
            </p>
            <p
              style={{
                fontSize: 32,
                fontWeight: 800,
                color: "#4A3728",
                fontFamily: "'Sora', sans-serif",
              }}
            >
              {totalProjects}
            </p>
            <span
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: "#A8C3A4",
                background: "rgba(168, 195, 164, 0.15)",
                padding: "4px 10px",
                borderRadius: 20,
                display: "inline-block",
                marginTop: 8,
              }}
            >
              +12% growth
            </span>
          </div>
        </div>

        {/* Additional Info Cards */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: 20,
          }}
        >
          <div
            style={{
              background: "#FFFFFF",
              borderRadius: 24,
              padding: "20px 24px",
              border: "1px solid #E8DCC8",
              display: "flex",
              alignItems: "center",
              gap: 16,
              transition: "transform 0.2s",
              cursor: "pointer",
            }}
            // onClick={() => navigate("/reports")}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-4px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            <div style={{ fontSize: 36 }}>👥</div>
            <div>
              <p
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: "#A0845C",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                }}
              >
                Faculty Engagement
              </p>
              <p
                style={{
                  fontSize: 24,
                  fontWeight: 700,
                  color: "#4A3728",
                  marginTop: 4,
                }}
              >
                {submissionRate}%{" "}
                <span style={{ fontSize: 14, color: "#D4A574" }}>active</span>
              </p>
            </div>
          </div>
          <div
            style={{
              background: "#FFFFFF",
              borderRadius: 24,
              padding: "20px 24px",
              border: "1px solid #E8DCC8",
              display: "flex",
              alignItems: "center",
              gap: 16,
              transition: "transform 0.2s",
              cursor: "pointer",
            }}
            // onClick={() => navigate("/reports")}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-4px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            <div style={{ fontSize: 36 }}>📁</div>
            <div>
              <p
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: "#A0845C",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                }}
              >
                Project Density
              </p>
              <p
                style={{
                  fontSize: 24,
                  fontWeight: 700,
                  color: "#4A3728",
                  marginTop: 4,
                }}
              >
                {(totalProjects / total || 0).toFixed(1)}{" "}
                <span style={{ fontSize: 14, color: "#A0845C" }}>
                  per faculty
                </span>
              </p>
            </div>
          </div>
          <div
            style={{
              background: "#FFFFFF",
              borderRadius: 24,
              padding: "20px 24px",
              border: "1px solid #E8DCC8",
              display: "flex",
              alignItems: "center",
              gap: 16,
              transition: "transform 0.2s",
              cursor: "pointer",
            }}
            // onClick={() => navigate("/reports?tab=summary")}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-4px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            <div style={{ fontSize: 36 }}>⭐</div>
            <div>
              <p
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: "#A0845C",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                }}
              >
                Completion Rate
              </p>
              <p
                style={{
                  fontSize: 24,
                  fontWeight: 700,
                  color: "#4A3728",
                  marginTop: 4,
                }}
              >
                {submissionRate}%{" "}
                <span style={{ fontSize: 14, color: "#A8C3A4" }}>target</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {showStudentModal && (
        <StudentListModal
          title={modalTitle}
          students={studentList}
          onClose={() => setShowStudentModal(false)}
          type="all"
        />
      )}
      {showUnassignedModal && (
        <StudentListModal
          title={modalTitle}
          students={studentList}
          onClose={() => setShowUnassignedModal(false)}
          type="unassigned"
        />
      )}
    </>
  );
};

/* ─── Legend item ─── */
function LegendItem({
  color,
  label,
  value,
}: {
  color: string;
  label: string;
  value: number;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <div
        style={{
          width: 10,
          height: 10,
          borderRadius: "50%",
          background: color,
          boxShadow: `0 0 0 2px ${color}30`,
        }}
      />
      <span style={{ fontSize: 13, fontWeight: 500, color: "#8B7355" }}>
        {label}
      </span>
      <span style={{ fontSize: 14, fontWeight: 700, color: "#4A3728" }}>
        {value}
      </span>
    </div>
  );
}

/* ─── Icons for Summary Cards ─── */
function UsersIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#fff"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function CheckCircleIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#fff"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}

function TeamsIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#fff"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
      <path d="M17 3.5a4 4 0 0 1 0 7.5" />
    </svg>
  );
}

function FreezeIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#fff"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 2v20M17 7l-5-5-5 5M17 17l-5 5-5-5" />
    </svg>
  );
}

function UserXIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#fff"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="8.5" cy="7" r="4" />
      <line x1="18" y1="8" x2="23" y2="13" />
      <line x1="23" y1="8" x2="18" y2="13" />
    </svg>
  );
}

/* ─── Original Icons ─── */
function FacultyIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#fff"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#fff"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function PendingIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#fff"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function ProjectIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#fff"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="2" y="3" width="20" height="14" rx="2" />
      <path d="M8 21h8M12 17v4" />
    </svg>
  );
}

export default DashboardPage;
