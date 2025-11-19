import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import QuestionList from '../components/QuestionList';
import { feedbackAPI, interviewAPI } from '../api/api';
import { useAuth } from '../context/AuthContext';

const Feedback = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { questions, answers, job, difficulty, mode, companyName, interviewType } = location.state || {};
  const [feedbacks, setFeedbacks] = useState([]);
  const [overallFeedback, setOverallFeedback] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [progress, setProgress] = useState(0); // 진행률 (0-100)
  const hasGeneratedRef = useRef(false);
  const progressIntervalRef = useRef(null);
  const startTimeRef = useRef(null);

  const calculateAverageScoreFromFeedbacks = (feedbacks) => {
    if (feedbacks.length === 0) return 0;
    const total = feedbacks.reduce((sum, fb) => {
      const avg = Object.values(fb.scores).reduce((a, b) => a + b, 0) / 4;
      return sum + avg;
    }, 0);
    return (total / feedbacks.length).toFixed(1);
  };

  const saveInterview = async (interviewFeedbacks) => {
    // 이미 저장 중이거나 저장 완료된 경우 중복 저장 방지
    if (isSaving || saved) {
      console.log('⚠️ 이미 저장 중이거나 저장 완료됨');
      return;
    }

    setIsSaving(true);
    try {
      const averageScore = calculateAverageScoreFromFeedbacks(interviewFeedbacks);
      const interviewData = {
        job,
        difficulty,
        mode,
        companyName: companyName || '',
        questions: questions.map(q => q.text || q),
        answers,
        feedbacks: interviewFeedbacks,
        score: parseFloat(averageScore),
        date: new Date().toISOString(),
        interviewType: interviewType || 'text', // 영상 면접인지 텍스트 면접인지 구분
      };

      console.log('💾 면접 기록 저장 시도:', {
        interviewType,
        hasUser: !!user,
        answersCount: answers?.length,
        answersType: answers?.map(a => typeof a === 'object' && a?.type).filter(Boolean)
      });

      // 백엔드에 저장 시도
      if (user) {
        try {
          console.log('📤 백엔드에 저장 시도 중...');
          const response = await interviewAPI.create(interviewData);
          console.log('✅ 백엔드 저장 성공:', response.data);
          setSaved(true);
          setIsSaving(false);
          return;
        } catch (error) {
          console.error('❌ 백엔드 저장 실패:', error);
          console.error('에러 상세:', {
            message: error.message,
            response: error.response?.data,
            status: error.response?.status
          });
          console.warn('백엔드 저장 실패, 로컬 스토리지에 저장 시도');
        }
      }

      // 로컬 스토리지에 저장
      const storedInterviews = JSON.parse(localStorage.getItem('interviews') || '[]');
      
      // 비디오 면접의 경우 base64Audio 데이터가 크므로 localStorage에 저장할 때는 제외
      let interviewDataForStorage = { ...interviewData };
      if (interviewType === 'video' && interviewDataForStorage.answers) {
        interviewDataForStorage.answers = interviewDataForStorage.answers.map(answer => {
          if (answer && typeof answer === 'object' && answer.base64Audio) {
            // base64Audio는 제외하고 메타데이터만 저장
            const { base64Audio, audioBlob, ...answerMeta } = answer;
            return {
              ...answerMeta,
              hasAudio: true, // 오디오 데이터가 있었음을 표시
              audioSize: base64Audio ? base64Audio.length : 0 // 크기 정보만 저장
            };
          }
          return answer;
        });
      }
      
      // 중복 저장 방지: 같은 날짜와 직무로 이미 저장된 기록이 있는지 확인
      const isDuplicate = storedInterviews.some(
        (iv) => 
          iv.job === interviewDataForStorage.job && 
          iv.date === interviewDataForStorage.date &&
          JSON.stringify(iv.questions) === JSON.stringify(interviewDataForStorage.questions)
      );

      if (isDuplicate) {
        console.warn('⚠️ 중복된 면접 기록이 있어 저장하지 않습니다');
        setSaved(true); // 중복이어도 저장 완료로 표시 (이미 저장되어 있음)
        setIsSaving(false);
        return;
      }

      try {
        console.log('💾 localStorage에 저장 시도 중...');
        const newInterview = {
          ...interviewDataForStorage,
          id: Date.now().toString(),
        };
        storedInterviews.unshift(newInterview);
        localStorage.setItem('interviews', JSON.stringify(storedInterviews));
        console.log('✅ localStorage 저장 성공');
        setSaved(true);
      } catch (storageError) {
        console.error('❌ localStorage 저장 오류:', storageError);
        // localStorage 크기 제한 초과 시 base64Audio를 더 제거하고 재시도
        if (storageError.name === 'QuotaExceededError' || storageError.code === 22) {
          console.warn('⚠️ localStorage 크기 제한 초과, 오디오 데이터를 더 제거하고 재시도');
          interviewDataForStorage.answers = interviewDataForStorage.answers.map(answer => {
            if (answer && typeof answer === 'object') {
              // 오디오 관련 모든 데이터 제거, 메타데이터만 유지
              return {
                type: answer.type || 'audio',
                duration: answer.duration || 0,
                hasAudio: true
              };
            }
            return answer;
          });
          try {
            const newInterview = {
              ...interviewDataForStorage,
              id: Date.now().toString(),
            };
            storedInterviews.unshift(newInterview);
            localStorage.setItem('interviews', JSON.stringify(storedInterviews));
            console.log('✅ localStorage 저장 성공 (오디오 데이터 제거 후)');
            setSaved(true);
          } catch (retryError) {
            console.error('❌ 재시도 후에도 저장 실패:', retryError);
            // 최소한의 데이터만 저장 시도
            const minimalInterview = {
              job: interviewDataForStorage.job,
              companyName: interviewDataForStorage.companyName,
              questions: interviewDataForStorage.questions,
              feedbacks: interviewDataForStorage.feedbacks,
              score: interviewDataForStorage.score,
              date: interviewDataForStorage.date,
              id: Date.now().toString(),
              answers: interviewDataForStorage.answers.map(() => ({ type: 'audio', hasAudio: true }))
            };
            storedInterviews.unshift(minimalInterview);
            localStorage.setItem('interviews', JSON.stringify(storedInterviews));
            console.log('✅ 최소 데이터로 저장 성공');
            setSaved(true);
          }
        } else {
          console.error('❌ 예상치 못한 저장 오류:', storageError);
          throw storageError;
        }
      }
    } catch (error) {
      console.error('❌ 면접 기록 저장 오류:', error);
      alert('면접 기록 저장에 실패했습니다. 콘솔을 확인해주세요.');
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    if (!questions || !answers) {
      navigate('/');
      return;
    }
    
    // 중복 실행 방지
    if (hasGeneratedRef.current) {
      return;
    }
    hasGeneratedRef.current = true;
    
    generateFeedbacks();
    
    // 컴포넌트 언마운트 시 진행률 인터벌 정리
    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const generateFeedbacks = async () => {
    setLoading(true);
    setProgress(5); // 초기 진행률 5%로 시작
    startTimeRef.current = Date.now();
    
    // 질문 개수에 따라 예상 소요 시간 계산 (질문당 약 10-15초)
    const questionCount = questions?.length || 5;
    const estimatedTime = Math.max(30, questionCount * 12); // 최소 30초 보장
    const minProgressTime = 20; // 최소 20초 동안 진행률 증가
    
    let currentProgress = 5;
    
    // 진행률 시뮬레이션 (실제 API 응답 전까지)
    progressIntervalRef.current = setInterval(() => {
      const elapsed = (Date.now() - startTimeRef.current) / 1000; // 초 단위
      
      // 진행률 계산 (더 부드럽게)
      // 초기 5%에서 시작하여 점진적으로 증가
      // 최소 시간 동안은 천천히, 그 이후에는 더 빠르게
      let targetProgress;
      if (elapsed < minProgressTime) {
        // 처음 20초 동안은 5%에서 70%까지 천천히 증가
        targetProgress = 5 + (elapsed / minProgressTime) * 65;
      } else {
        // 그 이후에는 70%에서 90%까지 증가
        const remainingTime = Math.max(1, estimatedTime - minProgressTime);
        const extraElapsed = elapsed - minProgressTime;
        targetProgress = 70 + (Math.min(extraElapsed, remainingTime) / remainingTime) * 20;
      }
      
      // 진행률이 감소하지 않도록 보장
      if (targetProgress > currentProgress) {
        currentProgress = Math.min(90, targetProgress);
        setProgress(Math.floor(currentProgress));
      }
    }, 100); // 100ms마다 업데이트 (더 부드럽게)
    
    try {
      const response = await feedbackAPI.generateBatch({
        questions,
        answers,
        job,
        difficulty,
        companyName,
      });
      
      // 진행률 인터벌 정리
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
      
      // 진행률을 단계적으로 증가
      setProgress(92);
      await new Promise(resolve => setTimeout(resolve, 200));
      
      setProgress(95);
      await new Promise(resolve => setTimeout(resolve, 200));
      
      const generatedFeedbacks = response.data.feedbacks || [];
      const overall = response.data.overallFeedback || null;
      setFeedbacks(generatedFeedbacks);
      setOverallFeedback(overall);
      
      // 진행률 98%로 설정
      setProgress(98);
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // 진행률 100%로 설정
      setProgress(100);
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // 피드백 생성 후 면접 기록 저장
      await saveInterview(generatedFeedbacks);
    } catch (error) {
      console.error('피드백 생성 오류:', error);
      // 에러 발생 시 기본 피드백 제공
      const fallbackFeedbacks = answers.map((answer, index) => {
        // answer가 객체인 경우 처리
        const answerLength = typeof answer === 'string' ? answer.length : 
                            (answer && answer.duration ? answer.duration : 0);
        const answerText = typeof answer === 'string' ? answer : 
                          (answer && answer.type === 'audio' ? '오디오 답변' : '답변 기록됨');
        
        return {
          scores: {
            completeness: answerLength > 100 ? 6 : 4,
            relevance: 5,
            clarity: answerLength > 50 ? 6 : 4,
            detail: answerLength > 150 ? 7 : 5,
          },
          comment: typeof answer === 'string' 
            ? `답변을 확인했습니다. ${answerLength}자로 작성하셨네요. 더 구체적인 내용을 추가하면 좋을 것 같습니다.`
            : `오디오 답변을 확인했습니다. ${answerLength > 0 ? `${answerLength}초` : ''} 녹음하셨네요. 더 구체적인 내용을 추가하면 좋을 것 같습니다.`,
          suggestions: [
            '구체적인 경험 사례를 추가하세요',
            'STAR 기법(Situation, Task, Action, Result)을 활용해보세요',
            '숫자나 구체적인 결과를 포함하세요',
          ],
          strengths: answerLength > 100 ? ['충분한 분량의 답변을 작성하셨습니다.'] : [],
          weaknesses: ['구체적인 예시를 추가하면 더 좋을 것 같습니다.'],
        };
      });
      setFeedbacks(fallbackFeedbacks);
      
      // 기본 피드백으로도 면접 기록 저장
      await saveInterview(fallbackFeedbacks);
      
      // 진행률 인터벌 정리
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
      
      // 진행률을 100%로 설정
      setProgress(100);
      await new Promise(resolve => setTimeout(resolve, 500));
    } finally {
      // 진행률 인터벌 정리
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
      setLoading(false);
    }
  };

  const calculateAverageScore = () => {
    if (feedbacks.length === 0) return 0;
    const total = feedbacks.reduce((sum, fb) => {
      const avg = Object.values(fb.scores).reduce((a, b) => a + b, 0) / 4;
      return sum + avg;
    }, 0);
    return (total / feedbacks.length).toFixed(1);
  };

  // 난이도를 한글로 변환
  const getDifficultyKorean = (difficulty) => {
    const difficultyMap = {
      'easy': '초급',
      'medium': '중급',
      'hard': '고급'
    };
    return difficultyMap[difficulty] || difficulty;
  };

  // 모드를 한글로 변환
  const getModeKorean = (mode) => {
    const modeMap = {
      'practice': '연습 모드',
      'real': '실전 모드'
    };
    return modeMap[mode] || mode;
  };

  if (loading) {
    return (
      <div className="feedback-page">
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '60vh',
          padding: '3rem',
          textAlign: 'center'
        }}>
          {/* 로딩 스피너 */}
          <div style={{
            width: '80px',
            height: '80px',
            border: '6px solid rgba(99, 102, 241, 0.2)',
            borderTop: '6px solid var(--primary-color)',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            marginBottom: '2rem'
          }}></div>
          
          {/* 메인 메시지 */}
          <h1 style={{
            fontSize: '1.8rem',
            fontWeight: 600,
            color: 'var(--text-primary)',
            marginBottom: '1rem'
          }}>
            AI가 피드백을 생성하고 있습니다
          </h1>
          
          {/* 부가 메시지 */}
          <p style={{
            fontSize: '1.1rem',
            color: 'var(--text-secondary)',
            marginBottom: '0.5rem',
            lineHeight: '1.6'
          }}>
            생성 중입니다, 조금만 기다려주세요...
          </p>
          
          <p style={{
            fontSize: '0.9rem',
            color: 'var(--text-secondary)',
            opacity: 0.7,
            marginTop: '1rem'
          }}>
            답변을 분석하고 맞춤형 피드백을 준비하고 있어요
          </p>
          
          {/* 진행률 표시 */}
          <div style={{
            width: '400px',
            maxWidth: '90%',
            marginTop: '2rem'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '0.5rem'
            }}>
              <span style={{
                fontSize: '0.9rem',
                color: 'var(--text-secondary)',
                fontWeight: 500
              }}>
                진행률
              </span>
              <span style={{
                fontSize: '1.2rem',
                fontWeight: 600,
                color: 'var(--primary-color)'
              }}>
                {progress}%
              </span>
            </div>
            
            {/* 진행 바 */}
            <div style={{
              width: '100%',
              height: '8px',
              backgroundColor: 'rgba(99, 102, 241, 0.2)',
              borderRadius: '4px',
              overflow: 'hidden',
              position: 'relative'
            }}>
              <div style={{
                width: `${progress}%`,
                height: '100%',
                backgroundColor: 'var(--primary-color)',
                borderRadius: '4px',
                transition: 'width 0.3s ease',
                boxShadow: '0 0 10px rgba(99, 102, 241, 0.5)',
                position: 'relative',
                overflow: 'hidden'
              }}>
                {/* 진행 바 내부 애니메이션 */}
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent)',
                  animation: 'shimmer 2s infinite'
                }}></div>
              </div>
            </div>
          </div>
          
          {/* 스타일 추가 */}
          <style>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
            @keyframes shimmer {
              0% { transform: translateX(-100%); }
              100% { transform: translateX(100%); }
            }
          `}</style>
        </div>
      </div>
    );
  }

  return (
    <div className="feedback-page">
      <h1>면접 결과</h1>
      <div className="feedback-summary">
        <h2>전체 점수: {calculateAverageScore()} / 10</h2>
        <p>직무: {job}</p>
        {companyName && <p>기업: {companyName}</p>}
        <p>난이도: {getDifficultyKorean(difficulty)}</p>
        <p>모드: {getModeKorean(mode)}</p>
      </div>

      {/* 전체 종합평가 */}
      {overallFeedback && (
        <div className="overall-feedback" style={{
          backgroundColor: 'var(--bg-secondary)',
          padding: '2rem',
          borderRadius: 'var(--radius-lg)',
          marginBottom: '2rem',
          border: '2px solid var(--primary-color)'
        }}>
          <h2 style={{ marginBottom: '1.5rem', color: 'var(--primary-color)', fontSize: '1.5rem' }}>
            📊 전체 종합평가
          </h2>
          
          {overallFeedback.overallComment && (
            <div style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ marginBottom: '0.75rem', fontSize: '1.1rem', fontWeight: 600 }}>💬 종합 평가</h3>
              <p style={{ 
                lineHeight: '1.8', 
                color: 'var(--text-primary)',
                whiteSpace: 'pre-wrap'
              }}>
                {overallFeedback.overallComment}
              </p>
            </div>
          )}

          {overallFeedback.keyStrengths && overallFeedback.keyStrengths.length > 0 && (
            <div style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ marginBottom: '0.75rem', fontSize: '1.1rem', fontWeight: 600, color: 'var(--success-color)' }}>
                ✅ 주요 강점
              </h3>
              <ul style={{ paddingLeft: '1.5rem', lineHeight: '1.8' }}>
                {overallFeedback.keyStrengths.map((strength, index) => (
                  <li key={index} style={{ marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
                    {strength}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {overallFeedback.keyWeaknesses && overallFeedback.keyWeaknesses.length > 0 && (
            <div style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ marginBottom: '0.75rem', fontSize: '1.1rem', fontWeight: 600, color: 'var(--warning-color)' }}>
                ⚠️ 개선이 필요한 점
              </h3>
              <ul style={{ paddingLeft: '1.5rem', lineHeight: '1.8' }}>
                {overallFeedback.keyWeaknesses.map((weakness, index) => (
                  <li key={index} style={{ marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
                    {weakness}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {overallFeedback.improvementSuggestions && overallFeedback.improvementSuggestions.length > 0 && (
            <div style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ marginBottom: '0.75rem', fontSize: '1.1rem', fontWeight: 600, color: 'var(--primary-color)' }}>
                💡 개선 제안
              </h3>
              <ul style={{ paddingLeft: '1.5rem', lineHeight: '1.8' }}>
                {overallFeedback.improvementSuggestions.map((suggestion, index) => (
                  <li key={index} style={{ marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
                    {suggestion}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {overallFeedback.interviewerPerspective && (
            <div style={{
              marginTop: '1.5rem',
              padding: '1rem',
              backgroundColor: 'rgba(99, 102, 241, 0.1)',
              borderRadius: 'var(--radius-md)',
              borderLeft: '4px solid var(--primary-color)'
            }}>
              <h3 style={{ marginBottom: '0.75rem', fontSize: '1.1rem', fontWeight: 600 }}>
                👔 면접관 관점
              </h3>
              <p style={{ 
                lineHeight: '1.8', 
                color: 'var(--text-primary)',
                whiteSpace: 'pre-wrap'
              }}>
                {overallFeedback.interviewerPerspective}
              </p>
            </div>
          )}
        </div>
      )}

      <h2 style={{ marginBottom: '1rem', fontSize: '1.3rem' }}>📝 질문별 상세 피드백</h2>
      <QuestionList questions={questions} answers={answers} feedbacks={feedbacks} />
      {saved && (
        <div className="save-success-message">
          ✅ 면접 기록이 저장되었습니다.
        </div>
      )}
      <div className="feedback-actions">
        <button onClick={() => navigate('/mypage')} className="btn btn-primary">
          면접 기록 보기
        </button>
        <button onClick={() => navigate('/interview')} className="btn btn-secondary">
          다시 면접하기
        </button>
      </div>
    </div>
  );
};

export default Feedback;

