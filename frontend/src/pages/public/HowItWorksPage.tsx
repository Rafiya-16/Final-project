// frontend/src/pages/public/HowItWorksPage.tsx

import React from 'react';
import {
  FolderKanban,
  FileText,
  ClipboardList,
  CheckCircle2,
  Users,
  Snowflake,
  Sparkles,
  ArrowRight,
  Clock3,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useScrollReveal } from '@/hooks/useScrollReveal';

type Role = 'Admin' | 'Faculty' | 'Subadmin' | 'Student';

interface Step {
  phase: string;
  title: string;
  icon: React.ReactNode;
  color: string;
  role: Role;
  points: string[];
}

const steps: Step[] = [
  {
    phase: 'Phase 1',
    title: 'Pool Creation',
    icon: <FolderKanban className="h-6 w-6" />,
    color: 'from-blue-500 to-blue-600',
    role: 'Admin',
    points: [
      'Admin creates a new allocation pool (e.g., "FYP 2026 Spring")',
      'Sets timeline: submission window, review period, selection dates, freeze date',
      'Assigns subadmin(s), faculty, and eligible students to the pool',
      'Activates the pool to open submissions',
    ],
  },
  {
    phase: 'Phase 2',
    title: 'Faculty Proposal Submission',
    icon: <FileText className="h-6 w-6" />,
    color: 'from-violet-500 to-purple-600',
    role: 'Faculty',
    points: [
      'Each faculty submits exactly 4 project proposals',
      'Proposals include title, description, domain, prerequisites, and max team size',
      'Faculty can edit drafts before finalizing',
      'Once finalized, all 4 proposals are locked for review',
    ],
  },
  {
    phase: 'Phase 3',
    title: 'Subadmin Review',
    icon: <ClipboardList className="h-6 w-6" />,
    color: 'from-amber-500 to-orange-600',
    role: 'Subadmin',
    points: [
      "Subadmin reviews each faculty's 4 proposals",
      'Locks (approves) 3 proposals at subadmin level',
      'Places 1 proposal on hold — escalated to admin for final decision',
      'Can add review notes for each proposal',
    ],
  },
  {
    phase: 'Phase 4',
    title: 'Admin Decision',
    icon: <CheckCircle2 className="h-6 w-6" />,
    color: 'from-emerald-500 to-green-600',
    role: 'Admin',
    points: [
      'Admin sees only ON_HOLD proposals',
      'Approves or rejects each held project with optional feedback',
      'Can batch-approve all locked projects',
      'Approved projects become visible to students',
    ],
  },
  {
    phase: 'Phase 5',
    title: 'Student Selection & Team Formation',
    icon: <Users className="h-6 w-6" />,
    color: 'from-indigo-500 to-blue-600',
    role: 'Student',
    points: [
      'Students browse approved projects (without faculty names for fairness)',
      'One student creates a team and becomes the leader',
      'Leader invites team members (min 3, max configurable per project)',
      'Team leader selects one project — first come, first served with DB locking',
      'Students can also submit their own project ideas for admin approval',
    ],
  },
  {
    phase: 'Phase 6',
    title: 'Freeze & Finalize',
    icon: <Snowflake className="h-6 w-6" />,
    color: 'from-cyan-500 to-teal-600',
    role: 'Admin',
    points: [
      'Admin freezes the pool after the deadline',
      'All teams are frozen — no further changes allowed',
      'Faculty can now see their assigned teams and student contact details',
      'Admin generates reports (printable + CSV export)',
      'Audit logs record every action for accountability',
    ],
  },
];

const roleColor = (role: Role): string => {
  switch (role) {
    case 'Admin':
      return 'border-red-200 bg-red-50 text-red-600 dark:border-red-400/20 dark:bg-red-500/10 dark:text-red-300';

    case 'Faculty':
      return 'border-violet-200 bg-violet-50 text-violet-600 dark:border-violet-400/20 dark:bg-violet-500/10 dark:text-violet-300';

    case 'Subadmin':
      return 'border-amber-200 bg-amber-50 text-amber-600 dark:border-amber-400/20 dark:bg-amber-500/10 dark:text-amber-300';

    case 'Student':
      return 'border-blue-200 bg-blue-50 text-blue-600 dark:border-blue-400/20 dark:bg-blue-500/10 dark:text-blue-300';

    default:
      return 'border-stone-200 bg-stone-50 text-stone-600 dark:border-slate-600 dark:bg-slate-500/10 dark:text-slate-300';
  }
};

const HowItWorksPage: React.FC = () => {
  const revealRef = useScrollReveal();

  return (
    <div
      ref={revealRef}
      className="relative min-h-screen overflow-hidden bg-[#fbfaf7] text-stone-900 transition-colors duration-500 dark:bg-[#070b12] dark:text-white"
    >
      <style>{`
        @keyframes fadeDown {
          from {
            opacity: 0;
            transform: translateY(-30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fadeUp {
          from {
            opacity: 0;
            transform: translateY(35px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.85);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes floatPink {
          0%,
          100% {
            transform: translate3d(0, 0, 0) scale(1);
          }

          50% {
            transform: translate3d(30px, -20px, 0) scale(1.08);
          }
        }

        @keyframes floatGreen {
          0%,
          100% {
            transform: translate3d(0, 0, 0) scale(1);
          }

          50% {
            transform: translate3d(-30px, 25px, 0) scale(1.07);
          }
        }

        @keyframes floatCenter {
          0%,
          100% {
            transform: translate3d(0, 0, 0);
          }

          50% {
            transform: translate3d(0, -20px, 0) scale(1.05);
          }
        }

        @keyframes pulseDot {
          0%,
          100% {
            opacity: 0.55;
            transform: scale(1);
          }

          50% {
            opacity: 1;
            transform: scale(1.25);
          }
        }

        @keyframes timelineReveal {
          from {
            transform: scaleY(0);
            transform-origin: top;
          }

          to {
            transform: scaleY(1);
            transform-origin: top;
          }
        }

        @keyframes shimmer {
          0% {
            transform: translateX(-130%) skewX(-18deg);
          }

          100% {
            transform: translateX(250%) skewX(-18deg);
          }
        }

        @keyframes iconPulse {
          0%,
          100% {
            box-shadow: 0 10px 30px rgba(16, 185, 129, 0.08);
          }

          50% {
            box-shadow:
              0 15px 45px rgba(16, 185, 129, 0.18),
              0 0 25px rgba(20, 184, 166, 0.12);
          }
        }

        @keyframes orbit {
          from {
            transform: rotate(0deg);
          }

          to {
            transform: rotate(360deg);
          }
        }

        @keyframes sparkle {
          0%,
          100% {
            opacity: 0.25;
            transform: scale(0.8) rotate(0deg);
          }

          50% {
            opacity: 1;
            transform: scale(1.15) rotate(90deg);
          }
        }

        @keyframes ctaFloat {
          0%,
          100% {
            transform: translateY(0);
          }

          50% {
            transform: translateY(-7px);
          }
        }

        .how-hero-badge {
          animation: fadeDown 0.7s ease-out both;
        }

        .how-hero-title {
          animation: fadeUp 0.8s 0.12s ease-out both;
        }

        .how-hero-description {
          animation: fadeUp 0.8s 0.24s ease-out both;
        }

        .how-process {
          animation: scaleIn 0.8s 0.4s ease-out both;
        }

        .how-pink-glow {
          animation: floatPink 8s ease-in-out infinite;
          will-change: transform;
        }

        .how-green-glow {
          animation: floatGreen 9s ease-in-out infinite;
          will-change: transform;
        }

        .how-center-glow {
          animation: floatCenter 7s ease-in-out infinite;
          will-change: transform;
        }

        .how-dot {
          animation: pulseDot 2.5s ease-in-out infinite;
        }

        .how-dot:nth-child(1) {
          animation-delay: 0s;
        }

        .how-dot:nth-child(2) {
          animation-delay: 0.15s;
        }

        .how-dot:nth-child(3) {
          animation-delay: 0.3s;
        }

        .how-dot:nth-child(4) {
          animation-delay: 0.45s;
        }

        .how-dot:nth-child(5) {
          animation-delay: 0.6s;
        }

        .how-dot:nth-child(6) {
          animation-delay: 0.75s;
        }

        .how-timeline {
          animation: timelineReveal 1.8s 0.5s ease-out both;
        }

        .how-card {
          position: relative;
          overflow: hidden;
          isolation: isolate;
          transition:
            transform 0.45s cubic-bezier(0.22, 1, 0.36, 1),
            box-shadow 0.45s ease,
            border-color 0.35s ease;
        }

        .how-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: -130%;
          width: 65%;
          height: 100%;
          background: linear-gradient(
            100deg,
            transparent,
            rgba(255, 255, 255, 0.24),
            transparent
          );
          pointer-events: none;
          z-index: 5;
        }

        .how-card:hover::before {
          animation: shimmer 0.9s ease;
        }

        .how-card:hover {
          transform: translateY(-6px);
        }

        .how-icon {
          animation: iconPulse 4s ease-in-out infinite;
          transition:
            transform 0.4s cubic-bezier(0.22, 1, 0.36, 1),
            box-shadow 0.4s ease;
        }

        .how-step:hover .how-icon {
          transform: translateY(-7px) scale(1.08) rotate(-3deg);
        }

        .how-orbit {
          opacity: 0;
          transition: opacity 0.35s ease;
        }

        .how-step:hover .how-orbit {
          opacity: 1;
          animation: orbit 4s linear infinite;
        }

        .how-point {
          transition:
            transform 0.3s ease,
            color 0.3s ease;
        }

        .how-point:hover {
          transform: translateX(5px);
        }

        .how-check {
          transition:
            transform 0.3s ease,
            box-shadow 0.3s ease;
        }

        .how-point:hover .how-check {
          transform: scale(1.18);
          box-shadow: 0 0 16px rgba(16, 185, 129, 0.18);
        }

        .how-spark {
          animation: sparkle 3s ease-in-out infinite;
        }

        .how-spark:nth-child(2) {
          animation-delay: 0.7s;
        }

        .how-spark:nth-child(3) {
          animation-delay: 1.4s;
        }

        .how-spark:nth-child(4) {
          animation-delay: 2.1s;
        }

        .how-cta-icon {
          animation: ctaFloat 3s ease-in-out infinite;
        }

        .how-cta-button {
          position: relative;
          overflow: hidden;
        }

        .how-cta-button::before {
          content: '';
          position: absolute;
          inset: 0;
          transform: translateX(-110%);
          background: linear-gradient(
            110deg,
            transparent,
            rgba(255, 255, 255, 0.25),
            transparent
          );
          transition: transform 0.6s ease;
        }

        .how-cta-button:hover::before {
          transform: translateX(110%);
        }

        @media (prefers-reduced-motion: reduce) {
          .how-hero-badge,
          .how-hero-title,
          .how-hero-description,
          .how-process,
          .how-pink-glow,
          .how-green-glow,
          .how-center-glow,
          .how-dot,
          .how-timeline,
          .how-icon,
          .how-spark,
          .how-cta-icon {
            animation: none !important;
          }

          .how-card,
          .how-icon,
          .how-point {
            transition: none !important;
          }
        }
      `}</style>

      {/* Background Effects */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="how-pink-glow absolute -left-40 top-0 h-[480px] w-[480px] rounded-full bg-pink-300/20 blur-[130px] dark:bg-pink-500/15" />

        <div className="how-green-glow absolute -right-40 top-[30rem] h-[520px] w-[520px] rounded-full bg-emerald-300/20 blur-[135px] dark:bg-emerald-500/15" />

        <div className="how-center-glow absolute left-1/2 top-[55rem] h-[400px] w-[400px] -translate-x-1/2 rounded-full bg-teal-300/15 blur-[130px] dark:bg-teal-500/10" />

        <Sparkles className="how-spark absolute left-[12%] top-[18%] h-4 w-4 text-pink-400/40" />

        <Sparkles className="how-spark absolute right-[15%] top-[28%] h-5 w-5 text-emerald-400/40" />

        <Sparkles className="how-spark absolute left-[8%] top-[65%] h-3 w-3 text-teal-400/40" />

        <Sparkles className="how-spark absolute right-[8%] top-[78%] h-4 w-4 text-violet-400/40" />
      </div>

      {/* Hero Section */}
      <section className="relative overflow-hidden px-4 pb-24 pt-32 sm:px-6 sm:pb-28 sm:pt-36">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.035] dark:opacity-[0.04]"
          style={{
            backgroundImage:
              'linear-gradient(#64748b 1px, transparent 1px), linear-gradient(90deg, #64748b 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />

        <div className="relative z-10 mx-auto max-w-4xl text-center">
          <div className="how-hero-badge mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-200/80 bg-white/75 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-emerald-700 shadow-[0_8px_30px_rgba(16,185,129,0.08)] backdrop-blur-xl dark:border-emerald-400/20 dark:bg-slate-900/65 dark:text-emerald-300">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-70" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500 dark:bg-emerald-400" />
            </span>

            <Sparkles className="h-4 w-4" />

            Process
          </div>

          <h1 className="how-hero-title text-4xl font-black tracking-[-0.04em] text-stone-900 sm:text-6xl lg:text-7xl dark:text-white">
            How It{' '}
            <span className="relative inline-block bg-gradient-to-r from-emerald-600 via-teal-500 to-green-600 bg-clip-text text-transparent dark:from-emerald-300 dark:via-teal-300 dark:to-green-400">
              Works
              <span className="absolute -bottom-2 left-1/2 h-1 w-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-emerald-400 to-teal-400 opacity-40 blur-sm" />
            </span>
          </h1>

          <p className="how-hero-description mx-auto mt-6 max-w-2xl text-base leading-7 text-stone-600 sm:text-lg sm:leading-8 dark:text-slate-300">
            A 6-phase lifecycle that takes your project allocation from pool
            creation to final team freeze.
          </p>

          {/* Process Indicator */}
          <div className="how-process mx-auto mt-10 flex max-w-xl items-center justify-center">
            {steps.map((step, index) => (
              <React.Fragment key={step.phase}>
                <div className="flex flex-col items-center gap-2">
                  <div
                    className={`how-dot h-3 w-3 rounded-full ${
                      index === 0
                        ? 'bg-emerald-500 shadow-[0_0_18px_rgba(16,185,129,0.65)] dark:bg-emerald-400'
                        : 'bg-stone-200 dark:bg-slate-700'
                    }`}
                  />

                  <span className="hidden text-[9px] font-bold uppercase tracking-wider text-stone-400 sm:block dark:text-slate-600">
                    {index + 1}
                  </span>
                </div>

                {index < steps.length - 1 && (
                  <div className="h-px w-7 bg-gradient-to-r from-stone-200 to-stone-300 sm:w-12 dark:from-slate-700 dark:to-slate-800" />
                )}
              </React.Fragment>
            ))}
          </div>

          {/* Hero Info Pills */}
          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-stone-200/80 bg-white/70 px-4 py-2 text-xs font-semibold text-stone-600 shadow-sm backdrop-blur-md dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-300">
              <Clock3 className="h-3.5 w-3.5 text-emerald-500" />
              6 Clear Phases
            </div>

            <div className="inline-flex items-center gap-2 rounded-full border border-stone-200/80 bg-white/70 px-4 py-2 text-xs font-semibold text-stone-600 shadow-sm backdrop-blur-md dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-300">
              <ShieldCheck className="h-3.5 w-3.5 text-blue-500" />
              Controlled Workflow
            </div>

            <div className="inline-flex items-center gap-2 rounded-full border border-stone-200/80 bg-white/70 px-4 py-2 text-xs font-semibold text-stone-600 shadow-sm backdrop-blur-md dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-300">
              <Zap className="h-3.5 w-3.5 text-amber-500" />
              Transparent Allocation
            </div>
          </div>
        </div>
      </section>

      {/* Timeline Section */}
      <section className="relative overflow-hidden px-4 pb-24 sm:px-6 sm:pb-32">
        <div className="how-pink-glow pointer-events-none absolute -left-40 top-1/4 h-[380px] w-[380px] rounded-full bg-pink-200/15 blur-[120px] dark:bg-pink-600/10" />

        <div className="how-green-glow pointer-events-none absolute -right-40 top-2/3 h-[420px] w-[420px] rounded-full bg-emerald-200/15 blur-[120px] dark:bg-emerald-600/10" />

        <div className="relative mx-auto max-w-5xl">
          <div className="mb-14 text-center">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-600 dark:text-emerald-400">
              The Allocation Journey
            </p>

            <h2 className="mt-3 text-2xl font-bold tracking-tight text-stone-900 sm:text-3xl dark:text-white">
              From setup to final allocation
            </h2>

            <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-stone-500 dark:text-slate-300">
              Every stage is clearly defined so that admins, faculty,
              subadmins, and students always know what happens next.
            </p>
          </div>

          <div className="relative">
            {/* Desktop Timeline Line */}
            <div className="how-timeline absolute bottom-10 left-[28px] top-10 hidden w-[2px] rounded-full bg-gradient-to-b from-emerald-400 via-teal-300 to-transparent lg:block dark:from-emerald-400/70 dark:via-teal-500/30 dark:to-transparent" />

            <div className="space-y-8 sm:space-y-10">
              {steps.map((step, index) => (
                <div
                  key={step.phase}
                  data-reveal={`${index * 150}ms`}
                  className="how-step group relative flex gap-5 sm:gap-7"
                >
                  {/* Step Icon */}
                  <div className="relative z-10 flex flex-shrink-0 flex-col items-center">
                    <div
                      className={`how-icon relative flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${step.color} text-white shadow-xl`}
                    >
                      {step.icon}

                      <div className="how-orbit pointer-events-none absolute -inset-2 rounded-[20px] border border-emerald-400/20 border-dashed" />

                      <div
                        className={`absolute -inset-2 -z-10 rounded-2xl bg-gradient-to-br ${step.color} opacity-0 blur-xl transition-opacity duration-300 group-hover:opacity-50`}
                      />
                    </div>

                    {/* Mobile Timeline */}
                    {index < steps.length - 1 && (
                      <div className="mt-3 min-h-[50px] w-[2px] flex-1 rounded-full bg-gradient-to-b from-emerald-300 to-transparent lg:hidden dark:from-emerald-500/40" />
                    )}
                  </div>

                  {/* Step Card */}
                  <div className="min-w-0 flex-1 pb-1">
                    <div className="how-card rounded-[1.7rem] border border-stone-200/80 bg-white/80 p-5 shadow-[0_12px_40px_rgba(41,37,36,0.055)] backdrop-blur-xl group-hover:border-emerald-300/70 group-hover:shadow-[0_20px_55px_rgba(16,185,129,0.10)] sm:p-7 dark:border-slate-700/80 dark:bg-slate-900/75 dark:shadow-[0_18px_55px_rgba(0,0,0,0.25)] dark:group-hover:border-emerald-400/30 dark:group-hover:bg-slate-900/90 dark:group-hover:shadow-[0_20px_60px_rgba(16,185,129,0.08)]">
                      {/* Top Accent */}
                      <div
                        className={`absolute left-0 right-0 top-0 h-[2px] bg-gradient-to-r ${step.color} opacity-50`}
                      />

                      {/* Phase + Role */}
                      <div className="relative z-10 flex flex-wrap items-center gap-2.5">
                        <span className="rounded-full border border-stone-200/70 bg-stone-50/80 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-stone-400 dark:border-slate-700 dark:bg-slate-800/70 dark:text-slate-400">
                          {step.phase}
                        </span>

                        <span
                          className={`rounded-lg border px-2.5 py-1 text-[11px] font-bold ${roleColor(
                            step.role
                          )}`}
                        >
                          {step.role}
                        </span>
                      </div>

                      {/* Title */}
                      <h3 className="relative z-10 mt-4 text-xl font-extrabold tracking-tight text-stone-900 sm:text-2xl dark:text-white">
                        {step.title}
                      </h3>

                      {/* Points */}
                      <ul className="relative z-10 mt-5 space-y-3.5">
                        {step.points.map((point, pointIndex) => (
                          <li
                            key={pointIndex}
                            className="how-point flex items-start gap-3 text-sm leading-6 text-stone-600 dark:text-slate-300"
                          >
                            <span className="how-check mt-[5px] flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-400/10">
                              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 dark:text-emerald-400" />
                            </span>

                            <span>{point}</span>
                          </li>
                        ))}
                      </ul>

                      {/* Card Footer */}
                      <div className="relative z-10 mt-7 flex items-center justify-between border-t border-stone-100 pt-4 dark:border-slate-700/70">
                        <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-stone-400 dark:text-slate-500">
                          Project Allocation Platform
                        </span>

                        <span className="rounded-full bg-stone-100 px-2.5 py-1 text-[10px] font-bold text-stone-400 dark:bg-slate-800 dark:text-slate-500">
                          0{index + 1}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative overflow-hidden px-4 pb-24 sm:px-6 sm:pb-32">
        <div className="how-pink-glow pointer-events-none absolute -left-20 top-1/2 h-[350px] w-[350px] -translate-y-1/2 rounded-full bg-pink-300/20 blur-[120px] dark:bg-pink-500/15" />

        <div className="how-green-glow pointer-events-none absolute -right-20 top-1/2 h-[350px] w-[350px] -translate-y-1/2 rounded-full bg-emerald-300/20 blur-[120px] dark:bg-emerald-500/15" />

        <div className="relative mx-auto max-w-4xl">
          <div className="relative overflow-hidden rounded-[2rem] border border-pink-200/70 bg-gradient-to-br from-white via-pink-50/70 to-emerald-50/70 px-6 py-14 text-center shadow-[0_20px_70px_rgba(41,37,36,0.08)] backdrop-blur-xl transition-all duration-500 hover:shadow-[0_25px_80px_rgba(16,185,129,0.10)] sm:px-10 sm:py-16 dark:border-slate-700/80 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800 dark:shadow-[0_25px_80px_rgba(0,0,0,0.35)]">
            <div className="how-pink-glow absolute -left-24 -top-24 h-64 w-64 rounded-full bg-pink-300/25 blur-[80px] dark:bg-pink-500/15" />

            <div className="how-green-glow absolute -bottom-24 -right-24 h-64 w-64 rounded-full bg-emerald-300/25 blur-[80px] dark:bg-emerald-500/15" />

            <div className="how-center-glow absolute left-1/2 top-1/2 h-48 w-48 -translate-x-1/2 -translate-y-1/2 rounded-full bg-teal-200/20 blur-[80px] dark:bg-teal-500/10" />

            <div className="relative z-10">
              <div className="how-cta-icon mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600 shadow-[0_10px_35px_rgba(16,185,129,0.12)] dark:bg-emerald-400/10 dark:text-emerald-300 dark:shadow-[0_0_30px_rgba(52,211,153,0.08)]">
                <Sparkles className="h-6 w-6" />
              </div>

              <h2 className="mt-6 text-2xl font-black tracking-tight text-stone-900 sm:text-3xl dark:text-white">
                Ready to get started?
              </h2>

              <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-stone-600 sm:text-base dark:text-slate-300">
                Make project allocation simpler, fairer, and completely
                transparent for everyone.
              </p>

              <Link
                to="/login"
                className="how-cta-button group mt-8 inline-flex items-center gap-2 rounded-xl bg-stone-900 px-6 py-3.5 text-sm font-bold text-white shadow-[0_12px_30px_rgba(28,25,23,0.15)] transition-all duration-300 hover:-translate-y-1 hover:bg-stone-800 hover:shadow-[0_18px_40px_rgba(28,25,23,0.20)] dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 dark:hover:shadow-[0_15px_40px_rgba(255,255,255,0.12)]"
              >
                <span className="relative z-10">Get Started</span>

                <ArrowRight className="relative z-10 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1.5" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HowItWorksPage;