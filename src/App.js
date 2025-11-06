import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Interview from './pages/Interview';
import VideoInterview from './pages/VideoInterview';
import CompanyInterview from './pages/CompanyInterview';
import Feedback from './pages/Feedback';
import MyPage from './pages/MyPage';
import Statistics from './pages/Statistics';
import CustomQuestions from './pages/CustomQuestions';
import CommunityCreate from './pages/CommunityCreate';
import CommunityDetail from './pages/CommunityDetail';
import InterviewDetail from './pages/InterviewDetail';
import Guide from './pages/Guide';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/interview" element={<Interview />} />
          <Route path="/video-interview" element={<VideoInterview />} />
          <Route path="/company-interview" element={<CompanyInterview />} />
          <Route path="/feedback" element={<Feedback />} />
          <Route path="/mypage" element={<MyPage />} />
          <Route path="/statistics" element={<Statistics />} />
          <Route path="/custom-questions" element={<CustomQuestions />} />
          <Route path="/community/create" element={<CommunityCreate />} />
          <Route path="/community/:id" element={<CommunityDetail />} />
          <Route path="/interview/:id" element={<InterviewDetail />} />
          <Route path="/guide" element={<Guide />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;

