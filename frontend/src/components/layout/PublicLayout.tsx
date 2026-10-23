// frontend/src/components/layout/PublicLayout.tsx
import React, { useState, useEffect } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import {
  GraduationCap, Menu, X, LogIn,
  LayoutDashboard, Github, Mail, Phone, MapPin, ArrowUpRight
} from 'lucide-react';

const navLinks = [
  { label: 'Home', path: '/' },
  { label: 'About', path: '/about' },
  { label: 'How It Works', path: '/how-it-works' },
  { label: 'Results', path: '/results' },
  { label: 'FAQ', path: '/faq' },
  { label: 'Contact', path: '/contact' },
];

export const PublicLayout: React.FC = () => {
  const { isAuthenticated } = useAuthStore();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-cream-100 dark:bg-slate-950 transition-colors">
      {/* ── HEADER ── */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-cream-50/90 dark:bg-slate-950/80 backdrop-blur-xl border-b border-cream-300 dark:border-white/5 shadow-lg dark:shadow-2xl shadow-cream-300/50 dark:shadow-black/20'
          : 'bg-transparent'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16 sm:h-20">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-violet-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:shadow-blue-500/40 transition-shadow">
                <GraduationCap className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-stone-800 dark:text-white">CSE-<span className="bg-gradient-to-r from-blue-500 to-violet-500 bg-clip-text text-transparent">ProFlow</span></span>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-1">
              {navLinks.map(link => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    location.pathname === link.path
                      ? 'text-amber-800 dark:text-white bg-amber-50 dark:bg-white/10'
                      : 'text-stone-600 dark:text-slate-400 hover:text-stone-900 dark:hover:text-white hover:bg-cream-200 dark:hover:bg-white/5'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            {/* Auth Button + Theme Toggle */}
            <div className="hidden md:flex items-center gap-3">
              <ThemeToggle variant="nav" />
              {isAuthenticated ? (
                <Link to="/dashboard" className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-500 to-violet-600 text-white rounded-xl hover:from-blue-600 hover:to-violet-700 text-sm font-semibold transition-all shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40">
                  <LayoutDashboard className="w-4 h-4" />Dashboard
                </Link>
              ) : (
                <Link to="/login" className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-500 to-violet-600 text-white rounded-xl hover:from-blue-600 hover:to-violet-700 text-sm font-semibold transition-all shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40">
                  <LogIn className="w-4 h-4" />Sign In
                </Link>
              )}
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden flex items-center gap-2">
              <ThemeToggle variant="nav" />
              <button onClick={() => setMobileOpen(!mobileOpen)} className="p-2 rounded-lg text-stone-700 dark:text-white hover:bg-cream-200 dark:hover:bg-white/10 transition-colors">
                {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Mobile Nav */}
          {mobileOpen && (
            <div className="md:hidden py-4 border-t border-cream-300 dark:border-white/5 space-y-1">
              {navLinks.map(link => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setMobileOpen(false)}
                  className={`block px-3 py-2.5 rounded-lg text-sm font-medium ${
                    location.pathname === link.path ? 'text-amber-800 dark:text-white bg-amber-50 dark:bg-white/10' : 'text-stone-600 dark:text-slate-400 hover:text-stone-900 dark:hover:text-white hover:bg-cream-200 dark:hover:bg-white/5'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
              <div className="pt-3 border-t border-cream-300 dark:border-white/5 mt-2">
                {isAuthenticated ? (
                  <Link to="/dashboard" onClick={() => setMobileOpen(false)} className="block px-3 py-2.5 text-sm font-semibold text-blue-600 dark:text-blue-400">Go to Dashboard</Link>
                ) : (
                  <Link to="/login" onClick={() => setMobileOpen(false)} className="block px-3 py-2.5 text-sm font-semibold text-blue-600 dark:text-blue-400">Sign In</Link>
                )}
              </div>
            </div>
          )}
        </div>
      </header>

      {/* ── MAIN ── */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* ── FOOTER ── */}
      <footer className="bg-gray-900 dark:bg-slate-950 border-t border-gray-800 dark:border-white/5 text-gray-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
            {/* Brand */}
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-15 h-10 bg-gradient-to-br rounded-xl flex items-center justify-center">
                   <img
        src="/logo.jpeg"
        alt="CSE ProFlow Logo"
      />
                </div>
                <span className="text-xl font-bold text-white">CSE ProFlow</span>
              </div>
              <p className="text-sm text-gray-400 leading-relaxed max-w-md">
                An automated project allocation platform designed for universities.
                Streamlines the entire process from proposal submission to team formation,
                ensuring fair and transparent project distribution.
              </p>
              <div className="flex items-center gap-3 mt-6">
                <a href="#" className="w-10 h-10 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all">
                  <Github className="w-4 h-4" />
                </a>
                <a href="mailto:support@university.edu" className="w-10 h-10 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all">
                  <Mail className="w-4 h-4" />
                </a>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="text-white font-semibold mb-5 text-sm uppercase tracking-wider">Navigate</h4>
              <ul className="space-y-3">
                {navLinks.map(link => (
                  <li key={link.path}>
                    <Link to={link.path} className="text-sm text-gray-400 hover:text-white transition-colors flex items-center gap-1 group">
                      {link.label}
                      <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h4 className="text-white font-semibold mb-5 text-sm uppercase tracking-wider">Contact</h4>
              <ul className="space-y-4 text-sm">
                <li className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-500/10 rounded-lg flex items-center justify-center"><Mail className="w-3.5 h-3.5 text-blue-400" /></div>
                  <span className="text-gray-400">support@iul.ac.in</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-500/10 rounded-lg flex items-center justify-center"><Phone className="w-3.5 h-3.5 text-blue-400" /></div>
                  <span className="text-gray-400">+91 123 456 7890</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-blue-500/10 rounded-lg flex items-center justify-center flex-shrink-0"><MapPin className="w-3.5 h-3.5 text-blue-400" /></div>
                  <span className="text-gray-400">Dept. of CSE,<br />Integral University, Lucknow</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 dark:border-white/5 mt-12 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-gray-500">© {new Date().getFullYear()} CSE ProFlow. All rights reserved.</p>
            <div className="flex gap-6 text-xs text-gray-500">
              <Link to="/about" className="hover:text-white transition-colors">Privacy Policy</Link>
              <Link to="/about" className="hover:text-white transition-colors">Terms of Service</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};