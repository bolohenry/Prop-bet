import { Routes, Route } from 'react-router-dom';
import AdminCreate from './pages/AdminCreate';
import AdminDashboard from './pages/AdminDashboard';
import ParticipantJoin from './pages/ParticipantJoin';
import ParticipantSurvey from './pages/ParticipantSurvey';
import ParticipantDashboard from './pages/ParticipantDashboard';
import Home from './pages/Home';

export default function App() {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/admin/create" element={<AdminCreate />} />
        <Route path="/admin/:adminCode" element={<AdminDashboard />} />
        <Route path="/i/:inviteCode" element={<ParticipantJoin />} />
        <Route path="/i/:inviteCode/survey" element={<ParticipantSurvey />} />
        <Route path="/i/:inviteCode/dashboard" element={<ParticipantDashboard />} />
      </Routes>
    </div>
  );
}
