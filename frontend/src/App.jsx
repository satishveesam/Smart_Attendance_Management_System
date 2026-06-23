import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import ProtectedRoute from './routes/ProtectedRoute';

// Pages
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import AdminEmployees from './pages/AdminEmployees';
import AdminAttendance from './pages/AdminAttendance';
import AdminReports from './pages/AdminReports';
import EmployeeDashboard from './pages/EmployeeDashboard';
import EmployeeAttendance from './pages/EmployeeAttendance';
import EmployeeHistory from './pages/EmployeeHistory';
import EmployeeProfile from './pages/EmployeeProfile';
import EmployeeLeaves from './pages/EmployeeLeaves';
import AdminLeaves from './pages/AdminLeaves';
import AdminBroadcasts from './pages/AdminBroadcasts';
import EmployeeApprovals from './pages/EmployeeApprovals';
import EmployeeAttendanceSummary from './pages/EmployeeAttendanceSummary';
import EmployeeAttendanceDetail from './pages/EmployeeAttendanceDetail';
import EmployeeSettings from './pages/EmployeeSettings';

// Styles
import './App.css';

const HomeRedirect = () => {
  const { isAuthenticated, user } = useSelector((state) => state.auth);

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role === 'ROLE_ADMIN') {
    return <Navigate to="/admin/dashboard" replace />;
  }

  if (user.role === 'ROLE_EMPLOYEE') {
    return <Navigate to="/employee/dashboard" replace />;
  }

  return <Navigate to="/login" replace />;
};

function App() {
  return (
    <Router>
      <Routes>
        {/* Guest Routes */}
        <Route path="/login" element={<Login />} />

        {/* Admin Protected Routes */}
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute allowedRoles={['ROLE_ADMIN']}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/employees"
          element={
            <ProtectedRoute allowedRoles={['ROLE_ADMIN']}>
              <AdminEmployees />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/attendance"
          element={
            <ProtectedRoute allowedRoles={['ROLE_ADMIN']}>
              <AdminAttendance />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/reports"
          element={
            <ProtectedRoute allowedRoles={['ROLE_ADMIN']}>
              <AdminReports />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/leaves"
          element={
            <ProtectedRoute allowedRoles={['ROLE_ADMIN']}>
              <AdminLeaves />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/broadcasts"
          element={
            <ProtectedRoute allowedRoles={['ROLE_ADMIN']}>
              <AdminBroadcasts />
            </ProtectedRoute>
          }
        />

        {/* Employee Protected Routes */}
        <Route
          path="/employee/dashboard"
          element={
            <ProtectedRoute allowedRoles={['ROLE_EMPLOYEE', 'ROLE_ADMIN']}>
              <EmployeeDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/employee/attendance"
          element={
            <ProtectedRoute allowedRoles={['ROLE_EMPLOYEE', 'ROLE_ADMIN']}>
              <EmployeeAttendanceSummary />
            </ProtectedRoute>
          }
        />
        <Route
          path="/employee/attendance/mark"
          element={
            <ProtectedRoute allowedRoles={['ROLE_EMPLOYEE', 'ROLE_ADMIN']}>
              <EmployeeAttendance />
            </ProtectedRoute>
          }
        />
        <Route
          path="/employee/attendance-detail/:date"
          element={
            <ProtectedRoute allowedRoles={['ROLE_EMPLOYEE', 'ROLE_ADMIN']}>
              <EmployeeAttendanceDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/employee/settings"
          element={
            <ProtectedRoute allowedRoles={['ROLE_EMPLOYEE', 'ROLE_ADMIN']}>
              <EmployeeSettings />
            </ProtectedRoute>
          }
        />
        <Route
          path="/employee/history"
          element={
            <ProtectedRoute allowedRoles={['ROLE_EMPLOYEE', 'ROLE_ADMIN']}>
              <EmployeeHistory />
            </ProtectedRoute>
          }
        />
        <Route
          path="/employee/profile"
          element={
            <ProtectedRoute allowedRoles={['ROLE_EMPLOYEE', 'ROLE_ADMIN']}>
              <EmployeeProfile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/employee/leaves"
          element={
            <ProtectedRoute allowedRoles={['ROLE_EMPLOYEE', 'ROLE_ADMIN']}>
              <EmployeeLeaves />
            </ProtectedRoute>
          }
        />
        <Route
          path="/employee/approvals"
          element={
            <ProtectedRoute allowedRoles={['ROLE_EMPLOYEE', 'ROLE_ADMIN']}>
              <EmployeeApprovals />
            </ProtectedRoute>
          }
        />

        {/* Root Redirect Route */}
        <Route path="/" element={<HomeRedirect />} />
        
        {/* Wildcard Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
