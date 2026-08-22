import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from '@/stores/authStore';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PublicLayout } from '@/components/layout/PublicLayout';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import HomePage from '@/pages/public/HomePage';
import AboutPage from '@/pages/public/AboutPage';
import HowItWorksPage from '@/pages/public/HowItWorksPage';
import ResultsPage from '@/pages/public/ResultsPage';
import FAQPage from '@/pages/public/FAQPage';
import ContactPage from '@/pages/public/ContactPage';
import NotFoundPage from '@/pages/public/NotFoundPage';
import LoginPage from '@/pages/LoginPage';
import AdminDashboard from '@/pages/admin/AdminDashboard';
import ManageUsersPage from '@/pages/admin/ManageUsersPage';
import ManagePoolsPage from '@/pages/admin/ManagePoolsPage';
import PoolDetailPage from '@/pages/admin/PoolDetailPage';
import ReportsPage from '@/pages/admin/ReportsPage';
import AuditPage from '@/pages/admin/AuditPage';
import ReviewIdeasPage from '@/pages/admin/ReviewIdeasPage';
import TemporaryPermissionsPage from '@/pages/admin/TemporaryPermissionsPage';
import ReviewPage from '@/pages/subadmin/ReviewPage';
import FacultyDashboard from '@/pages/faculty/FacultyDashboard';
import CreateProposal from '@/pages/faculty/CreateProposal';
import MyProjects from '@/pages/faculty/MyProjects';
import TeamManagement from '@/pages/faculty/TeamManagement';
import StudentDashboard from '@/pages/student/StudentDashboard';
import BrowseProjectsPage from '@/pages/student/BrowseProjectsPage';
import MyTeamPage from '@/pages/student/MyTeamPage';
import IdeasPage from '@/pages/student/IdeasPage';
import NotificationsPage from '@/pages/NotificationsPage';
import ProfilePage from '@/pages/ProfilePage';
import ChangePasswordPage from '@/pages/ChangePasswordPage';

const DashboardRedirect: React.FC = () => {
  const { user } = useAuthStore();
  switch (user?.role) {
    case 'ADMIN': return <AdminDashboard />;
    case 'SUBADMIN': return <ReviewPage />;
    case 'FACULTY': return <FacultyDashboard />;
    case 'STUDENT': return <StudentDashboard />;
    default: return <LoginPage />;
  }
};

const App: React.FC = () => (
  <BrowserRouter>
    <Toaster position="top-right" toastOptions={{ duration: 4000 }} />
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/how-it-works" element={<HowItWorksPage />} />
        <Route path="/results" element={<ResultsPage />} />
        <Route path="/faq" element={<FAQPage />} />
        <Route path="/contact" element={<ContactPage />} />
      </Route>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          <Route path="/dashboard" element={<DashboardRedirect />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/change-password" element={<ChangePasswordPage />} />
          <Route element={<ProtectedRoute roles={['ADMIN']} />}>
            <Route path="/users" element={<ManageUsersPage />} />
            <Route path="/audit" element={<AuditPage />} />
            <Route path="/student-ideas" element={<ReviewIdeasPage />} />
            <Route path="/temporary-permissions" element={<TemporaryPermissionsPage />} />
          </Route>
          <Route element={<ProtectedRoute permissions={['VIEW_REPORTS']} />}>
            <Route path="/reports" element={<ReportsPage />} />
          </Route>
          <Route element={<ProtectedRoute permissions={['MANAGE_POOLS']} />}>
            <Route path="/pools" element={<ManagePoolsPage />} />
            <Route path="/pools/:id" element={<PoolDetailPage />} />
          </Route>
          <Route element={<ProtectedRoute roles={['SUBADMIN']} />}>
            <Route path="/review" element={<ReviewPage />} />
          </Route>
          <Route element={<ProtectedRoute roles={['FACULTY']} />}>
            <Route path="/faculty/proposals" element={<CreateProposal />} />
            <Route path="/my-projects" element={<MyProjects />} />
            <Route path="/faculty/team-management" element={<TeamManagement />} />
          </Route>
          <Route element={<ProtectedRoute roles={['STUDENT']} />}>
            <Route path="/projects" element={<BrowseProjectsPage />} />
            <Route path="/my-team" element={<MyTeamPage />} />
            <Route path="/ideas" element={<IdeasPage />} />
          </Route>
        </Route>
      </Route>
      <Route element={<PublicLayout />}><Route path="*" element={<NotFoundPage />} /></Route>
    </Routes>
  </BrowserRouter>
);

export default App;
