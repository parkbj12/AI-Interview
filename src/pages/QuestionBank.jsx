import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { BookOpen, Search, Star, ArrowRight, Filter } from "lucide-react";
import { mockQuestions } from "../api/api";

export default function QuestionBank() {
  const navigate = useNavigate();
  const [selectedJobType, setSelectedJobType] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [favorites, setFavorites] = useState(
    JSON.parse(localStorage.getItem("favoriteQuestions") || "[]")
  );

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

  // 즐겨찾기 토글
  const toggleFavorite = (jobType, questionId) => {
    const key = `${jobType}-${questionId}`;
    const newFavorites = favorites.includes(key)
      ? favorites.filter(f => f !== key)
      : [...favorites, key];
    setFavorites(newFavorites);
    localStorage.setItem("favoriteQuestions", JSON.stringify(newFavorites));
  };

  // 모든 질문 수집
  const allQuestions = [];
  Object.entries(mockQuestions).forEach(([jobType, questions]) => {
    questions.forEach(q => {
      allQuestions.push({
        ...q,
        jobType,
        jobTypeLabel: getJobTypeLabel(jobType)
      });
    });
  });

  // 필터링
  let filteredQuestions = allQuestions;
  
  if (selectedJobType !== "all") {
    filteredQuestions = filteredQuestions.filter(q => q.jobType === selectedJobType);
  }
  
  if (searchQuery) {
    const query = searchQuery.toLowerCase();
    filteredQuestions = filteredQuestions.filter(q =>
      q.question.toLowerCase().includes(query) ||
      q.jobTypeLabel.toLowerCase().includes(query)
    );
  }

  // 직무별 그룹화
  const groupedQuestions = {};
  filteredQuestions.forEach(q => {
    if (!groupedQuestions[q.jobType]) {
      groupedQuestions[q.jobType] = [];
    }
    groupedQuestions[q.jobType].push(q);
  });

  const handleStartInterview = (jobType) => {
    navigate(`/interview?job=${encodeURIComponent(jobType)}&difficulty=medium&mode=practice`);
  };

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
      {/* 헤더 */}
      <div style={{
        backgroundColor: "white",
        borderRadius: "16px",
        padding: "24px",
        marginBottom: "20px",
        boxShadow: "0 4px 6px rgba(0,0,0,0.1)"
      }}>
        <h1 style={{
          margin: 0,
          fontSize: "1.75rem",
          color: "#1f2937",
          fontWeight: "700",
          display: "flex",
          alignItems: "center",
          gap: "12px",
          marginBottom: "8px"
        }}>
          <BookOpen size={28} color="#3b82f6" />
          질문 뱅크
        </h1>
        <p style={{ margin: 0, color: "#6b7280", fontSize: "14px" }}>
          모든 면접 질문을 카테고리별로 탐색하고 연습하세요
        </p>
      </div>

      {/* 검색 및 필터 */}
      <div style={{
        backgroundColor: "white",
        borderRadius: "16px",
        padding: "20px",
        marginBottom: "20px",
        boxShadow: "0 4px 6px rgba(0,0,0,0.1)"
      }}>
        <div style={{
          display: "flex",
          gap: "12px",
          flexWrap: "wrap",
          alignItems: "center"
        }}>
          <div style={{
            flex: 1,
            minWidth: "200px",
            position: "relative"
          }}>
            <Search size={18} style={{
              position: "absolute",
              left: "12px",
              top: "50%",
              transform: "translateY(-50%)",
              color: "#9ca3af"
            }} />
            <input
              type="text"
              placeholder="질문 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: "100%",
                padding: "10px 12px 10px 40px",
                border: "1px solid #d1d5db",
                borderRadius: "8px",
                fontSize: "14px"
              }}
            />
          </div>
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "8px"
          }}>
            <Filter size={18} color="#6b7280" />
            <select
              value={selectedJobType}
              onChange={(e) => setSelectedJobType(e.target.value)}
              style={{
                padding: "10px 12px",
                border: "1px solid #d1d5db",
                borderRadius: "8px",
                fontSize: "14px",
                backgroundColor: "white",
                cursor: "pointer",
                minWidth: "150px"
              }}
            >
              <option value="all">전체 직무</option>
              {Object.keys(mockQuestions).map(jobType => (
                <option key={jobType} value={jobType}>
                  {getJobTypeLabel(jobType)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 통계 */}
      <div style={{
        backgroundColor: "white",
        borderRadius: "16px",
        padding: "20px",
        marginBottom: "20px",
        boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
        display: "flex",
        gap: "24px",
        flexWrap: "wrap"
      }}>
        <div>
          <div style={{ fontSize: "24px", fontWeight: "700", color: "#1f2937" }}>
            {filteredQuestions.length}
          </div>
          <div style={{ fontSize: "14px", color: "#6b7280" }}>총 질문 수</div>
        </div>
        <div>
          <div style={{ fontSize: "24px", fontWeight: "700", color: "#1f2937" }}>
            {Object.keys(groupedQuestions).length}
          </div>
          <div style={{ fontSize: "14px", color: "#6b7280" }}>직무 카테고리</div>
        </div>
        <div>
          <div style={{ fontSize: "24px", fontWeight: "700", color: "#1f2937" }}>
            {favorites.length}
          </div>
          <div style={{ fontSize: "14px", color: "#6b7280" }}>즐겨찾기</div>
        </div>
      </div>

      {/* 질문 목록 */}
      {Object.keys(groupedQuestions).length === 0 ? (
        <div style={{
          backgroundColor: "white",
          borderRadius: "16px",
          padding: "60px",
          textAlign: "center",
          boxShadow: "0 4px 6px rgba(0,0,0,0.1)"
        }}>
          <Search size={48} color="#9ca3af" style={{ marginBottom: "16px", opacity: 0.5 }} />
          <h3 style={{ color: "#374151", marginBottom: "8px" }}>검색 결과가 없습니다</h3>
          <p style={{ color: "#6b7280" }}>다른 검색어로 시도해보세요.</p>
        </div>
      ) : (
        Object.entries(groupedQuestions).map(([jobType, questions]) => (
          <div
            key={jobType}
            style={{
              backgroundColor: "white",
              borderRadius: "16px",
              padding: "24px",
              marginBottom: "20px",
              boxShadow: "0 4px 6px rgba(0,0,0,0.1)"
            }}
          >
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "20px"
            }}>
              <h2 style={{
                margin: 0,
                fontSize: "1.25rem",
                color: "#1f2937",
                fontWeight: "600"
              }}>
                {getJobTypeLabel(jobType)}
                <span style={{
                  marginLeft: "12px",
                  fontSize: "14px",
                  color: "#6b7280",
                  fontWeight: "400"
                }}>
                  ({questions.length}개 질문)
                </span>
              </h2>
              <button
                onClick={() => handleStartInterview(jobType)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "8px 16px",
                  backgroundColor: "#3b82f6",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontSize: "14px",
                  fontWeight: "500"
                }}
              >
                면접 시작
                <ArrowRight size={14} />
              </button>
            </div>
            
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
              gap: "12px"
            }}>
              {questions.map((q) => {
                const isFavorite = favorites.includes(`${jobType}-${q.id}`);
                return (
                  <div
                    key={q.id}
                    style={{
                      padding: "16px",
                      backgroundColor: "#f9fafb",
                      borderRadius: "12px",
                      border: "1px solid #e5e7eb",
                      transition: "all 0.2s ease",
                      cursor: "pointer",
                      position: "relative"
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = "#f3f4f6";
                      e.currentTarget.style.borderColor = "#3b82f6";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "#f9fafb";
                      e.currentTarget.style.borderColor = "#e5e7eb";
                    }}
                  >
                    <div style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      gap: "8px"
                    }}>
                      <div style={{ flex: 1 }}>
                        <div style={{
                          fontSize: "12px",
                          color: "#6b7280",
                          marginBottom: "4px",
                          fontWeight: "500"
                        }}>
                          질문 #{q.id}
                        </div>
                        <div style={{
                          fontSize: "14px",
                          color: "#1f2937",
                          lineHeight: "1.5"
                        }}>
                          {q.question}
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavorite(jobType, q.id);
                        }}
                        style={{
                          backgroundColor: "transparent",
                          border: "none",
                          cursor: "pointer",
                          padding: "4px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center"
                        }}
                      >
                        <Star
                          size={18}
                          color={isFavorite ? "#f59e0b" : "#d1d5db"}
                          fill={isFavorite ? "#f59e0b" : "none"}
                        />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))
      )}
    </div>
  );
}

