// frontend/src/pages/faculty/FacultyGreeting.tsx

import React, { useEffect, useState } from 'react';
import {
  Sparkles,
  Heart,
  Quote,
  ArrowRight,
} from 'lucide-react';

const studentQuotes = [
  {
    text: 'Your guidance has been the lighthouse in our academic journey. Thank you for always being there!',
    from: 'Anonymous Student',
    emoji: '🌟',
  },
  {
    text: "The best teachers don't give you answers, they show you where to look. You're truly inspiring!",
    from: 'AI & ML Batch 2025',
    emoji: '📚',
  },
  {
    text: 'Every lecture of yours feels like a TED talk - full of insights and inspiration!',
    from: 'CSE Department',
    emoji: '🎯',
  },
  {
    text: "Thank you for believing in us even when we didn't believe in ourselves. You're the best!",
    from: 'Project Team Alpha',
    emoji: '💪',
  },
  {
    text: 'Your passion for teaching is contagious! You have made learning truly enjoyable.',
    from: 'Web Development Class',
    emoji: '🔥',
  },
  {
    text: 'The way you simplify complex topics is magical. Thank you for being an amazing mentor!',
    from: 'Data Science Students',
    emoji: '✨',
  },
  {
    text: 'You do not just teach subjects, you shape futures. Grateful to have you as our professor!',
    from: 'Final Year Students',
    emoji: '🎓',
  },
  {
    text: "Your encouragement during tough times kept us going. You're more than a teacher, you're a mentor!",
    from: 'Project Team Beta',
    emoji: '💐',
  },
  {
    text: 'The knowledge and wisdom you share goes beyond textbooks. Truly life-changing!',
    from: 'Computer Science Dept',
    emoji: '📖',
  },
  {
    text: 'Thank you for making every class interactive and engaging. We look forward to each session!',
    from: 'Morning Batch',
    emoji: '☀️',
  },
];

const FacultyGreeting: React.FC = () => {
  const [currentQuote, setCurrentQuote] = useState(studentQuotes[0]);
  const [quoteIndex, setQuoteIndex] = useState(0);
  const [greeting, setGreeting] = useState('Good Morning');

  useEffect(() => {
    const updateGreeting = () => {
      const hour = new Date().getHours();

      if (hour < 12) {
        setGreeting('Good Morning');
      } else if (hour < 17) {
        setGreeting('Good Afternoon');
      } else if (hour < 20) {
        setGreeting('Good Evening');
      } else {
        setGreeting('Good Night');
      }
    };

    updateGreeting();

    const timer = window.setInterval(updateGreeting, 60_000);

    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setQuoteIndex((previous) => {
        const next = (previous + 1) % studentQuotes.length;
        setCurrentQuote(studentQuotes[next]);
        return next;
      });
    }, 30_000);

    return () => window.clearInterval(interval);
  }, []);

  return (
    <section className="faculty-glow relative mb-6 overflow-hidden rounded-[28px] border border-indigo-100/70 bg-white/80 p-5 shadow-[0_20px_60px_rgba(79,70,229,0.10)] backdrop-blur-xl transition-all duration-500 hover:shadow-[0_24px_70px_rgba(79,70,229,0.14)] sm:p-6 lg:p-7 dark:border-slate-700/60 dark:bg-slate-900/75">
      {/* Decorative background */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -right-24 -top-24 h-64 w-64 rounded-full bg-indigo-200/25 blur-3xl dark:bg-indigo-500/10" />
        <div className="absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-sky-200/25 blur-3xl dark:bg-sky-500/10" />
        <div className="absolute right-1/3 top-1/2 h-32 w-32 -translate-y-1/2 rounded-full bg-violet-200/15 blur-3xl dark:bg-violet-500/10" />
      </div>

      <div className="relative z-10">
        {/* Top greeting */}
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 via-violet-500 to-purple-500 shadow-lg shadow-indigo-500/20">
              <Sparkles className="h-6 w-6 text-white" />

              <span className="absolute -right-1 -top-1 h-3 w-3 animate-pulse rounded-full bg-emerald-400 ring-4 ring-white dark:ring-slate-900" />
            </div>

            <div>
              <div className="mb-1 flex items-center gap-2">
                <span className="rounded-full border border-indigo-100 bg-indigo-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-indigo-600 dark:border-indigo-500/20 dark:bg-indigo-500/10 dark:text-indigo-300">
                  Faculty Portal
                </span>
              </div>

              <h2 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl dark:text-white">
                {greeting}, Professor! 👋
              </h2>

              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Welcome back to your project allocation workspace.
              </p>
            </div>
          </div>

          <div className="hidden items-center gap-2 rounded-2xl border border-slate-200/70 bg-white/60 px-4 py-3 sm:flex dark:border-slate-700 dark:bg-slate-800/50">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 dark:bg-amber-500/10">
              <Heart className="h-4 w-4 fill-amber-500 text-amber-500" />
            </div>

            <div>
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                Keep inspiring
              </p>
              <p className="text-[11px] text-slate-400">
                Your guidance matters.
              </p>
            </div>
          </div>
        </div>

        {/* Quote */}
        <div className="mt-6 rounded-2xl border border-white/70 bg-gradient-to-br from-indigo-50/90 via-white/80 to-violet-50/80 p-4 shadow-sm sm:p-5 dark:border-slate-700/60 dark:from-indigo-500/10 dark:via-slate-800/60 dark:to-violet-500/10">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm dark:bg-slate-800">
              <Quote className="h-4 w-4 text-indigo-500" />
            </div>

            <div className="min-w-0 flex-1">
              <p
                key={quoteIndex}
                className="animate-fade-in-up text-sm font-medium leading-7 text-slate-700 sm:text-base dark:text-slate-200"
              >
                “{currentQuote.text}”
              </p>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Heart className="h-3.5 w-3.5 fill-rose-400 text-rose-400" />

                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  {currentQuote.from}
                </span>

                <span className="text-sm">{currentQuote.emoji}</span>
              </div>
            </div>

            <ArrowRight className="mt-1 hidden h-4 w-4 text-slate-300 sm:block dark:text-slate-600" />
          </div>
        </div>

        {/* Quote indicators */}
        <div className="mt-4 flex justify-center gap-1.5">
          {studentQuotes.slice(0, 6).map((_, index) => (
            <span
              key={index}
              className={`h-1.5 rounded-full transition-all duration-500 ${
                index === quoteIndex % 6
                  ? 'w-6 bg-indigo-500'
                  : 'w-1.5 bg-slate-300 dark:bg-slate-600'
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default FacultyGreeting;