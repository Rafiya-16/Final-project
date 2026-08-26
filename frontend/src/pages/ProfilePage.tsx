// frontend/src/pages/ProfilePage.tsx
import React, { useState, useEffect } from 'react';
import { authService } from '@/services/authService';
import { useAuthStore } from '@/stores/authStore';
import { Badge } from '@/lib/utils';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { User as UserIcon, Mail, Phone, Building2, GraduationCap, Calendar, Lock, Sparkles, Award, Clock, IdCard } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ProfilePage: React.FC = () => {
  const { user } = useAuthStore();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    authService.getMe().then(p => setProfile(p)).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="min-h-screen bg-gradient-to-br from-[#DEFCF9]/30 via-[#CADEFC]/20 to-[#C3BEF0]/30 flex items-center justify-center">
      <LoadingSpinner />
    </div>
  );
  if (!profile) return null;

  const fields = [
    { icon: <Mail className="w-4 h-4" />, label: 'Email', value: profile.email },
    { icon: <Building2 className="w-4 h-4" />, label: 'Department', value: profile.department || '—' },
    { icon: <GraduationCap className="w-4 h-4" />, label: 'Enrollment', value: profile.enrollmentNo || '—', show: profile.role === 'STUDENT' },
    { icon: <IdCard className="w-4 h-4" />, label: 'Faculty ID', value: profile.facultyId || '—', show: profile.role === 'FACULTY' },
    { icon: <Phone className="w-4 h-4" />, label: 'Phone', value: profile.phone || '—' },
    { icon: <Calendar className="w-4 h-4" />, label: 'Joined', value: new Date(profile.createdAt).toLocaleDateString() },
    { icon: <Clock className="w-4 h-4" />, label: 'Last Login', value: profile.lastLoginAt ? new Date(profile.lastLoginAt).toLocaleString() : 'Never' },
  ].filter(f => f.show !== false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#DEFCF9]/30 via-[#CADEFC]/20 to-[#C3BEF0]/30">
      <div className="max-w-3xl mx-auto px-4 py-8">
        
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-[#C3BEF0] to-[#CCA8E9] rounded-xl shadow-md">
              <UserIcon className="w-6 h-6 text-gray-800" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-[#7C3AED] to-[#A855F7] bg-clip-text text-transparent">
                My Profile
              </h1>
              <p className="text-gray-500 mt-1">View and manage your personal information</p>
            </div>
          </div>
        </div>

        {/* Profile Card */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-[#CADEFC]/50 overflow-hidden shadow-lg">
          {/* Cover Section */}
          <div className="h-24 bg-gradient-to-r from-[#C3BEF0] to-[#CCA8E9]" />
          
          {/* Avatar Section */}
          <div className="relative px-6">
            <div className="absolute -top-12 left-6">
              <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-[#C3BEF0] to-[#CCA8E9] flex items-center justify-center text-gray-800 text-3xl font-bold shadow-xl border-4 border-white">
                {profile.firstName[0]}{profile.lastName[0]}
              </div>
            </div>
          </div>

          {/* Profile Info */}
          <div className="pt-14 pb-6 px-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">{profile.firstName} {profile.lastName}</h2>
                <div className="flex items-center gap-2 mt-2">
                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold ${
                    profile.role === 'ADMIN' ? 'bg-red-100 text-red-700' :
                    profile.role === 'FACULTY' ? 'bg-indigo-100 text-indigo-700' :
                    'bg-emerald-100 text-emerald-700'
                  }`}>
                    <Award className="w-3 h-3" />
                    {profile.role}
                  </span>
                  {profile.designation && (
                    <span className="text-sm text-gray-500">{profile.designation}</span>
                  )}
                </div>
              </div>
              <button 
                onClick={() => navigate('/change-password')}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-[#CADEFC]/50 rounded-xl text-sm font-medium text-gray-700 hover:bg-white/80 transition-all shadow-sm"
              >
                <Lock className="w-4 h-4" />
                Change Password
              </button>
            </div>

            {/* Details Grid */}
            <div className="border-t border-[#CADEFC]/50 pt-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#7C3AED]" />
                Account Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {fields.map((field) => (
                  <div key={field.label} className="flex items-center gap-3 p-3 bg-gray-50/50 rounded-xl border border-[#CADEFC]/30">
                    <div className="p-2 bg-white rounded-lg shadow-sm text-[#7C3AED]">
                      {field.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-500">{field.label}</p>
                      <p className="text-sm font-medium text-gray-800 truncate">{field.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Quick Tips */}
        <div className="mt-6 p-4 bg-gradient-to-r from-[#DEFCF9]/50 to-[#CADEFC]/30 rounded-xl border border-[#CADEFC]/50">
          <div className="flex items-start gap-3">
            <div className="p-1.5 bg-white/60 rounded-lg">
              <Sparkles className="w-4 h-4 text-[#7C3AED]" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-700">Need to update information?</p>
              <p className="text-xs text-gray-500 mt-0.5">Contact your administrator to update your profile details.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;