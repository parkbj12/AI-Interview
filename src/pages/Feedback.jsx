import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import QuestionList from '../components/QuestionList';
import { feedbackAPI, interviewAPI } from '../api/api';
import { useAuth } from '../context/AuthContext';

const Feedback = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { questions, answers, job, difficulty, mode, companyName } = location.state || {};
  const [feedbacks, setFeedbacks] = useState([]);
  const [overallFeedback, setOverallFeedback] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const hasGeneratedRef = useRef(false);

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
      };

      // 백엔드에 저장 시도
      if (user) {
        try {
          await interviewAPI.create(interviewData);
          setSaved(true);
          setIsSaving(false);
          return;
        } catch (error) {
          console.warn('백엔드 저장 실패, 로컬 스토리지에 저장:', error);
        }
      }

      // 로컬 스토리지에 저장
      const storedInterviews = JSON.parse(localStorage.getItem('interviews') || '[]');
      
      // 중복 저장 방지: 같은 날짜와 직무로 이미 저장된 기록이 있는지 확인
      const isDuplicate = storedInterviews.some(
        (iv) => 
          iv.job === interviewData.job && 
          iv.date === interviewData.date &&
          JSON.stringify(iv.questions) === JSON.stringify(interviewData.questions)
      );

      if (!isDuplicate) {
        const newInterview = {
          ...interviewData,
          id: Date.now().toString(),
        };
        storedInterviews.unshift(newInterview);
        localStorage.setItem('interviews', JSON.stringify(storedInterviews));
        setSaved(true);
      }
    } catch (error) {
      console.error('면접 기록 저장 오류:', error);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const generateFeedbacks = async () => {
    setLoading(true);
    try {
      const response = await feedbackAPI.generateBatch({
        questions,
        answers,
        job,
        difficulty,
        companyName,
      });
      const generatedFeedbacks = response.data.feedbacks || [];
      const overall = response.data.overallFeedback || null;
      setFeedbacks(generatedFeedbacks);
      setOverallFeedback(overall);
      
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
    } finally {
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

  if (loading) {
    return <div className="feedback-page">피드백 생성 중...</div>;
  }

  return (
    <div className="feedback-page">
      <h1>면접 결과</h1>
      <div className="feedback-summary">
        <h2>전체 점수: {calculateAverageScore()} / 10</h2>
        <p>직무: {job}</p>
        {companyName && <p>기업: {companyName}</p>}
        <p>난이도: {difficulty}</p>
        <p>모드: {mode}</p>
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

