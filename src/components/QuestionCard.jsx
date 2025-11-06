import React from 'react';

const QuestionCard = ({ question, answer, feedback, questionNumber, totalQuestions }) => {
  return (
    <div className="question-card">
      <div className="question-header">
        <span className="question-number">
          질문 {questionNumber} / {totalQuestions}
        </span>
      </div>
      <div className="question-content">
        <h3>{question}</h3>
      </div>
      {answer && (
        <div className="answer-content">
          <h4>내 답변</h4>
          {typeof answer === 'string' ? (
            <p>{answer}</p>
          ) : typeof answer === 'object' && answer !== null ? (
            <div>
              {answer.type === 'audio' ? (
                <div>
                  <p>🎤 오디오 답변</p>
                  {answer.duration && (
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                      녹음 시간: {Math.floor(answer.duration / 60)}:{(answer.duration % 60).toString().padStart(2, '0')}
                    </p>
                  )}
                  {answer.attempt && (
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                      {answer.attempt}차 답변
                    </p>
                  )}
                  {answer.audioUrl && (
                    <audio controls src={answer.audioUrl} style={{ marginTop: '0.5rem', width: '100%' }}>
                      브라우저가 오디오 태그를 지원하지 않습니다.
                    </audio>
                  )}
                </div>
              ) : answer.audioUrl ? (
                <div>
                  <p>🎤 오디오 답변</p>
                  <audio controls src={answer.audioUrl} style={{ marginTop: '0.5rem', width: '100%' }}>
                    브라우저가 오디오 태그를 지원하지 않습니다.
                  </audio>
                </div>
              ) : (
                <p>답변이 기록되었습니다.</p>
              )}
            </div>
          ) : (
            <p>{String(answer)}</p>
          )}
        </div>
      )}
      {feedback && (
        <div className="feedback-content">
          <h4>📝 면접관 피드백</h4>
          
          {/* 점수 */}
          {feedback.scores && (
            <div className="feedback-scores">
              <div className="score-grid">
                <div className="score-item">
                  <span className="score-label">완성도</span>
                  <span className="score-value">{feedback.scores.completeness}/10</span>
                </div>
                <div className="score-item">
                  <span className="score-label">관련성</span>
                  <span className="score-value">{feedback.scores.relevance}/10</span>
                </div>
                <div className="score-item">
                  <span className="score-label">명확성</span>
                  <span className="score-value">{feedback.scores.clarity}/10</span>
                </div>
                <div className="score-item">
                  <span className="score-label">구체성</span>
                  <span className="score-value">{feedback.scores.detail}/10</span>
                </div>
              </div>
            </div>
          )}

          {/* 전체 코멘트 */}
          {feedback.comment && (
            <div className="feedback-comment">
              <h5>💬 종합 평가</h5>
              <p>{feedback.comment}</p>
            </div>
          )}

          {/* 강점 */}
          {feedback.strengths && feedback.strengths.length > 0 && (
            <div className="feedback-strengths">
              <h5>✅ 잘한 점</h5>
              <ul>
                {feedback.strengths.map((strength, index) => (
                  <li key={index}>{strength}</li>
                ))}
              </ul>
            </div>
          )}

          {/* 약점 */}
          {feedback.weaknesses && feedback.weaknesses.length > 0 && (
            <div className="feedback-weaknesses">
              <h5>⚠️ 개선이 필요한 점</h5>
              <ul>
                {feedback.weaknesses.map((weakness, index) => (
                  <li key={index}>{weakness}</li>
                ))}
              </ul>
            </div>
          )}

          {/* 개선 제안 */}
          {feedback.suggestions && feedback.suggestions.length > 0 && (
            <div className="suggestions">
              <h5>💡 개선 제안</h5>
              <ul>
                {feedback.suggestions.map((suggestion, index) => (
                  <li key={index}>{suggestion}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default QuestionCard;

