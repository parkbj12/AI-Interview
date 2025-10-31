import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { interviewAPI } from "../api/api";
import { ArrowLeft, Star, Clock, Target, MessageSquare, CheckCircle, XCircle } from "lucide-react";

export default function InterviewDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [interview, setInterview] = useState(null);
  const [loading, setLoading] = useState(true);

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

  // 날짜 포맷팅
  const formatDate = (dateString) => {
    if (!dateString) return "날짜 없음";
    const date = new Date(dateString);
    return date.toLocaleString("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  // 면접 데이터 로드
  useEffect(() => {
    const loadInterview = async () => {
      if (!user) return;

      try {
        let interviewData = null;

        // location.state에서 데이터 가져오기 (마이페이지에서 전달된 경우)
        if (location.state?.interview) {
          interviewData = location.state.interview;
        } else {
          // MongoDB에서 로드 시도
          if (user.id) {
            try {
              const interviews = await interviewAPI.getUserInterviews(user.id);
              interviewData = interviews.find(i => (i._id || i.id) === id);
            } catch (error) {
              console.log("MongoDB 로드 실패, 로컬 스토리지 사용:", error);
            }
          }

          // 로컬 스토리지에서 로드
          if (!interviewData) {
            const interviews = JSON.parse(
              localStorage.getItem(`interviews_${user.email}`) || "[]"
            );
            interviewData = interviews.find(i => (i._id || i.id) === id);
          }
        }

        if (interviewData) {
          setInterview(interviewData);
        } else {
          // 면접을 찾을 수 없음
        }
      } catch (error) {
        console.error("면접 로드 실패:", error);
      } finally {
        setLoading(false);
      }
    };

    loadInterview();
  }, [id, user, location.state]);

  if (!user) {
    return (
      <div style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "400px"
      }}>
        <div style={{
          backgroundColor: "white",
          borderRadius: "16px",
          padding: "40px",
          textAlign: "center"
        }}>
          <p style={{ color: "#6b7280", marginBottom: "20px" }}>
            로그인이 필요합니다.
          </p>
          <button
            onClick={() => navigate("/login")}
            style={{
              padding: "12px 24px",
              backgroundColor: "#3b82f6",
              color: "white",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer"
            }}
          >
            로그인하러 가기
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "400px"
      }}>
        <p style={{ color: "white", fontSize: "18px" }}>면접 기록을 불러오는 중...</p>
      </div>
    );
  }

  if (!interview) {
    return (
      <div style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "400px"
      }}>
        <div style={{
          backgroundColor: "white",
          borderRadius: "16px",
          padding: "40px",
          textAlign: "center"
        }}>
          <XCircle size={48} color="#ef4444" style={{ marginBottom: "20px" }} />
          <h3 style={{ color: "#374151", marginBottom: "8px" }}>면접 기록을 찾을 수 없습니다</h3>
          <p style={{ color: "#6b7280", marginBottom: "20px" }}>
            요청하신 면접 기록이 존재하지 않거나 삭제되었습니다.
          </p>
          <button
            onClick={() => navigate("/mypage")}
            style={{
              padding: "12px 24px",
              backgroundColor: "#3b82f6",
              color: "white",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer"
            }}
          >
            마이페이지로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  const questions = interview.questions || [];
  const answers = interview.answers || {};
  const feedbacks = interview.feedbacks || {};
  const score = interview.score || 0;
  const mode = interview.mode || "practice";

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
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: "20px"
        }}>
          <div>
            <button
              onClick={() => navigate("/mypage")}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "8px 16px",
                backgroundColor: "transparent",
                border: "1px solid #d1d5db",
                borderRadius: "8px",
                cursor: "pointer",
                color: "#374151",
                marginBottom: "16px"
              }}
            >
              <ArrowLeft size={16} />
              마이페이지로
            </button>
            <h1 style={{
              margin: 0,
              fontSize: "1.75rem",
              color: "#1f2937",
              fontWeight: "700",
              marginBottom: "8px"
            }}>
              면접 상세 기록
            </h1>
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              flexWrap: "wrap"
            }}>
              <span style={{
                padding: "4px 12px",
                borderRadius: "12px",
                fontSize: "14px",
                backgroundColor: "#eff6ff",
                color: "#3b82f6",
                fontWeight: "500"
              }}>
                {getJobTypeLabel(interview.jobType)}
              </span>
              <span style={{
                padding: "4px 12px",
                borderRadius: "12px",
                fontSize: "14px",
                backgroundColor: "#f3f4f6",
                color: "#6b7280"
              }}>
                {getDifficultyLabel(interview.difficulty)}
              </span>
              <span style={{
                padding: "4px 12px",
                borderRadius: "12px",
                fontSize: "14px",
                backgroundColor: mode === "real" ? "#fef2f2" : "#f0fdf4",
                color: mode === "real" ? "#ef4444" : "#10b981",
                fontWeight: "600"
              }}>
                {mode === "real" ? "실전" : "연습"}
              </span>
              <span style={{
                fontSize: "14px",
                color: "#9ca3af"
              }}>
                {formatDate(interview.completedAt || interview.createdAt)}
              </span>
            </div>
          </div>
          <div style={{
            textAlign: "right"
          }}>
            <div style={{
              fontSize: "3rem",
              fontWeight: "700",
              color: getScoreColor(score),
              marginBottom: "4px"
            }}>
              {score}
            </div>
            <div style={{
              fontSize: "14px",
              color: "#6b7280"
            }}>
              {getScoreText(score)}
            </div>
          </div>
        </div>
      </div>

      {/* 통계 카드 */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
        gap: "16px",
        marginBottom: "20px"
      }}>
        <div style={{
          backgroundColor: "white",
          borderRadius: "12px",
          padding: "24px",
          boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
          textAlign: "center"
        }}>
          <Target size={32} color="#3b82f6" style={{ marginBottom: "12px" }} />
          <div style={{ fontSize: "2rem", fontWeight: "700", color: "#1f2937", marginBottom: "4px" }}>
            {questions.length}
          </div>
          <div style={{ color: "#6b7280", fontSize: "14px" }}>총 질문 수</div>
        </div>
        <div style={{
          backgroundColor: "white",
          borderRadius: "12px",
          padding: "24px",
          boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
          textAlign: "center"
        }}>
          <CheckCircle size={32} color="#10b981" style={{ marginBottom: "12px" }} />
          <div style={{ fontSize: "2rem", fontWeight: "700", color: "#1f2937", marginBottom: "4px" }}>
            {Object.keys(answers).length}
          </div>
          <div style={{ color: "#6b7280", fontSize: "14px" }}>답변 완료</div>
        </div>
        <div style={{
          backgroundColor: "white",
          borderRadius: "12px",
          padding: "24px",
          boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
          textAlign: "center"
        }}>
          <MessageSquare size={32} color="#8b5cf6" style={{ marginBottom: "12px" }} />
          <div style={{ fontSize: "2rem", fontWeight: "700", color: "#1f2937", marginBottom: "4px" }}>
            {Object.keys(feedbacks).length}
          </div>
          <div style={{ color: "#6b7280", fontSize: "14px" }}>피드백 받음</div>
        </div>
      </div>

      {/* 질문별 상세 결과 */}
      <div style={{
        backgroundColor: "white",
        borderRadius: "16px",
        padding: "24px",
        boxShadow: "0 4px 6px rgba(0,0,0,0.1)"
      }}>
        <h2 style={{
          margin: "0 0 24px 0",
          fontSize: "1.25rem",
          color: "#1f2937",
          fontWeight: "600"
        }}>
          질문별 상세 결과
        </h2>
        {questions.map((q, index) => {
          const questionText = typeof q === 'string' ? q : q.question || q;
          const answer = answers[index] || answers[q.id] || "";
          const feedbackData = feedbacks[index] || feedbacks[q.id] || "";
          // 피드백이 객체인 경우 feedback 속성 추출, 문자열인 경우 그대로 사용
          const feedbackText = typeof feedbackData === 'string' 
            ? feedbackData 
            : (feedbackData?.feedback || "");

          return (
            <div
              key={index}
              style={{
                padding: "20px",
                backgroundColor: "#f9fafb",
                borderRadius: "12px",
                marginBottom: "16px",
                border: "1px solid #e5e7eb"
              }}
            >
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                marginBottom: "12px"
              }}>
                <div style={{
                  width: "24px",
                  height: "24px",
                  borderRadius: "50%",
                  backgroundColor: "#3b82f6",
                  color: "white",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "12px",
                  fontWeight: "600"
                }}>
                  {index + 1}
                </div>
                <h3 style={{
                  margin: 0,
                  fontSize: "16px",
                  fontWeight: "600",
                  color: "#1f2937",
                  flex: 1
                }}>
                  {questionText}
                </h3>
                {answer && (
                  <CheckCircle size={20} color="#10b981" />
                )}
              </div>

              {answer ? (
                <>
                  <div style={{
                    marginBottom: "12px",
                    padding: "12px",
                    backgroundColor: "white",
                    borderRadius: "8px",
                    border: "1px solid #e5e7eb"
                  }}>
                    <div style={{
                      fontSize: "12px",
                      color: "#6b7280",
                      marginBottom: "8px",
                      fontWeight: "500"
                    }}>
                      내 답변
                    </div>
                    <div style={{
                      fontSize: "14px",
                      color: "#374151",
                      lineHeight: "1.6",
                      whiteSpace: "pre-wrap"
                    }}>
                      {answer}
                    </div>
                  </div>

                  {feedbackText && (
                    <div style={{
                      padding: "12px",
                      backgroundColor: "#eff6ff",
                      borderRadius: "8px",
                      border: "1px solid #0ea5e9"
                    }}>
                      <div style={{
                        fontSize: "12px",
                        color: "#0369a1",
                        marginBottom: "8px",
                        fontWeight: "600",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px"
                      }}>
                        <MessageSquare size={14} />
                        AI 피드백
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
                        fontSize: "14px",
                        color: "#0c4a6e",
                        lineHeight: "1.6",
                        whiteSpace: "pre-wrap"
                      }}>
                        {feedbackText}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div style={{
                  padding: "12px",
                  backgroundColor: "#fef2f2",
                  borderRadius: "8px",
                  border: "1px solid #fecaca",
                  color: "#991b1b",
                  fontSize: "14px"
                }}>
                  답변하지 않은 질문입니다.
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

