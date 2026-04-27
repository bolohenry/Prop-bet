import { Routes, Route, useLocation } from 'react-router-dom';
import { Toaster } from 'sonner';
import TopBanner from './components/TopBanner';
import ErrorBoundary from './components/ErrorBoundary';
import AdminCreate from './pages/AdminCreate';
import AdminDashboard from './pages/AdminDashboard';
import ParticipantJoin from './pages/ParticipantJoin';
import ParticipantSurvey from './pages/ParticipantSurvey';
import ParticipantDashboard from './pages/ParticipantDashboard';
import ParticipantRecap from './pages/ParticipantRecap';
import Home from './pages/Home';
import About from './pages/About';
import NotFound from './pages/NotFound';

const HIDE_BANNER_PATTERNS = ['/', '/about', '/admin/create'];
function shouldShowBanner(pathname) {
  if (HIDE_BANNER_PATTERNS.includes(pathname)) return false;
  if (/^\/i\/[^/]+$/.test(pathname)) return false;
  return true;
}

export default function App() {
  const { pathname } = useLocation();
  const showBanner = shouldShowBanner(pathname);

  return (
    <ErrorBoundary>
      <Toaster position="bottom-right" richColors closeButton />
      <div className="min-h-screen bg-gray-50 text-gray-900 flex flex-col">
        {showBanner && <TopBanner />}
        <div className="flex-1 flex flex-col">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/admin/create" element={<AdminCreate />} />
            <Route path="/admin/:adminCode" element={<AdminDashboard />} />
            <Route path="/i/:inviteCode" element={<ParticipantJoin />} />
            <Route path="/i/:inviteCode/survey" element={<ParticipantSurvey />} />
            <Route path="/i/:inviteCode/dashboard" element={<ParticipantDashboard />} />
            <Route path="/i/:inviteCode/recap" element={<ParticipantRecap />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>
      </div>
    </ErrorBoundary>
  );
}
