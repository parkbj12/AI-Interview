import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Mic, Clock, Brain, Target, ArrowRight, BookOpen, Plus, Sparkles, Loader2 } from "lucide-react";
import { generateCompanyQuestions } from "../api/api";

export default function Home() {
  const [jobType, setJobType] = useState("");
  const [difficulty, setDifficulty] = useState("medium");
  const [mode, setMode] = useState("practice"); // "practice" 또는 "real"
  const [questionCount, setQuestionCount] = useState(5); // 질문 개수
  const [questionSource, setQuestionSource] = useState("default"); // "default", "ai", 또는 "custom"
  const [companyName, setCompanyName] = useState("");
  const [aiJobType, setAiJobType] = useState("");
  const [aiDifficulty, setAiDifficulty] = useState("medium");
  const [aiQuestionCount, setAiQuestionCount] = useState(5);
  const [generatedQuestions, setGeneratedQuestions] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  const jobOptions = [
    // IT/기술직
    { value: "developer", label: "개발자", icon: "💻" },
    { value: "designer", label: "디자이너", icon: "🎨" },
    { value: "data-scientist", label: "데이터 사이언티스트", icon: "📊" },
    { value: "product-manager", label: "프로덕트 매니저", icon: "🚀" },
    { value: "planner", label: "기획자", icon: "📋" },
    { value: "marketer", label: "마케터", icon: "📈" },
    
    // 일반 사무직
    { value: "sales", label: "영업", icon: "🤝" },
    { value: "hr", label: "인사", icon: "👥" },
    { value: "finance", label: "재무/회계", icon: "💰" },
    { value: "admin", label: "총무/행정", icon: "📄" },
    { value: "customer-service", label: "고객서비스", icon: "🎧" },
    
    // 전문직
    { value: "teacher", label: "교사", icon: "👨‍🏫" },
    { value: "nurse", label: "간호사", icon: "👩‍⚕️" },
    { value: "lawyer", label: "변호사", icon: "⚖️" },
    { value: "accountant", label: "회계사", icon: "🧮" },
    
    // 서비스업
    { value: "retail", label: "유통/판매", icon: "🛍️" },
    { value: "hospitality", label: "호텔/관광", icon: "🏨" },
    { value: "food-service", label: "외식업", icon: "🍽️" },
    
    // 제조업
    { value: "manufacturing", label: "제조업", icon: "🏭" },
    { value: "quality-control", label: "품질관리", icon: "🔍" },
    { value: "logistics", label: "물류/운송", icon: "🚚" }
  ];

  const difficultyOptions = [
    { value: "easy", label: "초급", description: "기본적인 질문들" },
    { value: "medium", label: "중급", description: "실무 중심 질문들" },
    { value: "hard", label: "고급", description: "심화된 기술 질문들" }
  ];

  const handleGenerateQuestions = async () => {
    if (!companyName.trim()) {
      alert("기업명을 입력해주세요!");
      return;
    }
    if (!aiJobType) {
      alert("직무를 선택해주세요!");
      return;
    }
    
    setIsGenerating(true);
    try {
      const questions = await generateCompanyQuestions(
        companyName.trim(),
        aiJobType,
        aiDifficulty,
        aiQuestionCount
      );
      setGeneratedQuestions(questions);
    } catch (error) {
      console.error("질문 생성 실패:", error);
      alert("질문 생성에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleStartWithAIQuestions = () => {
    if (!generatedQuestions || generatedQuestions.length === 0) {
      alert("먼저 질문을 생성해주세요!");
      return;
    }
    navigate("/interview", {
      state: {
        customQuestions: generatedQuestions,
        useCustom: true,
        jobType: "ai-generated",
        difficulty: aiDifficulty,
        companyName: companyName
      }
    });
  };

  const handleStart = () => {
    if (!user) {
      alert("면접을 시작하려면 먼저 로그인해주세요.");
      navigate("/login");
      return;
    }
    
    if (questionSource === "ai") {
      if (!generatedQuestions || generatedQuestions.length === 0) {
        alert("먼저 질문을 생성해주세요!");
        return;
      }
      handleStartWithAIQuestions();
      return;
    }
    
    if (!jobType) {
      alert("직무를 선택해주세요!");
      return;
    }
    navigate(`/interview?job=${encodeURIComponent(jobType)}&difficulty=${difficulty}&mode=${mode}&count=${questionCount}`);
  };

  const handleVideoStart = () => {
    if (!user) {
      alert("영상 면접을 시작하려면 먼저 로그인해주세요.");
      navigate("/login");
      return;
    }
    
    if (questionSource === "ai") {
      if (!generatedQuestions || generatedQuestions.length === 0) {
        alert("먼저 질문을 생성해주세요!");
        return;
      }
      navigate("/video-interview", {
        state: {
          customQuestions: generatedQuestions,
          useCustom: true,
          jobType: "ai-generated",
          difficulty: aiDifficulty,
          companyName: companyName
        }
      });
      return;
    }
    
    if (!jobType) {
      alert("직무를 선택해주세요!");
      return;
    }
    navigate(`/video-interview?job=${encodeURIComponent(jobType)}&difficulty=${difficulty}&mode=${mode}&count=${questionCount}`);
  };

  return (
    <div style={{ 
      textAlign: "center", 
      marginTop: 20,
      maxWidth: "800px",
      margin: "0 auto"
    }}>
      {/* 메인 카드 */}
      <div style={{
        backgroundColor: "white",
        borderRadius: "16px",
        padding: "40px",
        boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
        marginBottom: "30px"
      }}>
        <h2 style={{ 
          fontSize: "2rem", 
          marginBottom: "16px",
          color: "#1f2937",
          fontWeight: "700"
        }}>
          AI 모의면접 시스템
        </h2>
        <p style={{ 
          fontSize: "1.1rem", 
          color: "#6b7280",
          marginBottom: "24px",
          lineHeight: "1.6"
        }}>
          음성 인식과 AI 피드백으로 완벽한 면접 준비를 시작하세요
        </p>

        {/* 질문 소스 탭 */}
        <div style={{
          display: "flex",
          gap: "8px",
          marginBottom: "30px",
          justifyContent: "center",
          flexWrap: "wrap"
        }}>
          <button
            onClick={() => setQuestionSource("default")}
            style={{
              padding: "10px 24px",
              backgroundColor: questionSource === "default" ? "#3b82f6" : "white",
              color: questionSource === "default" ? "white" : "#6b7280",
              border: questionSource === "default" ? "none" : "2px solid #e5e7eb",
              borderRadius: "8px",
              cursor: "pointer",
              fontSize: "15px",
              fontWeight: "500",
              transition: "all 0.2s ease"
            }}
          >
            기본 질문
          </button>
          <button
            onClick={() => {
              if (!user) {
                alert("AI 질문 생성을 사용하려면 먼저 로그인해주세요.");
                navigate("/login");
                return;
              }
              setQuestionSource("ai");
            }}
            style={{
              padding: "10px 24px",
              backgroundColor: questionSource === "ai" ? "#8b5cf6" : "white",
              color: questionSource === "ai" ? "white" : "#6b7280",
              border: questionSource === "ai" ? "none" : "2px solid #e5e7eb",
              borderRadius: "8px",
              cursor: "pointer",
              fontSize: "15px",
              fontWeight: "500",
              transition: "all 0.2s ease"
            }}
          >
            🤖 AI 질문 생성
          </button>
        </div>

        {/* AI 질문 생성 섹션 */}
        {questionSource === "ai" && user && (
          <div style={{
            backgroundColor: "#faf5ff",
            border: "2px solid #8b5cf6",
            borderRadius: "12px",
            padding: "24px",
            marginBottom: "24px"
          }}>
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              marginBottom: "20px"
            }}>
              <Sparkles size={24} color="#8b5cf6" />
              <h3 style={{
                margin: 0,
                color: "#6b21a8",
                fontSize: "1.3rem",
                fontWeight: "600"
              }}>
                AI로 기업별 질문 생성
              </h3>
            </div>
            <p style={{
              margin: "0 0 20px 0",
              color: "#6b7280",
              fontSize: "14px"
            }}>
              원하는 기업명과 직무를 입력하면 해당 기업에 맞는 면접 질문을 AI가 자동으로 생성해드립니다.
            </p>

            {/* 기업명 입력 */}
            <div style={{ marginBottom: "16px" }}>
              <label style={{
                display: "block",
                marginBottom: "8px",
                color: "#374151",
                fontWeight: "500",
                fontSize: "14px"
              }}>
                기업명 *
              </label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="예: 삼성전자, 네이버, 카카오 등"
                style={{
                  width: "100%",
                  padding: "12px",
                  border: "1px solid #d1d5db",
                  borderRadius: "8px",
                  fontSize: "16px"
                }}
              />
            </div>

            {/* 직무 입력 */}
            <div style={{ marginBottom: "16px" }}>
              <label style={{
                display: "block",
                marginBottom: "8px",
                color: "#374151",
                fontWeight: "500",
                fontSize: "14px"
              }}>
                직무 *
              </label>
              <input
                type="text"
                value={aiJobType}
                onChange={(e) => setAiJobType(e.target.value)}
                placeholder="예: 백엔드 개발자, 프론트엔드 개발자, UI/UX 디자이너 등"
                style={{
                  width: "100%",
                  padding: "12px",
                  border: "1px solid #d1d5db",
                  borderRadius: "8px",
                  fontSize: "16px"
                }}
              />
            </div>

            {/* 난이도 및 개수 선택 */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "16px",
              marginBottom: "20px"
            }}>
              <div>
                <label style={{
                  display: "block",
                  marginBottom: "8px",
                  color: "#374151",
                  fontWeight: "500",
                  fontSize: "14px"
                }}>
                  난이도
                </label>
                <select
                  value={aiDifficulty}
                  onChange={(e) => setAiDifficulty(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "12px",
                    border: "1px solid #d1d5db",
                    borderRadius: "8px",
                    fontSize: "16px"
                  }}
                >
                  <option value="easy">초급</option>
                  <option value="medium">중급</option>
                  <option value="hard">고급</option>
                </select>
              </div>
              <div>
                <label style={{
                  display: "block",
                  marginBottom: "8px",
                  color: "#374151",
                  fontWeight: "500",
                  fontSize: "14px"
                }}>
                  질문 개수
                </label>
                <select
                  value={aiQuestionCount}
                  onChange={(e) => setAiQuestionCount(Number(e.target.value))}
                  style={{
                    width: "100%",
                    padding: "12px",
                    border: "1px solid #d1d5db",
                    borderRadius: "8px",
                    fontSize: "16px"
                  }}
                >
                  <option value={3}>3개</option>
                  <option value={5}>5개</option>
                  <option value={7}>7개</option>
                  <option value={10}>10개</option>
                </select>
              </div>
            </div>

            {/* 생성 버튼 */}
            <button
              onClick={handleGenerateQuestions}
              disabled={isGenerating || !companyName.trim() || !aiJobType}
              style={{
                width: "100%",
                padding: "14px",
                backgroundColor: isGenerating || !companyName.trim() || !aiJobType ? "#9ca3af" : "#8b5cf6",
                color: "white",
                border: "none",
                borderRadius: "8px",
                fontSize: "16px",
                fontWeight: "600",
                cursor: isGenerating || !companyName.trim() || !aiJobType ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px"
              }}
            >
              {isGenerating ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  질문을 생성하고 있습니다. 잠시만 기다려주세요...
                </>
              ) : (
                <>
                  <Sparkles size={20} />
                  질문 생성하기
                </>
              )}
            </button>

            {/* 생성 중 안내 메시지 */}
            {isGenerating && (
              <div style={{
                marginTop: "16px",
                padding: "16px",
                backgroundColor: "#fef3c7",
                border: "1px solid #f59e0b",
                borderRadius: "8px",
                display: "flex",
                alignItems: "center",
                gap: "12px"
              }}>
                <Loader2 size={20} color="#f59e0b" className="animate-spin" />
                <div>
                  <p style={{
                    margin: 0,
                    color: "#92400e",
                    fontWeight: "600",
                    fontSize: "14px"
                  }}>
                    질문을 생성하고 있습니다. 잠시만 기다려주세요
                  </p>
                  <p style={{
                    margin: "4px 0 0 0",
                    color: "#78350f",
                    fontSize: "12px"
                  }}>
                    AI가 {companyName}의 {aiJobType} 직무에 맞는 면접 질문을 생성 중입니다...
                  </p>
                </div>
              </div>
            )}

            {/* 생성된 질문 표시 */}
            {generatedQuestions && generatedQuestions.length > 0 && (
              <div style={{
                marginTop: "24px",
                padding: "20px",
                backgroundColor: "white",
                borderRadius: "8px",
                border: "1px solid #e5e7eb"
              }}>
                <h4 style={{
                  margin: "0 0 16px 0",
                  color: "#1f2937",
                  fontSize: "18px",
                  fontWeight: "600"
                }}>
                  생성된 질문 ({generatedQuestions.length}개)
                </h4>
                <div style={{
                  maxHeight: "300px",
                  overflowY: "auto"
                }}>
                  {generatedQuestions.map((q, index) => (
                    <div
                      key={q.id || index}
                      style={{
                        padding: "12px",
                        marginBottom: "8px",
                        backgroundColor: "#f9fafb",
                        borderRadius: "6px",
                        fontSize: "14px",
                        color: "#374151"
                      }}
                    >
                      {index + 1}. {q.question}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 직무 선택 (기본 질문일 때만 표시) */}
        {questionSource === "default" && (
        <div style={{ marginBottom: "30px" }}>
          <h3 style={{ 
            fontSize: "1.2rem", 
            marginBottom: "20px",
            color: "#374151",
            fontWeight: "600",
            textAlign: "center"
          }}>
            직무를 선택하세요
          </h3>
          
          {/* IT/기술직 */}
          <div style={{ marginBottom: "24px" }}>
            <h4 style={{ 
              fontSize: "1rem", 
              marginBottom: "12px",
              color: "#6b7280",
              fontWeight: "500",
              textAlign: "left"
            }}>
              💻 IT/기술직
            </h4>
            <div style={{ 
              display: "grid", 
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              gap: "8px"
            }}>
              {jobOptions.slice(0, 6).map((job) => (
                <button
                  key={job.value}
                  onClick={() => setJobType(job.value)}
                  style={{
                    padding: "12px 16px",
                    border: jobType === job.value ? "2px solid #3b82f6" : "2px solid #e5e7eb",
                    borderRadius: "8px",
                    backgroundColor: jobType === job.value ? "#eff6ff" : "white",
                    cursor: "pointer",
                    transition: "all 0.3s ease",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                    fontSize: "14px",
                    fontWeight: "500",
                    minHeight: "48px"
                  }}
                >
                  <span style={{ fontSize: "16px" }}>{job.icon}</span>
                  {job.label}
                </button>
              ))}
            </div>
          </div>

          {/* 일반 사무직 */}
          <div style={{ marginBottom: "24px" }}>
            <h4 style={{ 
              fontSize: "1rem", 
              marginBottom: "12px",
              color: "#6b7280",
              fontWeight: "500",
              textAlign: "left"
            }}>
              📋 일반 사무직
            </h4>
            <div style={{ 
              display: "grid", 
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              gap: "8px"
            }}>
              {jobOptions.slice(6, 11).map((job) => (
                <button
                  key={job.value}
                  onClick={() => setJobType(job.value)}
                  style={{
                    padding: "12px 16px",
                    border: jobType === job.value ? "2px solid #3b82f6" : "2px solid #e5e7eb",
                    borderRadius: "8px",
                    backgroundColor: jobType === job.value ? "#eff6ff" : "white",
                    cursor: "pointer",
                    transition: "all 0.3s ease",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                    fontSize: "14px",
                    fontWeight: "500",
                    minHeight: "48px"
                  }}
                >
                  <span style={{ fontSize: "16px" }}>{job.icon}</span>
                  {job.label}
                </button>
              ))}
            </div>
          </div>

          {/* 전문직 */}
          <div style={{ marginBottom: "24px" }}>
            <h4 style={{ 
              fontSize: "1rem", 
              marginBottom: "12px",
              color: "#6b7280",
              fontWeight: "500",
              textAlign: "left"
            }}>
              🎓 전문직
            </h4>
            <div style={{ 
              display: "grid", 
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              gap: "8px"
            }}>
              {jobOptions.slice(11, 15).map((job) => (
                <button
                  key={job.value}
                  onClick={() => setJobType(job.value)}
                  style={{
                    padding: "12px 16px",
                    border: jobType === job.value ? "2px solid #3b82f6" : "2px solid #e5e7eb",
                    borderRadius: "8px",
                    backgroundColor: jobType === job.value ? "#eff6ff" : "white",
                    cursor: "pointer",
                    transition: "all 0.3s ease",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                    fontSize: "14px",
                    fontWeight: "500",
                    minHeight: "48px"
                  }}
                >
                  <span style={{ fontSize: "16px" }}>{job.icon}</span>
                  {job.label}
                </button>
              ))}
            </div>
          </div>

          {/* 서비스업 & 제조업 */}
          <div style={{ marginBottom: "24px" }}>
            <h4 style={{ 
              fontSize: "1rem", 
              marginBottom: "12px",
              color: "#6b7280",
              fontWeight: "500",
              textAlign: "left"
            }}>
              🏢 서비스업 & 제조업
            </h4>
            <div style={{ 
              display: "grid", 
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              gap: "8px"
            }}>
              {jobOptions.slice(15).map((job) => (
                <button
                  key={job.value}
                  onClick={() => setJobType(job.value)}
                  style={{
                    padding: "12px 16px",
                    border: jobType === job.value ? "2px solid #3b82f6" : "2px solid #e5e7eb",
                    borderRadius: "8px",
                    backgroundColor: jobType === job.value ? "#eff6ff" : "white",
                    cursor: "pointer",
                    transition: "all 0.3s ease",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                    fontSize: "14px",
                    fontWeight: "500",
                    minHeight: "48px"
                  }}
                >
                  <span style={{ fontSize: "16px" }}>{job.icon}</span>
                  {job.label}
                </button>
              ))}
            </div>
          </div>
        </div>
        )}

        {/* 모드 선택 */}
        {questionSource === "default" && (
        <>
        <div style={{ marginBottom: "30px" }}>
          <h3 style={{ 
            fontSize: "1.2rem", 
            marginBottom: "20px",
            color: "#374151",
            fontWeight: "600"
          }}>
            모드를 선택하세요
          </h3>
          <div style={{ 
            display: "flex", 
            gap: "12px",
            justifyContent: "center",
            flexWrap: "wrap",
            marginBottom: "20px"
          }}>
            <button
              onClick={() => setMode("practice")}
              style={{
                padding: "16px 24px",
                border: mode === "practice" ? "2px solid #10b981" : "2px solid #e5e7eb",
                borderRadius: "12px",
                backgroundColor: mode === "practice" ? "#f0fdf4" : "white",
                cursor: "pointer",
                transition: "all 0.3s ease",
                flex: "1",
                minWidth: "200px",
                textAlign: "left"
              }}
            >
              <div style={{ fontSize: "24px", marginBottom: "8px" }}>🎯</div>
              <div style={{ fontWeight: "600", marginBottom: "4px", fontSize: "16px" }}>연습 모드</div>
              <div style={{ fontSize: "12px", color: "#6b7280", lineHeight: "1.4" }}>
                • 시간 제한 완화<br/>
                • 즉시 피드백 제공<br/>
                • 여러 번 재시도 가능
              </div>
            </button>
            <button
              onClick={() => setMode("real")}
              style={{
                padding: "16px 24px",
                border: mode === "real" ? "2px solid #ef4444" : "2px solid #e5e7eb",
                borderRadius: "12px",
                backgroundColor: mode === "real" ? "#fef2f2" : "white",
                cursor: "pointer",
                transition: "all 0.3s ease",
                flex: "1",
                minWidth: "200px",
                textAlign: "left"
              }}
            >
              <div style={{ fontSize: "24px", marginBottom: "8px" }}>⚡</div>
              <div style={{ fontWeight: "600", marginBottom: "4px", fontSize: "16px" }}>실전 모드</div>
              <div style={{ fontSize: "12px", color: "#6b7280", lineHeight: "1.4" }}>
                • 엄격한 시간 제한<br/>
                • 면접 완료 후 피드백<br/>
                • 실제 면접과 유사
              </div>
            </button>
          </div>
        </div>

        {/* 난이도 선택 */}
        <div style={{ marginBottom: "30px" }}>
          <h3 style={{ 
            fontSize: "1.2rem", 
            marginBottom: "20px",
            color: "#374151",
            fontWeight: "600"
          }}>
            난이도를 선택하세요
          </h3>
          <div style={{ 
            display: "flex", 
            gap: "12px",
            justifyContent: "center",
            flexWrap: "wrap"
          }}>
            {difficultyOptions.map((diff) => (
              <button
                key={diff.value}
                onClick={() => setDifficulty(diff.value)}
                style={{
                  padding: "12px 20px",
                  border: difficulty === diff.value ? "2px solid #3b82f6" : "2px solid #e5e7eb",
                  borderRadius: "8px",
                  backgroundColor: difficulty === diff.value ? "#eff6ff" : "white",
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                  minWidth: "120px"
                }}
              >
                <div style={{ fontWeight: "600", marginBottom: "4px" }}>{diff.label}</div>
                <div style={{ fontSize: "12px", color: "#6b7280" }}>{diff.description}</div>
              </button>
            ))}
          </div>
        </div>
        </>
        )}

        {/* 질문 개수 선택 (기본 질문일 때만 표시) */}
        {questionSource === "default" && (
        <div style={{ marginBottom: "30px" }}>
          <h3 style={{ 
            fontSize: "1.2rem", 
            marginBottom: "20px",
            color: "#374151",
            fontWeight: "600"
          }}>
            질문 개수를 선택하세요
          </h3>
          <div style={{ 
            display: "flex", 
            gap: "12px",
            justifyContent: "center",
            flexWrap: "wrap"
          }}>
            {[3, 5, 7].map((count) => (
              <button
                key={count}
                onClick={() => setQuestionCount(count)}
                style={{
                  padding: "12px 20px",
                  border: questionCount === count ? "2px solid #10b981" : "2px solid #e5e7eb",
                  borderRadius: "8px",
                  backgroundColor: questionCount === count ? "#ecfdf5" : "white",
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                  fontSize: "1rem",
                  fontWeight: "600",
                  color: questionCount === count ? "#10b981" : "#6b7280",
                  minWidth: "80px"
                }}
              >
                {count}개
              </button>
            ))}
          </div>
        </div>
        )}

        {/* 시작 버튼 */}
        <div style={{ display: "flex", gap: "16px", justifyContent: "center", flexWrap: "wrap" }}>
          <button
            onClick={handleVideoStart}
            disabled={(questionSource === "default" && !jobType) || !user}
            style={{
              padding: "16px 32px",
              fontSize: "18px",
              fontWeight: "600",
              backgroundColor: ((questionSource === "default" && jobType) || (questionSource === "ai" && generatedQuestions && generatedQuestions.length > 0)) && user ? "#8b5cf6" : "#9ca3af",
              color: "white",
              border: "none",
              borderRadius: "12px",
              cursor: ((questionSource === "default" && jobType) || (questionSource === "ai" && generatedQuestions && generatedQuestions.length > 0)) && user ? "pointer" : "not-allowed",
              transition: "all 0.3s ease",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              boxShadow: ((questionSource === "default" && jobType) || (questionSource === "ai" && generatedQuestions && generatedQuestions.length > 0)) && user ? "0 4px 12px rgba(139, 92, 246, 0.4)" : "none"
            }}
          >
            <span style={{ fontSize: "20px" }}>📹</span>
            영상면접 시작
          </button>
          
          <button
            onClick={handleStart}
            disabled={((questionSource === "default" && !jobType) || (questionSource === "ai" && (!generatedQuestions || generatedQuestions.length === 0))) || !user}
            style={{
              padding: "16px 32px",
              fontSize: "18px",
              fontWeight: "600",
              backgroundColor: ((questionSource === "default" && jobType) || (questionSource === "ai" && generatedQuestions && generatedQuestions.length > 0)) && user ? "#10b981" : "#9ca3af",
              color: "white",
              border: "none",
              borderRadius: "12px",
              cursor: ((questionSource === "default" && jobType) || (questionSource === "ai" && generatedQuestions && generatedQuestions.length > 0)) && user ? "pointer" : "not-allowed",
              transition: "all 0.3s ease",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              boxShadow: ((questionSource === "default" && jobType) || (questionSource === "ai" && generatedQuestions && generatedQuestions.length > 0)) && user ? "0 4px 12px rgba(16, 185, 129, 0.4)" : "none"
            }}
          >
            <ArrowRight size={20} />
            텍스트 면접
          </button>
        </div>
        
        {!user && (
          <div style={{
            marginTop: "20px",
            padding: "16px",
            backgroundColor: "#fef3c7",
            borderRadius: "12px",
            border: "1px solid #f59e0b",
            textAlign: "center"
          }}>
            <p style={{ margin: 0, color: "#92400e", fontSize: "14px" }}>
              💡 면접을 시작하려면 먼저 <strong>로그인</strong>이 필요합니다.
            </p>
          </div>
        )}
      </div>

      {/* 기능 소개 */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
        gap: "20px",
        marginTop: "30px"
      }}>
        <div style={{
          backgroundColor: "rgba(255,255,255,0.9)",
          padding: "24px",
          borderRadius: "12px",
          textAlign: "center"
        }}>
          <Mic size={32} color="#3b82f6" style={{ marginBottom: "12px" }} />
          <h4 style={{ margin: "0 0 8px 0", color: "#1f2937" }}>음성 인식</h4>
          <p style={{ margin: 0, color: "#6b7280", fontSize: "14px" }}>
            음성으로 답변하고 실시간 텍스트 변환
          </p>
        </div>
        
        <div style={{
          backgroundColor: "rgba(255,255,255,0.9)",
          padding: "24px",
          borderRadius: "12px",
          textAlign: "center"
        }}>
          <Clock size={32} color="#10b981" style={{ marginBottom: "12px" }} />
          <h4 style={{ margin: "0 0 8px 0", color: "#1f2937" }}>타이머</h4>
          <p style={{ margin: 0, color: "#6b7280", fontSize: "14px" }}>
            실제 면접과 같은 시간 제한
          </p>
        </div>
        
        <div style={{
          backgroundColor: "rgba(255,255,255,0.9)",
          padding: "24px",
          borderRadius: "12px",
          textAlign: "center"
        }}>
          <Brain size={32} color="#8b5cf6" style={{ marginBottom: "12px" }} />
          <h4 style={{ margin: "0 0 8px 0", color: "#1f2937" }}>AI 피드백</h4>
          <p style={{ margin: 0, color: "#6b7280", fontSize: "14px" }}>
            상세한 답변 분석과 개선점 제시
          </p>
        </div>
      </div>
    </div>
  );
}
