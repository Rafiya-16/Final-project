// frontend/src/pages/student/IdeasPage.tsx
import React, { useState, useEffect } from 'react';
import { ideaService } from '@/services/ideaService';
import { poolService } from '@/services/poolService';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { Plus, Lightbulb, Sparkles, TrendingUp, MessageCircle, X, Send, Leaf, Flower2, Star, Rocket, Award, Brain, Zap } from 'lucide-react';
import toast from 'react-hot-toast';
import type { StudentIdea } from '@/types';
import { getErrorMessage } from '@/types';

// Premium Nature-Inspired Gradient Colors
const gradients = {
  brand: 'linear-gradient(135deg, #11998e 0%, #38ef7d 50%, #a8e6cf 100%)',
  brandAlt: 'linear-gradient(135deg, #52c234 0%, #061700 50%, #2ecc71 100%)',
  card: 'linear-gradient(135deg, rgba(255,255,255,0.98) 0%, rgba(245,255,250,0.95) 100%)',
  dark: 'linear-gradient(135deg, #0a2e1f 0%, #1a5c3a 50%, #0d3b24 100%)',
  emerald: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
  teal: 'linear-gradient(135deg, #00b4db 0%, #0083b0 100%)',
  gold: 'linear-gradient(135deg, #f5af19 0%, #f12711 50%, #f5af19 100%)',
};

const IdeasPage: React.FC = () => {
  const [poolId, setPoolId] = useState('');
  const [ideas, setIdeas] = useState<StudentIdea[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', domain: '' });
  const [hoveredIdea, setHoveredIdea] = useState<string | null>(null);

  useEffect(() => {
    poolService.list().then(async r => {
      const pool = r.data?.[0];
      if (pool) { 
        setPoolId(pool.id); 
        const i = await ideaService.getMyIdeas(pool.id); 
        setIdeas(i || []); 
      }
    }).finally(() => setLoading(false));
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await ideaService.submit(poolId, form);
      toast.success('✨ Idea submitted successfully!');
      setShowForm(false); 
      setForm({ title: '', description: '', domain: '' });
      const i = await ideaService.getMyIdeas(poolId); 
      setIdeas(i || []);
    } catch (e: unknown) { 
      toast.error(getErrorMessage(e)); 
    }
  };

  if (loading) return <LoadingSpinner />;

  const stats = [
    { label: 'Total Ideas', value: ideas.length, icon: <Lightbulb className="w-4 h-4" />, color: 'from-emerald-400 to-teal-500' },
    { label: 'Pending Review', value: ideas.filter(i => i.status === 'SUBMITTED' || i.status === 'UNDER_REVIEW').length, icon: <TrendingUp className="w-4 h-4" />, color: 'from-amber-400 to-orange-500' },
    { label: 'Approved', value: ideas.filter(i => i.status === 'APPROVED').length, icon: <Award className="w-4 h-4" />, color: 'from-green-400 to-emerald-500' },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return { text: '✓ APPROVED', className: 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 border-green-200' };
      case 'REJECTED':
        return { text: '✗ REJECTED', className: 'bg-gradient-to-r from-red-100 to-pink-100 text-red-700 border-red-200' };
      case 'SUBMITTED':
        return { text: '⏳ SUBMITTED', className: 'bg-gradient-to-r from-yellow-100 to-amber-100 text-yellow-700 border-yellow-200' };
      case 'UNDER_REVIEW':
        return { text: '⏳ UNDER REVIEW', className: 'bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-700 border-blue-200' };
      default:
        return { text: status, className: 'bg-gray-100 text-gray-700 border-gray-200' };
    }
  };

  return (
    <div className="min-h-screen" style={{ background: 'radial-gradient(circle at 10% 20%, #e8f5e9 0%, #c8e6c9 50%, #a5d6a7 100%)' }}>
      {/* Animated Background Elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-20 left-10 w-40 h-40 opacity-10 animate-float"><Leaf className="w-full h-full text-emerald-600" /></div>
        <div className="absolute bottom-20 right-10 w-32 h-32 opacity-10 animate-float-delayed"><Flower2 className="w-full h-full text-teal-600" /></div>
        <div className="absolute top-1/3 right-1/4 w-24 h-24 opacity-5 animate-spin-slow"><Star className="w-full h-full text-emerald-500" /></div>
        <div className="absolute bottom-1/3 left-1/4 w-20 h-20 opacity-5 animate-pulse-slow"><Brain className="w-full h-full text-teal-500" /></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8">
        
        {/* Hero Section - Premium Glassmorphic */}
        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-green-500 rounded-2xl sm:rounded-3xl blur-2xl opacity-25 group-hover:opacity-40 transition duration-700" />
          <div className="relative backdrop-blur-xl bg-white/30 rounded-2xl sm:rounded-3xl p-6 sm:p-8 lg:p-10 border border-white/40 shadow-2xl overflow-hidden">
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-gradient-to-r from-emerald-400 to-teal-400 rounded-full blur-3xl opacity-20" />
            <div className="relative flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
              <div>
                <div className="inline-flex items-center gap-2 text-xs font-medium px-3 sm:px-4 py-1.5 rounded-full bg-white/40 backdrop-blur-sm border border-white/60 mb-3 sm:mb-4">
                  <Rocket className="h-3 w-3 text-emerald-600" />
                  <span className="text-emerald-800 text-xs sm:text-sm">Innovation Hub</span>
                  <Sparkles className="h-3 w-3 text-emerald-600 animate-pulse" />
                </div>
                <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold tracking-tight leading-[1.1]">
                  <span className="text-gray-900">Submit Your</span>
                  <br />
                  <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-green-600 bg-clip-text text-transparent">Project Idea</span>
                </h1>
                <p className="mt-3 sm:mt-4 text-gray-600 text-sm sm:text-base lg:text-lg max-w-2xl">
                  Have a unique project idea? Submit it for review. If approved, it will be reserved exclusively for your team.
                </p>
              </div>
              
              <button 
                onClick={() => setShowForm(true)} 
                className="group relative inline-flex items-center gap-2 px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-bold transition-all duration-300 hover:scale-105 overflow-hidden shadow-2xl"
                style={{ background: gradients.brand, color: 'white' }}
              >
                <span className="relative z-10 flex items-center gap-2"><Plus className="w-5 h-5" />Submit New Idea<Sparkles className="w-4 h-4 group-hover:rotate-12 transition-transform" /></span>
                <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/30 to-transparent" />
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards - Premium Design */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
          {stats.map((stat, idx) => (
            <div key={idx} className="group/stat relative rounded-xl sm:rounded-2xl bg-white/80 backdrop-blur-sm border border-white/60 p-5 sm:p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-teal-500 rounded-xl sm:rounded-2xl opacity-0 group-hover/stat:opacity-10 transition-opacity" />
              <div className="flex items-center justify-between">
                <div className={`p-2.5 rounded-xl bg-gradient-to-r ${stat.color} shadow-md`}>
                  {stat.icon}
                </div>
                <span className="text-2xl sm:text-3xl font-bold text-gray-900">{stat.value}</span>
              </div>
              <p className="text-sm text-gray-600 mt-3 font-medium">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Submit Idea Form Modal - Premium Design */}
        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowForm(false)} />
            
            <div className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in duration-200">
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-500" />
              <div className="sticky top-0 bg-white/95 backdrop-blur-sm border-b border-gray-100 px-5 sm:px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 shadow-md">
                    <Lightbulb className="w-5 h-5 text-white" />
                  </div>
                  <h2 className="text-lg sm:text-xl font-bold text-gray-900">Submit New Project Idea</h2>
                </div>
                <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600 transition-colors"><X className="w-5 h-5" /></button>
              </div>
              
              <form onSubmit={submit} className="p-5 sm:p-6 space-y-5">
                <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl p-4 border border-emerald-100">
                  <p className="text-sm text-emerald-700 flex items-center gap-2"><Sparkles className="w-4 h-4" />If your idea gets approved, it will be reserved for your team. Make sure to provide clear details!</p>
                </div>

                <div>
                  <label className="text-sm font-bold text-gray-700 block mb-2">Project Title <span className="text-emerald-500">*</span></label>
                  <input 
                    value={form.title} 
                    onChange={e => setForm(f => ({ ...f, title: e.target.value }))} 
                    required 
                    placeholder="e.g., AI-Powered Health Monitoring System"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-shadow"
                  />
                </div>

                <div>
                  <label className="text-sm font-bold text-gray-700 block mb-2">Description <span className="text-emerald-500">*</span></label>
                  <textarea 
                    value={form.description} 
                    onChange={e => setForm(f => ({ ...f, description: e.target.value }))} 
                    required 
                    rows={5} 
                    placeholder="Describe your project idea in detail. What problem does it solve? What technologies will you use?"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-shadow resize-none"
                  />
                </div>

                <div>
                  <label className="text-sm font-bold text-gray-700 block mb-2">Domain (Optional)</label>
                  <input 
                    value={form.domain} 
                    onChange={e => setForm(f => ({ ...f, domain: e.target.value }))} 
                    placeholder="e.g., AI, Web Development, IoT, Blockchain, HealthTech"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-shadow"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button 
                    type="submit" 
                    className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-bold transition-all hover:scale-105 shadow-lg"
                    style={{ background: gradients.brand, color: 'white' }}
                  >
                    <Send className="w-4 h-4" />
                    Submit Idea
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setShowForm(false)} 
                    className="px-6 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Ideas List - Premium Design */}
        {ideas.length === 0 ? (
          <EmptyState 
            title="No ideas submitted yet" 
            subtitle="Click the 'Submit New Idea' button above to share your project idea"
          />
        ) : (
          <div className="space-y-4 sm:space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-gradient-to-r from-emerald-400 to-teal-500"><Lightbulb className="w-4 h-4 text-white" /></div>
                <h2 className="text-lg sm:text-xl font-bold text-gray-900">Your Submitted Ideas</h2>
              </div>
              <div className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs sm:text-sm font-bold">{ideas.length} idea{ideas.length !== 1 ? 's' : ''}</div>
            </div>
            
            <div className="grid gap-4 sm:gap-5">
              {ideas.map(idea => {
                const statusBadge = getStatusBadge(idea.status);
                return (
                  <div 
                    key={idea.id}
                    onMouseEnter={() => setHoveredIdea(idea.id)}
                    onMouseLeave={() => setHoveredIdea(null)}
                    className="group relative transition-all duration-300 hover:-translate-y-1"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-teal-500 rounded-xl sm:rounded-2xl blur-xl opacity-0 group-hover:opacity-30 transition duration-500" />
                    <div className="relative rounded-xl sm:rounded-2xl overflow-hidden transition-all duration-300 group-hover:shadow-2xl" style={{ background: gradients.card }}>
                      <div className="absolute inset-x-0 top-0 h-0.5 sm:h-1" style={{ background: gradients.brand }} />
                      
                      <div className="p-5 sm:p-6">
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex flex-wrap items-center gap-2 mb-3">
                              <div className="p-1.5 rounded-lg bg-gradient-to-r from-emerald-100 to-teal-100">
                                <Lightbulb className="w-4 h-4 text-emerald-600" />
                              </div>
                              <span className={`text-[9px] sm:text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${statusBadge.className}`}>
                                {statusBadge.text}
                              </span>
                            </div>
                            
                            <h3 className="font-bold text-lg sm:text-xl text-gray-900 mb-2">{idea.title}</h3>
                            <p className="text-gray-600 text-sm sm:text-base leading-relaxed">{idea.description}</p>
                            
                            {idea.domain && (
                              <div className="mt-3">
                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full bg-gradient-to-r from-purple-100 to-pink-100 text-purple-600 border border-purple-200">
                                  <Sparkles className="w-3 h-3" />
                                  {idea.domain}
                                </span>
                              </div>
                            )}
                          </div>
                          
                          {hoveredIdea === idea.id && (
                            <div className="flex items-center gap-1 text-emerald-500 text-xs animate-fade-in">
                              <Sparkles className="w-3 h-3 animate-pulse" />
                              <span>Viewing</span>
                            </div>
                          )}
                        </div>
                        
                        {idea.adminFeedback && (
                          <div className="mt-4 rounded-xl p-4 border border-teal-100" style={{ background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)' }}>
                            <div className="flex items-start gap-2">
                              <div className="p-1 rounded-lg bg-gradient-to-r from-emerald-400 to-teal-500">
                                <MessageCircle className="w-3 h-3 text-white" />
                              </div>
                              <div className="flex-1">
                                <p className="text-[10px] sm:text-xs font-bold text-emerald-700 uppercase tracking-wide">Admin Feedback</p>
                                <p className="text-sm text-emerald-700 mt-1">{idea.adminFeedback}</p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                      
                      {/* Shine Effect on Hover */}
                      <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default IdeasPage;