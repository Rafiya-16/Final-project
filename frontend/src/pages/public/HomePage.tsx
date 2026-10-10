import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  GraduationCap,
  Users,
  FileText,
  Shield,
  Clock,
  CheckCircle2,
  ChevronRight,
  ArrowRight,
  Lock,
  BarChart3,
  Bell,
  BookOpen,
  ClipboardList,
  Lightbulb,
  LogIn,
  Mail,
  Sparkles,
  UserCog,
  UserCheck,
  Layers3,
  Zap,
  Eye,
  Check,
} from "lucide-react";
import { useScrollReveal } from "../../hooks/useScrollReveal";

const AnimatedStat = ({
  value,
  suffix,
}: {
  value: number;
  suffix: string;
}) => {
  const [count, setCount] = useState(0);
  const [started, setStarted] = useState(false);
  const statRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const element = statRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setStarted(true);
          observer.disconnect();
        }
      },
      { threshold: 0.5 }
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!started) return;

    let animationFrame: number;
    let startTime: number | null = null;
    const duration = 1600;

    const animate = (timestamp: number) => {
      if (startTime === null) startTime = timestamp;

      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = 1 - Math.pow(1 - progress, 3);
      const currentValue = Math.floor(easedProgress * value);

      setCount(currentValue);

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      } else {
        setCount(value);
      }
    };

    animationFrame = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(animationFrame);
  }, [started, value]);

  return (
    <div
      ref={statRef}
      className="text-2xl font-extrabold text-slate-900 dark:text-white"
    >
      {count}
      {suffix}
    </div>
  );
};

const workflow = [
  {
    label: "Pool Created",
    description: "Admin creates the project allocation pool",
    icon: ClipboardList,
    status: "completed",
  },
  {
    label: "Proposals Submitted",
    description: "Faculty submit their project proposals",
    icon: FileText,
    status: "completed",
  },
  {
    label: "Multi-Level Review",
    description: "Subadmin and Admin review proposals",
    icon: Shield,
    status: "active",
  },
  {
    label: "Student Selection",
    description: "Students select approved projects",
    icon: Users,
    status: "pending",
  },
  {
    label: "Team Formation",
    description: "Students form their project teams",
    icon: GraduationCap,
    status: "pending",
  },
  {
    label: "Allocation Frozen",
    description: "Final allocation is locked and published",
    icon: Lock,
    status: "pending",
  },
];

const features = [
  {
    title: "Pool Management",
    description:
      "Create and manage project allocation pools with controlled lifecycle stages.",
    icon: Layers3,
    accent: "from-teal-400 to-cyan-500",
    glow: "bg-teal-400/10",
  },
  {
    title: "Proposal Submission",
    description:
      "Faculty can submit project proposals with structured details and requirements.",
    icon: FileText,
    accent: "from-blue-400 to-indigo-500",
    glow: "bg-blue-400/10",
  },
  {
    title: "Multi-Level Review",
    description:
      "Projects pass through Subadmin and Admin review before final approval.",
    icon: Shield,
    accent: "from-violet-400 to-purple-500",
    glow: "bg-violet-400/10",
  },
  {
    title: "Team Formation",
    description:
      "Students can form project teams while respecting defined team size rules.",
    icon: Users,
    accent: "from-emerald-400 to-green-500",
    glow: "bg-emerald-400/10",
  },
  {
    title: "Race Condition Prevention",
    description:
      "Protected selection prevents multiple students from claiming the same project.",
    icon: Zap,
    accent: "from-amber-400 to-orange-500",
    glow: "bg-amber-400/10",
  },
  {
    title: "Student Ideas",
    description:
      "Students can propose their own ideas and get them considered for allocation.",
    icon: Lightbulb,
    accent: "from-pink-400 to-rose-500",
    glow: "bg-pink-400/10",
  },
  {
    title: "Notifications",
    description:
      "Keep students, faculty and administrators informed about important updates.",
    icon: Bell,
    accent: "from-sky-400 to-blue-500",
    glow: "bg-sky-400/10",
  },
  {
    title: "Reports & Print",
    description:
      "Generate clear allocation reports that can be viewed, printed or shared.",
    icon: BarChart3,
    accent: "from-fuchsia-400 to-purple-500",
    glow: "bg-fuchsia-400/10",
  },
  {
    title: "Timeline Control",
    description:
      "Control each allocation phase with clearly defined deadlines and transitions.",
    icon: Clock,
    accent: "from-cyan-400 to-teal-500",
    glow: "bg-cyan-400/10",
  },
];

const roles = [
  {
    title: "Admin",
    description:
      "Manage the complete allocation process, pools, approvals and final decisions.",
    icon: UserCog,
    features: ["Pool control", "Final approval", "Reports"],
    accent: "from-violet-500 to-indigo-500",
    light: "bg-violet-50",
    border: "border-violet-200",
  },
  {
    title: "Subadmin",
    description:
      "Review faculty proposals and manage the intermediate project approval stage.",
    icon: Shield,
    features: ["Proposal review", "Project locking", "Monitoring"],
    accent: "from-blue-500 to-cyan-500",
    light: "bg-blue-50",
    border: "border-blue-200",
  },
  {
    title: "Faculty",
    description:
      "Submit project proposals and participate in the project review workflow.",
    icon: GraduationCap,
    features: ["Submit projects", "Track status", "Guide students"],
    accent: "from-emerald-500 to-teal-500",
    light: "bg-emerald-50",
    border: "border-emerald-200",
  },
  {
    title: "Student",
    description:
      "Explore approved projects, select preferences and form project teams.",
    icon: UserCheck,
    features: ["Explore projects", "Select projects", "Build teams"],
    accent: "from-pink-500 to-rose-500",
    light: "bg-pink-50",
    border: "border-pink-200",
  },
];

const HomePage: React.FC = () => {
  const statsRef = useScrollReveal();
  const featuresRef = useScrollReveal();
  const rolesRef = useScrollReveal();
  const ctaRef = useScrollReveal();

  return (
    <div className="min-h-screen overflow-hidden bg-white text-slate-800 dark:bg-slate-950 dark:text-slate-100">
      {/* =========================================================
          HERO
      ========================================================= */}
      <section className="group/hero relative overflow-hidden bg-gradient-to-r from-cream-50 via-[#F7FAFF] to-[#EAF4FF] dark:from-slate-950 dark:via-slate-950 dark:to-slate-950">
        {/* Background glows */}
        <div className="pointer-events-none absolute -left-24 top-20 h-72 w-72 rounded-full bg-teal-300/15 blur-3xl animate-float dark:bg-teal-500/5" />
        <div className="pointer-events-none absolute right-0 top-10 h-96 w-96 rounded-full bg-blue-300/20 blur-3xl animate-float-delayed dark:bg-blue-500/5" />
        <div className="pointer-events-none absolute bottom-0 left-1/3 h-80 w-80 rounded-full bg-indigo-300/10 blur-3xl animate-float-slow dark:bg-indigo-500/5" />
        <div className="pointer-events-none absolute left-1/2 top-1/2 h-56 w-56 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/70 blur-3xl animate-pulse-glow dark:bg-white/5" />

        {/* Floating dots */}
        <div className="pointer-events-none absolute left-[8%] top-[25%] h-2 w-2 rounded-full bg-teal-400/50 animate-pulse" />
        <div className="pointer-events-none absolute right-[15%] top-[20%] h-2.5 w-2.5 rounded-full bg-blue-400/50 animate-pulse" />
        <div className="pointer-events-none absolute right-[8%] bottom-[20%] h-2 w-2 rounded-full bg-indigo-400/40 animate-pulse" />

        <div className="relative mx-auto max-w-7xl px-6 pb-20 pt-20 lg:px-8 lg:pb-28 lg:pt-28">
          <div className="grid items-center gap-14 lg:grid-cols-[1.05fr_0.95fr]">
            {/* Hero content */}
            <div className="max-w-3xl">
              {/* Badge */}
              <div className="mb-7 inline-flex animate-fade-in-down items-center gap-2 rounded-full border border-blue-200/80 bg-white/80 px-4 py-2 text-sm font-semibold text-blue-700 shadow-sm backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:border-blue-300 hover:shadow-lg dark:border-slate-700 dark:bg-slate-900/80 dark:text-blue-300">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-teal-400 opacity-60" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-teal-500" />
                </span>

                <Sparkles className="h-4 w-4 animate-[spin_3s_linear_infinite]" />
                Smart Project Allocation Platform
              </div>

              {/* Heading */}
              <h1 className="animate-fade-in-up text-4xl font-black leading-[1.08] tracking-tight text-slate-900 sm:text-5xl lg:text-6xl dark:text-white">
                Automated
                <br />
                <span className="bg-gradient-to-r from-teal-600 via-blue-600 to-indigo-600 bg-[length:200%_auto] bg-clip-text text-transparent animate-gradient dark:from-teal-400 dark:via-blue-400 dark:to-indigo-400">
                  Project Allocation
                </span>
              </h1>

              <h2 className="mt-5 animate-fade-in-up text-xl font-bold text-slate-700 sm:text-2xl dark:text-slate-200">
                Streamline Your Project Allocation
              </h2>

              <p className="mt-5 max-w-2xl animate-fade-in-up text-base leading-7 text-slate-600 sm:text-lg dark:text-slate-400">
                A transparent and intelligent platform that simplifies project
                submission, review, student selection and final team
                allocation — all in one place.
              </p>

              {/* Buttons */}
              <div className="mt-8 flex flex-col gap-4 animate-fade-in-up sm:flex-row">
                <Link
                  to="/login"
                  className="group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-teal-600 to-blue-600 px-6 py-3.5 font-bold text-white shadow-lg shadow-blue-500/20 transition-all duration-300 hover:-translate-y-1 hover:scale-[1.02] hover:shadow-xl hover:shadow-blue-500/25"
                >
                  <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                  <LogIn className="relative h-5 w-5 transition-transform duration-300 group-hover:scale-110" />
                  <span className="relative">Get Started</span>
                  <ArrowRight className="relative h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                </Link>

                <Link
                  to="/how-it-works"
                  className="group inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white/80 px-6 py-3.5 font-bold text-slate-700 shadow-sm backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-blue-300 hover:bg-white hover:shadow-lg dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-200 dark:hover:border-blue-500"
                >
                  <BookOpen className="h-5 w-5 transition-transform duration-300 group-hover:scale-110" />
                  How It Works
                  <ChevronRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                </Link>
              </div>

              {/* Benefits */}
              <div className="mt-9 grid gap-3 animate-fade-in-up sm:grid-cols-3">
                {[
                  {
                    icon: Zap,
                    title: "No manual allocation",
                  },
                  {
                    icon: CheckCircle2,
                    title: "Fair distribution",
                  },
                  {
                    icon: Eye,
                    title: "Full audit trail",
                  },
                ].map((item, index) => {
                  const Icon = item.icon;

                  return (
                    <div
                      key={item.title}
                      className="group flex items-center gap-2.5 rounded-xl border border-white/70 bg-white/55 px-3 py-3 shadow-sm backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:bg-white hover:shadow-md dark:border-slate-800 dark:bg-slate-900/50 dark:hover:bg-slate-900"
                      style={{ animationDelay: `${550 + index * 100}ms` }}
                    >
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-teal-100 text-teal-600 transition-all duration-300 group-hover:scale-110 group-hover:rotate-3 dark:bg-teal-900/40 dark:text-teal-400">
                        <Icon className="h-4 w-4" />
                      </div>

                      <span className="text-xs font-semibold text-slate-700 sm:text-sm dark:text-slate-300">
                        {item.title}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Workflow */}
            <div className="relative animate-fade-in-right">
              <div className="absolute -inset-6 rounded-[2rem] bg-gradient-to-r from-teal-300/15 via-blue-300/10 to-indigo-300/15 blur-2xl dark:from-teal-500/5 dark:via-blue-500/5 dark:to-indigo-500/5" />

              <div className="group relative rounded-3xl border border-white/80 bg-white/80 p-5 shadow-2xl shadow-slate-300/30 backdrop-blur-xl transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl dark:border-slate-800 dark:bg-slate-900/80 dark:shadow-none">
                <div className="mb-5 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-500">
                      Allocation Workflow
                    </p>
                    <h3 className="mt-1 text-lg font-extrabold text-slate-900 dark:text-white">
                      From Proposal to Allocation
                    </h3>
                  </div>

                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-blue-600 text-white shadow-lg shadow-blue-500/20">
                    <ClipboardList className="h-5 w-5" />
                  </div>
                </div>

                <div className="space-y-2">
                  {workflow.map((step, index) => {
                    const Icon = step.icon;

                    const isCompleted = step.status === "completed";
                    const isActive = step.status === "active";

                    return (
                      <div
                        key={step.label}
                        className="group/step relative flex gap-3 rounded-2xl p-3 transition-all duration-300 hover:bg-slate-50 dark:hover:bg-slate-800/70"
                      >
                        {index < workflow.length - 1 && (
                          <div className="absolute left-[27px] top-[48px] h-5 w-px bg-slate-200 dark:bg-slate-700" />
                        )}

                        <div
                          className={`relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-all duration-300 ${
                            isCompleted
                              ? "bg-teal-500 text-white shadow-md shadow-teal-500/20"
                              : isActive
                              ? "bg-blue-500 text-white shadow-md shadow-blue-500/30 animate-pulse-glow"
                              : "bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500"
                          }`}
                        >
                          {isCompleted ? (
                            <Check className="h-4 w-4" />
                          ) : (
                            <Icon className="h-4 w-4" />
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <p
                              className={`text-sm font-bold ${
                                isActive
                                  ? "text-blue-700 dark:text-blue-300"
                                  : "text-slate-800 dark:text-slate-200"
                              }`}
                            >
                              {step.label}
                            </p>

                            {isActive && (
                              <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                                ACTIVE
                              </span>
                            )}
                          </div>

                          <p className="mt-0.5 text-xs leading-5 text-slate-500 dark:text-slate-400">
                            {step.description}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                  <div className="h-full w-[46%] rounded-full bg-gradient-to-r from-teal-500 via-blue-500 to-indigo-500 animate-gradient" />
                </div>

                <div className="mt-2 flex justify-between text-[10px] font-semibold text-slate-400">
                  <span>Progress</span>
                  <span>3 / 6 phases</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          STATS
      ========================================================= */}
      <section
        ref={statsRef}
        className="relative border-y border-cream-200/80 bg-cream-100/90 py-10 dark:border-slate-800 dark:bg-slate-950"
      >
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                value: 500,
                suffix: "+",
                label: "Students Served",
                icon: GraduationCap,
                accent: "from-teal-400 to-cyan-500",
              },
              {
                value: 100,
                suffix: "+",
                label: "Projects Allocated",
                icon: ClipboardList,
                accent: "from-blue-400 to-indigo-500",
              },
              {
                value: 75,
                suffix: "+",
                label: "Faculty Members",
                icon: Users,
                accent: "from-indigo-400 to-violet-500",
              },
              {
                value: 100,
                suffix: "%",
                label: "Transparency",
                icon: Eye,
                accent: "from-violet-400 to-fuchsia-500",
              },
            ].map((stat, index) => {
              const Icon = stat.icon;

              return (
                <div
                  key={stat.label}
                  className="group relative overflow-hidden rounded-2xl border border-white/80 bg-white/80 p-5 shadow-sm backdrop-blur-sm transition-all duration-500 hover:-translate-y-2 hover:shadow-xl dark:border-slate-800 dark:bg-slate-900/80"
                  style={{ transitionDelay: `${index * 80}ms` }}
                >
                  <div
                    className={`absolute -right-8 -top-8 h-24 w-24 rounded-full bg-gradient-to-br ${stat.accent} opacity-10 blur-2xl transition-all duration-500 group-hover:scale-150 group-hover:opacity-20`}
                  />

                  <div className="relative flex items-center gap-4">
                    <div
                      className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${stat.accent} text-white shadow-md transition-all duration-300 group-hover:scale-110 group-hover:rotate-3`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>

                    <div>
                      <AnimatedStat
                        value={stat.value}
                        suffix={stat.suffix}
                      />
                      <p className="mt-0.5 text-xs font-semibold text-slate-500 dark:text-slate-400">
                        {stat.label}
                      </p>
                    </div>
                  </div>

                  <div
                    className={`mt-5 h-1 w-12 rounded-full bg-gradient-to-r ${stat.accent} transition-all duration-500 group-hover:w-full`}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* =========================================================
          FEATURES
      ========================================================= */}
      <section
        ref={featuresRef}
        className="relative overflow-hidden bg-white py-24 dark:bg-slate-950"
      >
        {/* Background decoration */}
        <div className="pointer-events-none absolute left-0 top-20 h-80 w-80 rounded-full bg-teal-100/30 blur-3xl dark:bg-teal-500/5" />
        <div className="pointer-events-none absolute right-0 bottom-10 h-96 w-96 rounded-full bg-blue-100/30 blur-3xl dark:bg-blue-500/5" />

        <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
          {/* Section heading */}
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-teal-200 bg-teal-50 px-4 py-2 text-xs font-bold uppercase tracking-wider text-teal-700 dark:border-teal-800 dark:bg-teal-950/40 dark:text-teal-300">
              <Sparkles className="h-4 w-4" />
              Powerful Features
            </div>

            <h2 className="text-3xl font-black tracking-tight text-slate-900 sm:text-4xl dark:text-white">
              Everything You Need for
              <span className="ml-2 bg-gradient-to-r from-teal-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent dark:from-teal-400 dark:via-blue-400 dark:to-indigo-400">
                Smarter Allocation
              </span>
            </h2>

            <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-slate-600 dark:text-slate-400">
              A complete workflow designed to make project allocation
              organized, transparent, secure and easier for everyone.
            </p>
          </div>

          {/* Feature cards */}
          <div className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, index) => {
              const Icon = feature.icon;

              return (
                <div
                  key={feature.title}
                  className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm transition-all duration-500 hover:-translate-y-2 hover:border-slate-300 hover:shadow-xl dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700"
                  style={{
                    transitionDelay: `${index * 50}ms`,
                  }}
                >
                  {/* Card glow */}
                  <div
                    className={`absolute -right-12 -top-12 h-32 w-32 rounded-full ${feature.glow} opacity-0 blur-2xl transition-all duration-500 group-hover:scale-150 group-hover:opacity-100`}
                  />

                  {/* Top accent */}
                  <div
                    className={`absolute left-0 right-0 top-0 h-1 bg-gradient-to-r ${feature.accent} opacity-60 transition-all duration-500 group-hover:h-1.5 group-hover:opacity-100`}
                  />

                  <div className="relative">
                    {/* Icon */}
                    <div
                      className={`mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${feature.accent} text-white shadow-lg transition-all duration-500 group-hover:scale-110 group-hover:rotate-3`}
                    >
                      <Icon className="h-6 w-6" />
                    </div>

                    <h3 className="text-lg font-extrabold text-slate-900 transition-colors duration-300 group-hover:text-blue-700 dark:text-white dark:group-hover:text-blue-300">
                      {feature.title}
                    </h3>

                    <p className="mt-2.5 text-sm leading-6 text-slate-600 dark:text-slate-400">
                      {feature.description}
                    </p>

                    {/* Bottom indicator */}
                    <div className="mt-5 flex items-center gap-2 text-xs font-bold text-slate-400 transition-all duration-300 group-hover:translate-x-1 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                      <span>Explore feature</span>
                      <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1" />
                    </div>
                  </div>

                  {/* Corner decoration */}
                  <div className="absolute -bottom-8 -right-8 h-20 w-20 rounded-full border border-slate-100 transition-all duration-500 group-hover:scale-150 dark:border-slate-800" />
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* =========================================================
          ROLES
      ========================================================= */}
      <section
        ref={rolesRef}
        className="relative overflow-hidden border-y border-slate-100 bg-gradient-to-b from-slate-50 via-white to-cream-50 py-24 dark:border-slate-800 dark:from-slate-900 dark:via-slate-950 dark:to-slate-950"
      >
        {/* Soft background glows */}
        <div className="pointer-events-none absolute left-[10%] top-10 h-72 w-72 rounded-full bg-violet-200/20 blur-3xl dark:bg-violet-500/5" />
        <div className="pointer-events-none absolute right-[5%] bottom-10 h-80 w-80 rounded-full bg-teal-200/20 blur-3xl dark:bg-teal-500/5" />

        <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-4 py-2 text-xs font-bold uppercase tracking-wider text-indigo-700 dark:border-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-300">
              <Users className="h-4 w-4" />
              Built for Everyone
            </div>

            <h2 className="text-3xl font-black tracking-tight text-slate-900 sm:text-4xl dark:text-white">
              One Platform,
              <span className="ml-2 bg-gradient-to-r from-indigo-600 via-blue-600 to-teal-600 bg-clip-text text-transparent dark:from-indigo-400 dark:via-blue-400 dark:to-teal-400">
                Four Powerful Roles
              </span>
            </h2>

            <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-slate-600 dark:text-slate-400">
              Every user gets a focused workspace with the tools and
              permissions needed for their part in the allocation process.
            </p>
          </div>

          {/* Role cards */}
          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {roles.map((role, index) => {
              const Icon = role.icon;

              return (
                <div
                  key={role.title}
                  className={`group relative overflow-hidden rounded-3xl border ${role.border} bg-white/90 p-6 shadow-sm backdrop-blur-sm transition-all duration-500 hover:-translate-y-3 hover:shadow-2xl dark:border-slate-800 dark:bg-slate-900/90`}
                  style={{ transitionDelay: `${index * 80}ms` }}
                >
                  {/* Glow */}
                  <div
                    className={`absolute -right-10 -top-10 h-32 w-32 rounded-full ${role.light} opacity-60 blur-2xl transition-all duration-500 group-hover:scale-150 group-hover:opacity-100 dark:opacity-10`}
                  />

                  <div className="relative">
                    {/* Icon + arrow */}
                    <div className="flex items-start justify-between">
                      <div
                        className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${role.accent} text-white shadow-lg transition-all duration-500 group-hover:scale-110 group-hover:rotate-3`}
                      >
                        <Icon className="h-6 w-6" />
                      </div>

                      <div className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-400 transition-all duration-300 group-hover:border-blue-200 group-hover:bg-blue-50 group-hover:text-blue-600 dark:border-slate-700 dark:bg-slate-800 dark:group-hover:bg-blue-950/40">
                        <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
                      </div>
                    </div>

                    <h3 className="mt-6 text-xl font-black text-slate-900 dark:text-white">
                      {role.title}
                    </h3>

                    <p className="mt-2.5 min-h-[72px] text-sm leading-6 text-slate-600 dark:text-slate-400">
                      {role.description}
                    </p>

                    <div className="my-5 h-px bg-slate-100 dark:bg-slate-800" />

                    <div className="space-y-2.5">
                      {role.features.map((item) => (
                        <div
                          key={item}
                          className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300"
                        >
                          <span
                            className={`flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br ${role.accent} text-white`}
                          >
                            <Check className="h-3 w-3" />
                          </span>
                          {item}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Bottom gradient */}
                  <div
                    className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${role.accent} opacity-40 transition-all duration-500 group-hover:h-1.5 group-hover:opacity-100`}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* =========================================================
          CTA
      ========================================================= */}
      <section
        ref={ctaRef}
        className="relative overflow-hidden bg-gradient-to-br from-cream-50 via-[#F7FAFF] to-[#EAF4FF] py-24 dark:from-slate-950 dark:via-slate-950 dark:to-slate-950"
      >
        {/* Animated glows */}
        <div className="pointer-events-none absolute -left-20 top-0 h-72 w-72 rounded-full bg-teal-300/15 blur-3xl animate-float dark:bg-teal-500/5" />
        <div className="pointer-events-none absolute -right-20 bottom-0 h-80 w-80 rounded-full bg-blue-300/20 blur-3xl animate-float-delayed dark:bg-blue-500/5" />
        <div className="pointer-events-none absolute left-1/2 top-1/2 h-60 w-60 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/70 blur-3xl animate-pulse-glow dark:bg-white/5" />

        <div className="relative mx-auto max-w-5xl px-6 lg:px-8">
          <div className="group relative overflow-hidden rounded-[2rem] border border-white/80 bg-white/80 px-6 py-12 text-center shadow-2xl shadow-blue-200/20 backdrop-blur-xl transition-all duration-500 hover:-translate-y-1 hover:shadow-2xl sm:px-12 lg:px-16 dark:border-slate-800 dark:bg-slate-900/80 dark:shadow-none">
            {/* Moving light */}
            <div className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-1000 group-hover:translate-x-full dark:via-white/5" />

            {/* Decorative circles */}
            <div className="absolute -left-12 -top-12 h-32 w-32 rounded-full border border-teal-200/50 dark:border-teal-800/30" />
            <div className="absolute -bottom-16 -right-10 h-40 w-40 rounded-full border border-blue-200/50 dark:border-blue-800/30" />

            <div className="relative">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-500 to-blue-600 text-white shadow-xl shadow-blue-500/20 animate-float">
                <Sparkles className="h-7 w-7 animate-[spin_4s_linear_infinite]" />

                <span className="absolute h-16 w-16 rounded-2xl border border-blue-400/30 animate-ping" />
              </div>

              <p className="mt-7 text-sm font-bold uppercase tracking-[0.2em] text-blue-600 dark:text-blue-400">
                Start Your Journey
              </p>

              <h2 className="mt-3 text-3xl font-black text-slate-900 sm:text-4xl lg:text-5xl dark:text-white">
                Ready to{" "}
                <span className="bg-gradient-to-r from-teal-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent dark:from-teal-400 dark:via-blue-400 dark:to-indigo-400">
                  Get Started?
                </span>
              </h2>

              <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-slate-600 dark:text-slate-400">
                Simplify project allocation, improve transparency and make the
                entire process easier for students, faculty and administrators.
              </p>

              <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
                <Link
                  to="/login"
                  className="group/btn relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-teal-600 to-blue-600 px-7 py-3.5 font-bold text-white shadow-lg shadow-blue-500/20 transition-all duration-300 hover:-translate-y-1 hover:scale-[1.02] hover:shadow-xl"
                >
                  <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 group-hover/btn:translate-x-full" />

                  <LogIn className="relative h-5 w-5 transition-transform duration-300 group-hover/btn:rotate-6 group-hover/btn:scale-110" />

                  <span className="relative">Sign In</span>

                  <ArrowRight className="relative h-4 w-4 transition-transform duration-300 group-hover/btn:translate-x-1" />
                </Link>

                <Link
                  to="/contact"
                  className="group/contact inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white/80 px-7 py-3.5 font-bold text-slate-700 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-blue-300 hover:bg-white hover:shadow-lg dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-blue-500"
                >
                  <Mail className="h-5 w-5 transition-transform duration-300 group-hover/contact:rotate-6 group-hover/contact:scale-110" />
                  Contact Admin
                </Link>
              </div>

              <div className="mt-7 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs font-semibold text-slate-400">
                <span>Simple</span>
                <span className="h-1 w-1 rounded-full bg-slate-300" />
                <span>Secure</span>
                <span className="h-1 w-1 rounded-full bg-slate-300" />
                <span>Transparent</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;