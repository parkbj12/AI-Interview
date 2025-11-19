import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { questionAPI } from '../api/api';

const CompanyInterview = () => {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [companyName, setCompanyName] = useState('');
  const [job, setJob] = useState('');
  const [difficulty, setDifficulty] = useState('medium');
  const [questionCount, setQuestionCount] = useState(5);
  const [interviewMode, setInterviewMode] = useState('text'); // 'text' 또는 'video'
  const [practiceMode, setPracticeMode] = useState('practice'); // 'practice' 또는 'real'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [generatedQuestions, setGeneratedQuestions] = useState([]);
  const questionsSectionRef = useRef(null);

  // 로그인 체크는 렌더링 단계에서 처리

  const handleGenerate = async () => {
    // 로그인 체크
    if (!isAuthenticated) {
      setError('로그인이 필요합니다. 먼저 로그인해주세요.');
      navigate('/login', { state: { from: '/company-interview' } });
      return;
    }
    if (!companyName.trim()) {
      setError('기업명을 입력해주세요.');
      return;
    }
    
    if (!job.trim()) {
      setError('직무를 입력해주세요.');
      return;
    }
    
    if (questionCount < 1 || questionCount > 20) {
      setError('질문 수는 1개 이상 20개 이하여야 합니다.');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const response = await questionAPI.generateQuestions(
        companyName,
        job.trim(),
        difficulty,
        questionCount
      );
      setGeneratedQuestions(response.data.questions);
      
      // 질문 생성 후 생성된 질문 섹션으로 스크롤
      setTimeout(() => {
        if (questionsSectionRef.current) {
          questionsSectionRef.current.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start' 
          });
        }
      }, 100);
    } catch (err) {
      console.error('질문 생성 오류:', err);
      if (err.code === 'ERR_NETWORK' || err.code === 'ECONNREFUSED') {
        setError('백엔드 서버에 연결할 수 없습니다. 서버가 실행 중인지 확인해주세요.');
      } else if (err.code === 'ECONNABORTED') {
        setError('질문 생성 시간이 초과되었습니다. 잠시 후 다시 시도해주세요.');
      } else if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else if (err.message) {
        setError(`질문 생성에 실패했습니다: ${err.message}`);
      } else {
        setError('질문 생성에 실패했습니다. 잠시 후 다시 시도해주세요.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleStartInterview = () => {
    if (generatedQuestions.length === 0) {
      setError('먼저 질문을 생성해주세요.');
      return;
    }
    
    const interviewData = {
      questions: generatedQuestions.map((q, i) => ({ text: q, id: i + 1 })),
      job: job.trim(),
      difficulty,
      mode: practiceMode, // 연습 모드 또는 실전 모드
      companyName,
    };
    
    // 선택한 모드에 따라 다른 페이지로 이동
    if (interviewMode === 'video') {
      navigate('/video-interview', { state: interviewData });
    } else {
      navigate('/interview', { state: interviewData });
    }
  };

  // 로그인하지 않은 경우 안내 메시지 표시
  if (authLoading) {
    return (
      <div className="company-interview-page">
        <div className="company-interview-container">
          <div style={{ textAlign: 'center', padding: '3rem' }}>
            <p>로딩 중...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="company-interview-page">
        <div className="company-interview-container">
          <div style={{ 
            textAlign: 'center', 
            padding: '3rem',
            backgroundColor: 'var(--bg-secondary)',
            borderRadius: 'var(--radius-lg)',
            border: '2px solid var(--border-color)'
          }}>
            <h1 style={{ marginBottom: '1rem', color: 'var(--text-primary)' }}>
              🔒 로그인이 필요합니다
            </h1>
            <p style={{ marginBottom: '2rem', color: 'var(--text-secondary)', fontSize: '1.1rem' }}>
              이 기능을 사용하려면 로그인이 필요합니다.<br />
              로그인 후 다시 시도해주세요.
            </p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button 
                onClick={() => navigate('/login', { state: { from: '/company-interview' } })}
                className="btn btn-primary"
              >
                로그인하기
              </button>
              <button 
                onClick={() => navigate('/signup')}
                className="btn btn-secondary"
              >
                회원가입하기
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="company-interview-page">
      <div className="company-interview-container">
        <h1>기업별 맞춤 면접 질문 생성</h1>
        <p className="subtitle">
          OpenAI를 활용하여 특정 기업과 직무에 맞는 면접 질문을 생성합니다
        </p>

        <div className="form-section">
          <div className="form-group">
            <label htmlFor="company-name">기업명 *</label>
            <input
              type="text"
              id="company-name"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="예: 네이버, 카카오, 삼성전자 등"
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="job">직무 *</label>
            <input
              type="text"
              id="job"
              value={job}
              onChange={(e) => setJob(e.target.value)}
              placeholder="직무를 입력하세요 (예: 프론트엔드 개발자, 백엔드 개발자 등)"
              disabled={loading}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="difficulty">난이도</label>
            <select
              id="difficulty"
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
              disabled={loading}
            >
              <option value="easy">초급 (신입 수준)</option>
              <option value="medium">중급 (경력 2-5년 수준)</option>
              <option value="hard">고급 (시니어 수준)</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="question-count">질문 개수</label>
            <input
              type="number"
              id="question-count"
              min="1"
              max="20"
              value={questionCount}
              onChange={(e) => setQuestionCount(parseInt(e.target.value) || 1)}
              disabled={loading}
            />
            <small>1개 이상 20개 이하</small>
          </div>

          <div className="form-group">
            <label htmlFor="interview-mode">면접 방식</label>
            <div className="mode-selector" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.5rem' }}>
              <label style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.75rem', 
                cursor: 'pointer',
                padding: '1rem',
                border: `2px solid ${interviewMode === 'text' ? 'var(--primary-color)' : 'var(--border-color)'}`,
                borderRadius: 'var(--radius-md)',
                backgroundColor: interviewMode === 'text' ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
                transition: 'all 0.2s ease',
                width: '100%'
              }}>
                <input
                  type="radio"
                  id="mode-text"
                  name="interview-mode"
                  value="text"
                  checked={interviewMode === 'text'}
                  onChange={(e) => setInterviewMode(e.target.value)}
                  disabled={loading}
                  style={{ margin: 0, width: '18px', height: '18px' }}
                />
                <span style={{ fontSize: '1.3rem' }}>📝</span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', flex: 1 }}>
                  <span style={{ fontWeight: interviewMode === 'text' ? 600 : 500, fontSize: '1rem' }}>텍스트 면접</span>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>텍스트로 답변을 작성하는 면접 모드</span>
                </div>
              </label>
              <label style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.75rem', 
                cursor: 'pointer',
                padding: '1rem',
                border: `2px solid ${interviewMode === 'video' ? 'var(--primary-color)' : 'var(--border-color)'}`,
                borderRadius: 'var(--radius-md)',
                backgroundColor: interviewMode === 'video' ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
                transition: 'all 0.2s ease',
                width: '100%'
              }}>
                <input
                  type="radio"
                  id="mode-video"
                  name="interview-mode"
                  value="video"
                  checked={interviewMode === 'video'}
                  onChange={(e) => setInterviewMode(e.target.value)}
                  disabled={loading}
                  style={{ margin: 0, width: '18px', height: '18px' }}
                />
                <span style={{ fontSize: '1.3rem' }}>🎥</span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', flex: 1 }}>
                  <span style={{ fontWeight: interviewMode === 'video' ? 600 : 500, fontSize: '1rem' }}>영상 면접</span>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>영상 녹화로 답변을 진행하는 면접 모드</span>
                </div>
              </label>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="practice-mode">면접 모드</label>
            <div className="mode-selector" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.5rem' }}>
              <label style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.75rem', 
                cursor: 'pointer',
                padding: '1rem',
                border: `2px solid ${practiceMode === 'practice' ? 'var(--primary-color)' : 'var(--border-color)'}`,
                borderRadius: 'var(--radius-md)',
                backgroundColor: practiceMode === 'practice' ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
                transition: 'all 0.2s ease',
                width: '100%'
              }}>
                <input
                  type="radio"
                  id="practice-mode"
                  name="practice-mode"
                  value="practice"
                  checked={practiceMode === 'practice'}
                  onChange={(e) => setPracticeMode(e.target.value)}
                  disabled={loading}
                  style={{ margin: 0, width: '18px', height: '18px' }}
                />
                <span style={{ fontSize: '1.3rem' }}>📚</span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', flex: 1 }}>
                  <span style={{ fontWeight: practiceMode === 'practice' ? 600 : 500, fontSize: '1rem' }}>연습 모드</span>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>시간 제한 없이 자유롭게 답변할 수 있습니다</span>
                </div>
              </label>
              <label style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.75rem', 
                cursor: 'pointer',
                padding: '1rem',
                border: `2px solid ${practiceMode === 'real' ? 'var(--primary-color)' : 'var(--border-color)'}`,
                borderRadius: 'var(--radius-md)',
                backgroundColor: practiceMode === 'real' ? 'rgba(239, 68, 68, 0.1)' : 'transparent',
                transition: 'all 0.2s ease',
                width: '100%'
              }}>
                <input
                  type="radio"
                  id="real-mode"
                  name="practice-mode"
                  value="real"
                  checked={practiceMode === 'real'}
                  onChange={(e) => setPracticeMode(e.target.value)}
                  disabled={loading}
                  style={{ margin: 0, width: '18px', height: '18px' }}
                />
                <span style={{ fontSize: '1.3rem' }}>⚡</span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', flex: 1 }}>
                  <span style={{ fontWeight: practiceMode === 'real' ? 600 : 500, fontSize: '1rem' }}>실전 모드</span>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>질문당 3분 시간 제한이 있으며, 시간 종료 시 자동으로 다음 질문으로 이동합니다</span>
                </div>
              </label>
            </div>
          </div>

          {error && (
            <div className="error-message">
              <strong>⚠️ 오류 발생</strong>
              <p>{error}</p>
              <small>브라우저 콘솔(F12)에서 더 자세한 오류 정보를 확인할 수 있습니다.</small>
            </div>
          )}

          <button
            onClick={handleGenerate}
            className="btn btn-primary"
            disabled={loading || !companyName.trim() || !job.trim()}
          >
            {loading ? '질문 생성 중...' : '질문 생성하기'}
          </button>
        </div>

        {generatedQuestions.length > 0 && (
          <div className="questions-section" ref={questionsSectionRef}>
            <div className="questions-header">
              <h2>
                {companyName} - {job} 면접 질문 ({generatedQuestions.length}개)
              </h2>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ 
                  padding: '0.5rem 1rem', 
                  backgroundColor: interviewMode === 'text' ? 'rgba(99, 102, 241, 0.1)' : 'rgba(139, 92, 246, 0.1)',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.9rem',
                  color: 'var(--text-primary)'
                }}>
                  {interviewMode === 'text' ? '📝 텍스트 모드' : '🎥 영상 모드'}
                </div>
                <div style={{ 
                  padding: '0.5rem 1rem', 
                  backgroundColor: practiceMode === 'real' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(99, 102, 241, 0.1)',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.9rem',
                  color: practiceMode === 'real' ? '#ef4444' : 'var(--text-primary)',
                  fontWeight: practiceMode === 'real' ? 600 : 400
                }}>
                  {practiceMode === 'real' ? '⚡ 실전 모드 (3분 제한)' : '📚 연습 모드'}
                </div>
                <button onClick={handleStartInterview} className="btn btn-primary">
                  이 질문으로 면접 시작하기
                </button>
                <button 
                  onClick={handleGenerate} 
                  className="btn btn-secondary"
                  disabled={loading || !companyName.trim() || !job.trim()}
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '0.5rem' 
                  }}
                >
                  {loading ? (
                    <>
                      <span>⏳</span>
                      <span>생성 중...</span>
                    </>
                  ) : (
                    <>
                      <span>다시 생성하기</span>
                    </>
                  )}
                </button>
              </div>
            </div>
            <div className="questions-list">
              {generatedQuestions.map((question, index) => (
                <div key={index} className="question-item">
                  <span className="question-number">{index + 1}</span>
                  <p className="question-text">{question}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {loading && (
          <div className="loading-overlay">
            <div className="loading-spinner"></div>
            <p>AI가 맞춤형 질문을 생성하고 있습니다...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CompanyInterview;

