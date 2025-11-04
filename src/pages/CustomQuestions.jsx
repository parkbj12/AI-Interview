import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Plus, Edit2, Trash2, Play, Save, X, ArrowLeft } from "lucide-react";

export default function CustomQuestions() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [questions, setQuestions] = useState([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [newQuestion, setNewQuestion] = useState({ question: "", difficulty: "medium", jobType: "custom" });
  const [selectedQuestions, setSelectedQuestions] = useState([]);

  // 로컬 스토리지에서 사용자 질문 불러오기
  useEffect(() => {
    if (user) {
      const savedQuestions = JSON.parse(
        localStorage.getItem(`custom_questions_${user.email}`) || "[]"
      );
      setQuestions(savedQuestions);
    }
  }, [user]);

  // 질문 저장
  const saveQuestions = (updatedQuestions) => {
    if (user) {
      localStorage.setItem(
        `custom_questions_${user.email}`,
        JSON.stringify(updatedQuestions)
      );
      setQuestions(updatedQuestions);
    }
  };

  // 질문 추가
  const handleAddQuestion = () => {
    if (!newQuestion.question.trim()) {
      alert("질문을 입력해주세요.");
      return;
    }

    const question = {
      id: Date.now(),
      question: newQuestion.question.trim(),
      difficulty: newQuestion.difficulty,
      jobType: newQuestion.jobType,
      createdAt: new Date().toISOString()
    };

    const updatedQuestions = [...questions, question];
    saveQuestions(updatedQuestions);
    setNewQuestion({ question: "", difficulty: "medium", jobType: "custom" });
    setIsAdding(false);
  };

  // 질문 수정
  const handleEditQuestion = (id, updatedQuestion) => {
    const updatedQuestions = questions.map(q =>
      q.id === id ? { ...q, question: updatedQuestion.question.trim(), difficulty: updatedQuestion.difficulty } : q
    );
    saveQuestions(updatedQuestions);
    setEditingId(null);
  };

  // 질문 삭제
  const handleDeleteQuestion = (id) => {
    if (window.confirm("이 질문을 삭제하시겠습니까?")) {
      const updatedQuestions = questions.filter(q => q.id !== id);
      saveQuestions(updatedQuestions);
      setSelectedQuestions(selectedQuestions.filter(sid => sid !== id));
    }
  };

  // 질문 선택 토글
  const toggleQuestionSelection = (id) => {
    setSelectedQuestions(prev =>
      prev.includes(id)
        ? prev.filter(sid => sid !== id)
        : [...prev, id]
    );
  };

  // 선택한 질문으로 면접 시작
  const handleStartInterview = (isVideo = false) => {
    if (selectedQuestions.length === 0) {
      alert("면접에 사용할 질문을 최소 1개 이상 선택해주세요.");
      return;
    }

    const selectedQ = questions.filter(q => selectedQuestions.includes(q.id));
    const path = isVideo ? "/video-interview" : "/interview";
    navigate(path, {
      state: {
        customQuestions: selectedQ,
        useCustom: true,
        jobType: "custom",
        difficulty: "medium"
      }
    });
  };

  const getDifficultyLabel = (difficulty) => {
    const map = { easy: "초급", medium: "중급", hard: "고급" };
    return map[difficulty] || difficulty;
  };

  const getDifficultyColor = (difficulty) => {
    const map = { easy: "#10b981", medium: "#f59e0b", hard: "#ef4444" };
    return map[difficulty] || "#6b7280";
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

          {selectedQuestions.length > 0 && (
            <div style={{ display: "flex", gap: "8px" }}>
              <button
                onClick={() => handleStartInterview(false)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "10px 20px",
                  backgroundColor: "#10b981",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontSize: "16px",
                  fontWeight: "600"
                }}
              >
                <Play size={18} />
                텍스트 면접 ({selectedQuestions.length}개)
              </button>
              <button
                onClick={() => handleStartInterview(true)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "10px 20px",
                  backgroundColor: "#8b5cf6",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontSize: "16px",
                  fontWeight: "600"
                }}
              >
                <Play size={18} />
                영상 면접 ({selectedQuestions.length}개)
              </button>
            </div>
          )}
        </div>

        <h1 style={{
          margin: 0,
          color: "#1f2937",
          fontSize: "2rem",
          fontWeight: "700",
          textAlign: "center"
        }}>
          내 질문 관리
        </h1>
        <p style={{
          margin: "8px 0 0 0",
          color: "#6b7280",
          textAlign: "center"
        }}>
          면접 연습에 사용할 질문을 추가하고 관리하세요
        </p>
      </div>

      {/* 질문 추가 버튼 */}
      {!isAdding && (
        <div style={{ marginBottom: "20px" }}>
          <button
            onClick={() => setIsAdding(true)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "12px 24px",
              backgroundColor: "#3b82f6",
              color: "white",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              fontSize: "16px",
              fontWeight: "500"
            }}
          >
            <Plus size={20} />
            질문 추가
          </button>
        </div>
      )}

      {/* 질문 추가 폼 */}
      {isAdding && (
        <div style={{
          backgroundColor: "white",
          borderRadius: "12px",
          padding: "24px",
          marginBottom: "20px",
          boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
        }}>
          <h3 style={{ margin: "0 0 16px 0", color: "#1f2937" }}>새 질문 추가</h3>
          <textarea
            value={newQuestion.question}
            onChange={(e) => setNewQuestion({ ...newQuestion, question: e.target.value })}
            placeholder="질문을 입력하세요..."
            style={{
              width: "100%",
              minHeight: "100px",
              padding: "12px",
              border: "1px solid #d1d5db",
              borderRadius: "8px",
              fontSize: "16px",
              marginBottom: "12px",
              fontFamily: "inherit"
            }}
          />
          <div style={{ display: "flex", gap: "12px", marginBottom: "16px" }}>
            <select
              value={newQuestion.difficulty}
              onChange={(e) => setNewQuestion({ ...newQuestion, difficulty: e.target.value })}
              style={{
                padding: "8px 12px",
                border: "1px solid #d1d5db",
                borderRadius: "8px",
                fontSize: "14px"
              }}
            >
              <option value="easy">초급</option>
              <option value="medium">중급</option>
              <option value="hard">고급</option>
            </select>
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <button
              onClick={handleAddQuestion}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "10px 20px",
                backgroundColor: "#10b981",
                color: "white",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer"
              }}
            >
              <Save size={16} />
              저장
            </button>
            <button
              onClick={() => {
                setIsAdding(false);
                setNewQuestion({ question: "", difficulty: "medium", jobType: "custom" });
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "10px 20px",
                backgroundColor: "#6b7280",
                color: "white",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer"
              }}
            >
              <X size={16} />
              취소
            </button>
          </div>
        </div>
      )}

      {/* 질문 목록 */}
      <div style={{
        backgroundColor: "white",
        borderRadius: "16px",
        padding: "24px",
        boxShadow: "0 4px 6px rgba(0,0,0,0.1)"
      }}>
        {questions.length === 0 ? (
          <div style={{
            textAlign: "center",
            padding: "60px 20px",
            color: "#6b7280"
          }}>
            <p style={{ fontSize: "18px", marginBottom: "8px" }}>등록된 질문이 없습니다</p>
            <p style={{ fontSize: "14px" }}>위의 "질문 추가" 버튼을 눌러 질문을 추가해보세요.</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {questions.map((q) => (
              <div
                key={q.id}
                style={{
                  padding: "16px",
                  border: selectedQuestions.includes(q.id) ? "2px solid #3b82f6" : "1px solid #e5e7eb",
                  borderRadius: "8px",
                  backgroundColor: selectedQuestions.includes(q.id) ? "#eff6ff" : "#f9fafb",
                  cursor: "pointer",
                  transition: "all 0.2s ease"
                }}
                onClick={() => toggleQuestionSelection(q.id)}
              >
                {editingId === q.id ? (
                  <QuestionEditForm
                    question={q}
                    onSave={(updated) => handleEditQuestion(q.id, updated)}
                    onCancel={() => setEditingId(null)}
                  />
                ) : (
                  <>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                      <div style={{ flex: 1 }}>
                        <div style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          marginBottom: "8px"
                        }}>
                          <span style={{
                            padding: "4px 10px",
                            borderRadius: "12px",
                            fontSize: "12px",
                            fontWeight: "600",
                            backgroundColor: `${getDifficultyColor(q.difficulty)}20`,
                            color: getDifficultyColor(q.difficulty)
                          }}>
                            {getDifficultyLabel(q.difficulty)}
                          </span>
                          {selectedQuestions.includes(q.id) && (
                            <span style={{
                              padding: "4px 10px",
                              borderRadius: "12px",
                              fontSize: "12px",
                              fontWeight: "600",
                              backgroundColor: "#3b82f6",
                              color: "white"
                            }}>
                              선택됨
                            </span>
                          )}
                        </div>
                        <p style={{
                          margin: 0,
                          fontSize: "16px",
                          color: "#1f2937",
                          lineHeight: "1.5"
                        }}>
                          {q.question}
                        </p>
                      </div>
                      <div style={{ display: "flex", gap: "4px", marginLeft: "12px" }}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingId(q.id);
                          }}
                          style={{
                            padding: "6px",
                            backgroundColor: "transparent",
                            border: "1px solid #d1d5db",
                            borderRadius: "6px",
                            cursor: "pointer",
                            color: "#6b7280"
                          }}
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteQuestion(q.id);
                          }}
                          style={{
                            padding: "6px",
                            backgroundColor: "transparent",
                            border: "1px solid #d1d5db",
                            borderRadius: "6px",
                            cursor: "pointer",
                            color: "#ef4444"
                          }}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// 질문 수정 폼 컴포넌트
function QuestionEditForm({ question, onSave, onCancel }) {
  const [editedQuestion, setEditedQuestion] = useState({
    question: question.question,
    difficulty: question.difficulty
  });

  return (
    <div>
      <textarea
        value={editedQuestion.question}
        onChange={(e) => setEditedQuestion({ ...editedQuestion, question: e.target.value })}
        style={{
          width: "100%",
          minHeight: "80px",
          padding: "12px",
          border: "1px solid #d1d5db",
          borderRadius: "8px",
          fontSize: "16px",
          marginBottom: "12px",
          fontFamily: "inherit"
        }}
      />
      <select
        value={editedQuestion.difficulty}
        onChange={(e) => setEditedQuestion({ ...editedQuestion, difficulty: e.target.value })}
        style={{
          padding: "8px 12px",
          border: "1px solid #d1d5db",
          borderRadius: "8px",
          fontSize: "14px",
          marginBottom: "12px"
        }}
      >
        <option value="easy">초급</option>
        <option value="medium">중급</option>
        <option value="hard">고급</option>
      </select>
      <div style={{ display: "flex", gap: "8px" }}>
        <button
          onClick={() => onSave(editedQuestion)}
          style={{
            padding: "8px 16px",
            backgroundColor: "#10b981",
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            fontSize: "14px"
          }}
        >
          저장
        </button>
        <button
          onClick={onCancel}
          style={{
            padding: "8px 16px",
            backgroundColor: "#6b7280",
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            fontSize: "14px"
          }}
        >
          취소
        </button>
      </div>
    </div>
  );
}

