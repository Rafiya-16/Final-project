import React from 'react';
import {
  Target,
  Eye,
  Code,
  Layers,
  Database,
  Palette,
  Sparkles,
  CheckCircle2,
  XCircle,
  ArrowRight,
} from 'lucide-react';
import { useScrollReveal } from '@/hooks/useScrollReveal';

const AboutPage: React.FC = () => {
  const revealRef = useScrollReveal();

  const problems = [
    {
      problem: 'Manual Allocation',
      solution:
        'Fully automated pool-based allocation with clearly defined phases.',
    },
    {
      problem: 'Duplicate Selection',
      solution:
        'Database-level protection prevents same project selected twice.',
    },
    {
      problem: 'Lack of Transparency',
      solution:
        'Complete audit trail records important actions.',
    },
    {
      problem: 'Unfair Distribution',
      solution:
        'Students explore projects without faculty names influencing choice.',
    },
    {
      problem: 'Missed Deadlines',
      solution:
        'Timeline enforcement blocks actions outside designated phase.',
    },
    {
      problem: 'Communication Gaps',
      solution:
        'In-app and email notifications for critical events.',
    },
  ];

  const techStack = [
    {
      icon: Code,
      title: 'Frontend',
      description: 'React 18, TypeScript, Vite, Tailwind CSS',
      color: 'blue',
      iconBg: 'bg-blue-100 dark:bg-blue-500/10',
      iconColor: 'text-blue-600 dark:text-blue-400',
      glow: 'bg-blue-500/10',
    },
    {
      icon: Layers,
      title: 'Backend',
      description: 'Node.js, Express, TypeScript, Prisma ORM',
      color: 'emerald',
      iconBg: 'bg-emerald-100 dark:bg-emerald-500/10',
      iconColor: 'text-emerald-600 dark:text-emerald-400',
      glow: 'bg-emerald-500/10',
    },
    {
      icon: Database,
      title: 'Database',
      description: 'PostgreSQL, Prisma Migrations, UUID Primary Keys',
      color: 'violet',
      iconBg: 'bg-violet-100 dark:bg-violet-500/10',
      iconColor: 'text-violet-600 dark:text-violet-400',
      glow: 'bg-violet-500/10',
    },
    {
      icon: Palette,
      title: 'Platform',
      description:
        'JWT Auth, Role-Based Access, Email (Nodemailer), Audit Logging',
      color: 'amber',
      iconBg: 'bg-amber-100 dark:bg-amber-500/10',
      iconColor: 'text-amber-600 dark:text-amber-400',
      glow: 'bg-amber-500/10',
    },
  ];

  return (
    <div
      ref={revealRef}
      className="
        min-h-screen
        overflow-hidden
        bg-[#faf9f7]
        dark:bg-[#070812]
        transition-colors
        duration-500
      "
    >
      {/* =========================================================
          HERO SECTION
      ========================================================== */}
      <section
        className="
          relative
          overflow-hidden
          pt-32
          pb-24
          bg-[#fffefe]
          dark:bg-[#080914]
        "
      >
        {/* ---------- LIGHT MODE BACKGROUND ---------- */}

        {/* Left soft purple glow */}
        <div
          className="
            absolute
            -left-40
            top-0
            w-[560px]
            h-[560px]
            rounded-full
            bg-violet-200/35
            blur-[125px]
            dark:hidden
          "
        />

        {/* Left soft pink inner glow */}
        <div
          className="
            absolute
            -left-20
            top-36
            w-[380px]
            h-[380px]
            rounded-full
            bg-fuchsia-100/45
            blur-[105px]
            dark:hidden
          "
        />

        {/* Right soft pink glow */}
        <div
          className="
            absolute
            -right-40
            top-0
            w-[580px]
            h-[580px]
            rounded-full
            bg-pink-200/40
            blur-[125px]
            dark:hidden
          "
        />

        {/* Right soft purple inner glow */}
        <div
          className="
            absolute
            -right-20
            top-36
            w-[390px]
            h-[390px]
            rounded-full
            bg-violet-100/40
            blur-[105px]
            dark:hidden
          "
        />

        {/* Light center blending */}
        <div
          className="
            absolute
            inset-0
            bg-gradient-to-r
            from-violet-50/45
            via-transparent
            to-pink-50/50
            dark:hidden
          "
        />

        {/* Light soft white wash */}
        <div
          className="
            absolute
            inset-0
            bg-gradient-to-b
            from-white/35
            via-transparent
            to-white/70
            dark:hidden
          "
        />

        {/* ---------- DARK MODE BACKGROUND ---------- */}

        {/* Dark left purple glow */}
        <div
          className="
            absolute
            -left-48
            -top-20
            w-[650px]
            h-[650px]
            rounded-full
            bg-violet-600/24
            blur-[135px]
            hidden
            dark:block
            animate-pulse-glow
          "
        />

        {/* Dark left pink glow */}
        <div
          className="
            absolute
            -left-24
            top-36
            w-[430px]
            h-[430px]
            rounded-full
            bg-fuchsia-500/16
            blur-[115px]
            hidden
            dark:block
          "
        />

        {/* Dark right pink glow */}
        <div
          className="
            absolute
            -right-48
            -top-20
            w-[680px]
            h-[680px]
            rounded-full
            bg-pink-600/25
            blur-[135px]
            hidden
            dark:block
            animate-pulse-glow
          "
        />

        {/* Dark right purple glow */}
        <div
          className="
            absolute
            -right-24
            top-36
            w-[430px]
            h-[430px]
            rounded-full
            bg-violet-500/18
            blur-[115px]
            hidden
            dark:block
          "
        />

        {/* Dark center blending */}
        <div
          className="
            absolute
            inset-0
            hidden
            dark:block
            bg-gradient-to-r
            from-violet-950/20
            via-transparent
            to-pink-950/20
          "
        />

        {/* Dark center soft light */}
        <div
          className="
            absolute
            inset-0
            hidden
            dark:block
            bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.035),transparent_58%)]
          "
        />

        {/* Dark subtle vignette */}
        <div
          className="
            absolute
            inset-0
            hidden
            dark:block
            bg-[radial-gradient(circle_at_center,transparent_25%,rgba(8,9,20,0.18)_75%,rgba(8,9,20,0.32)_100%)]
          "
        />

        {/* ---------- GRID ---------- */}

        <div
          className="
            absolute
            inset-0
            opacity-[0.18]
            dark:opacity-[0.08]
            bg-[linear-gradient(rgba(124,58,237,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(236,72,153,0.08)_1px,transparent_1px)]
            bg-[size:42px_42px]
          "
        />

        {/* ---------- HERO CONTENT ---------- */}

        <div className="relative z-10 max-w-7xl mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center">
            {/* Badge */}
            <div
              data-reveal
              className="
                inline-flex
                items-center
                gap-2
                px-4
                py-2
                rounded-full
                border
                border-violet-200/80
                bg-white/75
                backdrop-blur-md
                text-violet-700
                shadow-sm
                animate-fade-in-down
                dark:border-violet-400/20
                dark:bg-white/[0.06]
                dark:text-violet-200
              "
            >
              <Sparkles className="w-4 h-4" />
              <span className="text-sm font-semibold">
                About ProjectAlloc
              </span>
            </div>

            {/* Heading */}
            <h1
              data-reveal
              className="
                mt-7
                text-4xl
                sm:text-5xl
                lg:text-6xl
                font-extrabold
                tracking-tight
                leading-tight
                text-stone-900
                dark:text-white
                animate-fade-in-up
              "
            >
              Smarter Project
              <br />
              <span
                className="
                  bg-gradient-to-r
                  from-violet-500
                  via-fuchsia-500
                  to-pink-500
                  dark:from-violet-300
                  dark:via-fuchsia-300
                  dark:to-pink-300
                  bg-clip-text
                  text-transparent
                "
              >
                Allocation for Everyone
              </span>
            </h1>

            {/* Description */}
            <p
              data-reveal
              className="
                mt-6
                max-w-3xl
                mx-auto
                text-base
                sm:text-lg
                leading-8
                text-stone-600
                dark:text-slate-200
                animate-fade-in-up
              "
            >
              An automated project allocation platform designed to eliminate
              manual processes, reduce bias, and give every student a fair
              opportunity to select their preferred project.
            </p>

            {/* Feature Pills */}
            <div
              data-reveal
              className="
                mt-8
                flex
                flex-wrap
                justify-center
                gap-3
                animate-fade-in-up
              "
            >
              {[
                'Fair Allocation',
                'Complete Transparency',
                'Automated Workflow',
              ].map((item, index) => (
                <div
                  key={item}
                  style={{
                    animationDelay: `${300 + index * 100}ms`,
                  }}
                  className="
                    inline-flex
                    items-center
                    gap-2
                    rounded-full
                    border
                    border-violet-200/80
                    bg-white/80
                    px-4
                    py-2
                    text-sm
                    font-medium
                    text-stone-700
                    shadow-sm
                    backdrop-blur-md
                    transition-all
                    duration-300
                    hover:-translate-y-1
                    hover:shadow-lg
                    dark:border-white/10
                    dark:bg-white/[0.06]
                    dark:text-slate-200
                  "
                >
                  <CheckCircle2
                    className="
                      w-4
                      h-4
                      text-violet-500
                      dark:text-violet-300
                    "
                  />
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          MISSION & VISION
      ========================================================== */}
      <section
        className="
          relative
          py-24
          bg-white
          dark:bg-[#080d18]
          transition-colors
          duration-500
        "
      >
        <div className="max-w-7xl mx-auto px-6">
          {/* Section Heading */}
          <div
            data-reveal
            className="text-center max-w-3xl mx-auto mb-14"
          >
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-violet-600 dark:text-violet-400">
              Our Purpose
            </p>

            <h2
              className="
                mt-3
                text-3xl
                sm:text-4xl
                font-bold
                text-stone-900
                dark:text-white
              "
            >
              Built around fairness and efficiency
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Mission */}
            <div
              data-reveal
              className="
                group
                relative
                overflow-hidden
                rounded-3xl
                border
                border-blue-100
                bg-blue-50/70
                p-8
                transition-all
                duration-500
                hover:-translate-y-2
                hover:scale-[1.01]
                hover:shadow-2xl
                dark:border-blue-500/10
                dark:bg-blue-500/[0.05]
              "
            >
              <div
                className="
                  absolute
                  -right-16
                  -top-16
                  w-40
                  h-40
                  rounded-full
                  bg-blue-400/20
                  blur-3xl
                  transition-transform
                  duration-500
                  group-hover:scale-150
                "
              />

              <div
                className="
                  relative
                  w-14
                  h-14
                  rounded-2xl
                  bg-blue-100
                  dark:bg-blue-500/10
                  flex
                  items-center
                  justify-center
                "
              >
                <Target className="w-7 h-7 text-blue-600 dark:text-blue-400" />
              </div>

              <h3
                className="
                  relative
                  mt-6
                  text-2xl
                  font-bold
                  text-stone-900
                  dark:text-white
                "
              >
                Mission
              </h3>

              <p
                className="
                  relative
                  mt-4
                  leading-7
                  text-stone-600
                  dark:text-slate-300
                "
              >
                To simplify and automate project allocation while ensuring
                fairness, transparency, and equal opportunity for every
                student.
              </p>
            </div>

            {/* Vision */}
            <div
              data-reveal
              className="
                group
                relative
                overflow-hidden
                rounded-3xl
                border
                border-violet-100
                bg-violet-50/70
                p-8
                transition-all
                duration-500
                hover:-translate-y-2
                hover:scale-[1.01]
                hover:shadow-2xl
                dark:border-violet-500/10
                dark:bg-violet-500/[0.05]
              "
            >
              <div
                className="
                  absolute
                  -right-16
                  -top-16
                  w-40
                  h-40
                  rounded-full
                  bg-violet-400/20
                  blur-3xl
                  transition-transform
                  duration-500
                  group-hover:scale-150
                "
              />

              <div
                className="
                  relative
                  w-14
                  h-14
                  rounded-2xl
                  bg-violet-100
                  dark:bg-violet-500/10
                  flex
                  items-center
                  justify-center
                "
              >
                <Eye className="w-7 h-7 text-violet-600 dark:text-violet-400" />
              </div>

              <h3
                className="
                  relative
                  mt-6
                  text-2xl
                  font-bold
                  text-stone-900
                  dark:text-white
                "
              >
                Vision
              </h3>

              <p
                className="
                  relative
                  mt-4
                  leading-7
                  text-stone-600
                  dark:text-slate-300
                "
              >
                To create a smarter academic ecosystem where technology
                removes unnecessary complexity and enables better project
                decisions.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          PROBLEMS WE SOLVE
      ========================================================== */}
      <section
        className="
          relative
          py-24
          bg-[#faf9f7]
          dark:bg-[#070b14]
          border-y
          border-stone-200/70
          dark:border-white/[0.06]
        "
      >
        <div className="max-w-7xl mx-auto px-6">
          <div
            data-reveal
            className="text-center max-w-3xl mx-auto mb-14"
          >
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-pink-600 dark:text-pink-400">
              Why ProjectAlloc
            </p>

            <h2
              className="
                mt-3
                text-3xl
                sm:text-4xl
                font-bold
                text-stone-900
                dark:text-white
              "
            >
              Problems we solve
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {problems.map((item, index) => (
              <div
                key={item.problem}
                data-reveal
                style={{
                  animationDelay: `${index * 100}ms`,
                }}
                className="
                  group
                  rounded-2xl
                  border
                  border-stone-200
                  bg-white
                  p-6
                  transition-all
                  duration-500
                  hover:-translate-y-2
                  hover:shadow-xl
                  dark:border-white/[0.07]
                  dark:bg-white/[0.03]
                "
              >
                <div className="flex items-start gap-4">
                  <div
                    className="
                      shrink-0
                      w-10
                      h-10
                      rounded-xl
                      bg-red-50
                      dark:bg-red-500/10
                      flex
                      items-center
                      justify-center
                    "
                  >
                    <XCircle className="w-5 h-5 text-red-500 dark:text-red-400" />
                  </div>

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-red-500 dark:text-red-400">
                      Problem
                    </p>

                    <h3
                      className="
                        mt-1
                        font-bold
                        text-stone-900
                        dark:text-white
                      "
                    >
                      {item.problem}
                    </h3>
                  </div>
                </div>

                <div
                  className="
                    my-5
                    h-px
                    bg-stone-200
                    dark:bg-white/10
                  "
                />

                <div className="flex items-start gap-4">
                  <div
                    className="
                      shrink-0
                      w-10
                      h-10
                      rounded-xl
                      bg-emerald-50
                      dark:bg-emerald-500/10
                      flex
                      items-center
                      justify-center
                    "
                  >
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 dark:text-emerald-400" />
                  </div>

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600 dark:text-emerald-400">
                      Solution
                    </p>

                    <p
                      className="
                        mt-1
                        text-sm
                        leading-6
                        text-stone-600
                        dark:text-slate-300
                      "
                    >
                      {item.solution}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =========================================================
          TECHNOLOGY
      ========================================================== */}
      <section
        className="
          relative
          py-24
          bg-white
          dark:bg-[#080d18]
        "
      >
        <div className="max-w-7xl mx-auto px-6">
          <div
            data-reveal
            className="text-center max-w-3xl mx-auto mb-14"
          >
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-violet-600 dark:text-violet-400">
              Technology
            </p>

            <h2
              className="
                mt-3
                text-3xl
                sm:text-4xl
                font-bold
                text-stone-900
                dark:text-white
              "
            >
              Built with modern technology
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {techStack.map((stack, index) => {
              const Icon = stack.icon;

              return (
                <div
                  key={stack.title}
                  data-reveal
                  style={{
                    animationDelay: `${index * 100}ms`,
                  }}
                  className="
                    group
                    relative
                    overflow-hidden
                    rounded-2xl
                    border
                    border-stone-200
                    bg-white
                    p-6
                    transition-all
                    duration-500
                    hover:-translate-y-2
                    hover:shadow-xl
                    dark:border-white/[0.07]
                    dark:bg-white/[0.03]
                  "
                >
                  <div
                    className={`
                      absolute
                      -right-10
                      -top-10
                      w-32
                      h-32
                      rounded-full
                      blur-3xl
                      opacity-0
                      group-hover:opacity-100
                      transition-opacity
                      duration-500
                      ${stack.glow}
                    `}
                  />

                  <div
                    className={`
                      relative
                      w-12
                      h-12
                      rounded-xl
                      flex
                      items-center
                      justify-center
                      ${stack.iconBg}
                    `}
                  >
                    <Icon
                      className={`
                        w-6
                        h-6
                        ${stack.iconColor}
                      `}
                    />
                  </div>

                  <h3
                    className="
                      relative
                      mt-5
                      text-xl
                      font-bold
                      text-stone-900
                      dark:text-white
                    "
                  >
                    {stack.title}
                  </h3>

                  <p
                    className="
                      relative
                      mt-3
                      text-sm
                      leading-6
                      text-stone-600
                      dark:text-slate-300
                    "
                  >
                    {stack.description}
                  </p>

                  <div
                    className="
                      relative
                      mt-5
                      inline-flex
                      items-center
                      gap-1
                      text-sm
                      font-semibold
                      text-violet-600
                      dark:text-violet-400
                    "
                  >
                    Explore
                    <ArrowRight
                      className="
                        w-4
                        h-4
                        transition-transform
                        duration-300
                        group-hover:translate-x-1
                      "
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* =========================================================
          CTA
      ========================================================== */}
      <section
        className="
          relative
          py-24
          bg-white
          dark:bg-[#080d18]
        "
      >
        <div className="max-w-6xl mx-auto px-6">
          <div
            data-reveal
            className="
              group
              relative
              overflow-hidden
              rounded-[2rem]
              border
              border-rose-100
              bg-white
              px-6
              py-16
              sm:px-12
              text-center
              shadow-xl
              dark:border-white/[0.07]
              dark:bg-white/[0.025]
            "
          >
            {/* Left Glow */}
            <div
              className="
                absolute
                -left-24
                -top-24
                w-72
                h-72
                rounded-full
                bg-rose-200/40
                dark:bg-rose-500/15
                blur-[100px]
                transition-transform
                duration-700
                group-hover:scale-125
              "
            />

            {/* Right Glow */}
            <div
              className="
                absolute
                -right-24
                -bottom-24
                w-72
                h-72
                rounded-full
                bg-pink-200/40
                dark:bg-pink-500/12
                blur-[100px]
                transition-transform
                duration-700
                group-hover:scale-125
              "
            />

            {/* Inner Gradient */}
            <div
              className="
                absolute
                inset-0
                bg-gradient-to-br
                from-rose-50/60
                via-white
                to-pink-50/50
                dark:from-rose-500/[0.035]
                dark:via-transparent
                dark:to-pink-500/[0.035]
              "
            />

            <div className="relative z-10">
              <div
                className="
                  mx-auto
                  w-14
                  h-14
                  rounded-2xl
                  bg-gradient-to-br
                  from-violet-100
                  to-pink-100
                  dark:from-violet-500/10
                  dark:to-pink-500/10
                  flex
                  items-center
                  justify-center
                "
              >
                <Sparkles className="w-7 h-7 text-violet-600 dark:text-violet-300" />
              </div>

              <h2
                className="
                  mt-6
                  text-3xl
                  sm:text-4xl
                  font-bold
                  text-stone-900
                  dark:text-white
                "
              >
                Making project allocation simpler
              </h2>

              <p
                className="
                  mt-5
                  max-w-2xl
                  mx-auto
                  text-base
                  sm:text-lg
                  leading-8
                  text-stone-600
                  dark:text-slate-300
                "
              >
                ProjectAlloc brings students, faculty, and administrators
                together through one transparent and automated platform.
              </p>
            </div>

            {/* Bottom Gradient Bar */}
            <div
              className="
                absolute
                bottom-0
                left-0
                right-0
                h-1
                bg-gradient-to-r
                from-violet-400
                via-fuchsia-400
                to-pink-400
              "
            />
          </div>
        </div>
      </section>
    </div>
  );
};

export default AboutPage;