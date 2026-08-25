// frontend/src/pages/student/WhatToDoPage.tsx
import React, { useState } from 'react';
import {
  Bell, Moon, Sun, Users2, Lightbulb,
  CheckCircle2, AlertTriangle, Shield, Users, BookOpen, XCircle, TrendingUp,
  Sparkles, ArrowRight, MessageCircle, Target, Zap, Award, Star,
  Leaf, Flower2, Rocket, Compass, Crown, Gem, Brain, Heart
} from 'lucide-react';
import { Link } from 'react-router-dom';

// Premium Nature-Inspired Gradients
const gradients = {
  brand: 'linear-gradient(135deg, #11998e 0%, #38ef7d 50%, #a8e6cf 100%)',
  brandAlt: 'linear-gradient(135deg, #52c234 0%, #061700 50%, #2ecc71 100%)',
  card: 'linear-gradient(135deg, rgba(255,255,255,0.98) 0%, rgba(245,255,250,0.95) 100%)',
  dark: 'linear-gradient(135deg, #0a2e1f 0%, #1a5c3a 50%, #0d3b24 100%)',
  emerald: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
  teal: 'linear-gradient(135deg, #00b4db 0%, #0083b0 100%)',
  gold: 'linear-gradient(135deg, #f5af19 0%, #f12711 50%, #f5af19 100%)',
  purple: 'linear-gradient(135deg, #8E2DE2 0%, #4A00E0 100%)',
  pink: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
};

const WhatToDoPage: React.FC = () => {
  const [dark, setDark] = useState(false);
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const [hoveredStat, setHoveredStat] = useState<number | null>(null);

  const sections = [
    {
      id: 'overview',
      icon: <Target className="w-5 h-5" />,
      title: '🔍 Understand the Process',
      color: 'from-blue-500 to-cyan-500',
      gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      badge: 'STEP 01',
      emoji: '🎯',
      content: {
        description: 'You are about to select your Final Year Project (FYP). This process includes:',
        points: [
          'Forming a team',
          'Joining a project',
          'Working under a faculty guide'
        ],
        note: '✨ Your choices here will impact your entire final year journey.',
        tip: 'Start early, plan wisely!'
      }
    },
    {
      id: 'notice',
      icon: <AlertTriangle className="w-5 h-5" />,
      title: '📢 Important Notice',
      color: 'from-amber-500 to-orange-500',
      gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
      badge: 'RULES',
      emoji: '⚡',
      content: {
        description: '',
        points: [
          '⚠️ You can create or join only one team',
          '⚠️ Each team can select only one project',
          '⚠️ Once a project is selected, it is locked to your team',
          '⚠️ Project selection is done on a first-come, first-served basis',
          '⚠️ Make sure all team members agree before proceeding'
        ],
        note: ''
      }
    },
    {
      id: 'caution',
      icon: <Shield className="w-5 h-5" />,
      title: '🚨 Caution – Read Carefully',
      color: 'from-red-500 to-pink-500',
      gradient: 'linear-gradient(135deg, #ff0844 0%, #ffb199 100%)',
      badge: 'CRITICAL',
      isCritical: true,
      emoji: '⚠️',
      content: {
        description: '',
        points: [
          '❌ Once you select a project, you cannot change it easily',
          '❌ There is NO automatic option to switch projects or teams',
          '❌ If you want to change: You must contact the Project Head / Admin directly',
          '❌ Approval is not guaranteed',
          '❌ Avoid making decisions in a hurry'
        ],
        note: '⚠️ This is the most important section - read it twice! ⚠️'
      }
    },
    {
      id: 'team',
      icon: <Users className="w-5 h-5" />,
      title: '👥 Team Formation Guidelines',
      color: 'from-green-500 to-emerald-500',
      gradient: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
      badge: 'GUIDELINES',
      emoji: '🤝',
      content: {
        description: '✨ Choose teammates who:',
        points: [
          '✓ Are responsible and active',
          '✓ Have complementary skills',
          '✓ Are committed to completing the project'
        ],
        note: '💪 A strong team = smoother project execution.',
        avoid: ['✗ Random team selection', '✗ Choosing inactive or unknown members']
      }
    },
    {
      id: 'project',
      icon: <BookOpen className="w-5 h-5" />,
      title: '📘 Project Selection Guidelines',
      color: 'from-purple-500 to-indigo-500',
      gradient: 'linear-gradient(135deg, #8E2DE2 0%, #4A00E0 100%)',
      badge: 'BEST PRACTICES',
      emoji: '🎯',
      content: {
        description: '🎯 Before selecting a project:',
        points: [
          '✓ Read the project description carefully',
          '✓ Understand required skills and prerequisites',
          '✓ Check faculty expectations'
        ],
        note: '🏆 Choose a project that matches your interests, is feasible within time, and aligns with your career goals.'
      }
    },
    {
      id: 'mistakes',
      icon: <XCircle className="w-5 h-5" />,
      title: '❌ Common Mistakes to Avoid',
      color: 'from-rose-500 to-red-500',
      gradient: 'linear-gradient(135deg, #f43b47 0%, #fb872b 100%)',
      badge: 'WARNING',
      emoji: '🚫',
      content: {
        description: '',
        points: [
          '❌ Selecting project without discussion',
          '❌ Joining team without knowing members',
          '❌ Ignoring project requirements',
          '❌ Choosing based only on "easy" or "popular"',
          '❌ Waiting too long and missing good projects'
        ],
        note: ''
      }
    },
    {
      id: 'advice',
      icon: <Sparkles className="w-5 h-5" />,
      title: '💡 Final Advice',
      color: 'from-yellow-500 to-amber-500',
      gradient: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
      badge: 'REMEMBER',
      emoji: '🌟',
      content: {
        description: '',
        points: [
          '✨ Take your time before confirming decisions',
          '✨ Discuss with your team and faculty if needed',
          '✨ Make informed choices — this is your final year project',
          '✨ Once confirmed, focus on execution and learning'
        ],
        note: '🎓 Your final year project is a milestone — make it count! 🎓'
      }
    }
  ];

  const stats = [
    { label: 'Active Projects', value: '43+', icon: <Rocket className="w-4 h-4" />, change: '+12%', color: 'from-emerald-400 to-teal-500' },
    { label: 'Teams Formed', value: '28', icon: <Users2 className="w-4 h-4" />, change: '+8%', color: 'from-blue-400 to-cyan-500' },
    { label: 'Success Rate', value: '94%', icon: <Award className="w-4 h-4" />, change: '+5%', color: 'from-amber-400 to-orange-500' },
  ];

  const achievements = [
    { label: 'Students Guided', value: '1,200+', icon: <Users className="w-4 h-4" /> },
    { label: 'Projects Completed', value: '350+', icon: <Award className="w-4 h-4" /> },
    { label: 'Success Stories', value: '98%', icon: <Star className="w-4 h-4" /> },
  ];

  return (
    <div className={`${dark ? "dark" : ""} min-h-screen`} style={{ 
      background: 'radial-gradient(circle at 10% 20%, #e8f5e9 0%, #c8e6c9 50%, #a5d6a7 100%)',
      position: 'relative'
    }}>
      {/* Animated Background Elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-20 left-10 w-40 h-40 opacity-10 animate-float"><Leaf className="w-full h-full text-emerald-600" /></div>
        <div className="absolute bottom-20 right-10 w-32 h-32 opacity-10 animate-float-delayed"><Flower2 className="w-full h-full text-teal-600" /></div>
        <div className="absolute top-1/3 right-1/4 w-24 h-24 opacity-5 animate-spin-slow"><Star className="w-full h-full text-emerald-500" /></div>
        <div className="absolute bottom-1/3 left-1/4 w-20 h-20 opacity-5 animate-pulse-slow"><Heart className="w-full h-full text-teal-500" /></div>
        <div className="absolute top-2/3 left-10 w-28 h-28 opacity-8 animate-float"><Compass className="w-full h-full text-emerald-400" /></div>
      </div>

      <main className="relative z-10">
        {/* Premium Header */}
        <header className="sticky top-0 z-20 backdrop-blur-xl bg-white/40 border-b border-white/40 shadow-lg">
          <div className="px-4 sm:px-6 lg:px-10 h-16 sm:h-20 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-6 h-6 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 flex items-center justify-center">
                  <Sparkles className="w-3 h-3 text-white" />
                </div>
                <p className="text-[10px] sm:text-xs uppercase tracking-[0.2em] text-emerald-600 font-bold">Guidance Center</p>
              </div>
              <h2 className="text-base sm:text-lg font-bold bg-gradient-to-r from-emerald-700 to-teal-700 bg-clip-text text-transparent">What You Need To Know</h2>
            </div>
            <button onClick={() => setDark((d) => !d)} className="h-9 w-9 sm:h-10 sm:w-10 grid place-items-center rounded-xl bg-white/60 backdrop-blur-sm border border-white/80 hover:shadow-lg transition-all">
              {dark ? <Sun className="h-4 w-4 text-amber-500" /> : <Moon className="h-4 w-4 text-emerald-600" />}
            </button>
          </div>
        </header>

        <div className="px-4 sm:px-6 lg:px-10 py-6 sm:py-8 space-y-6 sm:space-y-8">
          
          {/* Ultra Premium Hero Section */}
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-green-500 rounded-2xl sm:rounded-3xl blur-2xl opacity-25 group-hover:opacity-40 transition duration-700" />
            <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl p-6 sm:p-8 lg:p-12" style={{ background: gradients.card, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
              <div className="absolute -top-32 -right-32 w-96 h-96 bg-gradient-to-r from-emerald-400 to-teal-400 rounded-full blur-3xl opacity-20 animate-pulse-slow" />
              <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-gradient-to-r from-teal-400 to-cyan-400 rounded-full blur-3xl opacity-20 animate-pulse-slow delay-1000" />
              
              <div className="relative flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
                <div>
                  <div className="inline-flex items-center gap-2 text-[10px] sm:text-xs font-bold px-3 sm:px-4 py-1.5 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg mb-4 sm:mb-5">
                    <Rocket className="h-3 w-3" />
                    Your Success Journey Starts Here
                    <Sparkles className="h-3 w-3 animate-pulse" />
                  </div>
                  <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold tracking-tight leading-[1.1]">
                    <span className="text-gray-900">Your Roadmap to</span>
                    <br />
                    <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-green-600 bg-clip-text text-transparent animate-gradient">Success</span>
                  </h1>
                  <p className="mt-4 sm:mt-6 text-gray-600 text-base sm:text-lg lg:text-xl max-w-2xl leading-relaxed">
                    Everything you need to know before selecting your final year project. 
                    Read carefully to make informed decisions.
                  </p>
                </div>
                
                {/* Premium Stats */}
                <div className="flex gap-3 sm:gap-4 flex-wrap">
                  {stats.map((stat, idx) => (
                    <div 
                      key={idx}
                      onMouseEnter={() => setHoveredStat(idx)}
                      onMouseLeave={() => setHoveredStat(null)}
                      className="group/stat relative cursor-pointer"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-teal-500 rounded-xl sm:rounded-2xl blur-lg opacity-0 group-hover/stat:opacity-50 transition duration-500" />
                      <div className="relative bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl px-4 sm:px-6 py-3 sm:py-4 border border-white/60 shadow-lg hover:scale-105 transition-all duration-300">
                        <div className={`p-1.5 rounded-lg bg-gradient-to-r ${stat.color} inline-flex mb-2`}>{stat.icon}</div>
                        <p className="text-2xl sm:text-3xl font-bold text-gray-900">{stat.value}</p>
                        <p className="text-[10px] sm:text-xs text-gray-500 font-medium">{stat.label}</p>
                        {hoveredStat === idx && (
                          <div className="absolute -top-2 -right-2 px-1.5 py-0.5 rounded-full bg-emerald-500 text-white text-[8px] font-bold animate-bounce">
                            {stat.change}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Achievement Strip */}
              <div className="mt-8 pt-6 border-t border-gray-100 flex flex-wrap justify-center gap-6 sm:gap-10">
                {achievements.map((ach, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <div className="p-1 rounded-lg bg-gradient-to-r from-emerald-100 to-teal-100">{ach.icon}</div>
                    <div>
                      <p className="text-lg sm:text-xl font-bold text-gray-900">{ach.value}</p>
                      <p className="text-[9px] sm:text-[10px] text-gray-500">{ach.label}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Premium Cards Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6 lg:gap-8">
            {sections.map((section) => (
              <div
                key={section.id}
                onMouseEnter={() => setSelectedSection(section.id)}
                onMouseLeave={() => setSelectedSection(null)}
                className="group relative cursor-pointer transition-all duration-500 hover:-translate-y-2"
              >
                {/* 3D Shadow Effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl sm:rounded-2xl blur-xl opacity-0 group-hover:opacity-30 transition duration-500" />
                
                <div className={`relative rounded-xl sm:rounded-2xl overflow-hidden transition-all duration-500 group-hover:shadow-2xl ${section.isCritical ? 'ring-2 ring-red-500/50' : ''}`} style={{ background: gradients.card }}>
                  {/* Animated Gradient Border */}
                  <div className={`absolute inset-x-0 top-0 h-1 transition-all duration-500 ${selectedSection === section.id ? 'h-1.5' : 'h-1'}`} style={{ background: section.gradient }} />
                  
                  {/* Critical Badge */}
                  {section.isCritical && (
                    <div className="absolute -top-1 -right-1 z-20">
                      <div className="relative">
                        <div className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-75" />
                        <div className="relative flex items-center gap-1 px-2 sm:px-3 py-1 rounded-full text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-white shadow-xl" style={{ background: gradients.brand }}>
                          <span className="animate-pulse">⚠️</span> MOST IMPORTANT
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="relative p-5 sm:p-6 lg:p-7">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4 sm:mb-5">
                      <div className="flex items-center gap-3">
                        <div className={`p-2.5 rounded-xl bg-gradient-to-r ${section.color} text-white shadow-lg transform group-hover:scale-110 transition-transform duration-300`}>
                          {section.icon}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-base sm:text-lg">{section.emoji}</span>
                            <span className={`text-[9px] sm:text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-gradient-to-r ${section.color} text-white`}>
                              {section.badge}
                            </span>
                          </div>
                          <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 mt-1 leading-tight">{section.title}</h3>
                        </div>
                      </div>
                      <div className={`w-8 h-8 rounded-full bg-gradient-to-r ${section.color} flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:translate-x-1`}>
                        <ArrowRight className="w-4 h-4 text-white" />
                      </div>
                    </div>

                    {/* Content */}
                    <div className="space-y-4">
                      {section.content.description && (
                        <p className="text-gray-600 font-medium text-sm sm:text-base bg-gray-50 p-3 rounded-lg">{section.content.description}</p>
                      )}
                      
                      {/* Points List */}
                      <div className="space-y-2.5">
                        {section.content.points.map((point, idx) => (
                          <div key={idx} className="flex items-start gap-2.5 group/item transition-all duration-300 hover:translate-x-1">
                            <div className="mt-0.5">
                              {point.startsWith('✓') ? (
                                <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center"><CheckCircle2 className="w-3 h-3 text-green-600" /></div>
                              ) : point.startsWith('❌') || point.startsWith('⚠️') ? (
                                <div className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center"><XCircle className="w-3 h-3 text-red-500" /></div>
                              ) : (
                                <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center"><Sparkles className="w-3 h-3 text-emerald-500" /></div>
                              )}
                            </div>
                            <p className="text-gray-700 text-sm sm:text-base leading-relaxed">{point}</p>
                          </div>
                        ))}
                      </div>

                      {/* Avoid Section */}
                      {section.content.avoid && (
                        <div className="mt-4 p-4 rounded-xl bg-gradient-to-r from-red-50 to-orange-50 border border-red-100">
                          <p className="text-[10px] font-bold text-red-600 uppercase tracking-wide mb-2 flex items-center gap-1"><span>🚫</span> AVOID THESE MISTAKES</p>
                          <div className="space-y-2">
                            {section.content.avoid.map((item, idx) => (
                              <div key={idx} className="flex items-start gap-2">
                                <XCircle className="w-3.5 h-3.5 text-red-400 mt-0.5 flex-shrink-0" />
                                <p className="text-red-700 text-xs sm:text-sm">{item}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Note */}
                      {section.content.note && (
                        <div className={`mt-4 p-4 rounded-xl border ${section.id === 'caution' ? 'bg-gradient-to-r from-red-50 to-orange-50 border-red-200' : 'bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-200'}`}>
                          <div className="flex items-start gap-2">
                            <div className="p-1 rounded-lg bg-gradient-to-r from-emerald-400 to-teal-500">
                              <MessageCircle className="w-3 h-3 text-white" />
                            </div>
                            <p className={`text-sm font-medium ${section.id === 'caution' ? 'text-red-700' : 'text-emerald-700'} leading-relaxed`}>
                              {section.content.note}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Decorative Icon */}
                    <div className="absolute bottom-3 right-3 opacity-5 group-hover:opacity-10 transition-opacity">
                      <Crown className="w-12 h-12" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Premium CTA Section */}
          <div className="relative group overflow-hidden rounded-2xl sm:rounded-3xl transition-all duration-500 hover:shadow-2xl" style={{ background: gradients.dark }}>
            {/* Animated Elements */}
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute top-0 right-0 w-80 h-80 rounded-full blur-3xl animate-pulse-slow" style={{ background: 'radial-gradient(circle, rgba(56,239,125,0.3) 0%, rgba(17,153,142,0.1) 100%)' }} />
              <div className="absolute bottom-0 left-0 w-80 h-80 rounded-full blur-3xl animate-pulse-slow delay-1000" style={{ background: 'radial-gradient(circle, rgba(168,230,207,0.3) 0%, rgba(17,153,142,0.1) 100%)' }} />
            </div>
            
            {/* Floating Elements */}
            <div className="absolute top-10 right-20 opacity-10 animate-float"><Gem className="w-16 h-16 text-white" /></div>
            <div className="absolute bottom-10 left-20 opacity-10 animate-float-delayed"><Compass className="w-14 h-14 text-white" /></div>
            
            <div className="relative z-10 p-8 sm:p-10 lg:p-12 text-center">
              <div className="relative inline-block mb-4 sm:mb-5">
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-emerald-400 to-teal-500 blur-xl animate-pulse" />
                <div className="relative w-16 h-16 sm:w-20 sm:h-20 mx-auto rounded-full bg-gradient-to-r from-emerald-400 to-teal-500 flex items-center justify-center shadow-2xl">
                  <Brain className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
                </div>
              </div>
              
              <h3 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-3">
                🌟 Ready to Make Your Choice? 🌟
              </h3>
              <p className="text-white/80 mb-6 sm:mb-8 max-w-lg mx-auto text-base sm:text-lg">
                You've read all the guidelines. Now it's time to form your team and select the perfect project.
              </p>
              
              <Link
                to="/projects"
                className="group relative inline-flex items-center gap-2 px-8 sm:px-10 py-3 sm:py-4 rounded-xl font-bold transition-all duration-300 hover:scale-105 overflow-hidden text-base sm:text-lg shadow-2xl"
                style={{ background: gradients.brand, color: 'white', boxShadow: '0 20px 40px -12px rgba(17,153,142,0.5)' }}
              >
                <span className="relative z-10 flex items-center gap-2">
                  <Rocket className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform" />
                  Browse Projects
                  <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-2 transition-transform" />
                </span>
                <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/30 to-transparent" />
              </Link>
            </div>
          </div>

          {/* Footer Note */}
          <div className="text-center pt-4">
            <div className="inline-flex items-center gap-2 text-[10px] text-emerald-600/60">
              <div className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse" />
              <span>🎓 Powered by Project Allocation System</span>
              <div className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse" />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default WhatToDoPage;