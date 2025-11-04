import React, { useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { interviewAPI } from "../api/api";
import { 
  ArrowLeft, 
  Star, 
  TrendingUp, 
  MessageSquare, 
  Clock, 
  Target,
  CheckCircle,
  AlertTriangle,
  RotateCcw,
  User,
  Lightbulb,
  BookOpen,
} from "lucide-react";

export default function Feedback() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { jobType, difficulty, answers, feedbacks, questions, mode, useCustom, companyName } = location.state || {};
  const hasSavedRef = useRef(false); // 저장 여부를 추적하는 ref
  const interviewMode = mode || "practice"; // "practice" 또는 "real"

  // 디버깅: 받은 데이터 확인
  useEffect(() => {
    console.log('Feedback 페이지 - 받은 데이터:', {
      questionsCount: questions?.length,
      answersCount: Object.keys(answers || {}).length,
      feedbacksCount: Object.keys(feedbacks || {}).length,
      feedbacks: feedbacks
    });
  }, [questions, answers, feedbacks]);

  // 직무 타입을 한국어로 변환
  const getJobTypeLabel = (jobType) => {
    // AI 생성 질문인 경우 (ai-기업명 형식) 또는 companyName이 있는 경우
    if (companyName) {
      return companyName;
    }
    if (jobType && jobType.startsWith('ai-')) {
      return jobType.replace('ai-', '');
    }
    
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

  // 점수 계산 함수
  const calculateScore = () => {
    if (!questions || !answers) return 0;
    const totalQuestions = questions.length || 0;
    const answeredQuestions = Object.keys(answers || {}).length;
    
    // 답변 완성도 점수 (40% 가중치)
    const completionScore = (answeredQuestions / totalQuestions) * 40;
    
    // AI 평가 점수 (60% 가중치)
    let totalAIScore = 0;
    let aiScoreCount = 0;
    
    Object.values(feedbacks || {}).forEach(feedbackData => {
      if (!feedbackData) return;
      
      // 구조화된 데이터인 경우
      if (typeof feedbackData === 'object' && feedbackData.score !== undefined) {
        totalAIScore += feedbackData.score;
        aiScoreCount++;
      } 
      // 이전 형식 (텍스트만)인 경우 평가 데이터가 없으면 기본값 사용
      else if (typeof feedbackData === 'string') {
        // 텍스트만 있는 경우 기본 점수 (답변 길이 기반)
        const answerLength = Object.values(answers || {}).find(a => a)?.length || 0;
        let estimatedScore = 50;
        if (answerLength < 50) estimatedScore = 40;
        else if (answerLength > 200) estimatedScore = 65;
        else estimatedScore = 55;
        
        totalAIScore += estimatedScore;
        aiScoreCount++;
      }
    });
    
    // AI 평가 평균 점수
    const avgAIScore = aiScoreCount > 0 
      ? (totalAIScore / aiScoreCount) * 0.6 
      : 0;
    
    // 최종 점수 (완성도 40% + AI 평가 60%)
    const finalScore = Math.min(100, Math.round(completionScore + avgAIScore));
    
    return finalScore;
  };

  // 면접 기록 저장 (한 번만 실행되도록 보장)
  useEffect(() => {
    // 이미 저장했거나 필요한 데이터가 없으면 종료
    if (hasSavedRef.current || !location.state || !user || !questions) {
      return;
    }

    const saveInterview = async () => {
      // 저장 시작 전에 플래그 설정하여 중복 저장 방지
      hasSavedRef.current = true;

      // AI 생성 질문인 경우 jobType에 기업명 포함
      const finalJobType = useCustom && companyName 
        ? `ai-${companyName}` 
        : jobType;
      
      const interviewData = {
        jobType: finalJobType,
        difficulty,
        questions,
        answers,
        feedbacks,
        score: calculateScore(),
        completedAt: new Date().toISOString(),
        mode: interviewMode, // 모드 정보 추가
        companyName: companyName || null, // AI 생성 질문인 경우 기업명 저장
        useCustom: useCustom || false
      };

      try {
        // MongoDB에 저장 시도 (백엔드가 있는 경우)
        if (user.id) {
          try {
            await interviewAPI.saveInterview({
              ...interviewData,
              userId: user.id
            });
            console.log("MongoDB에 면접 기록 저장 완료");
          } catch (error) {
            console.log("MongoDB 저장 실패, 로컬 스토리지 사용:", error);
          }
        }

        // 로컬 스토리지에도 저장
        const savedInterviews = JSON.parse(
          localStorage.getItem(`interviews_${user.email}`) || "[]"
        );
        
        // 중복 저장 방지: 같은 시간(초 단위)에 저장된 기록이 있는지 확인
        const now = new Date();
        const currentTimestamp = Math.floor(now.getTime() / 1000); // 초 단위 타임스탬프
        
        const isDuplicate = savedInterviews.some(interview => {
          if (!interview.completedAt) return false;
          const interviewTimestamp = Math.floor(new Date(interview.completedAt).getTime() / 1000);
          // 같은 초에 저장된 기록이 있고, 같은 직무와 난이도인 경우 중복으로 간주
          // AI 생성 질문인 경우 companyName도 비교
          const sameJobType = interview.jobType === finalJobType || 
            (useCustom && companyName && interview.companyName === companyName);
          return Math.abs(interviewTimestamp - currentTimestamp) < 2 && 
                 sameJobType && 
                 interview.difficulty === difficulty;
        });

        if (!isDuplicate) {
          savedInterviews.push({
            ...interviewData,
            id: Date.now().toString()
          });
          localStorage.setItem(
            `interviews_${user.email}`,
            JSON.stringify(savedInterviews)
          );
          console.log("로컬 스토리지에 면접 기록 저장 완료");
        } else {
          console.log("중복 저장 방지: 이미 저장된 면접 기록입니다.");
        }
      } catch (error) {
        console.error("면접 기록 저장 실패:", error);
        hasSavedRef.current = false; // 오류 발생 시 플래그 리셋하여 재시도 가능하게
      }
    };

    saveInterview();
  }, [location.state, user, jobType, difficulty, questions, answers, feedbacks]);

  if (!location.state) {
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
        <AlertTriangle size={48} color="#f59e0b" style={{ marginBottom: "20px" }} />
        <h3 style={{ color: "#374151", marginBottom: "8px" }}>면접 데이터가 없습니다</h3>
        <p style={{ color: "#6b7280", marginBottom: "20px" }}>
          면접을 먼저 완료해주세요.
        </p>
        <button
          onClick={() => navigate("/")}
          style={{
            padding: "12px 24px",
            backgroundColor: "#3b82f6",
            color: "white",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer"
          }}
        >
          홈으로 돌아가기
        </button>
      </div>
    );
  }

  const score = calculateScore();
  const totalQuestions = questions?.length || 0;
  const answeredQuestions = Object.keys(answers || {}).length;

  const getScoreColor = (score) => {
    if (score >= 80) return "#10b981";
    if (score >= 60) return "#f59e0b";
    return "#ef4444";
  };

  const getScoreText = (score) => {
    if (score >= 80) return "우수";
    if (score >= 60) return "보통";
    return "개선 필요";
  };

  const handleRestart = () => {
    navigate("/");
  };

  const handleRetrySameInterview = () => {
    navigate(`/interview?job=${encodeURIComponent(jobType)}&difficulty=${difficulty}&mode=${interviewMode}`);
  };

  const handleGoToMyPage = () => {
    navigate("/mypage");
  };

  // 개선 제안 생성
  const getImprovementSuggestions = () => {
    const suggestions = [];
    
    if (score < 60) {
      suggestions.push({
        icon: "📝",
        title: "답변 완성도 개선",
        description: "모든 질문에 답변을 완료하면 점수가 크게 향상됩니다."
      });
    }
    
    if (answeredQuestions < totalQuestions) {
      const unansweredCount = totalQuestions - answeredQuestions;
      suggestions.push({
        icon: "💡",
        title: `${unansweredCount}개 질문 미답변`,
        description: "모든 질문에 답변하는 것이 면접에서 중요합니다."
      });
    }

    // 답변 길이 분석
    const answerLengths = Object.values(answers || {}).map(a => a.length);
    const avgLength = answerLengths.length > 0 
      ? answerLengths.reduce((a, b) => a + b, 0) / answerLengths.length 
      : 0;
    
    if (avgLength < 50) {
      suggestions.push({
        icon: "✍️",
        title: "답변 상세도 개선",
        description: "답변을 더 구체적이고 상세하게 작성하면 좋은 평가를 받을 수 있습니다."
      });
    }

    if (score >= 80) {
      suggestions.push({
        icon: "🎉",
        title: "훌륭한 성과입니다!",
        description: "계속 연습하며 더 나은 답변을 준비해보세요."
      });
    } else if (score >= 60) {
      suggestions.push({
        icon: "📈",
        title: "좋은 시작입니다",
        description: "약간의 개선으로 더 높은 점수를 받을 수 있습니다."
      });
    }

    return suggestions;
  };


  return (
    <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
      {/* 헤더 */}
      <div style={{
        backgroundColor: "white",
        borderRadius: "16px",
        padding: "24px",
        marginBottom: "20px",
        boxShadow: "0 4px 6px rgba(0,0,0,0.1)"
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <button
            onClick={() => navigate("/")}
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
          
          <div style={{ display: "flex", gap: "12px" }}>
            <button
              onClick={handleRetrySameInterview}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "8px 16px",
                backgroundColor: "#8b5cf6",
                color: "white",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                fontSize: "14px"
              }}
            >
              <BookOpen size={16} />
              다시 연습
            </button>
            <button
              onClick={handleGoToMyPage}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "8px 16px",
                backgroundColor: "#6b7280",
                color: "white",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                fontSize: "14px"
              }}
            >
              <User size={16} />
              내 기록
            </button>
            <button
              onClick={handleRestart}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "8px 16px",
                backgroundColor: "#3b82f6",
                color: "white",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                fontSize: "14px"
              }}
            >
              <RotateCcw size={16} />
              새 면접
            </button>
          </div>
        </div>

        <h1 style={{ 
          margin: 0, 
          color: "#1f2937",
          fontSize: "2rem",
          fontWeight: "700",
          textAlign: "center"
        }}>
          면접 결과 리포트
        </h1>
      </div>

      {/* 점수 카드 */}
      <div style={{
        backgroundColor: "white",
        borderRadius: "16px",
        padding: "32px",
        marginBottom: "20px",
        boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
        textAlign: "center"
      }}>
        <div style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: "120px",
          height: "120px",
          borderRadius: "50%",
          backgroundColor: `${getScoreColor(score)}20`,
          marginBottom: "20px"
        }}>
          <div style={{
            fontSize: "2.5rem",
            fontWeight: "700",
            color: getScoreColor(score)
          }}>
            {score}
          </div>
        </div>
        
        <h2 style={{ 
          margin: "0 0 8px 0", 
          color: "#1f2937",
          fontSize: "1.5rem"
        }}>
          {getScoreText(score)}
        </h2>
        
        <p style={{ 
          margin: 0, 
          color: "#6b7280",
          fontSize: "1.1rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "8px"
        }}>
          {getJobTypeLabel(jobType)} 면접 - {getDifficultyLabel(difficulty)} 난이도
          <span style={{
            padding: "4px 12px",
            borderRadius: "12px",
            fontSize: "0.9rem",
            fontWeight: "600",
            backgroundColor: interviewMode === "real" ? "#fef2f2" : "#f0fdf4",
            color: interviewMode === "real" ? "#ef4444" : "#10b981"
          }}>
            {interviewMode === "real" ? "실전" : "연습"}
          </span>
        </p>
      </div>

      {/* 통계 카드들 */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
        gap: "20px",
        marginBottom: "20px"
      }}>
        <div style={{
          backgroundColor: "white",
          borderRadius: "12px",
          padding: "24px",
          textAlign: "center",
          boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
        }}>
          <Target size={32} color="#3b82f6" style={{ marginBottom: "12px" }} />
          <div style={{ fontSize: "2rem", fontWeight: "700", color: "#1f2937", marginBottom: "4px" }}>
            {answeredQuestions}/{totalQuestions}
          </div>
          <div style={{ color: "#6b7280", fontSize: "14px" }}>답변 완료</div>
        </div>
        
        <div style={{
          backgroundColor: "white",
          borderRadius: "12px",
          padding: "24px",
          textAlign: "center",
          boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
        }}>
          <Clock size={32} color="#10b981" style={{ marginBottom: "12px" }} />
          <div style={{ fontSize: "2rem", fontWeight: "700", color: "#1f2937", marginBottom: "4px" }}>
            {difficulty === "easy" ? "2" : difficulty === "medium" ? "3" : "4"}분
          </div>
          <div style={{ color: "#6b7280", fontSize: "14px" }}>질문당 제한시간</div>
        </div>
        
        <div style={{
          backgroundColor: "white",
          borderRadius: "12px",
          padding: "24px",
          textAlign: "center",
          boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
        }}>
          <MessageSquare size={32} color="#8b5cf6" style={{ marginBottom: "12px" }} />
          <div style={{ fontSize: "2rem", fontWeight: "700", color: "#1f2937", marginBottom: "4px" }}>
            {Object.keys(feedbacks || {}).length}
          </div>
          <div style={{ color: "#6b7280", fontSize: "14px" }}>피드백 받음</div>
        </div>
      </div>

      {/* 개선 제안 섹션 */}
      {getImprovementSuggestions().length > 0 && (
        <div style={{
          backgroundColor: "white",
          borderRadius: "16px",
          padding: "24px",
          marginBottom: "20px",
          boxShadow: "0 4px 6px rgba(0,0,0,0.1)"
        }}>
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            marginBottom: "20px"
          }}>
            <Lightbulb size={24} color="#f59e0b" />
            <h3 style={{
              margin: 0,
              color: "#1f2937",
              fontSize: "1.3rem",
              fontWeight: "600"
            }}>
              개선 제안
            </h3>
          </div>
          
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
            gap: "16px"
          }}>
            {getImprovementSuggestions().map((suggestion, index) => (
              <div
                key={index}
                style={{
                  padding: "16px",
                  backgroundColor: "#fef3c7",
                  borderRadius: "12px",
                  border: "1px solid #fde68a"
                }}
              >
                <div style={{
                  fontSize: "24px",
                  marginBottom: "8px"
                }}>
                  {suggestion.icon}
                </div>
                <h4 style={{
                  margin: "0 0 6px 0",
                  color: "#1f2937",
                  fontSize: "16px",
                  fontWeight: "600"
                }}>
                  {suggestion.title}
                </h4>
                <p style={{
                  margin: 0,
                  color: "#6b7280",
                  fontSize: "14px",
                  lineHeight: "1.5"
                }}>
                  {suggestion.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 질문별 상세 결과 */}
      <div style={{
        backgroundColor: "white",
        borderRadius: "16px",
        padding: "24px",
        boxShadow: "0 4px 6px rgba(0,0,0,0.1)"
      }}>
        <h3 style={{ 
          margin: "0 0 20px 0", 
          color: "#1f2937",
          fontSize: "1.3rem",
          fontWeight: "600"
        }}>
          질문별 상세 결과
        </h3>
        
        {questions?.map((question, index) => (
          <div key={index} style={{
            marginBottom: "24px",
            padding: "20px",
            border: "1px solid #e5e7eb",
            borderRadius: "12px",
            backgroundColor: "#f9fafb"
          }}>
            <div style={{ marginBottom: "12px" }}>
              <div style={{ 
                display: "flex", 
                alignItems: "center", 
                gap: "8px",
                marginBottom: "8px"
              }}>
                <span style={{ 
                  fontSize: "14px", 
                  color: "#6b7280",
                  fontWeight: "500"
                }}>
                  질문 {index + 1}
                </span>
                {answers?.[index] && (
                  <CheckCircle size={16} color="#10b981" />
                )}
              </div>
              <div style={{ 
                fontSize: "16px", 
                color: "#1f2937",
                fontWeight: "500",
                lineHeight: "1.5"
              }}>
                {question.question}
              </div>
            </div>
            
            {answers?.[index] && (
              <div style={{ marginBottom: "12px" }}>
                <div style={{ 
                  fontSize: "14px", 
                  color: "#6b7280",
                  marginBottom: "6px",
                  fontWeight: "500"
                }}>
                  답변:
                </div>
                <div style={{ 
                  padding: "12px",
                  backgroundColor: "white",
                  borderRadius: "8px",
                  border: "1px solid #d1d5db",
                  fontSize: "14px",
                  lineHeight: "1.5",
                  color: "#374151"
                }}>
                  {answers[index]}
                </div>
              </div>
            )}
            
            {(feedbacks?.[index] || feedbacks?.[String(index)] || feedbacks?.[question.id]) && (() => {
              const feedbackData = feedbacks[index] || feedbacks[String(index)] || feedbacks[question.id];
              const feedbackText = typeof feedbackData === 'string' 
                ? feedbackData 
                : feedbackData.feedback || "";
              
              return (
                <div>
                  <div style={{ 
                    fontSize: "14px", 
                    color: "#6b7280",
                    marginBottom: "6px",
                    fontWeight: "500",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px"
                  }}>
                    AI 피드백:
                    {typeof feedbackData === 'object' && feedbackData.score !== undefined && (
                      <span style={{
                        padding: "2px 8px",
                        borderRadius: "12px",
                        fontSize: "12px",
                        fontWeight: "600",
                        backgroundColor: feedbackData.score >= 80 ? "#d1fae5" : feedbackData.score >= 60 ? "#fef3c7" : "#fee2e2",
                        color: feedbackData.score >= 80 ? "#065f46" : feedbackData.score >= 60 ? "#92400e" : "#991b1b"
                      }}>
                        {feedbackData.score}점
                      </span>
                    )}
                  </div>
                  <div style={{ 
                    padding: "12px",
                    backgroundColor: "#eff6ff",
                    borderRadius: "8px",
                    border: "1px solid #0ea5e9",
                    fontSize: "14px",
                    lineHeight: "1.5",
                    color: "#0c4a6e",
                    whiteSpace: "pre-wrap"
                  }}>
                    {feedbackText}
                  </div>
                  {typeof feedbackData === 'object' && feedbackData.evaluation && (
                    <div style={{
                      marginTop: "8px",
                      padding: "8px",
                      backgroundColor: "#f9fafb",
                      borderRadius: "6px",
                      fontSize: "12px",
                      color: "#6b7280"
                    }}>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "4px" }}>
                        <div>완성도: {feedbackData.evaluation.completeness}점</div>
                        <div>관련성: {feedbackData.evaluation.relevance}점</div>
                        <div>명확성: {feedbackData.evaluation.clarity}점</div>
                        <div>구체성: {feedbackData.evaluation.detail}점</div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        ))}
      </div>
    </div>
  );
}
