// frontend/src/pages/public/FAQPage.tsx

import React, { useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  Search,
  Sparkles,
} from 'lucide-react';

const faqs = [
  {
    category: 'General',
    questions: [
      {
        q: 'What is ProjectAlloc?',
        a: 'ProjectAlloc is an automated project allocation platform designed for universities. It manages the entire lifecycle from faculty proposal submission to student team formation and project selection.',
      },
      {
        q: 'Who can use this platform?',
        a: 'The platform supports four roles: Admin (manages everything), Subadmin (reviews proposals), Faculty (submits project proposals), and Students (form teams and select projects).',
      },
      {
        q: 'How do I get an account?',
        a: 'Accounts are created by the Admin only. There is no self-registration. The Admin either creates accounts manually or imports them via CSV. You\'ll receive your credentials from your department.',
      },
    ],
  },
  {
    category: 'For Students',
    questions: [
      {
        q: 'Can I see which faculty proposed a project?',
        a: 'No. To ensure fairness, students only see project titles, descriptions, domains, and prerequisites — not the faculty name. Faculty names are revealed only after teams are frozen.',
      },
      {
        q: 'How do I form a team?',
        a: 'One student creates a team and becomes the leader. The leader then invites other students. Each team needs a minimum of 3 members (configurable by admin). Maximum is usually 3, but some projects allow 4.',
      },
      {
        q: 'Can I be in multiple teams?',
        a: 'No. You can only be an active member of one team per pool. If you leave a team, you can join or create another one (before the freeze deadline).',
      },
      {
        q: 'What if I have my own project idea?',
        a: 'You can submit your own project idea through the platform. If the admin approves it, it gets automatically assigned to your team as a reserved project — no other team can take it.',
      },
      {
        q: 'Can two teams select the same project?',
        a: 'No. The system uses database-level locking to ensure that once a team selects a project, no other team can select the same one.',
      },
      {
        q: 'What happens after the freeze date?',
        a: 'After the admin freezes the pool, no changes can be made. Teams are finalized, project assignments are locked, and faculty can see their assigned teams.',
      },
    ],
  },
  {
    category: 'For Faculty',
    questions: [
      {
        q: 'How many proposals do I submit?',
        a: 'Each faculty must submit exactly 4 project proposals per pool. No more, no less. You can save drafts and finalize all 4 at once.',
      },
      {
        q: 'Can I edit my proposals after submitting?',
        a: 'You can only edit proposals while they are in DRAFT status. Once you click "Finalize," all 4 proposals are submitted and cannot be edited.',
      },
      {
        q: 'What happens during review?',
        a: 'The subadmin reviews your 4 proposals: locks (approves) 3 at subadmin level, and places 1 on hold for admin review. The admin then approves or rejects the held proposal.',
      },
      {
        q: 'When can I see my assigned team?',
        a: 'After the pool is frozen, you can see the team assigned to your projects, including student names, enrollment numbers, and email addresses.',
      },
    ],
  },
  {
    category: 'Technical',
    questions: [
      {
        q: 'What browsers are supported?',
        a: 'Chrome, Firefox, Safari, and Edge (latest versions). Internet Explorer is not supported.',
      },
      {
        q: 'Is my data secure?',
        a: 'Yes. Passwords are hashed with bcrypt, authentication uses JWT tokens (with httpOnly refresh cookies), and all actions are recorded in an audit log. The system enforces role-based access control.',
      },
      {
        q: 'What happens if I forget my password?',
        a: 'Contact your admin. They can reset your password from the admin panel and provide you with a new temporary password.',
      },
    ],
  },
];

const FAQPage: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const toggle = (key: string) => {
    setOpenIndex(openIndex === key ? null : key);
  };

  const filteredFaqs = faqs
    .map((cat) => ({
      ...cat,
      questions: cat.questions.filter(
        (q) =>
          !search ||
          q.q.toLowerCase().includes(search.toLowerCase()) ||
          q.a.toLowerCase().includes(search.toLowerCase())
      ),
    }))
    .filter((cat) => cat.questions.length > 0);

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50/70 via-white to-violet-50/70 dark:from-[#080d0d] dark:via-[#0b1010] dark:to-[#0d0a14] transition-colors duration-500">
      <style>{`
        @keyframes faqFadeUp {
          0% {
            opacity: 0;
            transform: translateY(24px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes faqFadeDown {
          0% {
            opacity: 0;
            transform: translateY(-18px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes faqFloat {
          0%,
          100% {
            transform: translate3d(0, 0, 0);
          }

          50% {
            transform: translate3d(0, -14px, 0);
          }
        }

        @keyframes faqFloatReverse {
          0%,
          100% {
            transform: translate3d(0, 0, 0);
          }

          50% {
            transform: translate3d(12px, 10px, 0);
          }
        }

        @keyframes faqGlow {
          0%,
          100% {
            opacity: 0.28;
            transform: scale(1);
          }

          50% {
            opacity: 0.6;
            transform: scale(1.08);
          }
        }

        @keyframes faqCardReveal {
          0% {
            opacity: 0;
            transform: translateY(18px) scale(0.98);
          }

          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes faqAnswerReveal {
          0% {
            opacity: 0;
            transform: translateY(-8px);
          }

          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes faqShimmer {
          0% {
            background-position: -200% center;
          }

          100% {
            background-position: 200% center;
          }
        }

        .faq-fade-up {
          animation: faqFadeUp 0.7s cubic-bezier(0.22, 1, 0.36, 1) both;
        }

        .faq-fade-down {
          animation: faqFadeDown 0.7s cubic-bezier(0.22, 1, 0.36, 1) both;
        }

        .faq-float {
          animation: faqFloat 6s ease-in-out infinite;
        }

        .faq-float-reverse {
          animation: faqFloatReverse 7s ease-in-out infinite;
        }

        .faq-glow {
          animation: faqGlow 5s ease-in-out infinite;
        }

        .faq-card-reveal {
          animation: faqCardReveal 0.55s cubic-bezier(0.22, 1, 0.36, 1) both;
        }

        .faq-answer-reveal {
          animation: faqAnswerReveal 0.35s ease-out both;
        }

        .faq-shimmer {
          background-size: 200% auto;
          animation: faqShimmer 6s linear infinite;
        }

        .faq-scrollbar::-webkit-scrollbar {
          width: 6px;
        }

        .faq-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }

        .faq-scrollbar::-webkit-scrollbar-thumb {
          border-radius: 999px;
          background: rgba(16, 185, 129, 0.25);
        }

        .faq-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(139, 92, 246, 0.35);
        }

        @media (prefers-reduced-motion: reduce) {
          .faq-fade-up,
          .faq-fade-down,
          .faq-float,
          .faq-float-reverse,
          .faq-glow,
          .faq-card-reveal,
          .faq-answer-reveal,
          .faq-shimmer {
            animation: none !important;
          }
        }
      `}</style>

      {/* =========================================================
          HERO SECTION
      ========================================================= */}
      <section className="relative pt-32 pb-20 overflow-hidden bg-gradient-to-br from-emerald-100 via-teal-50 to-violet-100 dark:from-[#071110] dark:via-[#0a1111] dark:to-[#110b18]">
        {/* Dark mode background glow */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-32 -right-24 w-[460px] h-[460px] rounded-full bg-emerald-300/35 dark:bg-emerald-400/[0.08] blur-[120px] faq-glow" />

          <div className="absolute top-10 left-1/4 w-[380px] h-[380px] rounded-full bg-violet-300/30 dark:bg-violet-500/[0.09] blur-[120px] faq-float" />

          <div className="absolute -bottom-24 right-1/3 w-[320px] h-[320px] rounded-full bg-purple-300/25 dark:bg-purple-400/[0.07] blur-[110px] faq-float-reverse" />

          <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(16,185,129,0.08),transparent_30%),radial-gradient(circle_at_85%_25%,rgba(139,92,246,0.09),transparent_32%)] dark:bg-[radial-gradient(circle_at_15%_20%,rgba(16,185,129,0.10),transparent_30%),radial-gradient(circle_at_85%_25%,rgba(139,92,246,0.12),transparent_32%)]" />
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center relative z-10">
          {/* Support Badge */}
          <div className="faq-fade-down">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs sm:text-sm font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-300 bg-white/80 dark:bg-[#101a18]/90 border border-emerald-200/80 dark:border-emerald-400/20 shadow-sm shadow-emerald-200/50 dark:shadow-[0_0_25px_rgba(16,185,129,0.08)] backdrop-blur-xl">
              <span className="relative flex items-center justify-center">
                <span className="absolute w-6 h-6 rounded-full bg-violet-400/25 dark:bg-violet-400/20 blur-md" />
                <Sparkles className="relative w-4 h-4 text-violet-600 dark:text-violet-300" />
              </span>

              Support
            </span>
          </div>

          {/* Main Heading */}
          <h1
            className="faq-fade-up mt-6 text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight bg-gradient-to-r from-emerald-700 via-teal-600 to-violet-700 dark:from-emerald-300 dark:via-teal-200 dark:to-violet-300 bg-clip-text text-transparent faq-shimmer"
            style={{ animationDelay: '100ms' }}
          >
            Frequently Asked Questions
          </h1>

          {/* Description */}
          <p
            className="faq-fade-up mt-5 max-w-2xl mx-auto text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed"
            style={{ animationDelay: '200ms' }}
          >
            Find answers to common questions about the platform
          </p>

          {/* Search */}
          <div
            className="faq-fade-up mt-9 max-w-xl mx-auto relative"
            style={{ animationDelay: '300ms' }}
          >
            <div className="absolute -inset-1 rounded-[22px] bg-gradient-to-r from-emerald-300/30 via-teal-300/20 to-violet-300/30 dark:from-emerald-500/10 dark:via-teal-500/5 dark:to-violet-500/12 blur-lg" />

            <div className="relative">
              <Search className="w-5 h-5 absolute left-5 top-1/2 -translate-y-1/2 text-emerald-600 dark:text-emerald-300 pointer-events-none" />

              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search questions..."
                className="w-full pl-13 pr-5 py-4 rounded-2xl text-sm sm:text-base outline-none bg-white/90 dark:bg-[#111918]/95 border border-emerald-200/80 dark:border-emerald-400/20 backdrop-blur-xl text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 shadow-xl shadow-emerald-100/50 dark:shadow-[0_10px_40px_rgba(0,0,0,0.28)] focus:border-violet-300 dark:focus:border-violet-400/40 focus:ring-4 focus:ring-violet-200/40 dark:focus:ring-violet-500/10 transition-all duration-300"
              />
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          FAQ CONTENT
      ========================================================= */}
      <section className="relative py-16 sm:py-20 max-w-4xl mx-auto px-4 sm:px-6">
        {/* Decorative Glow */}
        <div className="absolute -left-40 top-32 w-72 h-72 rounded-full bg-emerald-200/20 dark:bg-emerald-500/[0.04] blur-[110px] pointer-events-none" />

        <div className="absolute -right-40 bottom-32 w-72 h-72 rounded-full bg-violet-200/20 dark:bg-violet-500/[0.05] blur-[110px] pointer-events-none" />

        {filteredFaqs.length === 0 ? (
          <div className="relative text-center py-16 px-6 rounded-3xl bg-white/75 dark:bg-[#101615]/90 border border-emerald-100 dark:border-emerald-400/10 shadow-lg shadow-emerald-100/30 dark:shadow-[0_15px_45px_rgba(0,0,0,0.25)] faq-card-reveal">
            <div className="mx-auto mb-5 w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-100 to-violet-100 dark:from-emerald-500/10 dark:to-violet-500/10 border border-emerald-200/70 dark:border-emerald-400/15 flex items-center justify-center shadow-sm dark:shadow-[0_0_25px_rgba(16,185,129,0.06)]">
              <Search className="w-7 h-7 text-emerald-600 dark:text-emerald-300" />
            </div>

            <p className="text-lg font-semibold text-slate-700 dark:text-slate-100">
              No matching questions found
            </p>

            <p className="text-sm mt-2 text-slate-500 dark:text-slate-400">
              Try a different search term
            </p>
          </div>
        ) : (
          <div className="relative space-y-12">
            {filteredFaqs.map((category, categoryIndex) => (
              <div
                key={category.category}
                className="faq-card-reveal"
                style={{
                  animationDelay: `${categoryIndex * 100}ms`,
                }}
              >
                {/* Category Heading */}
                <h2 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-slate-100 mb-5 flex items-center gap-3">
                  <span className="relative flex-shrink-0 w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-100 to-violet-100 dark:from-emerald-500/10 dark:to-violet-500/10 border border-emerald-200/80 dark:border-emerald-400/15 flex items-center justify-center text-emerald-700 dark:text-emerald-300 text-sm font-bold shadow-sm shadow-emerald-100/60 dark:shadow-[0_0_20px_rgba(16,185,129,0.05)]">
                    <span className="absolute inset-0 rounded-xl bg-gradient-to-br from-emerald-300/20 to-violet-300/20 dark:from-emerald-400/10 dark:to-violet-400/10 blur-md" />

                    <span className="relative">
                      {category.questions.length}
                    </span>
                  </span>

                  <span className="bg-gradient-to-r from-emerald-700 to-violet-700 dark:from-emerald-300 dark:via-teal-200 dark:to-violet-300 bg-clip-text text-transparent">
                    {category.category}
                  </span>
                </h2>

                {/* FAQ Items */}
                <div className="space-y-3">
                  {category.questions.map((faq, i) => {
                    const key = `${category.category}-${i}`;
                    const isOpen = openIndex === key;

                    return (
                      <div
                        key={key}
                        className={`group rounded-2xl border overflow-hidden transition-all duration-300 ease-out ${
                          isOpen
                            ? 'bg-gradient-to-br from-white via-emerald-50/70 to-violet-50/60 dark:from-[#111b19] dark:via-[#111918] dark:to-[#15111b] border-emerald-300/80 dark:border-emerald-400/25 shadow-xl shadow-emerald-100/60 dark:shadow-[0_12px_40px_rgba(0,0,0,0.32)] -translate-y-1'
                            : 'bg-white/80 dark:bg-[#0f1514]/90 border-emerald-100/90 dark:border-white/[0.07] hover:border-violet-200/80 dark:hover:border-violet-400/20 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-violet-100/40 dark:hover:shadow-[0_10px_35px_rgba(0,0,0,0.24)]'
                        }`}
                      >
                        {/* Question Button */}
                        <button
                          onClick={() => toggle(key)}
                          className="w-full flex items-center justify-between gap-5 px-5 sm:px-6 py-5 text-left"
                        >
                          <span
                            className={`font-medium leading-relaxed pr-4 transition-colors duration-300 ${
                              isOpen
                                ? 'text-emerald-800 dark:text-emerald-200'
                                : 'text-slate-800 dark:text-slate-100 group-hover:text-violet-700 dark:group-hover:text-violet-200'
                            }`}
                          >
                            {faq.q}
                          </span>

                          <span
                            className={`flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-300 ${
                              isOpen
                                ? 'bg-gradient-to-br from-emerald-100 to-violet-100 dark:from-emerald-500/15 dark:to-violet-500/15 text-violet-600 dark:text-violet-300'
                                : 'bg-slate-100/80 dark:bg-white/[0.05] text-slate-400 dark:text-slate-500 group-hover:bg-violet-100 dark:group-hover:bg-violet-500/10 group-hover:text-violet-600 dark:group-hover:text-violet-300'
                            }`}
                          >
                            {isOpen ? (
                              <ChevronUp className="w-5 h-5" />
                            ) : (
                              <ChevronDown className="w-5 h-5 transition-transform duration-300 group-hover:translate-y-0.5" />
                            )}
                          </span>
                        </button>

                        {/* Answer */}
                        {isOpen && (
                          <div className="px-5 sm:px-6 pb-6 faq-answer-reveal">
                            <div className="h-px bg-gradient-to-r from-emerald-200/70 via-violet-200/60 to-transparent dark:from-emerald-400/20 dark:via-violet-400/20 dark:to-transparent mb-5" />

                            <p className="text-sm sm:text-[15px] text-slate-600 dark:text-slate-300 leading-7">
                              {faq.a}
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default FAQPage;