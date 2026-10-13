// frontend/src/pages/public/ContactPage.tsx

import React, { useState } from 'react';
import {
  Mail,
  Phone,
  MapPin,
  Send,
  Clock3,
  MessageCircle,
  Sparkles,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';

const ContactPage: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });

  const [submitted, setSubmitted] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setSubmitted(true);

    setTimeout(() => {
      setSubmitted(false);
      setFormData({
        name: '',
        email: '',
        subject: '',
        message: '',
      });
    }, 3000);
  };

  return (
    <div className="min-h-screen overflow-hidden bg-gradient-to-b from-[#f3efff] via-[#f5f8ff] to-[#eaf3ff] text-slate-800 transition-colors duration-500 dark:from-[#08091a] dark:via-[#0b1024] dark:to-[#0a1630]">
      <style>{`
        /* =====================================================
           PAGE LOAD ANIMATIONS
        ===================================================== */

        @keyframes contactFadeUp {
          0% {
            opacity: 0;
            transform: translateY(45px);
          }

          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes contactFadeDown {
          0% {
            opacity: 0;
            transform: translateY(-30px);
          }

          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes contactScaleIn {
          0% {
            opacity: 0;
            transform: scale(0.85);
          }

          100% {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes contactSlideLeft {
          0% {
            opacity: 0;
            transform: translateX(-45px);
          }

          100% {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes contactSlideRight {
          0% {
            opacity: 0;
            transform: translateX(45px);
          }

          100% {
            opacity: 1;
            transform: translateX(0);
          }
        }

        /* =====================================================
           FLOATING BACKGROUND
        ===================================================== */

        @keyframes contactFloat {
          0%,
          100% {
            transform: translate3d(0, 0, 0) scale(1);
          }

          50% {
            transform: translate3d(0, -22px, 0) scale(1.05);
          }
        }

        @keyframes contactFloatReverse {
          0%,
          100% {
            transform: translate3d(0, 0, 0) scale(1);
          }

          50% {
            transform: translate3d(20px, 16px, 0) scale(1.08);
          }
        }

        @keyframes contactFloatDiagonal {
          0%,
          100% {
            transform: translate(0, 0) rotate(0deg);
          }

          50% {
            transform: translate(14px, -18px) rotate(5deg);
          }
        }

        @keyframes contactGlow {
          0%,
          100% {
            opacity: 0.25;
            transform: scale(1);
          }

          50% {
            opacity: 0.65;
            transform: scale(1.15);
          }
        }

        /* =====================================================
           DECORATIVE ROTATION
        ===================================================== */

        @keyframes contactRotate {
          from {
            transform: rotate(0deg);
          }

          to {
            transform: rotate(360deg);
          }
        }

        @keyframes contactRotateReverse {
          from {
            transform: rotate(360deg);
          }

          to {
            transform: rotate(0deg);
          }
        }

        /* =====================================================
           CARD ANIMATIONS
        ===================================================== */

        @keyframes contactCardLeft {
          0% {
            opacity: 0;
            transform: translateX(-45px) translateY(20px);
          }

          100% {
            opacity: 1;
            transform: translateX(0) translateY(0);
          }
        }

        @keyframes contactCardRight {
          0% {
            opacity: 0;
            transform: translateX(45px) translateY(20px);
          }

          100% {
            opacity: 1;
            transform: translateX(0) translateY(0);
          }
        }

        @keyframes contactCardUp {
          0% {
            opacity: 0;
            transform: translateY(35px) scale(0.97);
          }

          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        /* =====================================================
           ICON ANIMATIONS
        ===================================================== */

        @keyframes contactIconFloat {
          0%,
          100% {
            transform: translateY(0) rotate(0deg);
          }

          50% {
            transform: translateY(-5px) rotate(2deg);
          }
        }

        @keyframes contactIconPulse {
          0%,
          100% {
            box-shadow: 0 0 0 0 rgba(99, 102, 241, 0);
          }

          50% {
            box-shadow: 0 0 0 9px rgba(99, 102, 241, 0.08);
          }
        }

        /* =====================================================
           SHIMMER
        ===================================================== */

        @keyframes contactShimmer {
          0% {
            background-position: -250% center;
          }

          100% {
            background-position: 250% center;
          }
        }

        /* =====================================================
           BUTTON GLOW
        ===================================================== */

        @keyframes contactButtonGlow {
          0%,
          100% {
            box-shadow:
              0 10px 30px rgba(79, 70, 229, 0.20);
          }

          50% {
            box-shadow:
              0 15px 45px rgba(79, 70, 229, 0.38),
              0 0 25px rgba(59, 130, 246, 0.15);
          }
        }

        /* =====================================================
           SUCCESS ANIMATION
        ===================================================== */

        @keyframes contactSuccess {
          0% {
            opacity: 0;
            transform: scale(0.6);
          }

          70% {
            opacity: 1;
            transform: scale(1.08);
          }

          100% {
            transform: scale(1);
          }
        }

        @keyframes contactCheck {
          0% {
            stroke-dashoffset: 100;
          }

          100% {
            stroke-dashoffset: 0;
          }
        }

        /* =====================================================
           UTILITY CLASSES
        ===================================================== */

        .contact-fade-up {
          animation: contactFadeUp 0.9s cubic-bezier(0.22, 1, 0.36, 1) both;
        }

        .contact-fade-down {
          animation: contactFadeDown 0.8s cubic-bezier(0.22, 1, 0.36, 1) both;
        }

        .contact-scale {
          animation: contactScaleIn 0.8s cubic-bezier(0.22, 1, 0.36, 1) both;
        }

        .contact-slide-left {
          animation: contactSlideLeft 0.9s cubic-bezier(0.22, 1, 0.36, 1) both;
        }

        .contact-slide-right {
          animation: contactSlideRight 0.9s cubic-bezier(0.22, 1, 0.36, 1) both;
        }

        .contact-float {
          animation: contactFloat 7s ease-in-out infinite;
        }

        .contact-float-reverse {
          animation: contactFloatReverse 8s ease-in-out infinite;
        }

        .contact-float-diagonal {
          animation: contactFloatDiagonal 9s ease-in-out infinite;
        }

        .contact-glow {
          animation: contactGlow 5s ease-in-out infinite;
        }

        .contact-rotate {
          animation: contactRotate 20s linear infinite;
        }

        .contact-rotate-reverse {
          animation: contactRotateReverse 25s linear infinite;
        }

        .contact-card-left {
          animation: contactCardLeft 0.9s cubic-bezier(0.22, 1, 0.36, 1) both;
        }

        .contact-card-right {
          animation: contactCardRight 0.9s cubic-bezier(0.22, 1, 0.36, 1) both;
        }

        .contact-card-up {
          animation: contactCardUp 0.8s cubic-bezier(0.22, 1, 0.36, 1) both;
        }

        .contact-icon-float {
          animation: contactIconFloat 3.5s ease-in-out infinite;
        }

        .contact-icon-pulse {
          animation: contactIconPulse 2.8s ease-in-out infinite;
        }

        .contact-shimmer {
          background-size: 250% auto;
          animation: contactShimmer 5s linear infinite;
        }

        .contact-button-glow {
          animation: contactButtonGlow 3s ease-in-out infinite;
        }

        .contact-success {
          animation: contactSuccess 0.65s cubic-bezier(0.22, 1, 0.36, 1) both;
        }

        /* =====================================================
           HOVER EFFECTS
        ===================================================== */

        .contact-info-card {
          transition:
            transform 0.35s ease,
            box-shadow 0.35s ease,
            border-color 0.35s ease;
        }

        .contact-info-card:hover {
          transform: translateY(-6px);
        }

        .contact-icon-box {
          transition:
            transform 0.35s ease,
            box-shadow 0.35s ease;
        }

        .contact-info-card:hover .contact-icon-box {
          transform: translateY(-4px) rotate(-3deg) scale(1.05);
        }

        .contact-input {
          transition:
            border-color 0.3s ease,
            box-shadow 0.3s ease,
            background-color 0.3s ease,
            transform 0.3s ease;
        }

        .contact-input:focus {
          transform: translateY(-1px);
        }

        @media (prefers-reduced-motion: reduce) {
          .contact-fade-up,
          .contact-fade-down,
          .contact-scale,
          .contact-slide-left,
          .contact-slide-right,
          .contact-float,
          .contact-float-reverse,
          .contact-float-diagonal,
          .contact-glow,
          .contact-rotate,
          .contact-rotate-reverse,
          .contact-card-left,
          .contact-card-right,
          .contact-card-up,
          .contact-icon-float,
          .contact-icon-pulse,
          .contact-shimmer,
          .contact-button-glow,
          .contact-success {
            animation: none !important;
          }
        }
      `}</style>

      {/* =========================================================
          HERO
      ========================================================= */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#e8dcff] via-[#e6efff] to-[#d9e9ff] pb-20 pt-32 dark:from-[#120b2d] dark:via-[#0a1430] dark:to-[#061b35]">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          {/* Purple orb */}
          <div className="contact-glow absolute -right-24 -top-32 h-[470px] w-[470px] rounded-full bg-purple-500/25 blur-[125px] dark:bg-purple-600/20" />

          {/* Blue orb */}
          <div className="contact-float absolute left-[12%] top-24 h-[400px] w-[400px] rounded-full bg-blue-500/20 blur-[125px] dark:bg-blue-500/15" />

          {/* Indigo orb */}
          <div className="contact-float-reverse absolute -bottom-40 right-[24%] h-[350px] w-[350px] rounded-full bg-indigo-500/20 blur-[115px] dark:bg-indigo-500/15" />

          {/* Small floating orb */}
          <div className="contact-float-diagonal absolute right-[12%] top-[45%] h-24 w-24 rounded-full bg-violet-400/20 blur-2xl dark:bg-violet-500/10" />

          {/* Rotating decorative circles */}
          <div className="contact-rotate absolute -left-20 top-20 h-64 w-64 rounded-full border border-purple-500/15 dark:border-purple-400/10" />

          <div className="contact-rotate-reverse absolute -right-20 bottom-0 h-80 w-80 rounded-full border border-blue-500/15 dark:border-blue-400/10" />

          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(124,58,237,0.12),transparent_30%),radial-gradient(circle_at_85%_25%,rgba(37,99,235,0.12),transparent_32%)] dark:bg-[radial-gradient(circle_at_15%_20%,rgba(168,85,247,0.13),transparent_30%),radial-gradient(circle_at_85%_25%,rgba(59,130,246,0.14),transparent_32%)]" />
        </div>

        <div className="relative z-10 mx-auto max-w-5xl px-4 text-center sm:px-6">
          {/* Badge */}
          <div className="contact-fade-down">
            <span className="inline-flex items-center gap-2 rounded-full border border-purple-300 bg-white/85 px-5 py-2.5 text-xs font-bold uppercase tracking-[0.18em] text-purple-700 shadow-lg shadow-purple-200/40 backdrop-blur-xl dark:border-purple-400/25 dark:bg-[#17132f]/90 dark:text-purple-200 dark:shadow-[0_0_30px_rgba(168,85,247,0.12)] sm:text-sm">
              <Sparkles className="contact-icon-float h-4 w-4 text-blue-600 dark:text-blue-300" />
              Get In Touch
            </span>
          </div>

          {/* Heading */}
          <h1
            className="contact-fade-up contact-shimmer mt-7 bg-gradient-to-r from-[#6d28d9] via-[#4f46e5] to-[#2563eb] bg-clip-text text-4xl font-extrabold tracking-tight text-transparent dark:from-[#d8b4fe] dark:via-[#a5b4fc] dark:to-[#93c5fd] sm:text-5xl lg:text-6xl"
            style={{ animationDelay: '120ms' }}
          >
            Contact Us
          </h1>

          {/* Description */}
          <p
            className="contact-fade-up mx-auto mt-5 max-w-2xl text-base font-medium leading-relaxed text-slate-600 dark:text-slate-300 sm:text-lg"
            style={{ animationDelay: '240ms' }}
          >
            Have questions about ProjectAlloc? We are here to help you with
            anything you need.
          </p>

          {/* Decorative line */}
          <div
            className="contact-fade-up mx-auto mt-8 flex items-center justify-center gap-2"
            style={{ animationDelay: '360ms' }}
          >
            <span className="h-1 w-10 rounded-full bg-purple-500 shadow-sm shadow-purple-300" />
            <span className="h-1 w-16 rounded-full bg-indigo-500 shadow-sm shadow-indigo-300" />
            <span className="h-1 w-10 rounded-full bg-blue-500 shadow-sm shadow-blue-300" />
          </div>
        </div>
      </section>

      {/* =========================================================
          CONTACT CONTENT
      ========================================================= */}
      <section className="relative mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-20">
        {/* Section background animation */}
        <div className="contact-glow pointer-events-none absolute -left-44 top-16 h-80 w-80 rounded-full bg-purple-400/15 blur-[120px] dark:bg-purple-600/[0.06]" />

        <div className="contact-float-reverse pointer-events-none absolute -right-44 bottom-10 h-80 w-80 rounded-full bg-blue-400/15 blur-[120px] dark:bg-blue-600/[0.06]" />

        <div className="relative grid gap-8 lg:grid-cols-[0.85fr_1.15fr]">
          {/* =====================================================
              LEFT SIDE
          ===================================================== */}
          <div className="space-y-6">
            {/* Contact Info */}
            <div
              className="contact-card-left rounded-[28px] border border-purple-200/80 bg-white/90 p-7 shadow-[0_20px_60px_rgba(99,102,241,0.12)] backdrop-blur-xl dark:border-purple-400/15 dark:bg-[#10162b]/95 dark:shadow-[0_20px_60px_rgba(0,0,0,0.35)] sm:p-8"
              style={{ animationDelay: '180ms' }}
            >
              <div className="mb-8">
                <div className="contact-icon-pulse relative inline-flex rounded-2xl">
                  <div className="absolute inset-0 rounded-2xl bg-purple-500/30 blur-xl dark:bg-purple-500/20" />

                  <span className="contact-icon-box relative flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-600 via-indigo-600 to-blue-600 text-white shadow-xl shadow-indigo-300/40 dark:shadow-[0_8px_30px_rgba(99,102,241,0.25)]">
                    <MessageCircle className="h-7 w-7" />
                  </span>
                </div>

                <h2 className="mt-6 text-2xl font-bold text-slate-900 dark:text-white">
                  Let&apos;s talk
                </h2>

                <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                  Whether you have a question, feedback, or need assistance,
                  feel free to reach out to us.
                </p>
              </div>

              <div className="space-y-4">
                {/* Email */}
                <div className="contact-info-card group flex cursor-default items-start gap-4 rounded-2xl border border-blue-200/80 bg-gradient-to-r from-blue-50 to-indigo-50/80 p-4 hover:border-blue-300 hover:shadow-lg hover:shadow-blue-200/40 dark:border-blue-400/15 dark:bg-gradient-to-r dark:from-blue-500/[0.07] dark:to-indigo-500/[0.06] dark:hover:border-blue-400/30 dark:hover:shadow-[0_12px_30px_rgba(59,130,246,0.10)]">
                  <span className="contact-icon-box flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-white text-blue-600 shadow-sm dark:bg-blue-500/10 dark:text-blue-300">
                    <Mail className="h-5 w-5" />
                  </span>

                  <div className="min-w-0">
                    <p className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-300">
                      Email
                    </p>

                    <p className="mt-1 break-all text-sm font-semibold text-slate-800 dark:text-slate-100">
                      support@projectalloc.com
                    </p>
                  </div>
                </div>

                {/* Phone */}
                <div className="contact-info-card group flex cursor-default items-start gap-4 rounded-2xl border border-purple-200/80 bg-gradient-to-r from-purple-50 to-violet-50/80 p-4 hover:border-purple-300 hover:shadow-lg hover:shadow-purple-200/40 dark:border-purple-400/15 dark:bg-gradient-to-r dark:from-purple-500/[0.07] dark:to-violet-500/[0.06] dark:hover:border-purple-400/30 dark:hover:shadow-[0_12px_30px_rgba(168,85,247,0.10)]">
                  <span className="contact-icon-box flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-white text-purple-600 shadow-sm dark:bg-purple-500/10 dark:text-purple-300">
                    <Phone className="h-5 w-5" />
                  </span>

                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-purple-300">
                      Phone
                    </p>

                    <p className="mt-1 text-sm font-semibold text-slate-800 dark:text-slate-100">
                      +91 00000 00000
                    </p>
                  </div>
                </div>

                {/* Location */}
                <div className="contact-info-card group flex cursor-default items-start gap-4 rounded-2xl border border-indigo-200/80 bg-gradient-to-r from-indigo-50 to-blue-50/80 p-4 hover:border-indigo-300 hover:shadow-lg hover:shadow-indigo-200/40 dark:border-indigo-400/15 dark:bg-gradient-to-r dark:from-indigo-500/[0.07] dark:to-blue-500/[0.06] dark:hover:border-indigo-400/30 dark:hover:shadow-[0_12px_30px_rgba(99,102,241,0.10)]">
                  <span className="contact-icon-box flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-white text-indigo-600 shadow-sm dark:bg-indigo-500/10 dark:text-indigo-300">
                    <MapPin className="h-5 w-5" />
                  </span>

                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-300">
                      Location
                    </p>

                    <p className="mt-1 text-sm font-semibold text-slate-800 dark:text-slate-100">
                      Lucknow, Uttar Pradesh, India
                    </p>
                  </div>
                </div>

                {/* Hours */}
                <div className="contact-info-card group flex cursor-default items-start gap-4 rounded-2xl border border-blue-200/80 bg-gradient-to-r from-sky-50 to-blue-50/80 p-4 hover:border-blue-300 hover:shadow-lg hover:shadow-blue-200/40 dark:border-blue-400/15 dark:bg-gradient-to-r dark:from-sky-500/[0.06] dark:to-blue-500/[0.07] dark:hover:border-blue-400/30 dark:hover:shadow-[0_12px_30px_rgba(59,130,246,0.10)]">
                  <span className="contact-icon-box flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-white text-blue-600 shadow-sm dark:bg-blue-500/10 dark:text-blue-300">
                    <Clock3 className="h-5 w-5" />
                  </span>

                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-300">
                      Working Hours
                    </p>

                    <p className="mt-1 text-sm font-semibold text-slate-800 dark:text-slate-100">
                      Monday – Friday, 9:00 AM – 6:00 PM
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* CTA */}
            <div
              className="contact-card-up relative overflow-hidden rounded-[28px] border border-purple-300/30 bg-gradient-to-br from-[#7c3aed] via-[#4f46e5] to-[#2563eb] p-7 text-white shadow-[0_20px_55px_rgba(79,70,229,0.25)] dark:border-purple-300/20 dark:from-[#4c1d95] dark:via-[#3730a3] dark:to-[#1d4ed8] dark:shadow-[0_20px_55px_rgba(79,70,229,0.20)]"
              style={{ animationDelay: '420ms' }}
            >
              <div className="contact-float absolute -right-16 -top-20 h-48 w-48 rounded-full bg-white/10 blur-2xl" />

              <div className="contact-float-reverse absolute -bottom-20 -left-10 h-40 w-40 rounded-full bg-blue-300/20 blur-2xl" />

              <div className="contact-rotate absolute right-8 top-8 h-20 w-20 rounded-full border border-white/10" />

              <div className="relative z-10">
                <Sparkles className="contact-icon-float h-6 w-6 text-blue-200" />

                <h3 className="mt-4 text-xl font-bold">
                  Need quick assistance?
                </h3>

                <p className="mt-2 text-sm leading-6 text-indigo-100">
                  Our team is ready to help you with your ProjectAlloc
                  questions.
                </p>

                <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-white backdrop-blur-md transition-all duration-300 hover:bg-white/20">
                  We&apos;re here to help
                  <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                </div>
              </div>
            </div>
          </div>

          {/* =====================================================
              FORM
          ===================================================== */}
          <div
            className="contact-card-right rounded-[28px] border border-blue-200/80 bg-white/95 p-6 shadow-[0_20px_65px_rgba(59,130,246,0.12)] backdrop-blur-xl dark:border-blue-400/15 dark:bg-[#0e1528]/95 dark:shadow-[0_20px_65px_rgba(0,0,0,0.38)] sm:p-8"
            style={{ animationDelay: '260ms' }}
          >
            <div className="mb-8">
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-indigo-600 dark:text-indigo-300">
                Send a message
              </p>

              <h2 className="contact-shimmer mt-2 bg-gradient-to-r from-purple-700 via-indigo-600 to-blue-700 bg-clip-text text-2xl font-extrabold text-transparent dark:from-purple-300 dark:via-indigo-200 dark:to-blue-300 sm:text-3xl">
                How can we help?
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                Fill out the form below and our team will get back to you.
              </p>
            </div>

            {submitted ? (
              <div className="contact-success flex min-h-[430px] flex-col items-center justify-center text-center">
                <div className="contact-icon-pulse relative flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-purple-100 via-indigo-100 to-blue-100 dark:from-purple-500/15 dark:via-indigo-500/15 dark:to-blue-500/15">
                  <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-purple-400/25 to-blue-400/25 blur-xl" />

                  <CheckCircle2 className="relative h-10 w-10 text-indigo-600 dark:text-indigo-300" />
                </div>

                <h3 className="mt-6 text-2xl font-bold text-slate-900 dark:text-white">
                  Message Sent!
                </h3>

                <p className="mt-2 max-w-sm text-sm leading-6 text-slate-600 dark:text-slate-300">
                  Thank you for contacting us. We&apos;ll get back to you as
                  soon as possible.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Name + Email */}
                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="contact-card-up" style={{ animationDelay: '500ms' }}>
                    <label
                      htmlFor="name"
                      className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-200"
                    >
                      Your Name
                    </label>

                    <input
                      id="name"
                      name="name"
                      type="text"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="Enter your name"
                      required
                      className="contact-input w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm font-medium text-slate-800 outline-none placeholder:text-slate-400 hover:border-indigo-300 hover:bg-white focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-100 dark:border-slate-700 dark:bg-[#111a2d] dark:text-white dark:placeholder:text-slate-500 dark:hover:border-indigo-400/40 dark:hover:bg-[#131e33] dark:focus:border-indigo-400 dark:focus:bg-[#152039] dark:focus:ring-indigo-500/10"
                    />
                  </div>

                  <div className="contact-card-up" style={{ animationDelay: '580ms' }}>
                    <label
                      htmlFor="email"
                      className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-200"
                    >
                      Email Address
                    </label>

                    <input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="you@example.com"
                      required
                      className="contact-input w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm font-medium text-slate-800 outline-none placeholder:text-slate-400 hover:border-indigo-300 hover:bg-white focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-100 dark:border-slate-700 dark:bg-[#111a2d] dark:text-white dark:placeholder:text-slate-500 dark:hover:border-indigo-400/40 dark:hover:bg-[#131e33] dark:focus:border-indigo-400 dark:focus:bg-[#152039] dark:focus:ring-indigo-500/10"
                    />
                  </div>
                </div>

                {/* Subject */}
                <div className="contact-card-up" style={{ animationDelay: '660ms' }}>
                  <label
                    htmlFor="subject"
                    className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-200"
                  >
                    Subject
                  </label>

                  <input
                    id="subject"
                    name="subject"
                    type="text"
                    value={formData.subject}
                    onChange={handleChange}
                    placeholder="What would you like to discuss?"
                    required
                    className="contact-input w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm font-medium text-slate-800 outline-none placeholder:text-slate-400 hover:border-indigo-300 hover:bg-white focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-100 dark:border-slate-700 dark:bg-[#111a2d] dark:text-white dark:placeholder:text-slate-500 dark:hover:border-indigo-400/40 dark:hover:bg-[#131e33] dark:focus:border-indigo-400 dark:focus:bg-[#152039] dark:focus:ring-indigo-500/10"
                  />
                </div>

                {/* Message */}
                <div className="contact-card-up" style={{ animationDelay: '740ms' }}>
                  <label
                    htmlFor="message"
                    className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-200"
                  >
                    Message
                  </label>

                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    placeholder="Write your message here..."
                    required
                    rows={7}
                    className="contact-input w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm font-medium leading-6 text-slate-800 outline-none placeholder:text-slate-400 hover:border-indigo-300 hover:bg-white focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-100 dark:border-slate-700 dark:bg-[#111a2d] dark:text-white dark:placeholder:text-slate-500 dark:hover:border-indigo-400/40 dark:hover:bg-[#131e33] dark:focus:border-indigo-400 dark:focus:bg-[#152039] dark:focus:ring-indigo-500/10"
                  />
                </div>

                {/* Submit Button */}
                <div
                  className="contact-card-up"
                  style={{ animationDelay: '820ms' }}
                >
                  <button
                    type="submit"
                    className="contact-button-glow group relative w-full overflow-hidden rounded-xl bg-gradient-to-r from-[#7c3aed] via-[#4f46e5] to-[#2563eb] px-6 py-4 text-sm font-bold text-white shadow-xl shadow-indigo-200/50 transition-all duration-300 hover:-translate-y-1 hover:scale-[1.01] hover:shadow-2xl hover:shadow-indigo-300/50 active:translate-y-0 active:scale-[0.99] dark:shadow-[0_12px_35px_rgba(79,70,229,0.25)] dark:hover:shadow-[0_15px_45px_rgba(79,70,229,0.40)]"
                  >
                    {/* Shimmer */}
                    <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 group-hover:translate-x-full" />

                    {/* Hover glow */}
                    <span className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                      <span className="absolute inset-0 bg-gradient-to-r from-purple-400/20 via-white/10 to-blue-400/20 blur-xl" />
                    </span>

                    <span className="relative flex items-center justify-center gap-2">
                      <Send className="h-4 w-4 transition-all duration-300 group-hover:-translate-y-1 group-hover:translate-x-1" />

                      <span>Send Message</span>

                      <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                    </span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default ContactPage;