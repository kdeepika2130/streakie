import { Routes, Route, useLocation } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import HabitCircles from './pages/HabitCircles';
import HabitMap from './components/map/HabitMap';
import NotFound from './pages/NotFound';
import ChatBot from './pages/ChatBot';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import { useAuth } from './context/useAuth';

function App() {
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const authExcludedRoutes = ["/login", "/signup"];

  return (
    <>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/circles" element={<HabitCircles />} />
          <Route path="/map" element={<HabitMap />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>

      {isAuthenticated && !authExcludedRoutes.includes(location.pathname) && <ChatBot />}
    </>
  );
}

export default App;
