import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { interviewAPI } from '../api/api';
import QuestionList from '../components/QuestionList';

const InterviewDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [interview, setInterview] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadInterviewDetail();
  }, [id, user]);

  const loadInterviewDetail = async () => {
    try {
      setLoading(true);
      let found = null;
      
      // 백엔드에서 면접 기록 로드 시도
      if (user) {
        try {
          const response = await interviewAPI.getById(id);
          found = response.data;
          // id 필드 확실히 설정
          if (found && found._id && !found.id) {
            found.id = found._id.toString();
          }
        } catch (error) {
          // 404는 정상적인 상황 (로컬 스토리지에만 있는 데이터)
          // 500 에러만 경고 로그 출력
          if (error.response?.status !== 404) {
            console.warn('백엔드에서 면접 기록 로드 실패, 로컬 스토리지에서 로드:', error);
          }
        }
      }
      
      // 백엔드에서 데이터를 가져오지 못한 경우 로컬 스토리지에서 로드
      if (!found) {
        const storedInterviews = localStorage.getItem('interviews');
        if (storedInterviews) {
          const interviews = JSON.parse(storedInterviews);
          found = interviews.find((iv) => iv.id === id || iv._id === id);
        }
      }
      
      if (!found) {
        console.warn('면접 기록을 찾을 수 없습니다. ID:', id);
        console.log('로컬 스토리지 면접 기록:', localStorage.getItem('interviews'));
      }
      
      setInterview(found);
    } catch (error) {
      console.error('면접 상세 로드 오류:', error);
    } finally {
      setLoading(false);
    }
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

  if (loading) {
    return <div className="interview-detail">로딩 중...</div>;
  }

  if (!interview) {
    return (
      <div className="interview-detail">
        <p>면접 기록을 찾을 수 없습니다.</p>
        <Link to="/mypage">마이페이지로</Link>
      </div>
    );
  }

  return (
    <div className="interview-detail">
      <header style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '2rem',
        paddingBottom: '1rem',
        borderBottom: '2px solid var(--border-color)'
      }}>
        <h1 style={{ margin: 0 }}>면접 상세</h1>
        <Link to="/mypage" className="btn btn-secondary">
          목록으로
        </Link>
      </header>
      
      <div className="interview-info" style={{
        backgroundColor: 'var(--bg-secondary)',
        padding: '2rem',
        borderRadius: 'var(--radius-md)',
        marginBottom: '2rem',
        border: '1px solid var(--border-color)'
      }}>
        <h2 style={{ marginTop: 0, marginBottom: '1rem', fontSize: '1.5rem' }}>
          {interview.companyName ? `${interview.companyName} - ` : ''}
          {interview.job || '직무 미지정'}
        </h2>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1rem',
          marginTop: '1.5rem'
        }}>
          <div>
            <strong style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>📅 날짜</strong>
            <p style={{ margin: '0.5rem 0 0 0', fontSize: '1rem' }}>
              {formatDate(interview.date || interview.createdAt)}
            </p>
          </div>
          
          {interview.difficulty && (
            <div>
              <strong style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>📊 난이도</strong>
              <p style={{ margin: '0.5rem 0 0 0', fontSize: '1rem' }}>
                {getDifficultyLabel(interview.difficulty)}
              </p>
            </div>
          )}
          
          {interview.mode && (
            <div>
              <strong style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>🎯 모드</strong>
              <p style={{ margin: '0.5rem 0 0 0', fontSize: '1rem' }}>
                {getModeLabel(interview.mode)}
              </p>
            </div>
          )}
          
          {interview.interviewType && (
            <div>
              <strong style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>📝 면접 타입</strong>
              <p style={{ margin: '0.5rem 0 0 0', fontSize: '1rem' }}>
                {interview.interviewType === 'video' ? '🎥 영상 면접' : '📝 텍스트 면접'}
              </p>
            </div>
          )}
          
          {interview.score !== undefined && (
            <div>
              <strong style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>⭐ 점수</strong>
              <p style={{ margin: '0.5rem 0 0 0', fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--primary-color)' }}>
                {interview.score}/10
              </p>
            </div>
          )}
        </div>
      </div>
      
      <QuestionList
        questions={interview.questions || []}
        answers={interview.answers || []}
        feedbacks={interview.feedbacks || []}
      />
    </div>
  );
};

export default InterviewDetail;

