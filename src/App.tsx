import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { App as CapApp } from '@capacitor/app';
<<<<<<< HEAD

// --- PAGE IMPORTS ---
import SplashScreen from './pages/SplashScreen';
=======
import { SplashScreen } from '@capacitor/splash-screen';

// --- PAGE IMPORTS ---
import SplashScreenPage from './pages/SplashScreen';
>>>>>>> 156638f6e2bff6d51419cdd9fa8935ec56842993
import RoleSelection from './pages/RoleSelection';
import Auth from './pages/Auth'; 
import Home from './pages/Home'; 
import Explore from './pages/Explore';
import Meetings from './pages/Meetings';
import ProfileEdit from './pages/ProfileEdit';
import Notifications from './pages/Notifications'; 
import ProDashboard from './pages/ProDashboard';
import ProBookings from './pages/ProBookings';
import ProDetails from './pages/ProDetails';
import BookingPage from './pages/BookingPage';
import CheckoutPage from './pages/CheckoutPage';
import UserMessages from './pages/UserMessages'; 
import ProMessages from './pages/ProMessages'; 
import ProWallet from './pages/ProWallet';
import ProProfileEdit from './pages/ProProfileEdit';
import BottomNav from './components/BottomNav';

<<<<<<< HEAD
// --- 1. ROLE-BASED GUARDS ---
=======
// --- ROLE-BASED GUARDS ---
>>>>>>> 156638f6e2bff6d51419cdd9fa8935ec56842993
const UserRoute = ({ children }: { children: React.ReactNode }) => {
  const userPhone = localStorage.getItem('sb_user_phone');
  const role = localStorage.getItem('user_role');
  if (!userPhone) return <Navigate to="/select-role" replace />;
<<<<<<< HEAD
  if (role !== 'user') return <Navigate to="/pro-dashboard" replace />;
=======
  // If a pro tries to access user pages, send them back to their dashboard
  if (role === 'pro') return <Navigate to="/pro-dashboard" replace />;
>>>>>>> 156638f6e2bff6d51419cdd9fa8935ec56842993
  return <>{children}</>;
};

const ProRoute = ({ children }: { children: React.ReactNode }) => {
  const userPhone = localStorage.getItem('sb_user_phone');
  const role = localStorage.getItem('user_role');
  if (!userPhone) return <Navigate to="/select-role" replace />;
<<<<<<< HEAD
  if (role !== 'pro') return <Navigate to="/home" replace />;
=======
  // If a user tries to access pro pages, send them to user home
  if (role === 'user') return <Navigate to="/home" replace />;
>>>>>>> 156638f6e2bff6d51419cdd9fa8935ec56842993
  return <>{children}</>;
};

function AnimatedRoutes() {
  const location = useLocation();
  const path = location.pathname;
  const userRole = localStorage.getItem('user_role');
<<<<<<< HEAD

  // --- 2. GLOBAL ANDROID BACK BUTTON LOGIC ---
  useEffect(() => {
    const backListener = CapApp.addListener('backButton', ({ canGoBack }) => {
      const exitPaths = ['/home', '/pro-dashboard', '/select-role', '/'];
      
      if (exitPaths.includes(location.pathname)) {
        CapApp.exitApp();
      } 
      else if (
        location.pathname === '/profile-edit' || 
        location.pathname === '/pro-profile-edit' || 
        location.pathname.startsWith('/checkout/')
      ) {
        // These pages handle their own history state/traps internally
        return;
      } 
      else if (canGoBack) {
        window.history.back();
      }
    });

    return () => {
      backListener.then(l => l.remove());
    };
  }, [location.pathname]);

  // --- 3. BOTTOM NAV VISIBILITY ---
=======

  // --- GLOBAL ANDROID BACK BUTTON LOGIC ---
  useEffect(() => {
    const backListener = CapApp.addListener('backButton', ({ canGoBack }) => {
      // Pages that should close the app
      const exitPaths = ['/home', '/pro-dashboard', '/select-role', '/'];
      
      if (exitPaths.includes(location.pathname)) {
        CapApp.exitApp();
      } 
      else if (
        location.pathname === '/profile-edit' || 
        location.pathname === '/pro-profile-edit' || 
        location.pathname.startsWith('/checkout/')
      ) {
        // Allow these pages to handle their own navigation
        return;
      } 
      else {
        // Standard back behavior for all other pages (Booking, Details, etc)
        window.history.back();
      }
    });

    return () => {
      backListener.then(l => l.remove());
    };
  }, [location.pathname]);

  useEffect(() => {
    SplashScreen.hide();
  }, []);

>>>>>>> 156638f6e2bff6d51419cdd9fa8935ec56842993
  const isChatOpen = new URLSearchParams(location.search).has('chat');
  const userPaths = ['/home', '/explore', '/meetings', '/messages'];
  const showUserNav = userPaths.includes(path) && !isChatOpen && userRole === 'user';

  return (
    <div className="relative min-h-screen bg-[#0a0a0a] overflow-x-hidden font-sans">
      <AnimatePresence mode="popLayout">
        <Routes location={location} key={path}>
<<<<<<< HEAD
          
          {/* Entry & Auth */}
          <Route path="/" element={<SplashScreen />} />
          <Route path="/select-role" element={<RoleSelection />} />
          <Route path="/auth/:role" element={<Auth />} />
          
          {/* --- USER ONLY ROUTES --- */}
=======
          <Route path="/" element={<SplashScreenPage />} />
          <Route path="/select-role" element={<RoleSelection />} />
          <Route path="/auth/:role" element={<Auth />} />
          
          {/* USER ROUTES */}
>>>>>>> 156638f6e2bff6d51419cdd9fa8935ec56842993
          <Route path="/home" element={<UserRoute><Home /></UserRoute>} />
          <Route path="/explore" element={<UserRoute><Explore /></UserRoute>} />
          <Route path="/meetings" element={<UserRoute><Meetings /></UserRoute>} />
          <Route path="/messages" element={<UserRoute><UserMessages /></UserRoute>} />
          <Route path="/notifications" element={<UserRoute><Notifications /></UserRoute>} />
          <Route path="/pro/:id" element={<UserRoute><ProDetails /></UserRoute>} />
          <Route path="/book/:id" element={<UserRoute><BookingPage /></UserRoute>} /> 
          <Route path="/checkout/:proId" element={<UserRoute><CheckoutPage /></UserRoute>} />
          <Route path="/profile-edit" element={<UserRoute><ProfileEdit /></UserRoute>} />

<<<<<<< HEAD
          {/* --- PRO ONLY ROUTES --- */}
=======
          {/* PRO ROUTES */}
>>>>>>> 156638f6e2bff6d51419cdd9fa8935ec56842993
          <Route path="/pro-dashboard" element={<ProRoute><ProDashboard /></ProRoute>} />
          <Route path="/pro-bookings" element={<ProRoute><ProBookings /></ProRoute>} />
          <Route path="/pro-messages" element={<ProRoute><ProMessages /></ProRoute>} />
          <Route path="/wallet" element={<ProRoute><ProWallet /></ProRoute>} />
          <Route path="/pro-profile-edit" element={<ProRoute><ProProfileEdit /></ProRoute>} />

<<<<<<< HEAD
          {/* Fallback */}
=======
>>>>>>> 156638f6e2bff6d51419cdd9fa8935ec56842993
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AnimatePresence>

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
