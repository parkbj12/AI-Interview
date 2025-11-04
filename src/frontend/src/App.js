import React from "react";
import { Routes, Route, Link, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Home from "../pages/Home";
import Interview from "../pages/Interview";
import VideoInterview from "../pages/VideoInterview";
import Feedback from "../pages/Feedback";
import Login from "../pages/Login";
import Signup from "../pages/Signup";
import MyPage from "../pages/MyPage";
import Statistics from "../pages/Statistics";
import QuestionBank from "../pages/QuestionBank";
import Guide from "../pages/Guide";
import CustomQuestions from "../pages/CustomQuestions";
import InterviewDetail from "../pages/InterviewDetail";
import { LogIn, LogOut, User, Settings, BarChart3, BookOpen, HelpCircle, AlertCircle } from "lucide-react";

// 로그인 필요 라우트 보호 컴포넌트
function PrivateRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "400px"
      }}>
        <div style={{
          backgroundColor: "white",
          borderRadius: "16px",
          padding: "40px",
          textAlign: "center"
        }}>
          <p style={{ color: "#6b7280" }}>로딩 중...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "400px"
      }}>
        <div style={{
          backgroundColor: "white",
          borderRadius: "16px",
          padding: "40px",
          textAlign: "center",
          maxWidth: "500px"
        }}>
          <AlertCircle size={48} color="#f59e0b" style={{ marginBottom: "20px" }} />
          <h3 style={{ color: "#374151", marginBottom: "8px" }}>로그인이 필요합니다</h3>
          <p style={{ color: "#6b7280", marginBottom: "20px" }}>
            이 기능을 사용하려면 먼저 로그인해주세요.
          </p>
          <Link
            to="/login"
            style={{
              display: "inline-block",
              padding: "12px 24px",
              backgroundColor: "#3b82f6",
              color: "white",
              textDecoration: "none",
              borderRadius: "8px",
              fontWeight: "500"
            }}
          >
            로그인하러 가기
          </Link>
        </div>
      </div>
    );
  }

  return children;
}

function Header() {
  const { user, logout } = useAuth();
  const [hoveredItem, setHoveredItem] = React.useState(null);

  const navItemStyle = (item) => ({
    color: "white",
    textDecoration: "none",
    padding: "8px 16px",
    borderRadius: "6px",
    backgroundColor: hoveredItem === item ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.1)",
    transition: "all 0.3s ease",
    display: "flex",
    alignItems: "center",
    gap: "6px",
    fontSize: "14px",
    transform: hoveredItem === item ? "translateY(-2px)" : "translateY(0)",
    boxShadow: hoveredItem === item ? "0 4px 8px rgba(0,0,0,0.2)" : "none"
  });

  const buttonStyle = (item) => ({
    color: "white",
    padding: "8px 16px",
    borderRadius: "6px",
    backgroundColor: hoveredItem === item ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.1)",
    border: "none",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "6px",
    fontSize: "14px",
    transition: "all 0.3s ease",
    transform: hoveredItem === item ? "translateY(-2px)" : "translateY(0)",
    boxShadow: hoveredItem === item ? "0 4px 8px rgba(0,0,0,0.2)" : "none"
  });

  return (
    <header style={{ 
      marginBottom: 30,
      textAlign: "center"
    }}>
      <h1 style={{ 
        margin: 0, 
        color: "white",
        fontSize: "2.5rem",
        fontWeight: "700",
        textShadow: "0 2px 4px rgba(0,0,0,0.3)"
      }}>
        🎤 AI 모의면접
      </h1>
      <p style={{ 
        color: "rgba(255,255,255,0.9)",
        marginTop: "8px",
        fontSize: "1.1rem"
      }}>
        음성 인식과 AI 피드백으로 완벽한 면접 준비
      </p>
      <nav style={{ 
        marginTop: 20,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        gap: "20px",
        flexWrap: "wrap"
      }}>
        <Link 
          to="/" 
          style={navItemStyle("home")}
          onMouseEnter={() => setHoveredItem("home")}
          onMouseLeave={() => setHoveredItem(null)}
        >
          홈
        </Link>
        <Link
          to="/questions"
          style={navItemStyle("questions")}
          onMouseEnter={() => setHoveredItem("questions")}
          onMouseLeave={() => setHoveredItem(null)}
        >
          <BookOpen size={16} />
          질문 뱅크
        </Link>
        <Link
          to="/guide"
          style={navItemStyle("guide")}
          onMouseEnter={() => setHoveredItem("guide")}
          onMouseLeave={() => setHoveredItem(null)}
        >
          <HelpCircle size={16} />
          가이드
        </Link>
        
        {user ? (
          <>
            <Link
              to="/statistics"
              style={navItemStyle("statistics")}
              onMouseEnter={() => setHoveredItem("statistics")}
              onMouseLeave={() => setHoveredItem(null)}
            >
              <BarChart3 size={16} />
              통계
            </Link>
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              color: "white",
              padding: "8px 16px",
              borderRadius: "6px",
              backgroundColor: "rgba(255,255,255,0.1)"
            }}>
              <User size={16} />
              <span style={{ fontSize: "14px" }}>{user.name}님</span>
            </div>
            <Link
              to="/mypage"
              style={navItemStyle("mypage")}
              onMouseEnter={() => setHoveredItem("mypage")}
              onMouseLeave={() => setHoveredItem(null)}
            >
              <Settings size={16} />
              마이페이지
            </Link>
            <button
              onClick={logout}
              style={buttonStyle("logout")}
              onMouseEnter={() => setHoveredItem("logout")}
              onMouseLeave={() => setHoveredItem(null)}
            >
              <LogOut size={16} />
              로그아웃
            </button>
          </>
        ) : (
          <Link 
            to="/login" 
            style={navItemStyle("login")}
            onMouseEnter={() => setHoveredItem("login")}
            onMouseLeave={() => setHoveredItem(null)}
          >
            <LogIn size={16} />
            로그인
          </Link>
        )}
      </nav>
    </header>
  );
}

function AppContent() {
  return (
    <div style={{ 
      minHeight: "100vh",
      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif"
    }}>
      <div className="container" style={{ 
        padding: "20px",
        maxWidth: "1200px",
        margin: "0 auto"
      }}>
        <Header />

        <Routes>
          {/* 공개 페이지 */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/questions" element={<QuestionBank />} />
          <Route path="/guide" element={<Guide />} />
          <Route path="/custom-questions" element={<PrivateRoute><CustomQuestions /></PrivateRoute>} />
          
          {/* 로그인 필요 페이지 */}
          <Route path="/mypage" element={<PrivateRoute><MyPage /></PrivateRoute>} />
          <Route path="/statistics" element={<PrivateRoute><Statistics /></PrivateRoute>} />
          <Route path="/interview/:id" element={<PrivateRoute><InterviewDetail /></PrivateRoute>} />
          <Route path="/interview" element={<PrivateRoute><Interview /></PrivateRoute>} />
          <Route path="/video-interview" element={<PrivateRoute><VideoInterview /></PrivateRoute>} />
          <Route path="/feedback" element={<PrivateRoute><Feedback /></PrivateRoute>} />
        </Routes>
      </div>
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

