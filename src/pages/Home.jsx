import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Home = () => {
  const { isAuthenticated } = useAuth();

  return (
    <div className="home-page">
      <header>
        <h1>AI Interview</h1>
        <p>AI 기반 실시간 반응형 인터뷰 시뮬레이터</p>
      </header>
      <main>
        <section className="hero">
          <h2>면접 준비를 시작하세요</h2>
          <p>GPT가 답변의 내용·톤·논리성을 평가해주는 웹 서비스</p>
          {isAuthenticated ? (
            <div className="action-buttons">
              <Link to="/interview" className="btn btn-primary">
                텍스트 면접 시작
              </Link>
              <Link to="/video-interview" className="btn btn-secondary">
                비디오 면접 시작
              </Link>
            </div>
          ) : (
            <div className="action-buttons">
              <Link to="/login" className="btn btn-primary">
                로그인
              </Link>
              <Link to="/signup" className="btn btn-secondary">
                회원가입
              </Link>
            </div>
          )}
        </section>
        <section className="features">
          <h3>주요 기능</h3>
          <div className="feature-grid">
            <div className="feature-card">
              <h4>다양한 직무 지원</h4>
              <p>20개 이상의 직무별 맞춤 면접 질문</p>
            </div>
            <div className="feature-card">
              <h4>AI 피드백</h4>
              <p>GPT를 활용한 자동 평가 및 개선 제안</p>
            </div>
            <div className="feature-card">
              <h4>면접 기록</h4>
              <p>모든 면접 기록 저장 및 통계 분석</p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Home;

