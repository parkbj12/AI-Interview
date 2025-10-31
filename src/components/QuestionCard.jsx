import React, { useState, useEffect, useCallback, useRef } from "react";
import { Clock, CheckCircle } from "lucide-react";

export default function QuestionCard({ question, onRequestFeedback, questionNumber, totalQuestions, timeLimit = 180, mode = "practice", answer: externalAnswer = "", onAnswerChange }) {
  const [answer, setAnswer] = useState(externalAnswer);
  const [feedback, setFeedback] = useState(null);
  const [loading, setLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(timeLimit);
  const [isAnswered, setIsAnswered] = useState(false);

  // 질문이 바뀔 때 상태 초기화
  useEffect(() => {
    const newAnswer = externalAnswer || "";
    setAnswer(newAnswer);
    setFeedback(null);
    setLoading(false);
    setTimeLeft(timeLimit);
    setIsAnswered(false);
  }, [question, questionNumber, timeLimit]);

  // externalAnswer가 변경될 때만 동기화 (부모에서 전달된 값)
  useEffect(() => {
    if (externalAnswer !== answer) {
      setAnswer(externalAnswer || "");
    }
  }, [externalAnswer]);

  // 사용자가 직접 입력할 때만 부모에게 알림 (무한 루프 방지)
  const handleAnswerChange = (e) => {
    const newAnswer = e.target.value;
    setAnswer(newAnswer);
    // 사용자 입력 시에만 부모에게 알림
    if (onAnswerChange) {
      onAnswerChange(newAnswer);
    }
  };

  // handleSubmit을 ref로 저장하여 타이머가 재시작되지 않도록 함
  const handleSubmitRef = useRef(null);
  
  const handleSubmit = useCallback(async () => {
    const currentAnswer = answer; // 클로저 문제 방지를 위해 현재 answer 사용
    if (!currentAnswer.trim()) {
      alert("답변을 입력하세요.");
      return;
    }
    
    // 즉시 UI 업데이트 (딜레이 최소화)
    setIsAnswered(true);
    
    // 실전 모드일 때는 피드백 요청 없이 즉시 완료
    if (mode === "real") {
      onRequestFeedback(question, currentAnswer);
      return;
    }
    
    // 연습 모드: 피드백은 백그라운드에서 비동기로 처리
    setLoading(true);
    try {
      // 피드백 요청을 비동기로 처리 (블로킹하지 않음)
      onRequestFeedback(question, currentAnswer)
        .then((fb) => {
          if (fb) {
            setFeedback(fb);
          }
          setLoading(false);
        })
        .catch((e) => {
          console.error("피드백 요청 실패:", e);
          setLoading(false);
        });
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  }, [answer, question, mode, onRequestFeedback]);

  // handleSubmit ref 업데이트
  useEffect(() => {
    handleSubmitRef.current = handleSubmit;
  }, [handleSubmit]);

  // 타이머 효과
  useEffect(() => {
    if (timeLeft > 0 && !isAnswered) {
      const timer = setTimeout(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            // 시간이 끝나면 자동 제출 (ref를 통해 최신 함수 호출)
            setTimeout(() => {
              if (!isAnswered && handleSubmitRef.current) {
                handleSubmitRef.current();
              }
            }, 0);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [timeLeft, isAnswered]); // handleSubmit 의존성 제거

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getTimeColor = () => {
    if (timeLeft <= 30) return "#ef4444";
    if (timeLeft <= 60) return "#f59e0b";
    return "#10b981";
  };

  return (
    <div style={{ 
      marginBottom: 20, 
      padding: 24, 
      border: "1px solid #e5e7eb", 
      borderRadius: 12,
      backgroundColor: "#ffffff",
      boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)"
    }}>
      {/* 질문 번호 및 타이머 */}
      <div style={{ 
        display: "flex", 
        justifyContent: "space-between", 
        alignItems: "center",
        marginBottom: 16 
      }}>
        <div style={{ 
          display: "flex", 
          alignItems: "center", 
          gap: 8,
          fontSize: "14px",
          color: "#6b7280"
        }}>
          <span>질문 {questionNumber} / {totalQuestions}</span>
          {isAnswered && <CheckCircle size={16} color="#10b981" />}
        </div>
        <div style={{ 
          display: "flex", 
          alignItems: "center", 
          gap: 8,
          color: getTimeColor(),
          fontWeight: "bold"
        }}>
          <Clock size={16} />
          <span>{formatTime(timeLeft)}</span>
        </div>
      </div>

      {/* 질문 */}
      <div style={{ 
        marginBottom: 20, 
        fontSize: "18px",
        fontWeight: "500",
        lineHeight: "1.5",
        color: "#1f2937"
      }}>
        {question}
      </div>

      {/* 답변 입력 영역 */}
      <div style={{ marginBottom: 16 }}>
        <textarea 
          value={answer} 
          onChange={handleAnswerChange} 
          placeholder="답변을 작성하세요... (최대 500자)"
          disabled={isAnswered}
          maxLength={500}
          style={{
            width: "100%",
            minHeight: "120px",
            padding: "12px",
            border: answer.length >= 500 ? "2px solid #ef4444" : "1px solid #d1d5db",
            borderRadius: "8px",
            fontSize: "16px",
            resize: "vertical",
            fontFamily: "inherit"
          }}
        />
        {/* 답변 글자 수 및 단어 수 카운터 */}
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginTop: "8px",
          padding: "0 4px"
        }}>
          <div style={{
            display: "flex",
            gap: "12px",
            fontSize: "12px",
            color: "#6b7280"
          }}>
            <span>
              글자 수: <strong style={{ 
                color: answer.length >= 500 ? "#ef4444" : answer.length > 0 ? "#3b82f6" : "#9ca3af" 
              }}>
                {answer.length}
              </strong>
              <span style={{ color: "#6b7280", marginLeft: "4px" }}>/ 500</span>
            </span>
            <span>
              단어 수: <strong style={{ color: answer.trim().split(/\s+/).filter(w => w).length > 0 ? "#3b82f6" : "#9ca3af" }}>
                {answer.trim() ? answer.trim().split(/\s+/).filter(w => w).length : 0}
              </strong>
            </span>
          </div>
          {/* 권장 글자 수 안내 */}
          <div style={{
            fontSize: "11px",
            color: "#9ca3af",
            fontStyle: "italic"
          }}>
            {answer.length < 100 && (
              <span style={{ color: "#f59e0b" }}>💡 100자 이상 권장</span>
            )}
            {answer.length >= 100 && answer.length < 300 && (
              <span style={{ color: "#10b981" }}>✓ 적절한 길이입니다</span>
            )}
            {answer.length >= 300 && answer.length < 450 && (
              <span style={{ color: "#6366f1" }}>📝 상세한 답변입니다</span>
            )}
            {answer.length >= 450 && answer.length < 500 && (
              <span style={{ color: "#f59e0b" }}>⚠️ 글자 수 제한에 가까워집니다</span>
            )}
            {answer.length >= 500 && (
              <span style={{ color: "#ef4444", fontWeight: "600" }}>🚫 최대 글자 수에 도달했습니다</span>
            )}
          </div>
        </div>
      </div>


      {/* 피드백 영역 (연습 모드일 때만 표시) */}
      {feedback && mode === "practice" && (
        <div style={{ 
          marginTop: 20, 
          padding: 16, 
          background: "linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)", 
          borderRadius: "8px",
          border: "1px solid #0ea5e9"
        }}>
          <div style={{ 
            display: "flex", 
            alignItems: "center", 
            gap: 8,
            marginBottom: 12,
            color: "#0369a1",
            fontWeight: "600"
          }}>
            <CheckCircle size={20} />
            <span>AI 피드백</span>
          </div>
          <p style={{ 
            whiteSpace: "pre-wrap", 
            margin: 0,
            lineHeight: "1.6",
            color: "#0c4a6e"
          }}>
            {feedback}
          </p>
        </div>
      )}

    </div>
  );
}
