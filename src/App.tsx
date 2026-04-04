import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import SplashScreen from './pages/SplashScreen';
import RoleSelection from './pages/RoleSelection';
import Auth from './pages/Auth'; 
import Home from './pages/Home'; 
import Explore from './pages/Explore';
import Meetings from './pages/Meetings';
import ProDashboard from './pages/ProDashboard';
import ProBookings from './pages/ProBookings';
import ProDetails from './pages/ProDetails';
import BookingPage from './pages/BookingPage';
import CheckoutPage from './pages/CheckoutPage';
import UserMessages from './pages/UserMessages'; 
import ProMessages from './pages/ProMessages'; 

// Navigation component for standard users
import BottomNav from './components/BottomNav';

// 1. Protected Route Logic
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const userPhone = localStorage.getItem('sb_user_phone');
  if (!userPhone) return <Navigate to="/" replace />;
  return <>{children}</>;
};

function AnimatedRoutes() {
  const location = useLocation();
  const path = location.pathname;

  // Detect if a chat is actively open via URL parameter
  const isChatOpen = new URLSearchParams(location.search).has('chat');

  // 2. Navigation Switcher Logic
  // List only the exact root paths where the BottomNav should be visible
  const userPaths = ['/home', '/explore', '/meetings', '/messages'];
  
  // Show ONLY on the main tabs, and strictly hide if a chat is open or on other pages
  const showUserNav = userPaths.includes(path) && !isChatOpen;

  return (
    <div className="relative min-h-screen bg-[#0a0a0a] overflow-x-hidden">
      
      <AnimatePresence mode="popLayout">
        <Routes location={location} key={path}>
          
          {/* --- Public / Onboarding Routes --- */}
          <Route path="/" element={<SplashScreen />} />
          <Route path="/select-role" element={<RoleSelection />} />
          <Route path="/auth/:role" element={<Auth />} />
          
          {/* --- Protected Standard User Routes --- */}
          <Route 
            path="/home" 
            element={<ProtectedRoute><Home /></ProtectedRoute>} 
          />
          <Route 
            path="/explore" 
            element={<ProtectedRoute><Explore /></ProtectedRoute>} 
          />
          <Route 
            path="/meetings" 
            element={<ProtectedRoute><Meetings /></ProtectedRoute>} 
          />
          <Route 
            path="/messages" 
            element={<ProtectedRoute><UserMessages /></ProtectedRoute>} 
          />
          
          {/* Dynamic Pro Details Page */}
          <Route 
            path="/pro/:id" 
            element={<ProtectedRoute><ProDetails /></ProtectedRoute>} 
          />
          <Route 
            path="/book/:id" 
            element={<ProtectedRoute><BookingPage /></ProtectedRoute>} 
          /> 
          <Route 
            path="/checkout/:proId" 
            element={<ProtectedRoute><CheckoutPage /></ProtectedRoute>} 
          />

          {/* --- Protected Professional Routes --- */}
          <Route 
            path="/pro-dashboard" 
            element={
              <ProtectedRoute>
                <ProDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/pro-bookings" 
            element={
              <ProtectedRoute>
                <ProBookings />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/pro-messages" 
            element={
              <ProtectedRoute>
                <ProMessages />
              </ProtectedRoute>
            } 
          />

          {/* Fallback Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AnimatePresence>

      {/* 3. Conditional Navigation Rendering */}
      {showUserNav && <BottomNav />}
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <AnimatedRoutes />
    </Router>
  );
}