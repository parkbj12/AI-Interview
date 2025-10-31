import React, { useEffect, useState, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { getQuestions, requestFeedback } from "../api/api";
import QuestionCard from "../components/QuestionCard";
import { ArrowLeft, RotateCcw, CheckCircle, Clock, AlertCircle } from "lucide-react";

export default function Interview() {
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [feedbacks, setFeedbacks] = useState({});
  const [isLoading, setIsLoading] = useState(false); // 초기값을 false로 변경
  const [interviewCompleted, setInterviewCompleted] = useState(false);
  const [error, setError] = useState(null);
  
  const location = useLocation();
  const navigate = useNavigate();
  const jobType = new URLSearchParams(location.search).get("job");
  const difficulty = new URLSearchParams(location.search).get("difficulty") || "medium";
  const mode = new URLSearchParams(location.search).get("mode") || "practice"; // "practice" 또는 "real"
  const questionCount = parseInt(new URLSearchParams(location.search).get("count")) || null;

  // 직무 타입을 한국어로 변환
  const getJobTypeLabel = (jobType) => {
    const jobMap = {
      "developer": "개발자",
      "designer": "디자이너",
      "data-scientist": "데이터 사이언티스트",
      "product-manager": "프로덕트 매니저",
      "planner": "기획자",
      "marketer": "마케터",
      "sales": "영업",
      "hr": "인사",
      "finance": "재무/회계",
      "admin": "총무/행정",
      "customer-service": "고객서비스",
      "teacher": "교사",
      "nurse": "간호사",
      "lawyer": "변호사",
      "accountant": "회계사",
      "retail": "유통/판매",
      "hospitality": "호텔/관광",
      "food-service": "외식업",
      "manufacturing": "제조업",
      "quality-control": "품질관리",
      "logistics": "물류/운송"
    };
    return jobMap[jobType] || jobType;
  };

  // 난이도를 한국어로 변환
  const getDifficultyLabel = (difficulty) => {
    const difficultyMap = {
      "easy": "초급",
      "medium": "중급",
      "hard": "고급"
    };
    return difficultyMap[difficulty] || difficulty;
  };

  // 난이도별 시간 제한 설정 (모드에 따라 다름)
  const timeLimits = mode === "real" 
    ? {
        easy: 120,    // 실전: 2분
        medium: 180,  // 실전: 3분
        hard: 240     // 실전: 4분
      }
    : {
        easy: 300,    // 연습: 5분 (완화)
        medium: 360,  // 연습: 6분 (완화)
        hard: 420     // 연습: 7분 (완화)
      };

  useEffect(() => {
    console.log("=== Interview useEffect 실행 ===");
    console.log("jobType:", jobType);
    console.log("location.state:", location.state);
    
    // 사용자 질문이 state로 전달된 경우
    if (location.state?.customQuestions && location.state?.useCustom) {
      console.log("사용자 질문 사용:", location.state.customQuestions);
      setQuestions(location.state.customQuestions);
      return;
    }
    
    const fetchData = async () => {
      try {
        setError(null);
        console.log("질문 요청 시작, 직무 타입:", jobType, "난이도:", difficulty, "개수:", questionCount);
        const data = await getQuestions(jobType, difficulty, questionCount);
        console.log("받은 질문 데이터:", data);
        console.log("질문 배열인가?", Array.isArray(data));
        console.log("질문 개수:", data?.length);
        
        if (data && Array.isArray(data) && data.length > 0) {
          setQuestions(data);
          console.log("질문 상태 업데이트 완료");
        } else {
          console.error("질문 데이터가 유효하지 않음:", data);
          setError("질문 데이터를 불러올 수 없습니다.");
        }
      } catch (error) {
        console.error("질문 불러오기 실패:", error);
        setError("질문을 불러오는데 실패했습니다. 다시 시도해주세요.");
      }
    };
    
    // jobType이 있으면 데이터 로드, 없으면 기본값으로 로드
    if (jobType) {
      fetchData();
    } else {
      // jobType이 없어도 기본 질문 로드
      console.log("jobType이 없어서 기본 질문 로드");
      fetchData();
    }
  }, [jobType, difficulty, questionCount, location.state]);

  const handleAnswerSubmit = async (question, answer, autoMoveNext = false) => {
    try {
      // 답변 저장 (즉시 처리)
      setAnswers(prev => ({ ...prev, [currentQuestionIndex]: answer }));
      
      // 피드백은 백그라운드에서 비동기로 처리 (블로킹하지 않음)
      if (mode === "practice") {
        requestFeedback(question, answer)
          .then((feedbackData) => {
            // 구조화된 데이터 또는 텍스트 형식 모두 처리
            const feedbackText = typeof feedbackData === 'string' 
              ? feedbackData 
              : feedbackData.feedback || "";
            
            console.log(`피드백 저장: 질문 ${currentQuestionIndex}`, feedbackText.substring(0, 50));
            console.log('피드백 데이터:', feedbackData);
            
            setFeedbacks(prev => {
              const updated = { 
                ...prev, 
                [currentQuestionIndex]: typeof feedbackData === 'string' 
                  ? feedbackData 
                  : feedbackData 
              };
              console.log('전체 피드백 상태:', updated);
              return updated;
            });
          })
          .catch((error) => {
            console.error("피드백 요청 실패:", error);
          });
      }
      
      // autoMoveNext가 true일 때만 자동으로 다음 질문으로 이동
      if (autoMoveNext) {
        if (currentQuestionIndex < questions.length - 1) {
          setTimeout(() => {
            setCurrentQuestionIndex(prev => prev + 1);
          }, 500);
        } else {
          setTimeout(() => {
            setInterviewCompleted(true);
          }, 1000);
        }
      }
    } catch (error) {
      console.error("답변 제출 실패:", error);
    }
  };

  const handleNextQuestion = async () => {
    const currentQuestion = questions[currentQuestionIndex];
    const currentAnswer = answers[currentQuestionIndex] || "";
    
    // 답변이 없으면 경고
    if (!currentAnswer.trim()) {
      alert("답변을 입력해주세요.");
      return;
    }
    
    // 답변 제출 처리 (자동 이동 없이)
    await handleAnswerSubmit(currentQuestion.question, currentAnswer, false);
    
    // 다음 질문으로 이동
    if (currentQuestionIndex < questions.length - 1) {
      setTimeout(() => {
        setCurrentQuestionIndex(prev => prev + 1);
      }, 300);
    } else {
      // 마지막 질문이면 완료 처리 (답변 제출 후)
      setTimeout(() => {
        setInterviewCompleted(true);
      }, 300);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const handleRestart = () => {
    setCurrentQuestionIndex(0);
    setAnswers({});
    setFeedbacks({});
    setInterviewCompleted(false);
  };

  const handleFinishInterview = () => {
    console.log('결과 페이지로 이동 - 전달할 피드백:', feedbacks);
    console.log('답변 개수:', Object.keys(answers || {}).length);
    console.log('피드백 개수:', Object.keys(feedbacks || {}).length);
    
    // AI 생성 질문인 경우 companyName도 함께 전달
    const feedbackState = {
      jobType: location.state?.useCustom ? (location.state?.jobType || jobType) : jobType,
      difficulty: location.state?.difficulty || difficulty,
      answers, 
      feedbacks, 
      questions,
      mode,
      useCustom: location.state?.useCustom || false,
      companyName: location.state?.companyName || null
    };
    
    navigate("/feedback", { 
      state: feedbackState
    });
  };

  // 페이지 이동을 강제로 허용하는 함수
  const forceNavigate = useCallback((path) => {
    // 모든 비동기 작업을 취소하고 즉시 이동
    navigate(path, { replace: true });
  }, [navigate]);

  // 답변 변경 핸들러 (useCallback으로 메모이제이션)
  const handleAnswerChange = useCallback((newAnswer) => {
    setAnswers(prev => ({ ...prev, [currentQuestionIndex]: newAnswer }));
  }, [currentQuestionIndex]);

  // 페이지를 떠날 때 (location 변경 시) 처리
  useEffect(() => {
    // location.pathname이 변경되면 정리 작업 수행 (필요시)
    // 실제로는 컴포넌트가 언마운트될 때 실행됨
    return () => {
      // 텍스트 면접에서는 특별한 리소스 정리가 필요 없지만,
      // 페이지 이동이 원활하도록 빈 cleanup 함수 추가
    };
  }, [location.pathname]);

  // 헤더 링크 클릭을 감지하여 강제로 네비게이션 허용
  useEffect(() => {
    const handleLinkClick = (e) => {
      // React Router의 Link 컴포넌트는 내부적으로 a 태그를 사용
      const link = e.target.closest('a');
      if (!link) return;
      
      // href 속성 확인 (React Router Link는 to prop을 href로 변환)
      const href = link.getAttribute('href');
      if (!href || !href.startsWith('/')) return;
      
      // 현재 경로와 다르면 강제로 네비게이션
      if (href !== location.pathname) {
        // React Router의 기본 동작을 허용하되, 확실하게 네비게이션 실행
        // preventDefault를 호출하지 않고, 단지 네비게이션이 제대로 작동하도록 보장
        setTimeout(() => {
          if (window.location.pathname === location.pathname) {
            // 네비게이션이 실행되지 않았다면 강제 실행
            forceNavigate(href);
          }
        }, 0);
      }
    };

    // 캡처 단계에서 이벤트 리스너 추가 (다른 핸들러보다 먼저 실행)
    document.addEventListener('click', handleLinkClick, true);
    
    return () => {
      document.removeEventListener('click', handleLinkClick, true);
    };
  }, [location.pathname, forceNavigate]);

  // 질문이 아직 로드되지 않았을 때
  if (questions.length === 0 && !error) {
    return (
      <div style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "400px",
        backgroundColor: "white",
        borderRadius: "16px",
        padding: "40px"
      }}>
        <p style={{ color: "#6b7280", marginBottom: "20px" }}>질문을 불러오는 중...</p>
        <button
          onClick={() => {
            // 강제로 질문 다시 로드
            const fetchData = async () => {
              const data = await getQuestions(jobType || 'developer');
              setQuestions(data);
            };
            fetchData();
          }}
          style={{
            padding: "10px 20px",
            backgroundColor: "#3b82f6",
            color: "white",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer"
          }}
        >
          다시 시도
        </button>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "400px",
        backgroundColor: "white",
        borderRadius: "16px",
        padding: "40px"
      }}>
        <AlertCircle size={48} color="#ef4444" style={{ marginBottom: "20px" }} />
        <h3 style={{ color: "#374151", marginBottom: "8px" }}>오류가 발생했습니다</h3>
        <p style={{ color: "#6b7280", marginBottom: "20px" }}>{error}</p>
        <button
          onClick={() => window.location.reload()}
          style={{
            padding: "12px 24px",
            backgroundColor: "#3b82f6",
            color: "white",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer"
          }}
        >
          다시 시도
        </button>
      </div>
    );
  }

  if (interviewCompleted) {
    return (
      <div style={{
        backgroundColor: "white",
        borderRadius: "16px",
        padding: "40px",
        textAlign: "center",
        boxShadow: "0 10px 25px rgba(0,0,0,0.1)"
      }}>
        <CheckCircle size={64} color="#10b981" style={{ marginBottom: "20px" }} />
        <h2 style={{ color: "#1f2937", marginBottom: "16px" }}>
          면접이 완료되었습니다!
        </h2>
        <p style={{ color: "#6b7280", marginBottom: "30px" }}>
          모든 질문에 답변하셨습니다. 결과를 확인해보세요.
        </p>
        <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
          <button
            onClick={handleFinishInterview}
            style={{
              padding: "12px 24px",
              backgroundColor: "#10b981",
              color: "white",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              fontSize: "16px",
              fontWeight: "500"
            }}
          >
            결과 보기
          </button>
          <button
            onClick={handleRestart}
            style={{
              padding: "12px 24px",
              backgroundColor: "#6b7280",
              color: "white",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              fontSize: "16px",
              fontWeight: "500"
            }}
          >
            다시 시작
          </button>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto" }}>
      {/* 면접 헤더 */}
      <div style={{
        backgroundColor: "white",
        borderRadius: "16px",
        padding: "24px",
        marginBottom: "20px",
        boxShadow: "0 4px 6px rgba(0,0,0,0.1)"
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              forceNavigate("/");
            }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "8px 16px",
              backgroundColor: "transparent",
              border: "1px solid #d1d5db",
              borderRadius: "8px",
              cursor: "pointer",
              color: "#374151"
            }}
          >
            <ArrowLeft size={16} />
            홈으로
          </button>
          
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Clock size={16} color={mode === "real" ? "#ef4444" : "#10b981"} />
            <span style={{ 
              color: mode === "real" ? "#ef4444" : "#10b981", 
              fontSize: "14px",
              fontWeight: mode === "real" ? "600" : "400"
            }}>
              {timeLimits[difficulty]}초 제한 {mode === "real" ? "(실전)" : "(연습)"}
            </span>
          </div>
        </div>

        {/* 진행률 바 */}
        <div style={{ marginBottom: "16px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
            <span style={{ fontSize: "14px", color: "#6b7280" }}>
              질문 {currentQuestionIndex + 1} / {questions.length}
            </span>
            <span style={{ fontSize: "14px", color: "#6b7280" }}>
              {Math.round(progress)}% 완료
            </span>
          </div>
          <div style={{
            width: "100%",
            height: "8px",
            backgroundColor: "#e5e7eb",
            borderRadius: "4px",
            overflow: "hidden"
          }}>
            <div style={{
              width: `${progress}%`,
              height: "100%",
              backgroundColor: "#3b82f6",
              transition: "width 0.3s ease"
            }} />
          </div>
        </div>

        <h2 style={{ 
          margin: 0, 
          color: "#1f2937",
          fontSize: "1.5rem",
          fontWeight: "600"
        }}>
          {getJobTypeLabel(jobType)} 면접 - {getDifficultyLabel(difficulty)}
          <span style={{
            marginLeft: "12px",
            fontSize: "1rem",
            color: mode === "real" ? "#ef4444" : "#10b981",
            fontWeight: "500"
          }}>
            [{mode === "real" ? "실전 모드" : "연습 모드"}]
          </span>
        </h2>
      </div>

      {/* 질문 카드 */}
      {currentQuestion && (
        <QuestionCard
          key={`question-${currentQuestionIndex}-${currentQuestion.id}`}
          question={currentQuestion.question}
          onRequestFeedback={handleAnswerSubmit}
          questionNumber={currentQuestionIndex + 1}
          totalQuestions={questions.length}
          timeLimit={timeLimits[difficulty]}
          mode={mode}
          answer={answers[currentQuestionIndex] || ""}
          onAnswerChange={handleAnswerChange}
        />
      )}

      {/* 네비게이션 버튼 */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        marginTop: "20px"
      }}>
        <button
          onClick={handlePreviousQuestion}
          disabled={currentQuestionIndex === 0}
          style={{
            padding: "12px 24px",
            backgroundColor: currentQuestionIndex === 0 ? "#f3f4f6" : "#6b7280",
            color: currentQuestionIndex === 0 ? "#9ca3af" : "white",
            border: "none",
            borderRadius: "8px",
            cursor: currentQuestionIndex === 0 ? "not-allowed" : "pointer",
            fontSize: "16px"
          }}
        >
          이전 질문
        </button>

        <button
          onClick={handleNextQuestion}
          disabled={!answers[currentQuestionIndex]?.trim()}
          style={{
            padding: "12px 24px",
            backgroundColor: answers[currentQuestionIndex]?.trim() ? "#3b82f6" : "#f3f4f6",
            color: answers[currentQuestionIndex]?.trim() ? "white" : "#9ca3af",
            border: "none",
            borderRadius: "8px",
            cursor: answers[currentQuestionIndex]?.trim() ? "pointer" : "not-allowed",
            fontSize: "16px"
          }}
        >
          {currentQuestionIndex === questions.length - 1 ? "답변 제출" : "다음 질문"}
        </button>
      </div>
    </div>
  );
}
