import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { interviewAPI } from "../api/api";
import { User, Mail, Lock, Edit2, Save, X, AlertCircle, CheckCircle, Clock, Target, FileText, ChevronDown, ChevronUp, MessageSquare, Star, Trash2, Search, Filter, Download, BarChart3, TrendingUp, ChevronLeft, ChevronRight, CheckSquare, Square, ExternalLink } from "lucide-react";

export default function MyPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingPassword, setIsEditingPassword] = useState(false);
  const [name, setName] = useState(user?.name || "");
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [interviewStats, setInterviewStats] = useState({
    totalInterviews: 0,
    totalTime: 0
  });
  const [interviewHistory, setInterviewHistory] = useState([]);
  const [selectedInterview, setSelectedInterview] = useState(null);
  const [expandedInterviews, setExpandedInterviews] = useState(new Set());
  
  // 필터링 및 검색 상태
  const [searchQuery, setSearchQuery] = useState("");
  const [filterJobType, setFilterJobType] = useState("all");
  const [filterDifficulty, setFilterDifficulty] = useState("all");
  const [filterMode, setFilterMode] = useState("all"); // "all", "practice", "real"
  const [sortBy, setSortBy] = useState("date-desc"); // date-desc, date-asc, score-desc, score-asc, job-type
  const [selectedInterviews, setSelectedInterviews] = useState(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

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
    return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  };

  // 면접 기록 확장/축소 토글
  const toggleInterview = (interviewId) => {
    const newExpanded = new Set(expandedInterviews);
    if (newExpanded.has(interviewId)) {
      newExpanded.delete(interviewId);
    } else {
      newExpanded.add(interviewId);
    }
    setExpandedInterviews(newExpanded);
  };

  // 일괄 삭제 모달 핸들러
  const handleBulkDelete = async () => {
    if (selectedInterviews.size === 0) return;
    
    if (!window.confirm(`정말 선택한 ${selectedInterviews.size}개의 면접 기록을 삭제하시겠습니까? 삭제된 기록은 복구할 수 없습니다.`)) {
      return;
    }

    try {
      setLoading(true);
      setError("");
      
      const interviewsToDelete = Array.from(selectedInterviews);
      const savedInterviews = JSON.parse(
        localStorage.getItem(`interviews_${user.email}`) || "[]"
      );

      // MongoDB에서 삭제 시도
      let mongoDeleteSuccess = false;
      for (const interviewId of interviewsToDelete) {
        try {
          await interviewAPI.deleteInterview(interviewId);
          mongoDeleteSuccess = true;
        } catch (error) {
          console.log("MongoDB 삭제 실패:", error);
        }
      }

      // 로컬 스토리지에서 삭제
      const filteredInterviews = savedInterviews.filter(
        (item) => !interviewsToDelete.includes(item._id || item.id)
      );
      localStorage.setItem(
        `interviews_${user.email}`,
        JSON.stringify(filteredInterviews)
      );

      // MongoDB 삭제가 성공했으면 최신 데이터로 동기화
      if (mongoDeleteSuccess && user?.id) {
        try {
          const mongoInterviews = await interviewAPI.getUserInterviews(user.id);
          if (mongoInterviews) {
            localStorage.setItem(
              `interviews_${user.email}`,
              JSON.stringify(mongoInterviews)
            );
          }
        } catch (error) {
          console.log("동기화 실패:", error);
        }
      }

      // MongoDB 삭제가 성공했으면 최신 데이터로 동기화
      let finalInterviews = filteredInterviews;
      if (mongoDeleteSuccess && user?.id) {
        try {
          const mongoInterviews = await interviewAPI.getUserInterviews(user.id);
          if (mongoInterviews) {
            localStorage.setItem(
              `interviews_${user.email}`,
              JSON.stringify(mongoInterviews)
            );
            finalInterviews = mongoInterviews;
          }
        } catch (error) {
          console.log("동기화 실패:", error);
        }
      }

      // 상태 업데이트
      setInterviewHistory(finalInterviews);
      setSelectedInterviews(new Set());
      setShowDeleteModal(false);
      
      // 통계 재계산
      const totalTime = finalInterviews.reduce((sum, interview) => {
        const timeLimit = interview.difficulty === "easy" ? 120 : 
                          interview.difficulty === "medium" ? 180 : 240;
        return sum + (timeLimit * interview.questions?.length || 0);
      }, 0);

      setInterviewStats({
        totalInterviews: finalInterviews.length,
        totalTime: Math.floor(totalTime / 60)
      });

      // 확장 상태에서도 제거
      const newExpanded = new Set(expandedInterviews);
      interviewsToDelete.forEach(id => newExpanded.delete(id));
      setExpandedInterviews(newExpanded);

      setSuccess(`${interviewsToDelete.length}개의 면접 기록이 삭제되었습니다.`);
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      console.error("면접 기록 일괄 삭제 실패:", err);
      setError("면접 기록 삭제에 실패했습니다.");
      setTimeout(() => setError(""), 3000);
    } finally {
      setLoading(false);
    }
  };

  // 필터 변경 시 첫 페이지로 리셋
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterJobType, filterDifficulty, filterMode, sortBy]);

  // 면접 기록 삭제
  const handleDeleteInterview = async (interview) => {
    const interviewId = interview._id || interview.id;
    
    if (!window.confirm("정말 이 면접 기록을 삭제하시겠습니까? 삭제된 기록은 복구할 수 없습니다.")) {
      return;
    }

    try {
      setLoading(true);
      setError("");
      
      // MongoDB에서 삭제 시도 (백엔드가 있는 경우)
      let deleteSuccess = false;
      if (interview._id && user?.id) {
        try {
          await interviewAPI.deleteInterview(interview._id);
          console.log("MongoDB에서 면접 기록 삭제 완료");
          deleteSuccess = true;
        } catch (error) {
          console.log("MongoDB 삭제 실패:", error);
        }
      }

      // 로컬 스토리지에서 삭제
      const savedInterviews = JSON.parse(
        localStorage.getItem(`interviews_${user.email}`) || "[]"
      );
      const filteredInterviews = savedInterviews.filter(
        (item) => (item._id || item.id) !== interviewId
      );
      localStorage.setItem(
        `interviews_${user.email}`,
        JSON.stringify(filteredInterviews)
      );

      // MongoDB 삭제가 성공했으면 최신 데이터로 동기화
      let finalInterviews = filteredInterviews;
      if (deleteSuccess && user?.id) {
        try {
          const mongoInterviews = await interviewAPI.getUserInterviews(user.id);
          if (mongoInterviews) {
            localStorage.setItem(
              `interviews_${user.email}`,
              JSON.stringify(mongoInterviews)
            );
            finalInterviews = mongoInterviews;
          }
        } catch (error) {
          console.log("동기화 실패:", error);
        }
      }

      // 상태 업데이트
      setInterviewHistory(finalInterviews);
      
      // 통계 재계산
      const totalTime = finalInterviews.reduce((sum, interview) => {
        const timeLimit = interview.difficulty === "easy" ? 120 : 
                          interview.difficulty === "medium" ? 180 : 240;
        return sum + (timeLimit * interview.questions?.length || 0);
      }, 0);

      setInterviewStats({
        totalInterviews: finalInterviews.length,
        totalTime: Math.floor(totalTime / 60)
      });

      // 확장 상태에서도 제거
      const newExpanded = new Set(expandedInterviews);
      newExpanded.delete(interviewId);
      setExpandedInterviews(newExpanded);

      setSuccess("면접 기록이 삭제되었습니다.");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      console.error("면접 기록 삭제 실패:", err);
      setError("면접 기록 삭제에 실패했습니다.");
      setTimeout(() => setError(""), 3000);
    } finally {
      setLoading(false);
    }
  };

  // 면접 통계 불러오기
  useEffect(() => {
    const loadInterviewStats = async () => {
      if (!user) return;

      try {
        // 로컬 스토리지에서 면접 기록 가져오기
        const savedInterviews = JSON.parse(
          localStorage.getItem(`interviews_${user.email}`) || "[]"
        );

        // MongoDB API도 시도 (백엔드가 있는 경우)
        try {
          if (user.id) {
            const mongoInterviews = await interviewAPI.getUserInterviews(user.id);
            if (mongoInterviews && mongoInterviews.length > 0) {
              // MongoDB 데이터를 localStorage에 동기화 (삭제된 항목 제거)
              localStorage.setItem(
                `interviews_${user.email}`,
                JSON.stringify(mongoInterviews)
              );

              // MongoDB 데이터 사용
              const totalTime = mongoInterviews.reduce((sum, interview) => {
                const timeLimit = interview.difficulty === "easy" ? 120 : 
                                  interview.difficulty === "medium" ? 180 : 240;
                return sum + (timeLimit * interview.questions?.length || 0);
              }, 0);

              setInterviewStats({
                totalInterviews: mongoInterviews.length,
                totalTime: Math.floor(totalTime / 60) // 분 단위로 변환
              });

              // 면접 기록 정렬 (최신순)
              const sortedInterviews = mongoInterviews.sort((a, b) => {
                const dateA = new Date(a.completedAt || a.createdAt);
                const dateB = new Date(b.completedAt || b.createdAt);
                return dateB - dateA;
              });
              setInterviewHistory(sortedInterviews);
              return;
            } else {
              // MongoDB에 데이터가 없으면 localStorage도 비우기
              localStorage.setItem(`interviews_${user.email}`, "[]");
            }
          }
        } catch (error) {
          // 네트워크 에러는 조용하게 처리 (정상적인 폴백 동작)
          const isNetworkError = error.code === 'ERR_NETWORK' || error.message === 'Network Error';
          if (!isNetworkError && process.env.NODE_ENV === 'development') {
            console.warn("MongoDB API 실패, 로컬 스토리지 사용:", error.message);
          }
        }

        // 로컬 스토리지 데이터 사용
        const totalTime = savedInterviews.reduce((sum, interview) => {
          const timeLimit = interview.difficulty === "easy" ? 120 : 
                            interview.difficulty === "medium" ? 180 : 240;
          return sum + (timeLimit * (interview.questions?.length || 0));
        }, 0);

        setInterviewStats({
          totalInterviews: savedInterviews.length,
          totalTime: Math.floor(totalTime / 60) // 분 단위로 변환
        });

        // 면접 기록 정렬 (최신순)
        const sortedInterviews = savedInterviews.sort((a, b) => {
          const dateA = new Date(a.completedAt || a.id);
          const dateB = new Date(b.completedAt || b.id);
          return dateB - dateA;
        });
        setInterviewHistory(sortedInterviews);
      } catch (error) {
        console.error("면접 통계 로드 실패:", error);
      }
    };

    loadInterviewStats();
  }, [user]);

  // 이름 수정
  const handleUpdateName = () => {
    if (!name.trim()) {
      setError("이름을 입력해주세요.");
      return;
    }

    try {
      const users = JSON.parse(localStorage.getItem("users") || "[]");
      const userIndex = users.findIndex(u => u.email === user.email);
      
      if (userIndex !== -1) {
        users[userIndex].name = name.trim();
        localStorage.setItem("users", JSON.stringify(users));
        
        const updatedUser = { ...user, name: name.trim() };
        localStorage.setItem("user", JSON.stringify(updatedUser));
        
        setSuccess("이름이 변경되었습니다.");
        setIsEditingName(false);
        setTimeout(() => {
          window.location.reload(); // 사용자 정보 갱신
        }, 1000);
      }
    } catch (err) {
      setError("이름 변경에 실패했습니다.");
    }
  };

  // 비밀번호 변경
  const handleUpdatePassword = () => {
    setError("");
    setSuccess("");

    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      setError("모든 필드를 입력해주세요.");
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setError("새 비밀번호는 최소 6자 이상이어야 합니다.");
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError("새 비밀번호가 일치하지 않습니다.");
      return;
    }

    try {
      const users = JSON.parse(localStorage.getItem("users") || "[]");
      const userIndex = users.findIndex(u => u.email === user.email);

      if (userIndex === -1) {
        setError("사용자를 찾을 수 없습니다.");
        return;
      }

      // 현재 비밀번호 확인
      if (users[userIndex].password !== passwordData.currentPassword) {
        setError("현재 비밀번호가 올바르지 않습니다.");
        return;
      }

      // 비밀번호 변경
      users[userIndex].password = passwordData.newPassword;
      localStorage.setItem("users", JSON.stringify(users));

      setSuccess("비밀번호가 변경되었습니다.");
      setIsEditingPassword(false);
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
      });
    } catch (err) {
      setError("비밀번호 변경에 실패했습니다.");
    }
  };

  // 회원 탈퇴
  const handleDeleteAccount = () => {
    if (!window.confirm("정말 탈퇴하시겠습니까? 모든 데이터가 삭제됩니다.")) {
      return;
    }

    try {
      const users = JSON.parse(localStorage.getItem("users") || "[]");
      const filteredUsers = users.filter(u => u.email !== user.email);
      localStorage.setItem("users", JSON.stringify(filteredUsers));
      localStorage.removeItem("user");
      
      logout();
      navigate("/");
    } catch (err) {
      setError("계정 삭제에 실패했습니다.");
    }
  };

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
            마이페이지를 보려면 먼저 로그인해주세요.
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

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto" }}>
      {/* 헤더 */}
      <div style={{
        backgroundColor: "white",
        borderRadius: "16px",
        padding: "32px",
        marginBottom: "20px",
        boxShadow: "0 4px 6px rgba(0,0,0,0.1)"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "24px" }}>
          <div style={{
            width: "80px",
            height: "80px",
            borderRadius: "50%",
            backgroundColor: "#3b82f6",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "2rem",
            color: "white",
            fontWeight: "700"
          }}>
            {user.name?.[0]?.toUpperCase() || "U"}
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: "1.5rem", color: "#1f2937" }}>
              {user.name}님, 안녕하세요!
            </h1>
            <p style={{ margin: "4px 0 0 0", color: "#6b7280", fontSize: "14px" }}>
              {user.email}
            </p>
          </div>
        </div>
      </div>

      {/* 알림 메시지 */}
      {error && (
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          padding: "12px 16px",
          backgroundColor: "#fef2f2",
          border: "1px solid #fecaca",
          borderRadius: "8px",
          marginBottom: "20px",
          color: "#dc2626"
        }}>
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          padding: "12px 16px",
          backgroundColor: "#f0fdf4",
          border: "1px solid #bbf7d0",
          borderRadius: "8px",
          marginBottom: "20px",
          color: "#16a34a"
        }}>
          <CheckCircle size={16} />
          <span>{success}</span>
        </div>
      )}

      {/* 사용자 정보 수정 */}
      <div style={{
        backgroundColor: "white",
        borderRadius: "16px",
        padding: "24px",
        marginBottom: "20px",
        boxShadow: "0 4px 6px rgba(0,0,0,0.1)"
      }}>
        <h2 style={{
          margin: "0 0 24px 0",
          fontSize: "1.25rem",
          color: "#1f2937",
          fontWeight: "600"
        }}>
          내 정보 수정
        </h2>

        {/* 이름 수정 */}
        <div style={{ marginBottom: "24px" }}>
          <label style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            marginBottom: "8px",
            fontSize: "14px",
            fontWeight: "500",
            color: "#374151"
          }}>
            <User size={16} />
            이름
          </label>
          {isEditingName ? (
            <div style={{ display: "flex", gap: "8px" }}>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={{
                  flex: 1,
                  padding: "10px 12px",
                  border: "1px solid #d1d5db",
                  borderRadius: "8px",
                  fontSize: "16px"
                }}
              />
              <button
                onClick={handleUpdateName}
                style={{
                  padding: "10px 16px",
                  backgroundColor: "#10b981",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px"
                }}
              >
                <Save size={16} />
                저장
              </button>
              <button
                onClick={() => {
                  setIsEditingName(false);
                  setName(user.name);
                  setError("");
                }}
                style={{
                  padding: "10px 16px",
                  backgroundColor: "#6b7280",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px"
                }}
              >
                <X size={16} />
                취소
              </button>
            </div>
          ) : (
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "12px",
              backgroundColor: "#f9fafb",
              borderRadius: "8px"
            }}>
              <span style={{ fontSize: "16px", color: "#1f2937" }}>{user.name}</span>
              <button
                onClick={() => setIsEditingName(true)}
                style={{
                  padding: "6px 12px",
                  backgroundColor: "transparent",
                  border: "1px solid #d1d5db",
                  borderRadius: "6px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  fontSize: "14px",
                  color: "#374151"
                }}
              >
                <Edit2 size={14} />
                수정
              </button>
            </div>
          )}
        </div>

        {/* 이메일 (읽기 전용) */}
        <div style={{ marginBottom: "24px" }}>
          <label style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            marginBottom: "8px",
            fontSize: "14px",
            fontWeight: "500",
            color: "#374151"
          }}>
            <Mail size={16} />
            이메일
          </label>
          <div style={{
            padding: "12px",
            backgroundColor: "#f9fafb",
            borderRadius: "8px",
            fontSize: "16px",
            color: "#6b7280"
          }}>
            {user.email}
          </div>
          <p style={{
            margin: "8px 0 0 0",
            fontSize: "12px",
            color: "#9ca3af"
          }}>
            이메일은 변경할 수 없습니다.
          </p>
        </div>

        {/* 비밀번호 변경 */}
        <div>
          <label style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            marginBottom: "8px",
            fontSize: "14px",
            fontWeight: "500",
            color: "#374151"
          }}>
            <Lock size={16} />
            비밀번호
          </label>
          {isEditingPassword ? (
            <div>
              <div style={{ marginBottom: "12px" }}>
                <input
                  type="password"
                  placeholder="현재 비밀번호"
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    border: "1px solid #d1d5db",
                    borderRadius: "8px",
                    fontSize: "16px",
                    boxSizing: "border-box"
                  }}
                />
              </div>
              <div style={{ marginBottom: "12px" }}>
                <input
                  type="password"
                  placeholder="새 비밀번호 (최소 6자)"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    border: "1px solid #d1d5db",
                    borderRadius: "8px",
                    fontSize: "16px",
                    boxSizing: "border-box"
                  }}
                />
              </div>
              <div style={{ marginBottom: "12px" }}>
                <input
                  type="password"
                  placeholder="새 비밀번호 확인"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    border: passwordData.newPassword && passwordData.newPassword !== passwordData.confirmPassword
                      ? "1px solid #ef4444"
                      : "1px solid #d1d5db",
                    borderRadius: "8px",
                    fontSize: "16px",
                    boxSizing: "border-box"
                  }}
                />
                {passwordData.confirmPassword && passwordData.newPassword !== passwordData.confirmPassword && (
                  <p style={{ margin: "4px 0 0 0", fontSize: "12px", color: "#ef4444" }}>
                    비밀번호가 일치하지 않습니다.
                  </p>
                )}
              </div>
              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  onClick={handleUpdatePassword}
                  style={{
                    padding: "10px 16px",
                    backgroundColor: "#10b981",
                    color: "white",
                    border: "none",
                    borderRadius: "8px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px"
                  }}
                >
                  <Save size={16} />
                  변경
                </button>
                <button
                  onClick={() => {
                    setIsEditingPassword(false);
                    setPasswordData({
                      currentPassword: "",
                      newPassword: "",
                      confirmPassword: ""
                    });
                    setError("");
                  }}
                  style={{
                    padding: "10px 16px",
                    backgroundColor: "#6b7280",
                    color: "white",
                    border: "none",
                    borderRadius: "8px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px"
                  }}
                >
                  <X size={16} />
                  취소
                </button>
              </div>
            </div>
          ) : (
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "12px",
              backgroundColor: "#f9fafb",
              borderRadius: "8px"
            }}>
              <span style={{ fontSize: "16px", color: "#6b7280" }}>••••••••</span>
              <button
                onClick={() => setIsEditingPassword(true)}
                style={{
                  padding: "6px 12px",
                  backgroundColor: "transparent",
                  border: "1px solid #d1d5db",
                  borderRadius: "6px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  fontSize: "14px",
                  color: "#374151"
                }}
              >
                <Edit2 size={14} />
                변경
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 면접 통계 */}
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
          alignItems: "center",
          marginBottom: "24px"
        }}>
          <h2 style={{
            margin: 0,
            fontSize: "1.25rem",
            color: "#1f2937",
            fontWeight: "600",
            display: "flex",
            alignItems: "center",
            gap: "8px"
          }}>
            <BarChart3 size={20} />
            면접 통계
          </h2>
          <button
            onClick={() => navigate("/statistics")}
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
            상세 통계 보기
            <ExternalLink size={14} />
          </button>
        </div>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "16px",
          marginBottom: "24px"
        }}>
          <div style={{
            padding: "20px",
            backgroundColor: "#eff6ff",
            borderRadius: "12px",
            textAlign: "center"
          }}>
            <Target size={32} color="#3b82f6" style={{ marginBottom: "8px" }} />
            <div style={{ fontSize: "2rem", fontWeight: "700", color: "#1f2937", marginBottom: "4px" }}>
              {interviewStats.totalInterviews}
            </div>
            <div style={{ fontSize: "14px", color: "#6b7280" }}>완료한 면접</div>
          </div>
          <div style={{
            padding: "20px",
            backgroundColor: "#f0fdf4",
            borderRadius: "12px",
            textAlign: "center"
          }}>
            <Clock size={32} color="#10b981" style={{ marginBottom: "8px" }} />
            <div style={{ fontSize: "2rem", fontWeight: "700", color: "#1f2937", marginBottom: "4px" }}>
              {interviewStats.totalTime}
            </div>
            <div style={{ fontSize: "14px", color: "#6b7280" }}>총 소요 시간 (분)</div>
          </div>
          {(() => {
            const averageScore = interviewHistory.length > 0
              ? Math.round(interviewHistory.reduce((sum, i) => sum + (i.score || 0), 0) / interviewHistory.length)
              : 0;
            return (
              <div style={{
                padding: "20px",
                backgroundColor: "#fef3c7",
                borderRadius: "12px",
                textAlign: "center"
              }}>
                <Star size={32} color="#f59e0b" style={{ marginBottom: "8px" }} />
                <div style={{ fontSize: "2rem", fontWeight: "700", color: "#1f2937", marginBottom: "4px" }}>
                  {averageScore}
                </div>
                <div style={{ fontSize: "14px", color: "#6b7280" }}>평균 점수</div>
              </div>
            );
          })()}
        </div>

        {/* 성능 추이 차트 */}
        {interviewHistory.length > 0 && (() => {
          // 최근 10개 면접 기록으로 성능 추이 분석
          const recentInterviews = [...interviewHistory]
            .sort((a, b) => new Date(b.completedAt || b.createdAt || b.id) - new Date(a.completedAt || a.createdAt || a.id))
            .slice(0, 10)
            .reverse(); // 오래된 순서대로 표시

          const maxScore = Math.max(...recentInterviews.map(i => i.score || 0), 100);
          const minScore = Math.min(...recentInterviews.map(i => i.score || 0), 0);

          return (
            <div style={{
              marginTop: "24px",
              padding: "20px",
              backgroundColor: "#f9fafb",
              borderRadius: "12px",
              border: "1px solid #e5e7eb"
            }}>
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                marginBottom: "16px"
              }}>
                <TrendingUp size={18} color="#3b82f6" />
                <h3 style={{
                  margin: 0,
                  fontSize: "1rem",
                  color: "#1f2937",
                  fontWeight: "600"
                }}>
                  최근 면접 성능 추이
                </h3>
              </div>
              <div style={{
                display: "flex",
                alignItems: "flex-end",
                gap: "8px",
                height: "200px",
                padding: "16px 0",
                borderBottom: "2px solid #e5e7eb",
                position: "relative"
              }}>
                {recentInterviews.map((interview, index) => {
                  const score = interview.score || 0;
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
                          title={`${formatDate(interview.completedAt || interview.createdAt)} - ${score}점`}
                          onMouseEnter={(e) => {
                            e.target.style.opacity = "0.8";
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.opacity = "1";
                          }}
                        >
                          <div style={{
                            position: "absolute",
                            top: "-24px",
                            left: "50%",
                            transform: "translateX(-50%)",
                            fontSize: "11px",
                            color: "#6b7280",
                            fontWeight: "600",
                            whiteSpace: "nowrap",
                            opacity: 0,
                            transition: "opacity 0.2s"
                          }}
                          onMouseEnter={(e) => {
                            e.target.style.opacity = "1";
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.opacity = "0";
                          }}
                          >
                            {score}
                          </div>
                        </div>
                      </div>
                      <div style={{
                        fontSize: "10px",
                        color: "#9ca3af",
                        textAlign: "center",
                        writingMode: recentInterviews.length > 7 ? "vertical-rl" : "horizontal-tb",
                        transform: recentInterviews.length > 7 ? "rotate(180deg)" : "none"
                      }}>
                        {index + 1}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div style={{
                display: "flex",
                justifyContent: "space-between",
                marginTop: "12px",
                fontSize: "12px",
                color: "#6b7280"
              }}>
                <span>최근 {recentInterviews.length}개 면접</span>
                <div style={{ display: "flex", gap: "16px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                    <div style={{ width: "12px", height: "12px", backgroundColor: "#10b981", borderRadius: "2px" }} />
                    <span>80점 이상</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                    <div style={{ width: "12px", height: "12px", backgroundColor: "#f59e0b", borderRadius: "2px" }} />
                    <span>60-79점</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                    <div style={{ width: "12px", height: "12px", backgroundColor: "#ef4444", borderRadius: "2px" }} />
                    <span>60점 미만</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}
      </div>

      {/* 면접 기록 목록 */}
      <div style={{
        backgroundColor: "white",
        borderRadius: "16px",
        padding: "24px",
        marginBottom: "20px",
        boxShadow: "0 4px 6px rgba(0,0,0,0.1)"
      }}>
        <h2 style={{
          margin: "0 0 24px 0",
          fontSize: "1.25rem",
          color: "#1f2937",
          fontWeight: "600",
          display: "flex",
          alignItems: "center",
          gap: "8px"
        }}>
          <FileText size={20} />
          저장된 면접 기록
        </h2>

        {/* 검색 및 필터 영역 */}
        {interviewHistory.length > 0 && (
          <div style={{
            display: "flex",
            flexDirection: "column",
            gap: "12px",
            marginBottom: "24px",
            padding: "16px",
            backgroundColor: "#f9fafb",
            borderRadius: "12px"
          }}>
            {/* 검색창 */}
            <div style={{ position: "relative" }}>
              <Search size={18} style={{
                position: "absolute",
                left: "12px",
                top: "50%",
                transform: "translateY(-50%)",
                color: "#9ca3af"
              }} />
              <input
                type="text"
                placeholder="질문 또는 답변으로 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px 12px 10px 40px",
                  border: "1px solid #d1d5db",
                  borderRadius: "8px",
                  fontSize: "14px",
                  boxSizing: "border-box"
                }}
              />
            </div>

            {/* 필터 및 정렬 */}
            <div style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "12px",
              alignItems: "center"
            }}>
              {/* 직무 타입 필터 */}
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Filter size={16} color="#6b7280" />
                <select
                  value={filterJobType}
                  onChange={(e) => setFilterJobType(e.target.value)}
                  style={{
                    padding: "8px 12px",
                    border: "1px solid #d1d5db",
                    borderRadius: "6px",
                    fontSize: "14px",
                    backgroundColor: "white",
                    cursor: "pointer"
                  }}
                >
                  <option value="all">전체 직무</option>
                  {Array.from(new Set(interviewHistory.map(i => i.jobType))).map(jobType => (
                    <option key={jobType} value={jobType}>{getJobTypeLabel(jobType)}</option>
                  ))}
                </select>
              </div>

              {/* 난이도 필터 */}
              <select
                value={filterDifficulty}
                onChange={(e) => setFilterDifficulty(e.target.value)}
                style={{
                  padding: "8px 12px",
                  border: "1px solid #d1d5db",
                  borderRadius: "6px",
                  fontSize: "14px",
                  backgroundColor: "white",
                  cursor: "pointer"
                }}
              >
                <option value="all">전체 난이도</option>
                <option value="easy">초급</option>
                <option value="medium">중급</option>
                <option value="hard">고급</option>
              </select>

              {/* 정렬 */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                style={{
                  padding: "8px 12px",
                  border: "1px solid #d1d5db",
                  borderRadius: "6px",
                  fontSize: "14px",
                  backgroundColor: "white",
                  cursor: "pointer",
                  marginLeft: "auto"
                }}
              >
                <option value="date-desc">최신순</option>
                <option value="date-asc">오래된순</option>
                <option value="score-desc">점수 높은순</option>
                <option value="score-asc">점수 낮은순</option>
                <option value="job-type">직무별</option>
              </select>
            </div>

            {/* 일괄 선택 및 삭제 */}
            {interviewHistory.length > 0 && (
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                paddingTop: "12px",
                borderTop: "1px solid #e5e7eb"
              }}>
                <button
                  onClick={() => {
                    // 필터링된 면접 기록만 가져오기
                    let filtered = [...interviewHistory];
                    if (searchQuery) {
                      filtered = filtered.filter(interview => {
                        const searchLower = searchQuery.toLowerCase();
                        const questionsText = interview.questions?.map(q => 
                          typeof q === 'string' ? q : q.question
                        ).join(' ') || '';
                        const answersText = Object.values(interview.answers || {}).join(' ') || '';
                        return questionsText.toLowerCase().includes(searchLower) || 
                               answersText.toLowerCase().includes(searchLower) ||
                               getJobTypeLabel(interview.jobType).toLowerCase().includes(searchLower);
                      });
                    }
                    if (filterJobType !== "all") {
                      filtered = filtered.filter(i => i.jobType === filterJobType);
                    }
                    if (filterDifficulty !== "all") {
                      filtered = filtered.filter(i => i.difficulty === filterDifficulty);
                    }
                    if (filterMode !== "all") {
                      filtered = filtered.filter(i => (i.mode || "practice") === filterMode);
                    }
                    
                    const filteredIds = new Set(filtered.map(i => i._id || i.id));
                    const allSelected = filteredIds.size > 0 && Array.from(filteredIds).every(id => selectedInterviews.has(id));
                    
                    if (allSelected) {
                      // 선택 해제
                      const newSelected = new Set(selectedInterviews);
                      filteredIds.forEach(id => newSelected.delete(id));
                      setSelectedInterviews(newSelected);
                    } else {
                      // 전체 선택
                      const newSelected = new Set(selectedInterviews);
                      filteredIds.forEach(id => newSelected.add(id));
                      setSelectedInterviews(newSelected);
                    }
                  }}
                  style={{
                    padding: "6px 12px",
                    backgroundColor: "transparent",
                    border: "1px solid #d1d5db",
                    borderRadius: "6px",
                    fontSize: "13px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    color: "#374151"
                  }}
                >
                  {(() => {
                    let filtered = [...interviewHistory];
                    if (searchQuery) {
                      filtered = filtered.filter(interview => {
                        const searchLower = searchQuery.toLowerCase();
                        const questionsText = interview.questions?.map(q => 
                          typeof q === 'string' ? q : q.question
                        ).join(' ') || '';
                        const answersText = Object.values(interview.answers || {}).join(' ') || '';
                        return questionsText.toLowerCase().includes(searchLower) || 
                               answersText.toLowerCase().includes(searchLower) ||
                               getJobTypeLabel(interview.jobType).toLowerCase().includes(searchLower);
                      });
                    }
                    if (filterJobType !== "all") {
                      filtered = filtered.filter(i => i.jobType === filterJobType);
                    }
                    if (filterDifficulty !== "all") {
                      filtered = filtered.filter(i => i.difficulty === filterDifficulty);
                    }
                    if (filterMode !== "all") {
                      filtered = filtered.filter(i => (i.mode || "practice") === filterMode);
                    }
                    const filteredIds = new Set(filtered.map(i => i._id || i.id));
                    const allSelected = filteredIds.size > 0 && Array.from(filteredIds).every(id => selectedInterviews.has(id));
                    return allSelected ? <CheckSquare size={16} /> : <Square size={16} />;
                  })()}
                  전체 선택
                </button>
                {selectedInterviews.size > 0 && (
                  <>
                    <span style={{ fontSize: "13px", color: "#6b7280" }}>
                      {selectedInterviews.size}개 선택됨
                    </span>
                    <button
                      onClick={() => setShowDeleteModal(true)}
                      style={{
                        padding: "6px 12px",
                        backgroundColor: "#ef4444",
                        color: "white",
                        border: "none",
                        borderRadius: "6px",
                        fontSize: "13px",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px"
                      }}
                    >
                      <Trash2 size={14} />
                      선택 삭제
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        )}
        
        {/* 필터링된 면접 기록 */}
        {(() => {
          // 필터링 및 정렬 로직
          let filtered = [...interviewHistory];

          // 검색 필터
          if (searchQuery) {
            filtered = filtered.filter(interview => {
              const searchLower = searchQuery.toLowerCase();
              const questionsText = interview.questions?.map(q => 
                typeof q === 'string' ? q : q.question
              ).join(' ') || '';
              const answersText = Object.values(interview.answers || {}).join(' ') || '';
              return questionsText.toLowerCase().includes(searchLower) || 
                     answersText.toLowerCase().includes(searchLower) ||
                     getJobTypeLabel(interview.jobType).toLowerCase().includes(searchLower);
            });
          }

          // 직무 타입 필터
          if (filterJobType !== "all") {
            filtered = filtered.filter(i => i.jobType === filterJobType);
          }

          // 난이도 필터
          if (filterDifficulty !== "all") {
            filtered = filtered.filter(i => i.difficulty === filterDifficulty);
          }

          // 모드 필터
          if (filterMode !== "all") {
            filtered = filtered.filter(i => (i.mode || "practice") === filterMode);
          }

          // 정렬
          filtered.sort((a, b) => {
            switch (sortBy) {
              case "date-desc":
                return new Date(b.completedAt || b.createdAt || b.id) - 
                       new Date(a.completedAt || a.createdAt || a.id);
              case "date-asc":
                return new Date(a.completedAt || a.createdAt || a.id) - 
                       new Date(b.completedAt || b.createdAt || b.id);
              case "score-desc":
                return (b.score || 0) - (a.score || 0);
              case "score-asc":
                return (a.score || 0) - (b.score || 0);
              case "job-type":
                return getJobTypeLabel(a.jobType).localeCompare(getJobTypeLabel(b.jobType));
              default:
                return 0;
            }
          });

          // 페이징
          const totalPages = Math.ceil(filtered.length / itemsPerPage);
          const startIndex = (currentPage - 1) * itemsPerPage;
          const paginatedInterviews = filtered.slice(startIndex, startIndex + itemsPerPage);

          return (
            <>
              {filtered.length === 0 ? (
                <div style={{
                  padding: "40px",
                  textAlign: "center",
                  color: "#6b7280"
                }}>
                  <Search size={48} style={{ marginBottom: "16px", opacity: 0.5 }} />
                  <p style={{ margin: 0, fontSize: "16px" }}>
                    검색 결과가 없습니다.
                  </p>
                  <p style={{ margin: "8px 0 0 0", fontSize: "14px", color: "#9ca3af" }}>
                    다른 검색어나 필터를 시도해보세요.
                  </p>
                </div>
              ) : (
                <>
                  <div style={{ marginBottom: "16px", fontSize: "14px", color: "#6b7280" }}>
                    총 {filtered.length}개의 면접 기록 ({(currentPage - 1) * itemsPerPage + 1}-
                    {Math.min(currentPage * itemsPerPage, filtered.length)} 표시 중)
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    {paginatedInterviews.map((interview) => {
                      const interviewId = interview._id || interview.id;
                      const isExpanded = expandedInterviews.has(interviewId);
                      const isSelected = selectedInterviews.has(interviewId);
                      const score = interview.score || 0;
                      const getScoreColor = (score) => {
                        if (score >= 80) return "#10b981";
                        if (score >= 60) return "#f59e0b";
                        return "#ef4444";
                      };

                      return (
                        <div
                          key={interviewId}
                          style={{
                            border: isSelected ? "2px solid #3b82f6" : "1px solid #e5e7eb",
                            borderRadius: "12px",
                            overflow: "hidden",
                            transition: "all 0.3s ease",
                            backgroundColor: isSelected ? "#eff6ff" : "white"
                          }}
                        >
                          {/* 면접 기록 헤더 */}
                          <div
                            style={{
                              padding: "16px 20px",
                              backgroundColor: isExpanded ? "#f9fafb" : (isSelected ? "#eff6ff" : "white"),
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              transition: "background-color 0.2s ease"
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "16px",
                                flex: 1
                              }}
                            >
                              {/* 선택 체크박스 */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const newSelected = new Set(selectedInterviews);
                                  if (isSelected) {
                                    newSelected.delete(interviewId);
                                  } else {
                                    newSelected.add(interviewId);
                                  }
                                  setSelectedInterviews(newSelected);
                                }}
                                style={{
                                  padding: "4px",
                                  backgroundColor: "transparent",
                                  border: "none",
                                  cursor: "pointer",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center"
                                }}
                              >
                                {isSelected ? (
                                  <CheckSquare size={20} color="#3b82f6" />
                                ) : (
                                  <Square size={20} color="#9ca3af" />
                                )}
                              </button>

                              <div
                                onClick={() => toggleInterview(interviewId)}
                                style={{
                                  cursor: "pointer",
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "16px",
                                  flex: 1
                                }}
                              >
                                <div style={{
                                  width: "48px",
                                  height: "48px",
                                  borderRadius: "8px",
                                  backgroundColor: `${getScoreColor(score)}20`,
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  fontSize: "1.2rem",
                                  fontWeight: "700",
                                  color: getScoreColor(score)
                                }}>
                                  {score}
                                </div>
                                <div style={{ flex: 1 }}>
                                  <div style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "8px",
                                    marginBottom: "4px"
                                  }}>
                                    <span style={{
                                      fontSize: "16px",
                                      fontWeight: "600",
                                      color: "#1f2937"
                                    }}>
                                      {getJobTypeLabel(interview.jobType)}
                                    </span>
                                    <span style={{
                                      fontSize: "14px",
                                      color: "#6b7280",
                                      padding: "2px 8px",
                                      backgroundColor: "#f3f4f6",
                                      borderRadius: "4px"
                                    }}>
                                      {getDifficultyLabel(interview.difficulty)}
                                    </span>
                                    <span style={{
                                      fontSize: "12px",
                                      color: (interview.mode || "practice") === "real" ? "#ef4444" : "#10b981",
                                      padding: "2px 8px",
                                      backgroundColor: (interview.mode || "practice") === "real" ? "#fef2f2" : "#f0fdf4",
                                      borderRadius: "4px",
                                      fontWeight: "600"
                                    }}>
                                      {(interview.mode || "practice") === "real" ? "실전" : "연습"}
                                    </span>
                                  </div>
                                  <div style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "12px",
                                    fontSize: "13px",
                                    color: "#9ca3af"
                                  }}>
                                    <span>{formatDate(interview.completedAt || interview.createdAt)}</span>
                                    <span>•</span>
                                    <span>{interview.questions?.length || 0}개 질문</span>
                                    {interview.answers && (
                                      <>
                                        <span>•</span>
                                        <span>{Object.keys(interview.answers).length}개 답변</span>
                                      </>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginLeft: "16px" }}>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/interview/${interviewId}`, {
                                    state: { interview }
                                  });
                                }}
                                style={{
                                  padding: "8px 12px",
                                  backgroundColor: "#3b82f6",
                                  color: "white",
                                  border: "none",
                                  borderRadius: "6px",
                                  cursor: "pointer",
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "6px",
                                  fontSize: "13px",
                                  fontWeight: "500"
                                }}
                                title="상세 보기"
                              >
                                <FileText size={14} />
                                상세
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteInterview(interview);
                                }}
                                disabled={loading}
                                style={{
                                  padding: "8px",
                                  backgroundColor: "transparent",
                                  border: "1px solid #fecaca",
                                  borderRadius: "6px",
                                  cursor: loading ? "not-allowed" : "pointer",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  color: "#ef4444",
                                  transition: "all 0.2s ease",
                                  opacity: loading ? 0.5 : 1
                                }}
                                onMouseEnter={(e) => {
                                  if (!loading) {
                                    e.target.style.backgroundColor = "#fef2f2";
                                  }
                                }}
                                onMouseLeave={(e) => {
                                  e.target.style.backgroundColor = "transparent";
                                }}
                                title="삭제"
                              >
                                <Trash2 size={18} />
                              </button>
                              <div
                                onClick={() => toggleInterview(interviewId)}
                                style={{
                                  cursor: "pointer",
                                  padding: "4px"
                                }}
                              >
                                {isExpanded ? (
                                  <ChevronUp size={20} color="#6b7280" />
                                ) : (
                                  <ChevronDown size={20} color="#6b7280" />
                                )}
                              </div>
                            </div>
                          </div>

                          {/* 면접 기록 상세 내용 */}
                          {isExpanded && (
                            <div style={{
                              padding: "20px",
                              backgroundColor: "#f9fafb",
                              borderTop: "1px solid #e5e7eb"
                            }}>
                              <div style={{
                                display: "flex",
                                justifyContent: "flex-end",
                                marginBottom: "16px"
                              }}>
                                <button
                                  onClick={() => handleDeleteInterview(interview)}
                                  disabled={loading}
                                  style={{
                                    padding: "8px 16px",
                                    backgroundColor: "#ef4444",
                                    color: "white",
                                    border: "none",
                                    borderRadius: "6px",
                                    cursor: loading ? "not-allowed" : "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "6px",
                                    fontSize: "14px",
                                    fontWeight: "500",
                                    transition: "all 0.2s ease",
                                    opacity: loading ? 0.5 : 1
                                  }}
                                  onMouseEnter={(e) => {
                                    if (!loading) {
                                      e.target.style.backgroundColor = "#dc2626";
                                    }
                                  }}
                                  onMouseLeave={(e) => {
                                    e.target.style.backgroundColor = "#ef4444";
                                  }}
                                >
                                  <Trash2 size={16} />
                                  삭제
                                </button>
                              </div>
                              {interview.questions?.map((question, index) => {
                                const questionData = typeof question === 'string' 
                                  ? { question } 
                                  : question;
                                const answer = interview.answers?.[index] || interview.answers?.[questionData.id];
                                const feedback = interview.feedbacks?.[index] || interview.feedbacks?.[questionData.id];

                                return (
                                  <div
                                    key={index}
                                    style={{
                                      marginBottom: index < (interview.questions?.length - 1) ? "20px" : 0,
                                      padding: "16px",
                                      backgroundColor: "white",
                                      borderRadius: "8px",
                                      border: "1px solid #e5e7eb"
                                    }}
                                  >
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
                                        {answer && (
                                          <CheckCircle size={16} color="#10b981" />
                                        )}
                                      </div>
                                      <div style={{
                                        fontSize: "15px",
                                        color: "#1f2937",
                                        fontWeight: "500",
                                        lineHeight: "1.5"
                                      }}>
                                        {questionData.question || question}
                                      </div>
                                    </div>

                                    {answer && (
                                      <div style={{ marginBottom: "12px" }}>
                                        <div style={{
                                          fontSize: "13px",
                                          color: "#6b7280",
                                          marginBottom: "6px",
                                          fontWeight: "500",
                                          display: "flex",
                                          alignItems: "center",
                                          gap: "6px"
                                        }}>
                                          <MessageSquare size={14} />
                                          답변:
                                        </div>
                                        <div style={{
                                          padding: "12px",
                                          backgroundColor: "#f9fafb",
                                          borderRadius: "6px",
                                          border: "1px solid #e5e7eb",
                                          fontSize: "14px",
                                          lineHeight: "1.6",
                                          color: "#374151"
                                        }}>
                                          {answer}
                                        </div>
                                      </div>
                                    )}

                                    {feedback && (() => {
                                      const feedbackData = feedback;
                                      const feedbackText = typeof feedbackData === 'string' 
                                        ? feedbackData 
                                        : feedbackData.feedback || "";
                                      
                                      return (
                                        <div>
                                          <div style={{
                                            fontSize: "13px",
                                            color: "#6b7280",
                                            marginBottom: "6px",
                                            fontWeight: "500",
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "6px"
                                          }}>
                                            <Star size={14} />
                                            AI 피드백:
                                            {typeof feedbackData === 'object' && feedbackData.score !== undefined && (
                                              <span style={{
                                                padding: "2px 8px",
                                                borderRadius: "12px",
                                                fontSize: "11px",
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
                                            borderRadius: "6px",
                                            border: "1px solid #93c5fd",
                                            fontSize: "14px",
                                            lineHeight: "1.6",
                                            color: "#1e40af",
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

                                    {!answer && (
                                      <div style={{
                                        padding: "12px",
                                        textAlign: "center",
                                        color: "#9ca3af",
                                        fontSize: "13px",
                                        fontStyle: "italic"
                                      }}>
                                        답변하지 않은 질문입니다.
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* 페이징 */}
                  {totalPages > 1 && (
                    <div style={{
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      gap: "8px",
                      marginTop: "24px",
                      paddingTop: "20px",
                      borderTop: "1px solid #e5e7eb"
                    }}>
                      <button
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        style={{
                          padding: "8px 12px",
                          backgroundColor: currentPage === 1 ? "#f3f4f6" : "white",
                          border: "1px solid #d1d5db",
                          borderRadius: "6px",
                          cursor: currentPage === 1 ? "not-allowed" : "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: "4px",
                          color: currentPage === 1 ? "#9ca3af" : "#374151"
                        }}
                      >
                        <ChevronLeft size={16} />
                        이전
                      </button>
                      
                      {Array.from({ length: totalPages }, (_, i) => i + 1)
                        .filter(page => {
                          if (totalPages <= 7) return true;
                          if (page === 1 || page === totalPages) return true;
                          if (Math.abs(page - currentPage) <= 1) return true;
                          return false;
                        })
                        .map((page, idx, arr) => {
                          if (idx > 0 && page - arr[idx - 1] > 1) {
                            return (
                              <React.Fragment key={`ellipsis-${page}`}>
                                <span style={{ color: "#9ca3af" }}>...</span>
                                <button
                                  onClick={() => setCurrentPage(page)}
                                  style={{
                                    padding: "8px 12px",
                                    backgroundColor: currentPage === page ? "#3b82f6" : "white",
                                    color: currentPage === page ? "white" : "#374151",
                                    border: "1px solid #d1d5db",
                                    borderRadius: "6px",
                                    cursor: "pointer",
                                    fontWeight: currentPage === page ? "600" : "400"
                                  }}
                                >
                                  {page}
                                </button>
                              </React.Fragment>
                            );
                          }
                          return (
                            <button
                              key={page}
                              onClick={() => setCurrentPage(page)}
                              style={{
                                padding: "8px 12px",
                                backgroundColor: currentPage === page ? "#3b82f6" : "white",
                                color: currentPage === page ? "white" : "#374151",
                                border: "1px solid #d1d5db",
                                borderRadius: "6px",
                                cursor: "pointer",
                                fontWeight: currentPage === page ? "600" : "400"
                              }}
                            >
                              {page}
                            </button>
                          );
                        })}
                      
                      <button
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        style={{
                          padding: "8px 12px",
                          backgroundColor: currentPage === totalPages ? "#f3f4f6" : "white",
                          border: "1px solid #d1d5db",
                          borderRadius: "6px",
                          cursor: currentPage === totalPages ? "not-allowed" : "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: "4px",
                          color: currentPage === totalPages ? "#9ca3af" : "#374151"
                        }}
                      >
                        다음
                        <ChevronRight size={16} />
                      </button>

                      <select
                        value={itemsPerPage}
                        onChange={(e) => {
                          setItemsPerPage(Number(e.target.value));
                          setCurrentPage(1);
                        }}
                        style={{
                          marginLeft: "16px",
                          padding: "8px 12px",
                          border: "1px solid #d1d5db",
                          borderRadius: "6px",
                          fontSize: "14px",
                          backgroundColor: "white",
                          cursor: "pointer"
                        }}
                      >
                        <option value={5}>5개씩</option>
                        <option value={10}>10개씩</option>
                        <option value={20}>20개씩</option>
                        <option value={50}>50개씩</option>
                      </select>
                    </div>
                  )}
                </>
              )}
            </>
          );
        })()}
      </div>

      {/* 계정 관리 */}
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
          계정 관리
        </h2>
        <button
          onClick={handleDeleteAccount}
          style={{
            padding: "12px 24px",
            backgroundColor: "#ef4444",
            color: "white",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            fontSize: "16px",
            fontWeight: "500"
          }}
        >
          회원 탈퇴
        </button>
        <p style={{
          margin: "12px 0 0 0",
          fontSize: "12px",
          color: "#9ca3af"
        }}>
          회원 탈퇴 시 모든 데이터가 영구적으로 삭제됩니다.
        </p>
      </div>

      {/* 일괄 삭제 확인 모달 */}
      {showDeleteModal && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0, 0, 0, 0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: "white",
            borderRadius: "16px",
            padding: "24px",
            maxWidth: "400px",
            width: "90%",
            boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)"
          }}>
            <h3 style={{
              margin: "0 0 16px 0",
              fontSize: "1.25rem",
              color: "#1f2937",
              fontWeight: "600"
            }}>
              일괄 삭제 확인
            </h3>
            <p style={{
              margin: "0 0 24px 0",
              fontSize: "14px",
              color: "#6b7280",
              lineHeight: "1.6"
            }}>
              정말 선택한 <strong>{selectedInterviews.size}개</strong>의 면접 기록을 삭제하시겠습니까?<br />
              삭제된 기록은 복구할 수 없습니다.
            </p>
            <div style={{
              display: "flex",
              gap: "12px",
              justifyContent: "flex-end"
            }}>
              <button
                onClick={() => setShowDeleteModal(false)}
                disabled={loading}
                style={{
                  padding: "10px 20px",
                  backgroundColor: "#f3f4f6",
                  color: "#374151",
                  border: "none",
                  borderRadius: "8px",
                  cursor: loading ? "not-allowed" : "pointer",
                  fontSize: "14px",
                  fontWeight: "500"
                }}
              >
                취소
              </button>
              <button
                onClick={handleBulkDelete}
                disabled={loading}
                style={{
                  padding: "10px 20px",
                  backgroundColor: "#ef4444",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  cursor: loading ? "not-allowed" : "pointer",
                  fontSize: "14px",
                  fontWeight: "500",
                  opacity: loading ? 0.5 : 1
                }}
              >
                {loading ? "삭제 중..." : "삭제"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

