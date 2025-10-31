import React, { useState } from "react";
import { BookOpen, Lightbulb, HelpCircle, CheckCircle, AlertCircle, TrendingUp, Clock, Target, Users } from "lucide-react";

export default function Guide() {
  const [activeTab, setActiveTab] = useState("tips");

  const tabs = [
    { id: "tips", label: "면접 팁", icon: Lightbulb },
    { id: "usage", label: "활용법", icon: BookOpen },
    { id: "faq", label: "FAQ", icon: HelpCircle }
  ];

  const tips = [
    {
      category: "기본 준비",
      items: [
        {
          title: "명확하고 간결한 답변",
          description: "면접관이 이해하기 쉽도록 핵심만 간단명료하게 전달하세요. 불필요한 장황한 설명은 피하세요.",
          icon: Target
        },
        {
          title: "STAR 기법 활용",
          description: "상황(Situation), 과제(Task), 행동(Action), 결과(Result) 구조로 답변을 구성하면 체계적이고 설득력 있는 답변이 됩니다.",
          icon: CheckCircle
        },
        {
          title: "구체적인 예시 제시",
          description: "일반적인 설명보다 실제 경험이나 사례를 들어 설명하면 더 설득력이 있습니다.",
          icon: AlertCircle
        }
      ]
    },
    {
      category: "답변 구성",
      items: [
        {
          title: "시작은 간단히, 본론은 구체적으로",
          description: "먼저 핵심 답변을 한 문장으로 제시하고, 이어서 상세 설명을 덧붙이세요.",
          icon: TrendingUp
        },
        {
          title: "시간 배분",
          description: "1분 이내로 핵심 메시지를 전달하고, 남은 시간에 구체적인 설명을 추가하세요.",
          icon: Clock
        },
        {
          title: "끝맺음 필수",
          description: "답변의 마지막에 핵심을 다시 강조하거나 다음 단계에 대한 의지를 표현하세요.",
          icon: CheckCircle
        }
      ]
    },
    {
      category: "심화 팁",
      items: [
        {
          title: "약점을 강점으로",
          description: "부족한 부분이 있다면 그것을 보완하기 위한 노력과 계획을 함께 설명하세요.",
          icon: Users
        },
        {
          title: "회사와의 연결점 강조",
          description: "자신의 경험과 회사의 비전, 업무를 연결해서 설명하면 높은 평가를 받을 수 있습니다.",
          icon: Target
        },
        {
          title: "긍정적인 태도",
          description: "어려운 상황에서도 긍정적인 마인드셋과 해결 의지를 보여주세요.",
          icon: Lightbulb
        }
      ]
    }
  ];

  const usageGuides = [
    {
      title: "연습 모드 활용법",
      description: "실제 면접 전 충분한 연습을 위한 모드입니다.",
      steps: [
        "시간 제한이 완화되어 여유롭게 답변을 구성할 수 있습니다.",
        "답변 제출 후 즉시 AI 피드백을 받아 실시간으로 개선할 수 있습니다.",
        "같은 면접을 여러 번 반복하여 완벽한 답변을 준비하세요.",
        "다양한 직무와 난이도를 시도하여 폭넓은 준비를 하세요."
      ],
      color: "#10b981"
    },
    {
      title: "실전 모드 활용법",
      description: "실제 면접 환경과 유사한 조건에서 실전 연습을 하세요.",
      steps: [
        "엄격한 시간 제한으로 실제 면접 스트레스를 경험할 수 있습니다.",
        "면접 완료 후 한 번에 피드백을 받아 전체적인 평가를 확인하세요.",
        "시간 관리 연습을 통해 핵심만 전달하는 능력을 기르세요.",
        "실전 점수를 통해 자신의 실력을 객관적으로 파악하세요."
      ],
      color: "#ef4444"
    },
    {
      title: "통계 페이지 활용법",
      description: "자신의 성과를 분석하고 개선점을 찾아보세요.",
      steps: [
        "직무별, 난이도별 성과를 비교하여 강점과 약점을 파악하세요.",
        "성장 추이를 확인하여 연습 효과를 시각적으로 확인하세요.",
        "모드별 성과를 비교하여 어떤 방식이 자신에게 적합한지 분석하세요.",
        "주기적으로 통계를 확인하여 지속적인 개선을 도모하세요."
      ],
      color: "#3b82f6"
    },
    {
      title: "질문 뱅크 활용법",
      description: "모든 질문을 미리 확인하고 준비하세요.",
      steps: [
        "직무별로 질문을 미리 확인하여 예상 질문을 파악하세요.",
        "검색 기능을 활용하여 관심 있는 주제의 질문을 찾아보세요.",
        "즐겨찾기 기능으로 중요한 질문을 저장하여 집중 연습하세요.",
        "질문 카드를 클릭하여 바로 해당 직무의 면접을 시작할 수 있습니다."
      ],
      color: "#8b5cf6"
    }
  ];

  const faqs = [
    {
      question: "연습 모드와 실전 모드의 차이는 무엇인가요?",
      answer: "연습 모드는 시간 제한이 완화되고 즉시 피드백을 받을 수 있어 학습에 집중할 수 있습니다. 실전 모드는 엄격한 시간 제한과 면접 완료 후 피드백을 제공하여 실제 면접 환경과 유사한 연습이 가능합니다."
    },
    {
      question: "점수는 어떻게 계산되나요?",
      answer: "점수는 답변 완성도(답변한 질문 수), 답변 품질(AI 피드백 기반) 등을 종합하여 계산됩니다. 더 많은 질문에 답변하고, 상세하고 구체적인 답변을 작성할수록 높은 점수를 받을 수 있습니다."
    },
    {
      question: "면접 기록은 어디에 저장되나요?",
      answer: "면접 기록은 로컬 스토리지에 저장되며, 백엔드 서버가 연결되어 있으면 MongoDB에도 자동으로 저장됩니다. 마이페이지에서 모든 기록을 확인할 수 있습니다."
    },
    {
      question: "질문을 추가하거나 수정할 수 있나요?",
      answer: "현재는 시스템에 등록된 질문만 사용할 수 있습니다. 질문 추가나 수정은 관리자 권한이 필요하며, 향후 업데이트에서 사용자 맞춤 질문 기능을 추가할 예정입니다."
    },
    {
      question: "피드백의 정확도는 어떤가요?",
      answer: "AI 피드백은 답변의 구조, 완성도, 구체성 등을 분석하여 제공합니다. 하지만 실제 면접관의 평가와는 차이가 있을 수 있으므로 참고 자료로 활용하시기 바랍니다."
    },
    {
      question: "영상 면접과 텍스트 면접의 차이는?",
      answer: "텍스트 면접은 키보드로 답변을 작성하며, 영상 면접은 음성 인식을 통해 말로 답변합니다. 영상 면접은 실제 면접과 더 유사한 환경을 제공합니다."
    }
  ];

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
          학습 가이드
        </h1>
        <p style={{ margin: 0, color: "#6b7280", fontSize: "14px" }}>
          면접 준비에 도움이 되는 팁과 활용법을 확인하세요
        </p>
      </div>

      {/* 탭 */}
      <div style={{
        backgroundColor: "white",
        borderRadius: "16px",
        padding: "8px",
        marginBottom: "20px",
        boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
        display: "flex",
        gap: "8px"
      }}>
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                flex: 1,
                padding: "12px 16px",
                backgroundColor: activeTab === tab.id ? "#3b82f6" : "transparent",
                color: activeTab === tab.id ? "white" : "#6b7280",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: "500",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                transition: "all 0.2s ease"
              }}
            >
              <Icon size={18} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* 콘텐츠 */}
      {activeTab === "tips" && (
        <div>
          {tips.map((category, categoryIndex) => (
            <div
              key={categoryIndex}
              style={{
                backgroundColor: "white",
                borderRadius: "16px",
                padding: "24px",
                marginBottom: "20px",
                boxShadow: "0 4px 6px rgba(0,0,0,0.1)"
              }}
            >
              <h2 style={{
                margin: "0 0 20px 0",
                fontSize: "1.25rem",
                color: "#1f2937",
                fontWeight: "600"
              }}>
                {category.category}
              </h2>
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
                gap: "16px"
              }}>
                {category.items.map((tip, tipIndex) => {
                  const Icon = tip.icon;
                  return (
                    <div
                      key={tipIndex}
                      style={{
                        padding: "20px",
                        backgroundColor: "#f9fafb",
                        borderRadius: "12px",
                        border: "1px solid #e5e7eb"
                      }}
                    >
                      <div style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: "12px"
                      }}>
                        <div style={{
                          padding: "8px",
                          backgroundColor: "#eff6ff",
                          borderRadius: "8px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center"
                        }}>
                          <Icon size={20} color="#3b82f6" />
                        </div>
                        <div style={{ flex: 1 }}>
                          <h3 style={{
                            margin: "0 0 8px 0",
                            fontSize: "16px",
                            fontWeight: "600",
                            color: "#1f2937"
                          }}>
                            {tip.title}
                          </h3>
                          <p style={{
                            margin: 0,
                            fontSize: "14px",
                            color: "#6b7280",
                            lineHeight: "1.6"
                          }}>
                            {tip.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === "usage" && (
        <div>
          {usageGuides.map((guide, index) => (
            <div
              key={index}
              style={{
                backgroundColor: "white",
                borderRadius: "16px",
                padding: "24px",
                marginBottom: "20px",
                boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
                borderLeft: `4px solid ${guide.color}`
              }}
            >
              <h2 style={{
                margin: "0 0 8px 0",
                fontSize: "1.25rem",
                color: "#1f2937",
                fontWeight: "600"
              }}>
                {guide.title}
              </h2>
              <p style={{
                margin: "0 0 20px 0",
                color: "#6b7280",
                fontSize: "14px"
              }}>
                {guide.description}
              </p>
              <ol style={{
                margin: 0,
                paddingLeft: "20px"
              }}>
                {guide.steps.map((step, stepIndex) => (
                  <li
                    key={stepIndex}
                    style={{
                      marginBottom: "12px",
                      fontSize: "14px",
                      color: "#374151",
                      lineHeight: "1.6"
                    }}
                  >
                    {step}
                  </li>
                ))}
              </ol>
            </div>
          ))}
        </div>
      )}

      {activeTab === "faq" && (
        <div>
          {faqs.map((faq, index) => (
            <div
              key={index}
              style={{
                backgroundColor: "white",
                borderRadius: "16px",
                padding: "24px",
                marginBottom: "16px",
                boxShadow: "0 4px 6px rgba(0,0,0,0.1)"
              }}
            >
              <div style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "12px"
              }}>
                <div style={{
                  padding: "8px",
                  backgroundColor: "#fef3c7",
                  borderRadius: "8px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0
                }}>
                  <HelpCircle size={20} color="#f59e0b" />
                </div>
                <div style={{ flex: 1 }}>
                  <h3 style={{
                    margin: "0 0 12px 0",
                    fontSize: "16px",
                    fontWeight: "600",
                    color: "#1f2937"
                  }}>
                    {faq.question}
                  </h3>
                  <p style={{
                    margin: 0,
                    fontSize: "14px",
                    color: "#6b7280",
                    lineHeight: "1.6"
                  }}>
                    {faq.answer}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

