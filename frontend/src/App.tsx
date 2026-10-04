// frontend/src/App.tsx

import React from 'react';
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

import { useAuthStore } from '@/stores/authStore';
import { useWorkplaceStore } from '@/stores/workplaceStore';

import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PublicLayout } from '@/components/layout/PublicLayout';

// Public Pages
import HomePage from '@/pages/public/HomePage';
import AboutPage from '@/pages/public/AboutPage';
import HowItWorksPage from '@/pages/public/HowItWorksPage';
import ResultsPage from '@/pages/public/ResultsPage';
import FAQPage from '@/pages/public/FAQPage';
import ContactPage from '@/pages/public/ContactPage';
import NotFoundPage from '@/pages/public/NotFoundPage';

// Auth
import LoginPage from '@/pages/LoginPage';

// Admin Pages
import AdminDashboard from '@/pages/admin/AdminDashboard';
import ManageUsersPage from '@/pages/admin/ManageUsersPage';
import ManagePoolsPage from '@/pages/admin/ManagePoolsPage';
import PoolDetailPage from '@/pages/admin/PoolDetailPage';
import ReportsPage from '@/pages/admin/ReportsPage';
import AuditPage from '@/pages/admin/AuditPage';
import ReviewIdeasPage from '@/pages/admin/ReviewIdeasPage';

// Faculty Pages
import FacultyDashboard from '@/pages/faculty/FacultyDashboard';
import CreateProposal from '@/pages/faculty/CreateProposal';
import MyProjects from '@/pages/faculty/MyProjects';
import TeamManagement from '@/pages/faculty/TeamManagement';
import SupervisionRequests from '@/pages/faculty/SupervisionRequests';

// Student Pages
import StudentDashboard from '@/pages/student/StudentDashboard';
import BrowseProjectsPage from '@/pages/student/BrowseProjectsPage';
import WhatToDoPage from '@/pages/student/WhatToDoPage';
import MyTeamPage from '@/pages/student/MyTeamPage';
import IdeasPage from '@/pages/student/IdeasPage';

// SubAdmin Pages
import ReviewPage from '@/pages/subadmin/ReviewPage';
import DashboardPage from '@/pages/subadmin/DashboardPage';
import FacultyPage from '@/pages/subadmin/FacultyPage';
import ProjectsPage from '@/pages/subadmin/ProjectsPage';

// Common Pages
import NotificationsPage from '@/pages/NotificationsPage';
import ProfilePage from '@/pages/ProfilePage';
import ChangePasswordPage from '@/pages/ChangePasswordPage';

type Workplace = 'FACULTY' | 'SUBADMIN';

interface ProtectedRouteProps {
  children: React.ReactNode;
  roles?: string[];
  workplace?: Workplace;
}

/**
 * ProtectedRoute
 *
 * Normal roles are checked against User.role.
 *
 * Special case:
 * A FACULTY user can access SubAdmin pages when:
 *
 * 1. The user has pool-level SubAdmin capability.
 * 2. SUBADMIN workplace is currently selected.
 *
 * User.role itself is never changed.
 */
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  roles,
  workplace,
}) => {
  const { isAuthenticated, user } = useAuthStore();

  const {
    activeWorkplace,
    hasSubadminAccess,
  } = useWorkplaceStore();

  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  /*
   * Password reset has highest priority.
   */
  if (
    user?.mustResetPwd &&
    location.pathname !== '/change-password'
  ) {
    return <Navigate to="/change-password" replace />;
  }

  /*
   * No role restriction.
   */
  if (!roles || !user) {
    return <>{children}</>;
  }

  /*
   * -------------------------------------------------------
   * FACULTY + SUBADMIN WORKPLACE
   * -------------------------------------------------------
   *
   * User.role remains FACULTY.
   *
   * We allow access to SUBADMIN routes only when the
   * workplace store confirms pool-level SubAdmin access.
   */
  if (
    workplace === 'SUBADMIN' &&
    user.role === 'FACULTY'
  ) {
    if (
      hasSubadminAccess &&
      activeWorkplace === 'SUBADMIN'
    ) {
      return <>{children}</>;
    }

    return <Navigate to="/dashboard" replace />;
  }

  /*
   * -------------------------------------------------------
   * NORMAL ROLE CHECK
   * -------------------------------------------------------
   */
  if (!roles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  /*
   * If a specific workplace was requested but the current
   * user/workplace does not match it, deny access.
   */
  if (
    workplace &&
    user.role === 'FACULTY' &&
    workplace === 'FACULTY' &&
    activeWorkplace !== 'FACULTY'
  ) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

/**
 * Role + Workplace based dashboard.
 */
const DashboardRedirect: React.FC = () => {
  const { user } = useAuthStore();

  const {
    activeWorkplace,
    hasSubadminAccess,
  } = useWorkplaceStore();

  /*
   * Faculty who is also a SubAdmin and has selected
   * SubAdmin workplace gets the SubAdmin dashboard.
   */
  if (
    user?.role === 'FACULTY' &&
    hasSubadminAccess &&
    activeWorkplace === 'SUBADMIN'
  ) {
    return <DashboardPage />;
  }

  switch (user?.role) {
    case 'ADMIN':
      return <AdminDashboard />;

    case 'SUBADMIN':
      return <DashboardPage />;

    case 'FACULTY':
      return <FacultyDashboard />;

    case 'STUDENT':
      return <StudentDashboard />;

    default:
      return <AdminDashboard />;
  }
};

const App: React.FC = () => (
  <BrowserRouter>
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 4000,
      }}
    />

    <Routes>

      {/* =====================================================
          PUBLIC
      ===================================================== */}

      <Route element={<PublicLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route
          path="/how-it-works"
          element={<HowItWorksPage />}
        />
        <Route path="/results" element={<ResultsPage />} />
        <Route path="/faq" element={<FAQPage />} />
        <Route path="/contact" element={<ContactPage />} />
      </Route>

      {/* =====================================================
          AUTH
      ===================================================== */}

      <Route
        path="/login"
        element={<LoginPage />}
      />

      {/* =====================================================
          PROTECTED
      ===================================================== */}

      <Route
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >

        {/* ===================================================
            DASHBOARD
        =================================================== */}

        <Route
          path="/dashboard"
          element={<DashboardRedirect />}
        />

        {/* ===================================================
            COMMON
        =================================================== */}

        <Route
          path="/profile"
          element={<ProfilePage />}
        />

        <Route
          path="/change-password"
          element={<ChangePasswordPage />}
        />

        <Route
          path="/notifications"
          element={<NotificationsPage />}
        />

        {/* ===================================================
            SUBADMIN WORKPLACE
        =================================================== */}

        <Route
          path="/faculty"
          element={
            <ProtectedRoute
              roles={['SUBADMIN']}
              workplace="SUBADMIN"
            >
              <FacultyPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin-projects"
          element={
            <ProtectedRoute
              roles={['SUBADMIN']}
              workplace="SUBADMIN"
            >
              <ProjectsPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/review"
          element={
            <ProtectedRoute
              roles={['SUBADMIN']}
              workplace="SUBADMIN"
            >
              <ReviewPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/review/:poolId/:facultyId"
          element={
            <ProtectedRoute
              roles={['SUBADMIN']}
              workplace="SUBADMIN"
            >
              <ReviewPage />
            </ProtectedRoute>
          }
        />

        {/* ===================================================
            ADMIN
        =================================================== */}

        <Route
          path="/users"
          element={
            <ProtectedRoute roles={['ADMIN']}>
              <ManageUsersPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/pools"
          element={
            <ProtectedRoute
              roles={['ADMIN', 'SUBADMIN']}
              workplace="SUBADMIN"
            >
              <ManagePoolsPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/pools/:id"
          element={
            <ProtectedRoute
              roles={['ADMIN', 'SUBADMIN']}
              workplace="SUBADMIN"
            >
              <PoolDetailPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/reports"
          element={
            <ProtectedRoute
              roles={['ADMIN', 'SUBADMIN']}
              workplace="SUBADMIN"
            >
              <ReportsPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/audit"
          element={
            <ProtectedRoute roles={['ADMIN']}>
              <AuditPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/student-ideas"
          element={
            <ProtectedRoute roles={['ADMIN']}>
              <ReviewIdeasPage />
            </ProtectedRoute>
          }
        />

        {/* ===================================================
            FACULTY WORKPLACE
        =================================================== */}

        <Route
          path="/faculty/proposals"
          element={
            <ProtectedRoute
              roles={['FACULTY']}
              workplace="FACULTY"
            >
              <CreateProposal />
            </ProtectedRoute>
          }
        />

        <Route
          path="/faculty/team-management"
          element={
            <ProtectedRoute
              roles={['FACULTY']}
              workplace="FACULTY"
            >
              <TeamManagement />
            </ProtectedRoute>
          }
        />

        <Route
          path="/my-projects"
          element={
            <ProtectedRoute
              roles={['FACULTY']}
              workplace="FACULTY"
            >
              <MyProjects />
            </ProtectedRoute>
          }
        />

        <Route
          path="/supervision-requests"
          element={
            <ProtectedRoute
              roles={['FACULTY']}
              workplace="FACULTY"
            >
              <SupervisionRequests />
            </ProtectedRoute>
          }
        />

        {/* ===================================================
            STUDENT
        =================================================== */}

        <Route
          path="/projects"
          element={
            <ProtectedRoute roles={['STUDENT']}>
              <BrowseProjectsPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/my-team"
          element={
            <ProtectedRoute roles={['STUDENT']}>
              <MyTeamPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/ideas"
          element={
            <ProtectedRoute roles={['STUDENT']}>
              <IdeasPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/what-to-do"
          element={
            <ProtectedRoute roles={['STUDENT']}>
              <WhatToDoPage />
            </ProtectedRoute>
          }
        />

      </Route>

      {/* =====================================================
          404
      ===================================================== */}

      <Route element={<PublicLayout />}>
        <Route
          path="*"
          element={<NotFoundPage />}
        />
      </Route>

    </Routes>
  </BrowserRouter>
);

export default App;