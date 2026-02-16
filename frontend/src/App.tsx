import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import Missions from './pages/Missions';
import MissionPlanning from './pages/MissionPlanning';
import MissionMonitor from './pages/MissionMonitor';
import Reports from './pages/Reports';
import TeamManagement from './pages/TeamManagement';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import { useMissions } from './hooks/useMissions';
import { AnimatePresence } from 'framer-motion';
import { Toaster } from "@/components/ui/toaster"
import PageTransition from '@/components/layout/PageTransition';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import Navbar from './components/landing/Navbar';

function AppContent() {
  useMissions();
  const location = useLocation();

  return (
    <div className="min-h-screen bg-[#050505] text-white selection:bg-blue-500/30 selection:text-blue-200">
      <Navbar />

      <div className="pt-16">
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            {/* Public Routes */}
            <Route path="/" element={<PageTransition><Landing /></PageTransition>} />
            <Route path="/login" element={<PageTransition><Login /></PageTransition>} />
            <Route path="/register" element={<PageTransition><Register /></PageTransition>} />

            {/* Protected Routes */}
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <PageTransition><Dashboard /></PageTransition>
              </ProtectedRoute>
            } />
            <Route path="/team" element={
              <ProtectedRoute>
                <PageTransition><TeamManagement /></PageTransition>
              </ProtectedRoute>
            } />
            <Route path="/missions" element={
              <ProtectedRoute>
                <PageTransition><Missions /></PageTransition>
              </ProtectedRoute>
            } />
            <Route path="/missions/plan" element={
              <ProtectedRoute>
                <PageTransition><MissionPlanning /></PageTransition>
              </ProtectedRoute>
            } />
            <Route path="/missions/:id/monitor" element={
              <ProtectedRoute>
                <PageTransition><MissionMonitor /></PageTransition>
              </ProtectedRoute>
            } />
            <Route path="/reports" element={
              <ProtectedRoute>
                <PageTransition><Reports /></PageTransition>
              </ProtectedRoute>
            } />
            
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AnimatePresence>
      </div>
      <Toaster />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
