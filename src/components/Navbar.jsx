import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-logo">
          AI Interview
        </Link>
        <div className="navbar-menu">
          {isAuthenticated ? (
            <>
              <Link to="/company-interview" className="navbar-link">
                AI 질문 생성
              </Link>
              <Link to="/statistics" className="navbar-link">
                통계
              </Link>
              <Link to="/custom-questions" className="navbar-link">
                커뮤니티
              </Link>
              <Link to="/guide" className="navbar-link">
                가이드
              </Link>
              <Link to="/mypage" className="navbar-user-link">
                <span className="navbar-user">{user?.name}님</span>
              </Link>
              <button onClick={handleLogout} className="btn btn-secondary">
                로그아웃
              </button>
            </>
          ) : (
            <>
              <Link to="/company-interview" className="navbar-link">
                기업별 질문 생성
              </Link>
              <Link to="/guide" className="navbar-link">
                가이드
              </Link>
              <Link to="/login" className="btn btn-primary">
                로그인
              </Link>
              <Link to="/signup" className="btn btn-secondary">
                회원가입
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

