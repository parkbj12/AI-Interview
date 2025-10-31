import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { UserPlus, Mail, Lock, User, AlertCircle, CheckCircle } from "lucide-react";

export default function Signup() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: ""
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { signup } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError("");
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      setError("이름을 입력해주세요.");
      return false;
    }
    if (!formData.email.trim()) {
      setError("이메일을 입력해주세요.");
      return false;
    }
    if (formData.password.length < 6) {
      setError("비밀번호는 최소 6자 이상이어야 합니다.");
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError("비밀번호가 일치하지 않습니다.");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      await signup(formData.email, formData.password, formData.name);
      navigate("/");
    } catch (err) {
      setError(err.message || "회원가입에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const getPasswordStrength = () => {
    if (!formData.password) return null;
    if (formData.password.length < 6) return { text: "약함", color: "#ef4444" };
    if (formData.password.length < 10) return { text: "보통", color: "#f59e0b" };
    return { text: "강함", color: "#10b981" };
  };

  const passwordStrength = getPasswordStrength();

  return (
    <div style={{
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      minHeight: "calc(100vh - 200px)",
      padding: "20px"
    }}>
      <div style={{
        backgroundColor: "white",
        borderRadius: "16px",
        padding: "40px",
        boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
        width: "100%",
        maxWidth: "400px"
      }}>
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <h1 style={{
            margin: 0,
            fontSize: "2rem",
            fontWeight: "700",
            color: "#1f2937",
            marginBottom: "8px"
          }}>
            회원가입
          </h1>
          <p style={{
            margin: 0,
            color: "#6b7280",
            fontSize: "14px"
          }}>
            새 계정을 만들어보세요
          </p>
        </div>

        {error && (
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "12px",
            backgroundColor: "#fef2f2",
            border: "1px solid #fecaca",
            borderRadius: "8px",
            marginBottom: "20px",
            color: "#dc2626"
          }}>
            <AlertCircle size={16} />
            <span style={{ fontSize: "14px" }}>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "20px" }}>
            <label style={{
              display: "block",
              marginBottom: "8px",
              fontSize: "14px",
              fontWeight: "500",
              color: "#374151"
            }}>
              이름
            </label>
            <div style={{ position: "relative" }}>
              <User size={20} style={{
                position: "absolute",
                left: "12px",
                top: "50%",
                transform: "translateY(-50%)",
                color: "#9ca3af"
              }} />
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                placeholder="이름을 입력하세요"
                style={{
                  width: "100%",
                  padding: "12px 12px 12px 40px",
                  border: "1px solid #d1d5db",
                  borderRadius: "8px",
                  fontSize: "16px",
                  boxSizing: "border-box"
                }}
              />
            </div>
          </div>

          <div style={{ marginBottom: "20px" }}>
            <label style={{
              display: "block",
              marginBottom: "8px",
              fontSize: "14px",
              fontWeight: "500",
              color: "#374151"
            }}>
              이메일
            </label>
            <div style={{ position: "relative" }}>
              <Mail size={20} style={{
                position: "absolute",
                left: "12px",
                top: "50%",
                transform: "translateY(-50%)",
                color: "#9ca3af"
              }} />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder="이메일을 입력하세요"
                style={{
                  width: "100%",
                  padding: "12px 12px 12px 40px",
                  border: "1px solid #d1d5db",
                  borderRadius: "8px",
                  fontSize: "16px",
                  boxSizing: "border-box"
                }}
              />
            </div>
          </div>

          <div style={{ marginBottom: "20px" }}>
            <label style={{
              display: "block",
              marginBottom: "8px",
              fontSize: "14px",
              fontWeight: "500",
              color: "#374151"
            }}>
              비밀번호
            </label>
            <div style={{ position: "relative" }}>
              <Lock size={20} style={{
                position: "absolute",
                left: "12px",
                top: "50%",
                transform: "translateY(-50%)",
                color: "#9ca3af"
              }} />
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                placeholder="비밀번호를 입력하세요 (최소 6자)"
                style={{
                  width: "100%",
                  padding: "12px 12px 12px 40px",
                  border: "1px solid #d1d5db",
                  borderRadius: "8px",
                  fontSize: "16px",
                  boxSizing: "border-box"
                }}
              />
            </div>
            {passwordStrength && (
              <div style={{
                marginTop: "8px",
                fontSize: "12px",
                color: passwordStrength.color,
                fontWeight: "500"
              }}>
                비밀번호 강도: {passwordStrength.text}
              </div>
            )}
          </div>

          <div style={{ marginBottom: "24px" }}>
            <label style={{
              display: "block",
              marginBottom: "8px",
              fontSize: "14px",
              fontWeight: "500",
              color: "#374151"
            }}>
              비밀번호 확인
            </label>
            <div style={{ position: "relative" }}>
              <Lock size={20} style={{
                position: "absolute",
                left: "12px",
                top: "50%",
                transform: "translateY(-50%)",
                color: "#9ca3af"
              }} />
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                placeholder="비밀번호를 다시 입력하세요"
                style={{
                  width: "100%",
                  padding: "12px 12px 12px 40px",
                  border: formData.confirmPassword && formData.password !== formData.confirmPassword
                    ? "1px solid #ef4444"
                    : formData.confirmPassword && formData.password === formData.confirmPassword
                    ? "1px solid #10b981"
                    : "1px solid #d1d5db",
                  borderRadius: "8px",
                  fontSize: "16px",
                  boxSizing: "border-box"
                }}
              />
            </div>
            {formData.confirmPassword && (
              <div style={{
                marginTop: "8px",
                fontSize: "12px",
                display: "flex",
                alignItems: "center",
                gap: "4px",
                color: formData.password === formData.confirmPassword ? "#10b981" : "#ef4444"
              }}>
                {formData.password === formData.confirmPassword ? (
                  <>
                    <CheckCircle size={14} />
                    <span>비밀번호가 일치합니다</span>
                  </>
                ) : (
                  <>
                    <AlertCircle size={14} />
                    <span>비밀번호가 일치하지 않습니다</span>
                  </>
                )}
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "14px",
              backgroundColor: loading ? "#9ca3af" : "#10b981",
              color: "white",
              border: "none",
              borderRadius: "8px",
              fontSize: "16px",
              fontWeight: "600",
              cursor: loading ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              marginBottom: "20px"
            }}
          >
            <UserPlus size={20} />
            {loading ? "가입 중..." : "회원가입"}
          </button>
        </form>

        <div style={{
          textAlign: "center",
          paddingTop: "20px",
          borderTop: "1px solid #e5e7eb"
        }}>
          <p style={{
            margin: 0,
            color: "#6b7280",
            fontSize: "14px"
          }}>
            이미 계정이 있으신가요?{" "}
            <Link
              to="/login"
              style={{
                color: "#3b82f6",
                textDecoration: "none",
                fontWeight: "500"
              }}
            >
              로그인
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

