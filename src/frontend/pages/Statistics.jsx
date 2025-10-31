import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { interviewAPI } from "../api/api";
import { 
  BarChart3, 
  TrendingUp, 
  Target, 
  Clock, 
  Star,
  ArrowLeft,
  PieChart,
  Calendar,
  Award,
  AlertCircle
} from "lucide-react";

export default function Statistics() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [interviewHistory, setInterviewHistory] = useState([]);
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

  // 면접 기록 로드
  useEffect(() => {
    const loadInterviews = async () => {
      if (!user) return;

      try {
        // MongoDB에서 로드 시도
        let interviews = [];
        if (user.id) {
          try {
            interviews = await interviewAPI.getUserInterviews(user.id);
          } catch (error) {
            // 네트워크 에러는 조용하게 처리 (정상적인 폴백 동작)
            const isNetworkError = error.code === 'ERR_NETWORK' || error.message === 'Network Error';
            if (!isNetworkError && process.env.NODE_ENV === 'development') {
              console.warn("MongoDB 로드 실패, 로컬 스토리지 사용:", error.message);
            }
          }
        }

        // 로컬 스토리지에서 로드
        if (interviews.length === 0) {
          interviews = JSON.parse(
            localStorage.getItem(`interviews_${user.email}`) || "[]"
          );
        }

        // 날짜순 정렬
        interviews.sort((a, b) => {
          const dateA = new Date(a.completedAt || a.createdAt || a.id);
          const dateB = new Date(b.completedAt || b.createdAt || b.id);
          return dateB - dateA;
        });

        setInterviewHistory(interviews);
      } catch (error) {
        console.error("면접 기록 로드 실패:", error);
      } finally {
        setLoading(false);
      }
    };

    loadInterviews();
  }, [user]);

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
          <AlertCircle size={48} color="#f59e0b" style={{ marginBottom: "20px" }} />
          <h3 style={{ color: "#374151", marginBottom: "8px" }}>로그인이 필요합니다</h3>
          <p style={{ color: "#6b7280", marginBottom: "20px" }}>
            통계를 보려면 먼저 로그인해주세요.
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
        <p style={{ color: "white", fontSize: "18px" }}>통계를 불러오는 중...</p>
      </div>
    );
  }

  // 통계 계산
  const totalInterviews = interviewHistory.length;
  const practiceInterviews = interviewHistory.filter(i => (i.mode || "practice") === "practice").length;
  const realInterviews = interviewHistory.filter(i => (i.mode || "practice") === "real").length;
  
  const averageScore = totalInterviews > 0
    ? Math.round(interviewHistory.reduce((sum, i) => sum + (i.score || 0), 0) / totalInterviews)
    : 0;

  const highestScore = totalInterviews > 0
    ? Math.max(...interviewHistory.map(i => i.score || 0))
    : 0;

  // 직무별 통계
  const jobTypeStats = {};
  interviewHistory.forEach(interview => {
    const jobType = interview.jobType;
    if (!jobTypeStats[jobType]) {
      jobTypeStats[jobType] = { count: 0, totalScore: 0, scores: [] };
    }
    jobTypeStats[jobType].count++;
    jobTypeStats[jobType].totalScore += interview.score || 0;
    jobTypeStats[jobType].scores.push(interview.score || 0);
  });

  const jobTypeStatsArray = Object.entries(jobTypeStats).map(([jobType, stats]) => ({
    jobType,
    count: stats.count,
    averageScore: Math.round(stats.totalScore / stats.count),
    maxScore: Math.max(...stats.scores)
  })).sort((a, b) => b.count - a.count);

  // 난이도별 통계
  const difficultyStats = {
    easy: { count: 0, totalScore: 0 },
    medium: { count: 0, totalScore: 0 },
    hard: { count: 0, totalScore: 0 }
  };

  interviewHistory.forEach(interview => {
    const difficulty = interview.difficulty || "medium";
    if (difficultyStats[difficulty]) {
      difficultyStats[difficulty].count++;
      difficultyStats[difficulty].totalScore += interview.score || 0;
    }
  });

  // 최근 7일간 통계
  const last7Days = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    const dayInterviews = interviewHistory.filter(i => {
      const interviewDate = new Date(i.completedAt || i.createdAt || i.id).toISOString().split('T')[0];
      return interviewDate === dateStr;
    });
    last7Days.push({
      date: dateStr,
      count: dayInterviews.length,
      averageScore: dayInterviews.length > 0
        ? Math.round(dayInterviews.reduce((sum, i) => sum + (i.score || 0), 0) / dayInterviews.length)
        : 0
    });
  }

  // 모드별 통계
  const modeStats = {
    practice: {
      count: practiceInterviews,
      averageScore: practiceInterviews > 0
        ? Math.round(interviewHistory
            .filter(i => (i.mode || "practice") === "practice")
            .reduce((sum, i) => sum + (i.score || 0), 0) / practiceInterviews)
        : 0
    },
    real: {
      count: realInterviews,
      averageScore: realInterviews > 0
        ? Math.round(interviewHistory
            .filter(i => (i.mode || "practice") === "real")
            .reduce((sum, i) => sum + (i.score || 0), 0) / realInterviews)
        : 0
    }
  };

  if (totalInterviews === 0) {
    return (
      <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
        <div style={{
          backgroundColor: "white",
          borderRadius: "16px",
          padding: "40px",
          textAlign: "center",
          boxShadow: "0 4px 6px rgba(0,0,0,0.1)"
        }}>
          <BarChart3 size={64} color="#9ca3af" style={{ marginBottom: "20px", opacity: 0.5 }} />
          <h2 style={{ color: "#374151", marginBottom: "8px" }}>통계 데이터가 없습니다</h2>
          <p style={{ color: "#6b7280", marginBottom: "20px" }}>
            면접을 완료하면 여기에 통계가 표시됩니다.
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
            면접 시작하기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
      {/* 헤더 */}
      <div style={{
        backgroundColor: "white",
        borderRadius: "16px",
        padding: "24px",
        marginBottom: "20px",
        boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center"
      }}>
        <div>
          <h1 style={{
            margin: 0,
            fontSize: "1.75rem",
            color: "#1f2937",
            fontWeight: "700",
            display: "flex",
            alignItems: "center",
            gap: "12px"
          }}>
            <BarChart3 size={28} color="#3b82f6" />
            면접 통계 분석
          </h1>
          <p style={{ margin: "8px 0 0 0", color: "#6b7280", fontSize: "14px" }}>
            전체 성과를 한눈에 확인하세요
          </p>
        </div>
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
            color: "#374151"
          }}
        >
          <ArrowLeft size={16} />
          마이페이지로
        </button>
      </div>

      {/* 전체 통계 카드 */}
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
            {totalInterviews}
          </div>
          <div style={{ color: "#6b7280", fontSize: "14px" }}>총 면접 수</div>
        </div>

        <div style={{
          backgroundColor: "white",
          borderRadius: "12px",
          padding: "24px",
          boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
          textAlign: "center"
        }}>
          <Star size={32} color="#f59e0b" style={{ marginBottom: "12px" }} />
          <div style={{ fontSize: "2rem", fontWeight: "700", color: "#1f2937", marginBottom: "4px" }}>
            {averageScore}
          </div>
          <div style={{ color: "#6b7280", fontSize: "14px" }}>평균 점수</div>
        </div>

        <div style={{
          backgroundColor: "white",
          borderRadius: "12px",
          padding: "24px",
          boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
          textAlign: "center"
        }}>
          <Award size={32} color="#10b981" style={{ marginBottom: "12px" }} />
          <div style={{ fontSize: "2rem", fontWeight: "700", color: "#1f2937", marginBottom: "4px" }}>
            {highestScore}
          </div>
          <div style={{ color: "#6b7280", fontSize: "14px" }}>최고 점수</div>
        </div>

        <div style={{
          backgroundColor: "white",
          borderRadius: "12px",
          padding: "24px",
          boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
          textAlign: "center"
        }}>
          <Calendar size={32} color="#8b5cf6" style={{ marginBottom: "12px" }} />
          <div style={{ fontSize: "2rem", fontWeight: "700", color: "#1f2937", marginBottom: "4px" }}>
            {practiceInterviews}/{realInterviews}
          </div>
          <div style={{ color: "#6b7280", fontSize: "14px" }}>연습/실전</div>
        </div>
      </div>

      {/* 모드별 통계 */}
      <div style={{
        backgroundColor: "white",
        borderRadius: "16px",
        padding: "24px",
        marginBottom: "20px",
        boxShadow: "0 4px 6px rgba(0,0,0,0.1)"
      }}>
        <h2 style={{
          margin: "0 0 20px 0",
          fontSize: "1.25rem",
          color: "#1f2937",
          fontWeight: "600"
        }}>
          모드별 성과
        </h2>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
          gap: "16px"
        }}>
          <div style={{
            padding: "20px",
            backgroundColor: "#f0fdf4",
            borderRadius: "12px",
            border: "2px solid #10b981"
          }}>
            <div style={{ fontSize: "20px", marginBottom: "8px" }}>🎯 연습 모드</div>
            <div style={{ fontSize: "1.5rem", fontWeight: "700", color: "#1f2937", marginBottom: "4px" }}>
              {modeStats.practice.count}회
            </div>
            <div style={{ color: "#6b7280", fontSize: "14px" }}>
              평균 {modeStats.practice.averageScore}점
            </div>
          </div>
          <div style={{
            padding: "20px",
            backgroundColor: "#fef2f2",
            borderRadius: "12px",
            border: "2px solid #ef4444"
          }}>
            <div style={{ fontSize: "20px", marginBottom: "8px" }}>⚡ 실전 모드</div>
            <div style={{ fontSize: "1.5rem", fontWeight: "700", color: "#1f2937", marginBottom: "4px" }}>
              {modeStats.real.count}회
            </div>
            <div style={{ color: "#6b7280", fontSize: "14px" }}>
              평균 {modeStats.real.averageScore}점
            </div>
          </div>
        </div>
      </div>

      {/* 최근 7일 활동 */}
      {last7Days.some(day => day.count > 0) && (
        <div style={{
          backgroundColor: "white",
          borderRadius: "16px",
          padding: "24px",
          marginBottom: "20px",
          boxShadow: "0 4px 6px rgba(0,0,0,0.1)"
        }}>
          <h2 style={{
            margin: "0 0 20px 0",
            fontSize: "1.25rem",
            color: "#1f2937",
            fontWeight: "600"
          }}>
            최근 7일 활동
          </h2>
          <div style={{
            display: "flex",
            alignItems: "flex-end",
            gap: "8px",
            height: "200px",
            padding: "16px 0",
            borderBottom: "2px solid #e5e7eb"
          }}>
            {last7Days.map((day, index) => {
              const maxCount = Math.max(...last7Days.map(d => d.count), 1);
              const heightPercent = maxCount > 0 ? (day.count / maxCount) * 100 : 0;
              const date = new Date(day.date);
              const dayName = ['일', '월', '화', '수', '목', '금', '토'][date.getDay()];

              return (
                <div
                  key={index}
                  style={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "8px",
                    height: "100%"
                  }}
                >
                  <div style={{
                    flex: 1,
                    width: "100%",
                    display: "flex",
                    alignItems: "flex-end",
                    justifyContent: "center"
                  }}>
                    <div
                      style={{
                        width: "100%",
                        height: `${heightPercent}%`,
                        minHeight: heightPercent > 0 ? "4px" : "0",
                        backgroundColor: day.count > 0 ? "#3b82f6" : "#e5e7eb",
                        borderRadius: "4px 4px 0 0",
                        transition: "all 0.3s ease",
                        position: "relative"
                      }}
                      title={`${day.date}: ${day.count}회 (평균 ${day.averageScore}점)`}
                    >
                      {day.count > 0 && (
                        <div style={{
                          position: "absolute",
                          top: "-24px",
                          left: "50%",
                          transform: "translateX(-50%)",
                          fontSize: "11px",
                          color: "#6b7280",
                          fontWeight: "600",
                          whiteSpace: "nowrap"
                        }}>
                          {day.count}
                        </div>
                      )}
                    </div>
                  </div>
                  <div style={{
                    fontSize: "10px",
                    color: "#9ca3af",
                    textAlign: "center"
                  }}>
                    {date.getMonth() + 1}/{date.getDate()}
                    <br />
                    {dayName}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 직무별 통계 */}
      {jobTypeStatsArray.length > 0 && (
        <div style={{
          backgroundColor: "white",
          borderRadius: "16px",
          padding: "24px",
          marginBottom: "20px",
          boxShadow: "0 4px 6px rgba(0,0,0,0.1)"
        }}>
          <h2 style={{
            margin: "0 0 20px 0",
            fontSize: "1.25rem",
            color: "#1f2937",
            fontWeight: "600"
          }}>
            직무별 통계
          </h2>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
            gap: "12px"
          }}>
            {jobTypeStatsArray.map((stat, index) => (
              <div
                key={stat.jobType}
                style={{
                  padding: "16px",
                  backgroundColor: "#f9fafb",
                  borderRadius: "12px",
                  border: "1px solid #e5e7eb"
                }}
              >
                <div style={{
                  fontSize: "16px",
                  fontWeight: "600",
                  color: "#1f2937",
                  marginBottom: "8px"
                }}>
                  {getJobTypeLabel(stat.jobType)}
                </div>
                <div style={{
                  fontSize: "24px",
                  fontWeight: "700",
                  color: "#3b82f6",
                  marginBottom: "4px"
                }}>
                  {stat.count}회
                </div>
                <div style={{
                  fontSize: "14px",
                  color: "#6b7280"
                }}>
                  평균 {stat.averageScore}점
                </div>
                <div style={{
                  fontSize: "12px",
                  color: "#9ca3af",
                  marginTop: "4px"
                }}>
                  최고 {stat.maxScore}점
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 난이도별 통계 */}
      <div style={{
        backgroundColor: "white",
        borderRadius: "16px",
        padding: "24px",
        marginBottom: "20px",
        boxShadow: "0 4px 6px rgba(0,0,0,0.1)"
      }}>
        <h2 style={{
          margin: "0 0 20px 0",
          fontSize: "1.25rem",
          color: "#1f2937",
          fontWeight: "600"
        }}>
          난이도별 통계
        </h2>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "16px"
        }}>
          {Object.entries(difficultyStats).map(([difficulty, stats]) => {
            if (stats.count === 0) return null;
            const difficultyLabels = {
              easy: "초급",
              medium: "중급",
              hard: "고급"
            };
            const colors = {
              easy: "#10b981",
              medium: "#f59e0b",
              hard: "#ef4444"
            };
            const averageScore = Math.round(stats.totalScore / stats.count);

            return (
              <div
                key={difficulty}
                style={{
                  padding: "20px",
                  backgroundColor: `${colors[difficulty]}10`,
                  borderRadius: "12px",
                  border: `2px solid ${colors[difficulty]}`,
                  textAlign: "center"
                }}
              >
                <div style={{
                  fontSize: "18px",
                  fontWeight: "600",
                  color: colors[difficulty],
                  marginBottom: "12px"
                }}>
                  {difficultyLabels[difficulty]}
                </div>
                <div style={{
                  fontSize: "2rem",
                  fontWeight: "700",
                  color: "#1f2937",
                  marginBottom: "4px"
                }}>
                  {stats.count}회
                </div>
                <div style={{
                  fontSize: "14px",
                  color: "#6b7280"
                }}>
                  평균 {averageScore}점
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 성장 추이 */}
      {interviewHistory.length >= 3 && (
        <div style={{
          backgroundColor: "white",
          borderRadius: "16px",
          padding: "24px",
          marginBottom: "20px",
          boxShadow: "0 4px 6px rgba(0,0,0,0.1)"
        }}>
          <h2 style={{
            margin: "0 0 20px 0",
            fontSize: "1.25rem",
            color: "#1f2937",
            fontWeight: "600",
            display: "flex",
            alignItems: "center",
            gap: "8px"
          }}>
            <TrendingUp size={20} color="#10b981" />
            성장 추이
          </h2>
          <div style={{
            display: "flex",
            alignItems: "flex-end",
            gap: "8px",
            height: "250px",
            padding: "16px 0",
            borderBottom: "2px solid #e5e7eb"
          }}>
            {interviewHistory.slice(0, 10).reverse().map((interview, index) => {
              const score = interview.score || 0;
              const maxScore = Math.max(...interviewHistory.map(i => i.score || 0), 100);
              const heightPercent = maxScore > 0 ? (score / maxScore) * 100 : 0;
              const getScoreColor = (score) => {
                if (score >= 80) return "#10b981";
                if (score >= 60) return "#f59e0b";
                return "#ef4444";
              };

              return (
                <div
                  key={interview._id || interview.id}
                  style={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "8px",
                    height: "100%"
                  }}
                >
                  <div style={{
                    flex: 1,
                    width: "100%",
                    display: "flex",
                    alignItems: "flex-end",
                    justifyContent: "center"
                  }}>
                    <div
                      style={{
                        width: "100%",
                        height: `${heightPercent}%`,
                        minHeight: "4px",
                        backgroundColor: getScoreColor(score),
                        borderRadius: "4px 4px 0 0",
                        transition: "all 0.3s ease",
                        cursor: "pointer",
                        position: "relative"
                      }}
                      title={`${score}점`}
                    >
                      <div style={{
                        position: "absolute",
                        top: "-20px",
                        left: "50%",
                        transform: "translateX(-50%)",
                        fontSize: "10px",
                        color: "#6b7280",
                        fontWeight: "600",
                        whiteSpace: "nowrap"
                      }}>
                        {score}
                      </div>
                    </div>
                  </div>
                  <div style={{
                    fontSize: "9px",
                    color: "#9ca3af",
                    textAlign: "center",
                    writingMode: "vertical-rl",
                    transform: "rotate(180deg)"
                  }}>
                    {index + 1}
                  </div>
                </div>
              );
            })}
          </div>
          <div style={{
            marginTop: "12px",
            fontSize: "12px",
            color: "#6b7280",
            textAlign: "center"
          }}>
            최근 10개 면접의 점수 추이
          </div>
        </div>
      )}
    </div>
  );
}

