import React, { useEffect, useState } from "react";
import { poolService } from "@/services/poolService";
import { projectService } from "@/services/projectService";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import {
  Lock,
  AlertTriangle,
  Send,
  ClipboardList,
  ChevronRight,
  ArrowRight,
} from "lucide-react";
import toast from "react-hot-toast";
import type {
  Pool,
  Project,
  FacultyStatus,
  ReviewDecision,
} from "@/types";
import { getErrorMessage } from "@/types";

const font = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=Sora:wght@300;400;500;600&display=swap');
`;

const css = `
  .rp-root { font-family: 'Sora', sans-serif; }
  .rp-root * { box-sizing: border-box; }

  .rp-select {
    appearance: none;
    background: #fffbf5 url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%23b45309' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E") no-repeat right 14px center;
    padding: 10px 36px 10px 14px;
    border: 1.5px solid #f0bc12;
    border-radius: 10px;
    font-family: 'Sora', sans-serif;
    font-size: 13px;
    font-weight: 500;
    color: #92400e;
    cursor: pointer;
    transition: border-color 0.15s, box-shadow 0.15s;
  }

  .rp-select:focus {
    outline: none;
    border-color: #f59e0b;
    box-shadow: 0 0 0 3px rgba(245,158,11,0.15);
  }

  .rp-faculty-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 24px;
    cursor: default;
    border-bottom: 1px solid rgba(245,158,11,0.08);
    transition: background 0.12s;
    position: relative;
  }

  .rp-faculty-row.clickable {
    cursor: pointer;
  }

  .rp-faculty-row.clickable:hover {
    background: rgba(245,158,11,0.05);
  }

  .rp-faculty-row.active {
    background: linear-gradient(90deg, rgba(245,158,11,0.12) 0%, transparent 100%);
  }

  .rp-faculty-row.active::before {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 3px;
    background: linear-gradient(180deg, #f59e0b, #d97706);
    border-radius: 0 2px 2px 0;
  }

  .rp-faculty-row:last-child {
    border-bottom: none;
  }

  .badge-submitted,
  .badge-awaiting,
  .badge-reviewed {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    font-size: 11px;
    letter-spacing: 0.04em;
    padding: 3px 10px;
    border-radius: 20px;
  }

  .badge-submitted {
    font-weight: 600;
    color: #065f46;
    background: #d1fae5;
  }

  .badge-awaiting {
    font-weight: 500;
    color: #9ca3af;
    background: #f3f4f6;
  }

  .badge-reviewed {
    font-weight: 600;
    color: #166534;
    background: #dcfce7;
  }

  .rp-card {
    background: #fff;
    border-radius: 16px;
    border: 1.5px solid #e5e7eb;
    padding: 24px;
    transition: border-color 0.15s, transform 0.12s, box-shadow 0.15s;
  }

  .rp-card:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 20px rgba(235, 190, 11, 0.06);
  }

  .rp-card.state-lock {
    border-color: #34d399;
    background: #f0fdf9;
  }

  .rp-card.state-hold {
    border-color: #fbbf24;
    background: #fffbeb;
  }

  .rp-btn-lock,
  .rp-btn-hold {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    padding: 9px 18px;
    border-radius: 10px;
    font-size: 13px;
    font-weight: 600;
    font-family: 'Sora', sans-serif;
    cursor: pointer;
    transition: all 0.14s;
    border: 1.5px solid;
  }

  .rp-btn-lock {
    color: #065f46;
    background: #fff;
    border-color: #d1fae5;
  }

  .rp-btn-lock:hover {
    background: #ecfdf5;
    border-color: #6ee7b7;
  }

  .rp-btn-lock.active {
    background: #059669;
    border-color: #059669;
    color: #fff;
  }

  .rp-btn-hold {
    color: #92400e;
    background: #fff;
    border-color: #fde68a;
  }

  .rp-btn-hold:hover {
    background: #fffbeb;
    border-color: #fcd34d;
  }

  .rp-btn-hold.active {
    background: #d97706;
    border-color: #d97706;
    color: #fff;
  }

  .rp-progress-track {
    height: 4px;
    background: rgba(255,255,255,0.25);
    border-radius: 2px;
    overflow: hidden;
  }

  .rp-progress-fill {
    height: 100%;
    background: #fff;
    border-radius: 2px;
    transition: width 0.3s cubic-bezier(0.4,0,0.2,1);
  }

  .rp-submit {
    width: 100%;
    padding: 15px;
    border-radius: 14px;
    border: none;
    font-family: 'Sora', sans-serif;
    font-size: 15px;
    font-weight: 600;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
    color: #fff;
    letter-spacing: 0.02em;
    transition: opacity 0.15s, transform 0.12s, box-shadow 0.15s;
    box-shadow: 0 2px 16px rgba(217,119,6,0.28);
  }

  .rp-submit:hover {
    opacity: 0.92;
    transform: translateY(-1px);
    box-shadow: 0 6px 24px rgba(217,119,6,0.35);
  }

  .rp-submit:active {
    transform: translateY(0);
  }

  .rp-index {
    width: 28px;
    height: 28px;
    border-radius: 8px;
    background: #fef3c7;
    color: #92400e;
    font-size: 12px;
    font-weight: 700;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  @media (prefers-color-scheme: dark) {
    .rp-select {
      background-color: #725d2b;
      color: #f1bf19;
      border-color: #78350f;
    }

    .rp-faculty-row.clickable:hover {
      background: rgba(245,158,11,0.08);
    }

    .rp-faculty-row.active {
      background: rgba(245,158,11,0.1);
    }

    .rp-card {
      background: #fff;
      border-color: #2d2d2d;
    }

    .rp-card.state-lock {
      background: #fef3c7;
      border-color: #059669;
    }

    .rp-card.state-hold {
      background: #fef3c7;
      border-color: #d97706;
    }

    .rp-btn-lock {
      background: #fef3c7;
      color: #6ee7b7;
      border-color: #064e2e;
    }

    .rp-btn-lock.active {
      background: #059669;
      color: #fff;
    }

    .rp-btn-hold {
      background: #fef3c7;
      color: #fcd34d;
      border-color: #78350f;
    }

    .rp-btn-hold.active {
      background: #d97706;
      color: #fff;
    }

    .rp-index {
      background: #fef3c7;
      color: #ebb812;
    }

    .rp-card.state-lock h3 {
      color: #6ee7b7 !important;
    }

    .rp-card.state-hold h3 {
      color: #fbbf24 !important;
    }
  }
`;

type ReviewStatus = "AWAITING" | "SUBMITTED" | "REVIEWED";

type FacultyReviewStatus = FacultyStatus & {
  reviewStatus: ReviewStatus;
};

const ReviewPage: React.FC = () => {
  const [pools, setPools] = useState<Pool[]>([]);
  const [selectedPool, setSelectedPool] = useState("");
  const [facultyList, setFacultyList] = useState<FacultyReviewStatus[]>([]);
  const [selectedFaculty, setSelectedFaculty] = useState("");
  const [projects, setProjects] = useState<Project[]>([]);
  const [decisions, setDecisions] = useState<
    Record<string, "LOCK" | "HOLD">
  >({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPools = async () => {
      try {
        const response = await poolService.list(1, "subadmin");

        const assignedPools: Pool[] = Array.isArray(response.data)
          ? response.data
          : [];

        setPools(assignedPools);

        if (assignedPools.length > 0) {
          setSelectedPool(assignedPools[0].id);
        } else {
          setSelectedPool("");
        }
      } catch (error) {
        toast.error(getErrorMessage(error));
        setPools([]);
        setSelectedPool("");
      } finally {
        setLoading(false);
      }
    };

    loadPools();
  }, []);

  useEffect(() => {
    if (!selectedPool) {
      setFacultyList([]);
      setSelectedFaculty("");
      setProjects([]);
      setDecisions({});
      return;
    }

    const loadFacultyStatus = async () => {
      try {
        const [facultyStatusResponse, projectsResponse] =
          await Promise.all([
            projectService.getFacultyStatus(selectedPool),
            projectService.listByPool(selectedPool),
          ]);

        const facultyStatus: FacultyStatus[] = Array.isArray(
          facultyStatusResponse,
        )
          ? facultyStatusResponse
          : [];

        const allProjects: Project[] = Array.isArray(projectsResponse)
          ? projectsResponse
          : [];

        const updatedFaculty: FacultyReviewStatus[] = facultyStatus.map(
          (faculty) => {
            const facultyProjects = allProjects.filter(
              (project) => project.facultyId === faculty.facultyId,
            );

            const reviewedProjects = facultyProjects.filter(
              (project) =>
                project.status === "LOCKED" ||
                project.status === "ON_HOLD",
            );

            const submittedProjects = facultyProjects.filter(
              (project) => project.status === "SUBMITTED",
            );

            let reviewStatus: ReviewStatus = "AWAITING";

            if (reviewedProjects.length === 4) {
              reviewStatus = "REVIEWED";
            } else if (
              submittedProjects.length === 4 ||
              faculty.hasSubmitted
            ) {
              reviewStatus = "SUBMITTED";
            }

            return {
              ...faculty,
              reviewStatus,
            };
          },
        );

        setFacultyList(updatedFaculty);
      } catch (error) {
        setFacultyList([]);
        setSelectedFaculty("");
        setProjects([]);
        setDecisions({});
        toast.error(getErrorMessage(error));
      }
    };

    loadFacultyStatus();
  }, [selectedPool]);

  useEffect(() => {
    if (!selectedPool || !selectedFaculty) {
      setProjects([]);
      setDecisions({});
      return;
    }

    const loadFacultyProjects = async () => {
      try {
        const allProjects = await projectService.listByPool(selectedPool);

        const facultyProjects = (
          Array.isArray(allProjects) ? allProjects : []
        ).filter(
          (project: Project) =>
            project.facultyId === selectedFaculty &&
            project.status === "SUBMITTED",
        );

        setProjects(facultyProjects);
        setDecisions({});
      } catch (error) {
        setProjects([]);
        setDecisions({});
        toast.error(getErrorMessage(error));
      }
    };

    loadFacultyProjects();
  }, [selectedFaculty, selectedPool]);

  const setDecision = (
    projectId: string,
    action: "LOCK" | "HOLD",
  ) => {
    setDecisions((previous) => {
      const next = {
        ...previous,
        [projectId]: action,
      };

      const holds = Object.values(next).filter(
        (value) => value === "HOLD",
      ).length;

      if (holds > 1 && action === "HOLD") {
        toast.error("Only 1 project can be held.");
        return previous;
      }

      return next;
    });
  };

  const submitReview = async () => {
    if (!selectedPool || !selectedFaculty) {
      toast.error("Please select a faculty member.");
      return;
    }

    if (projects.length !== 4) {
      toast.error(
        "Exactly 4 submitted projects are required for review.",
      );
      return;
    }

    const locks = Object.values(decisions).filter(
      (value) => value === "LOCK",
    ).length;

    const holds = Object.values(decisions).filter(
      (value) => value === "HOLD",
    ).length;

    if (locks !== 3 || holds !== 1) {
      toast.error("Must lock 3 projects and hold 1 project.");
      return;
    }

    const decisionsList: ReviewDecision[] = Object.entries(
      decisions,
    ).map(([projectId, action]) => ({
      projectId,
      action,
    }));

    try {
      await projectService.reviewBatch(
        selectedPool,
        selectedFaculty,
        decisionsList,
      );

      toast.success("Review submitted successfully!");

      setFacultyList((previous) =>
        previous.map((faculty) =>
          faculty.facultyId === selectedFaculty
            ? {
                ...faculty,
                reviewStatus: "REVIEWED",
              }
            : faculty,
        ),
      );

      setSelectedFaculty("");
      setProjects([]);
      setDecisions({});
    } catch (error: unknown) {
      toast.error(getErrorMessage(error));
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  const lockedCount = Object.values(decisions).filter(
    (value) => value === "LOCK",
  ).length;

  const heldCount = Object.values(decisions).filter(
    (value) => value === "HOLD",
  ).length;

  return (
    <>
      <style>
        {font}
        {css}
      </style>

      <div
        className="rp-root"
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 28,
          maxWidth: 960,
          margin: "0 auto",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
            paddingBottom: 4,
          }}
        >
          <div>
            <h1
              style={{
                fontFamily: "'DM Serif Display', serif",
                fontSize: 30,
                fontWeight: 400,
                color: "#a25803",
                margin: 0,
                lineHeight: 1.15,
              }}
            >
              Please Review The Project
            </h1>

            <p
              style={{
                fontSize: 13,
                color: "#a16207",
                marginTop: 4,
                fontWeight: 400,
              }}
            >
              Review four submitted faculty proposals.
            </p>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <span
              style={{
                fontSize: 12,
                color: "#a16207",
                fontWeight: 500,
              }}
            >
              Pool
            </span>

            <select
              value={selectedPool}
              onChange={(event) => {
                setSelectedPool(event.target.value);
                setSelectedFaculty("");
                setProjects([]);
                setDecisions({});
              }}
              className="rp-select"
            >
              {pools.map((pool) => (
                <option key={pool.id} value={pool.id}>
                  {pool.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "300px 1fr",
            gap: 24,
            alignItems: "start",
          }}
        >
          <div
            style={{
              background: "#fffbf5",
              border: "1.5px solid rgba(245,158,11,0.2)",
              borderRadius: 18,
              overflow: "hidden",
              position: "sticky",
              top: 24,
            }}
          >
            <div
              style={{
                padding: "16px 24px",
                borderBottom:
                  "1px solid rgba(245,158,11,0.12)",
                background:
                  "linear-gradient(135deg, #fef9ee 0%, #fffbf5 100%)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <ClipboardList size={15} color="#d97706" />

                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: "#92400e",
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                  }}
                >
                  Faculty
                </span>
              </div>
            </div>

            {facultyList.length === 0 ? (
              <div
                style={{
                  padding: "32px 24px",
                  textAlign: "center",
                  color: "#d97706",
                  fontSize: 13,
                }}
              >
                No faculty found
              </div>
            ) : (
              facultyList.map((faculty) => {
                const canReview =
                  faculty.reviewStatus === "SUBMITTED";

                return (
                  <div
                    key={faculty.facultyId}
                    onClick={() => {
                      if (canReview) {
                        setSelectedFaculty(faculty.facultyId);
                      }
                    }}
                    className={`rp-faculty-row ${
                      canReview ? "clickable" : ""
                    } ${
                      selectedFaculty === faculty.facultyId
                        ? "active"
                        : ""
                    }`}
                  >
                    <div>
                      <p
                        style={{
                          fontSize: 14,
                          fontWeight: 500,
                          color: "#93530b",
                          margin: 0,
                        }}
                      >
                        {faculty.faculty.firstName}{" "}
                        {faculty.faculty.lastName}
                      </p>

                      <p
                        style={{
                          fontSize: 10,
                          color: "#a16207",
                          margin: "3px 0 0",
                        }}
                      >
                        {faculty.faculty.email}
                      </p>
                    </div>

                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                      }}
                    >
                      {faculty.reviewStatus === "REVIEWED" ? (
                        <span className="badge-reviewed">
                          ✓ Reviewed
                        </span>
                      ) : faculty.reviewStatus === "SUBMITTED" ? (
                        <>
                          <span className="badge-submitted">
                            ✓ Submitted
                          </span>

                          <ChevronRight
                            size={13}
                            color="#d97706"
                          />
                        </>
                      ) : (
                        <span className="badge-awaiting">
                          Awaiting
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 16,
            }}
          >
            {!selectedFaculty && (
              <div
                style={{
                  borderRadius: 18,
                  border:
                    "1.5px dashed rgba(245,158,11,0.25)",
                  padding: "52px 24px",
                  textAlign: "center",
                }}
              >
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 12,
                    background: "#fef3c7",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto 16px",
                  }}
                >
                  <ClipboardList size={22} color="#d97706" />
                </div>

                <p
                  style={{
                    fontFamily: "'DM Serif Display', serif",
                    fontSize: 20,
                    color: "#92400e",
                    margin: "0 0 6px",
                  }}
                >
                  Select a faculty member
                </p>

                <p
                  style={{
                    fontSize: 13,
                    color: "#a16207",
                    margin: 0,
                  }}
                >
                  Choose a submitted faculty member from the panel on the
                  left.
                </p>
              </div>
            )}

            {selectedFaculty && projects.length === 0 && (
              <div
                style={{
                  borderRadius: 18,
                  border:
                    "1.5px dashed rgba(245,158,11,0.25)",
                  padding: "52px 24px",
                  textAlign: "center",
                }}
              >
                <ClipboardList size={24} color="#d97706" />

                <p
                  style={{
                    fontSize: 14,
                    color: "#92400e",
                    marginTop: 12,
                  }}
                >
                  Projects already reviewed.
                </p>
              </div>
            )}

            {projects.length > 0 && (
              <>
                <div
                  style={{
                    background:
                      "linear-gradient(135deg, #d97706 0%, #b45309 100%)",
                    borderRadius: 14,
                    padding: "16px 20px",
                    color: "#fff",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: 10,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        opacity: 0.9,
                      }}
                    >
                      Review Progress
                    </span>

                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: 500,
                        background: "rgba(255,255,255,0.2)",
                        padding: "3px 10px",
                        borderRadius: 20,
                      }}
                    >
                      {lockedCount + heldCount} / {projects.length} decided
                    </span>
                  </div>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: 12,
                    }}
                  >
                    <div>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          marginBottom: 5,
                        }}
                      >
                        <span
                          style={{
                            fontSize: 11,
                            opacity: 0.8,
                          }}
                        >
                          Locked
                        </span>

                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 700,
                          }}
                        >
                          {lockedCount} / 3
                        </span>
                      </div>

                      <div className="rp-progress-track">
                        <div
                          className="rp-progress-fill"
                          style={{
                            width: `${Math.min(
                              (lockedCount / 3) * 100,
                              100,
                            )}%`,
                          }}
                        />
                      </div>
                    </div>

                    <div>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          marginBottom: 5,
                        }}
                      >
                        <span
                          style={{
                            fontSize: 11,
                            opacity: 0.8,
                          }}
                        >
                          On Hold
                        </span>

                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 700,
                          }}
                        >
                          {heldCount} / 1
                        </span>
                      </div>

                      <div className="rp-progress-track">
                        <div
                          className="rp-progress-fill"
                          style={{
                            width: `${Math.min(
                              heldCount * 100,
                              100,
                            )}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {projects.map((project, index) => (
                  <div
                    key={project.id}
                    className={`rp-card ${
                      decisions[project.id] === "LOCK"
                        ? "state-lock"
                        : decisions[project.id] === "HOLD"
                          ? "state-hold"
                          : ""
                    }`}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: 12,
                        marginBottom: 12,
                      }}
                    >
                      <span className="rp-index">
                        {index + 1}
                      </span>

                      <div
                        style={{
                          flex: 1,
                          minWidth: 0,
                        }}
                      >
                        <h3
                          style={{
                            fontFamily:
                              "'DM Serif Display', serif",
                            fontSize: 20,
                            fontWeight: 400,
                            color: "#92400e",
                            margin: "0 0 5px",
                            lineHeight: 1.3,
                            letterSpacing: "-0.01em",
                          }}
                        >
                          {project.title}
                        </h3>
                      </div>

                      {decisions[project.id] && (
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 700,
                            letterSpacing: "0.06em",
                            textTransform: "uppercase",
                            padding: "4px 12px",
                            borderRadius: 20,
                            flexShrink: 0,
                            ...(decisions[project.id] === "LOCK"
                              ? {
                                  background: "#d1fae5",
                                  color: "#065f46",
                                }
                              : {
                                  background: "#fef3c7",
                                  color: "#92400e",
                                }),
                          }}
                        >
                          {decisions[project.id] === "LOCK"
                            ? "✓ Locked"
                            : "⏸ On Hold"}
                        </span>
                      )}
                    </div>

                    <p
                      style={{
                        fontSize: 14,
                        lineHeight: 1.65,
                        color: "#6b5b3e",
                        margin: "0 0 20px",
                      }}
                    >
                      {project.description}
                    </p>

                    <div
                      style={{
                        height: 1,
                        background: "rgba(47, 46, 46, 0.06)",
                        marginBottom: 18,
                      }}
                    />

                    <div
                      style={{
                        display: "flex",
                        gap: 10,
                      }}
                    >
                      <button
                        type="button"
                        onClick={() =>
                          setDecision(project.id, "LOCK")
                        }
                        className={`rp-btn-lock ${
                          decisions[project.id] === "LOCK"
                            ? "active"
                            : ""
                        }`}
                      >
                        <Lock size={14} />
                        {decisions[project.id] === "LOCK"
                          ? "Locked"
                          : "Lock"}
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          setDecision(project.id, "HOLD")
                        }
                        className={`rp-btn-hold ${
                          decisions[project.id] === "HOLD"
                            ? "active"
                            : ""
                        }`}
                      >
                        <AlertTriangle size={14} />
                        {decisions[project.id] === "HOLD"
                          ? "On Hold"
                          : "Hold"}
                      </button>
                    </div>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={submitReview}
                  className="rp-submit"
                >
                  <Send size={15} />
                  Submit Review
                  <ArrowRight size={15} />
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default ReviewPage;