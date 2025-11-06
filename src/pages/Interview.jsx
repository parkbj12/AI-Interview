import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import QuestionList from '../components/QuestionList';
import { getQuestionsByJob } from '../data/interviewQuestions';

const Interview = () => {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  
  // location.state에서 전달된 질문이 있으면 사용
  const preloadedData = location.state || {};
  
  const [job, setJob] = useState(preloadedData.job || '');
  const [difficulty, setDifficulty] = useState(preloadedData.difficulty || 'medium');
  const [mode, setMode] = useState(preloadedData.mode || 'practice');
  const [companyName, setCompanyName] = useState(preloadedData.companyName || '');
  const [questionCount, setQuestionCount] = useState(preloadedData.questions?.length || 5);
  const [questions, setQuestions] = useState(preloadedData.questions || []);
  const [answers, setAnswers] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isStarted, setIsStarted] = useState(!!preloadedData.questions?.length);
  const [timeLeft, setTimeLeft] = useState(null); // 실전 모드 시간 제한 (초)
  const timerRef = useRef(null);
  
  // 로그인 체크는 렌더링 단계에서 처리
  
  // 디버깅용: 모드와 시작 상태 확인
  useEffect(() => {
    console.log('📊 면접 상태:', { mode, isStarted, timeLeft, currentQuestionIndex });
  }, [mode, isStarted, timeLeft, currentQuestionIndex]);

  useEffect(() => {
    if (preloadedData.questions?.length) {
      setAnswers(Array(preloadedData.questions.length).fill(''));
    }
  }, [preloadedData.questions]);

  // 실전 모드 시간 제한 설정 및 타이머 시작
  useEffect(() => {
    if (isStarted && mode === 'real' && timeLeft === null) {
      // 실전 모드: 질문당 3분 (180초)
      console.log('⏱️ 실전 모드 타이머 시작:', mode, isStarted);
      setTimeLeft(180);
    } else if (mode !== 'real') {
      // 연습 모드일 때는 타이머 초기화
      setTimeLeft(null);
    }
  }, [isStarted, mode]);

  const handleAutoNext = useCallback(() => {
    // 현재 답변 자동 저장
    const currentAnswer = answers[currentQuestionIndex] || '';
    if (currentAnswer.trim()) {
      const newAnswers = [...answers];
      newAnswers[currentQuestionIndex] = currentAnswer;
      setAnswers(newAnswers);
    }

    // 다음 질문으로 이동
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      // 마지막 질문이면 면접 완료
      navigate('/feedback', {
        state: { questions, answers, job, difficulty, mode, companyName },
      });
    }
  }, [currentQuestionIndex, answers, questions, navigate, job, difficulty, mode, companyName]);

  // 타이머 동작
  useEffect(() => {
    // 기존 타이머 정리
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    if (mode === 'real' && isStarted && timeLeft !== null && timeLeft > 0) {
      console.log('⏱️ 타이머 시작:', timeLeft);
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev === null || prev <= 1) {
            console.log('⏱️ 시간 종료, 다음 질문으로 이동');
            // 기존 타이머 정리
            if (timerRef.current) {
              clearInterval(timerRef.current);
              timerRef.current = null;
            }
            // 시간 종료 시 자동으로 다음 질문으로 이동
            handleAutoNext();
            return null; // 타이머 리셋
          }
          return prev - 1;
        });
      }, 1000);
    }
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [mode, isStarted, timeLeft, handleAutoNext]);

  // 질문이 변경될 때마다 타이머 리셋
  useEffect(() => {
    if (mode === 'real' && isStarted) {
      // 새 질문으로 이동할 때 타이머 리셋
      setTimeLeft(180); // 새 질문마다 3분 리셋
    }
  }, [currentQuestionIndex, mode, isStarted]);


  const startInterview = () => {
    // 직무별 실제 면접 질문 가져오기
    const jobQuestions = getQuestionsByJob(job, 10); // 항상 10개 모두 가져오기
    
    // 요청한 질문 개수만큼 샘플링 (더 나은 랜덤 선택)
    let finalQuestions;
    if (jobQuestions.length > questionCount) {
      // Fisher-Yates 셔플 알고리즘 사용 (더 나은 랜덤성)
      const shuffled = [...jobQuestions];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      // 시간 기반 추가 랜덤성
      const timeSeed = Date.now() % shuffled.length;
      const rotated = [...shuffled.slice(timeSeed), ...shuffled.slice(0, timeSeed)];
      finalQuestions = rotated.slice(0, questionCount);
    } else {
      finalQuestions = jobQuestions;
    }
    
    setQuestions(finalQuestions);
    setAnswers(Array(finalQuestions.length).fill(''));
    setIsStarted(true);
  };

  const handleAnswerChange = (index, value) => {
    // 500자 제한
    if (value.length <= 500) {
      const newAnswers = [...answers];
      newAnswers[index] = value;
      setAnswers(newAnswers);
    }
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      // 면접 완료
      navigate('/feedback', {
        state: { questions, answers, job, difficulty, mode, companyName },
      });
    }
  };

  if (!isStarted) {
    return (
      <div className="interview-page">
        <h1>면접 설정</h1>
        <div className="form-section">
          <div className="form-group">
            <label>직무 선택 *</label>
            <div className="job-selector-grid">
              {[
                { id: 'frontend', name: '프론트엔드 개발자', icon: '💻' },
                { id: 'backend', name: '백엔드 개발자', icon: '⚙️' },
                { id: 'fullstack', name: '풀스택 개발자', icon: '🔧' },
                { id: 'mobile', name: '모바일 개발자', icon: '📱' },
                { id: 'data-scientist', name: '데이터 사이언티스트', icon: '📊' },
                { id: 'ai-ml', name: 'AI/ML 엔지니어', icon: '🤖' },
                { id: 'devops', name: '데브옵스 엔지니어', icon: '☁️' },
                { id: 'ui-ux', name: 'UI/UX 디자이너', icon: '🎨' },
                { id: 'pm', name: '프로덕트 매니저', icon: '📋' },
                { id: 'qa', name: 'QA 엔지니어', icon: '✅' },
                { id: 'security', name: '보안 엔지니어', icon: '🔒' },
                { id: 'cloud', name: '클라우드 엔지니어', icon: '🌐' },
                { id: 'blockchain', name: '블록체인 개발자', icon: '⛓️' },
                { id: 'game', name: '게임 개발자', icon: '🎮' },
                { id: 'embedded', name: '임베디드 개발자', icon: '🔌' },
                { id: 'system', name: '시스템 엔지니어', icon: '🖥️' },
                { id: 'network', name: '네트워크 엔지니어', icon: '🌍' },
                { id: 'data-engineer', name: '데이터 엔지니어', icon: '💾' },
              ].map((jobOption) => (
                <button
                  key={jobOption.id}
                  type="button"
                  className={`job-card ${job === jobOption.name ? 'selected' : ''}`}
                  onClick={() => {
                    setJob(jobOption.name);
                  }}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '1.25rem',
                    border: `2px solid ${job === jobOption.name ? 'var(--primary-color)' : 'var(--border-color)'}`,
                    borderRadius: 'var(--radius-lg)',
                    backgroundColor: job === jobOption.name ? 'rgba(99, 102, 241, 0.1)' : 'var(--bg-primary)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    fontSize: '1.5rem',
                    minHeight: '100px',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                  onMouseEnter={(e) => {
                    if (job !== jobOption.name) {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (job !== jobOption.name) {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'none';
                    }
                  }}
                >
                  <span style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{jobOption.icon}</span>
                  <span style={{ 
                    fontSize: '0.9rem', 
                    fontWeight: job === jobOption.name ? 600 : 500,
                    color: 'var(--text-primary)',
                    textAlign: 'center',
                    lineHeight: '1.3'
                  }}>
                    {jobOption.name}
                  </span>
                  {job === jobOption.name && (
                    <div style={{
                      position: 'absolute',
                      top: '0.5rem',
                      right: '0.5rem',
                      width: '24px',
                      height: '24px',
                      backgroundColor: 'var(--primary-color)',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontSize: '0.75rem',
                      fontWeight: 'bold'
                    }}>
                      ✓
                    </div>
                  )}
                </button>
              ))}
            </div>
            {job && (
              <div style={{
                marginTop: '1rem',
                padding: '0.75rem 1rem',
                backgroundColor: 'rgba(99, 102, 241, 0.1)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--primary-color)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '1rem'
              }}>
                <span style={{ 
                  color: 'var(--text-primary)', 
                  fontWeight: 500,
                  fontSize: '0.95rem'
                }}>
                  선택된 직무: <strong>{job}</strong>
                </span>
                <button
                  type="button"
                  onClick={() => setJob('')}
                  style={{
                    padding: '0.25rem 0.75rem',
                    backgroundColor: 'transparent',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-sm)',
                    color: 'var(--text-secondary)',
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--bg-secondary)';
                    e.currentTarget.style.borderColor = 'var(--text-secondary)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.borderColor = 'var(--border-color)';
                  }}
                >
                  변경
                </button>
              </div>
            )}
          </div>
          <div className="form-group">
            <label>난이도</label>
            <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
              <option value="easy">초급</option>
              <option value="medium">중급</option>
              <option value="hard">고급</option>
            </select>
          </div>
          <div className="form-group">
            <label>모드</label>
            <select value={mode} onChange={(e) => setMode(e.target.value)}>
              <option value="practice">연습 모드</option>
              <option value="real">실전 모드</option>
            </select>
          </div>
          <div className="form-group">
            <label>질문 개수</label>
            <input
              type="number"
              min="1"
              max="20"
              value={questionCount}
              onChange={(e) => setQuestionCount(parseInt(e.target.value))}
            />
          </div>
          <button onClick={startInterview} className="btn btn-primary" disabled={!job}>
            면접 시작
          </button>
        </div>
      </div>
    );
  }

  // 로그인하지 않은 경우 안내 메시지 표시
  if (authLoading) {
    return (
      <div className="interview-page">
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          <p>로딩 중...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="interview-page">
        <div style={{ 
          textAlign: 'center', 
          padding: '3rem',
          backgroundColor: 'var(--bg-secondary)',
          borderRadius: 'var(--radius-lg)',
          border: '2px solid var(--border-color)',
          maxWidth: '600px',
          margin: '2rem auto'
        }}>
          <h1 style={{ marginBottom: '1rem', color: 'var(--text-primary)' }}>
            🔒 로그인이 필요합니다
          </h1>
          <p style={{ marginBottom: '2rem', color: 'var(--text-secondary)', fontSize: '1.1rem' }}>
            면접을 시작하려면 로그인이 필요합니다.<br />
            로그인 후 다시 시도해주세요.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <button 
              onClick={() => navigate('/login', { state: { from: '/interview' } })}
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
    );
  }

  const currentAnswer = answers[currentQuestionIndex] || '';
  const answerLength = currentAnswer.length;
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  return (
    <div className="interview-page">
      <div className="interview-container">
        {/* 진행 상태 표시 */}
        <div className="interview-progress">
          <div className="progress-header">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <h3>면접 진행 상황</h3>
              {job && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontSize: '0.9rem',
                  color: 'var(--text-secondary)'
                }}>
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>직무:</span>
                  <span style={{
                    padding: '0.25rem 0.75rem',
                    backgroundColor: 'rgba(99, 102, 241, 0.1)',
                    borderRadius: 'var(--radius-sm)',
                    color: 'var(--primary-color)',
                    fontWeight: 500
                  }}>
                    {job}
                  </span>
                </div>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <span className="progress-text">
                {currentQuestionIndex + 1} / {questions.length}
              </span>
              {mode === 'real' && timeLeft !== null && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.5rem 1rem',
                  backgroundColor: timeLeft <= 30 ? 'rgba(239, 68, 68, 0.1)' : 'rgba(99, 102, 241, 0.1)',
                  borderRadius: 'var(--radius-md)',
                  border: `2px solid ${timeLeft <= 30 ? '#ef4444' : '#6366f1'}`,
                  fontWeight: 'bold',
                  color: timeLeft <= 30 ? '#ef4444' : '#6366f1'
                }}>
                  <span style={{ fontSize: '1.2rem' }}>⏱️</span>
                  <span style={{ 
                    fontSize: '1.1rem',
                    minWidth: '60px'
                  }}>
                    {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
                  </span>
                  {timeLeft <= 30 && (
                    <span style={{ fontSize: '0.9rem' }}>남은 시간</span>
                  )}
                </div>
              )}
            </div>
          </div>
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          {mode === 'real' && timeLeft !== null && (
            <div style={{
              width: '100%',
              height: '4px',
              backgroundColor: 'rgba(0, 0, 0, 0.1)',
              borderRadius: '2px',
              marginTop: '0.5rem',
              overflow: 'hidden'
            }}>
              <div style={{
                width: `${(timeLeft / 180) * 100}%`,
                height: '100%',
                backgroundColor: timeLeft <= 30 ? '#ef4444' : '#6366f1',
                transition: 'width 1s linear, background-color 0.3s ease',
                borderRadius: '2px'
              }}></div>
            </div>
          )}
        </div>

        {/* 질문 카드 */}
        <div className="question-card">
          <div className="question-number-badge">
            질문 {currentQuestionIndex + 1}
          </div>
          <h2 className="question-text">
            {questions[currentQuestionIndex]?.text}
          </h2>
          <div className="question-hint">
            💡 아래 입력란에 답변을 작성해주세요. 충분히 구체적이고 명확하게 작성하면 더 나은 피드백을 받을 수 있습니다.
          </div>
        </div>

        {/* 답변 입력 영역 */}
        <div className="answer-card">
          <div className="answer-header">
            <label htmlFor="answer-input" className="answer-label">
              <span className="label-icon">✍️</span>
              답변 작성
            </label>
            <div className="answer-stats">
              <span className={`char-count ${answerLength >= 500 ? 'char-limit' : answerLength >= 450 ? 'char-warning' : ''}`}>
                {answerLength.toLocaleString()} / 500자
              </span>
              {answerLength >= 500 && (
                <span className="char-limit-message" style={{ color: '#ef4444', fontSize: '0.85rem', fontWeight: 600 }}>
                  최대 글자 수에 도달했습니다
                </span>
              )}
              {answerLength > 0 && answerLength < 500 && (
                <span className="word-count">
                  약 {Math.ceil(answerLength / 3)}단어
                </span>
              )}
            </div>
          </div>
          <textarea
            id="answer-input"
            className="answer-textarea"
            value={currentAnswer}
            onChange={(e) => handleAnswerChange(currentQuestionIndex, e.target.value)}
            placeholder="여기에 답변을 작성하세요. 최소 50자 이상 작성하시면 더 나은 피드백을 받을 수 있습니다. (최대 500자)"
            rows={12}
            maxLength={500}
            autoFocus
          />
          <div className="answer-footer">
            <small className="answer-hint">
              💡 팁: 답변은 구체적인 예시와 경험을 포함하여 작성하면 좋습니다.
            </small>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              {answerLength < 50 && answerLength > 0 && (
                <small className="answer-warning">
                  ⚠️ 최소 50자 이상 작성하는 것을 권장합니다.
                </small>
              )}
              {answerLength >= 450 && answerLength < 500 && (
                <small style={{ color: '#f59e0b', fontSize: '0.85rem' }}>
                  ⚠️ 500자 제한에 근접했습니다. ({500 - answerLength}자 남음)
                </small>
              )}
            </div>
          </div>
        </div>

        {/* 컨트롤 버튼 */}
        <div className="interview-controls">
          <button
            onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
            disabled={currentQuestionIndex === 0}
            className="btn btn-secondary btn-control"
          >
            <span className="btn-icon">←</span>
            이전 질문
          </button>
          
          <div className="control-center">
            {questions.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentQuestionIndex(index)}
                className={`question-indicator ${
                  index === currentQuestionIndex ? 'active' : ''
                } ${answers[index] ? 'answered' : ''}`}
                title={`질문 ${index + 1}${answers[index] ? ' (답변 완료)' : ''}`}
              >
                {index + 1}
              </button>
            ))}
          </div>

          <button 
            onClick={handleNext} 
            className="btn btn-primary btn-control"
            disabled={!currentAnswer.trim()}
          >
            {currentQuestionIndex === questions.length - 1 ? (
              <>
                <span className="btn-icon">✓</span>
                면접 완료
              </>
            ) : (
              <>
                다음 질문
                <span className="btn-icon">→</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Interview;

