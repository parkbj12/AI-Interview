import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { interviewAPI } from '../api/api';

const Statistics = () => {
  const { user } = useAuth();
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalInterviews: 0,
    averageScore: 0,
    totalQuestions: 0,
  });

  useEffect(() => {
    loadStatistics();
  }, [user]);

  const loadStatistics = async () => {
    try {
      setLoading(true);
      let loadedInterviews = [];
      
      // 백엔드에서 면접 기록 로드 시도
      if (user) {
        try {
          const response = await interviewAPI.getAll();
          loadedInterviews = response.data || [];
        } catch (error) {
          console.warn('백엔드에서 면접 기록 로드 실패, 로컬 스토리지에서 로드:', error);
        }
      }
      
      // 백엔드에서 데이터를 가져오지 못한 경우 로컬 스토리지에서 로드
      if (loadedInterviews.length === 0) {
        const storedInterviews = localStorage.getItem('interviews');
        if (storedInterviews) {
          loadedInterviews = JSON.parse(storedInterviews);
        }
      }
      
      // 날짜순 정렬 (최신순)
      loadedInterviews.sort((a, b) => {
        const dateA = new Date(a.date || a.createdAt || 0);
        const dateB = new Date(b.date || b.createdAt || 0);
        return dateB - dateA;
      });
      
      setInterviews(loadedInterviews);
      
      const total = loadedInterviews.length;
      const avgScore = total > 0
        ? (loadedInterviews.reduce((sum, iv) => sum + (iv.score || 0), 0) / total).toFixed(1)
        : 0;
      const totalQ = loadedInterviews.reduce((sum, iv) => sum + (iv.questions?.length || 0), 0);

      setStats({
        totalInterviews: total,
        averageScore: avgScore,
        totalQuestions: totalQ,
      });
    } catch (error) {
      console.error('통계 로드 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '날짜 없음';
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getDifficultyLabel = (difficulty) => {
    const labels = {
      easy: '초급',
      medium: '중급',
      hard: '고급'
    };
    return labels[difficulty] || difficulty;
  };

  const getModeLabel = (mode) => {
    const labels = {
      practice: '연습 모드',
      real: '실전 모드',
      text: '텍스트 면접',
      video: '영상 면접'
    };
    return labels[mode] || mode || '일반';
  };

  return (
    <div className="statistics-page">
      <h1>면접 통계</h1>
      
      {/* 통계 카드 */}
      <div className="stats-grid">
        <div className="stat-card">
          <h3>총 면접 횟수</h3>
          <p className="stat-value">{stats.totalInterviews}</p>
        </div>
        <div className="stat-card">
          <h3>평균 점수</h3>
          <p className="stat-value">{stats.averageScore} / 10</p>
        </div>
        <div className="stat-card">
          <h3>총 답변한 질문</h3>
          <p className="stat-value">{stats.totalQuestions}</p>
        </div>
      </div>

      {/* 면접 기록 목록 */}
      <div className="interview-records-section" style={{ marginTop: '2rem' }}>
        <h2 style={{ marginBottom: '1rem' }}>면접 기록</h2>
        
        {loading ? (
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <p>로딩 중...</p>
          </div>
        ) : interviews.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '3rem',
            backgroundColor: 'var(--bg-secondary)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--text-secondary)'
          }}>
            <p style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>📝 아직 면접 기록이 없습니다</p>
            <Link to="/company-interview" className="btn btn-primary">
              첫 면접 시작하기
            </Link>
          </div>
        ) : (
          <div className="interview-list" style={{ 
            display: 'grid', 
            gap: '1rem',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))'
          }}>
            {interviews.map((interview) => (
              <div 
                key={interview.id || interview._id} 
                className="interview-item"
                style={{
                  backgroundColor: 'var(--bg-secondary)',
                  padding: '1.5rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-color)',
                  transition: 'all 0.2s ease',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'flex-start',
                  marginBottom: '1rem'
                }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600 }}>
                      {interview.companyName ? `${interview.companyName} - ` : ''}
                      {interview.job || '직무 미지정'}
                    </h3>
                    {interview.interviewType && (
                      <span style={{
                        display: 'inline-block',
                        marginTop: '0.25rem',
                        padding: '0.25rem 0.5rem',
                        backgroundColor: interview.interviewType === 'video' 
                          ? 'rgba(139, 92, 246, 0.1)' 
                          : 'rgba(99, 102, 241, 0.1)',
                        color: interview.interviewType === 'video' 
                          ? '#8b5cf6' 
                          : '#6366f1',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.75rem',
                        fontWeight: 500
                      }}>
                        {interview.interviewType === 'video' ? '🎥 영상' : '📝 텍스트'}
                      </span>
                    )}
                  </div>
                  <span style={{
                    fontSize: '1.5rem',
                    fontWeight: 'bold',
                    color: 'var(--primary-color)'
                  }}>
                    {interview.score !== undefined ? `${interview.score}/10` : '-'}
                  </span>
                </div>
                
                <div style={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: '0.5rem',
                  marginBottom: '1rem',
                  fontSize: '0.9rem',
                  color: 'var(--text-secondary)'
                }}>
                  <p style={{ margin: 0 }}>
                    📅 {formatDate(interview.date || interview.createdAt)}
                  </p>
                  {interview.difficulty && (
                    <p style={{ margin: 0 }}>
                      📊 난이도: {getDifficultyLabel(interview.difficulty)}
                    </p>
                  )}
                  {interview.mode && (
                    <p style={{ margin: 0 }}>
                      🎯 모드: {getModeLabel(interview.mode)}
                    </p>
                  )}
                  <p style={{ margin: 0 }}>
                    📝 질문 수: {interview.questions?.length || 0}개
                  </p>
                </div>
                
                <Link 
                  to={`/interview/${interview.id || interview._id}`} 
                  className="btn btn-primary"
                  style={{ 
                    width: '100%', 
                    textAlign: 'center',
                    padding: '0.75rem',
                    fontSize: '0.9rem'
                  }}
                >
                  상세 보기
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 액션 버튼 */}
      <div className="actions" style={{ marginTop: '2rem', display: 'flex', gap: '1rem', justifyContent: 'center' }}>
        <Link to="/mypage" className="btn btn-secondary">
          마이페이지로
        </Link>
        <Link to="/company-interview" className="btn btn-primary">
          새 면접 시작
        </Link>
      </div>
    </div>
  );
};

export default Statistics;

