import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { LogIn, Mail, Lock, AlertCircle } from "lucide-react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login(email, password);
      navigate("/");
    } catch (err) {
      setError(err.message || "로그인에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

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
            로그인
          </h1>
          <p style={{
            margin: 0,
            color: "#6b7280",
            fontSize: "14px"
          }}>
            AI 모의면접에 오신 것을 환영합니다
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
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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

          <div style={{ marginBottom: "24px" }}>
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
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="비밀번호를 입력하세요"
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

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "14px",
              backgroundColor: loading ? "#9ca3af" : "#3b82f6",
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
            <LogIn size={20} />
            {loading ? "로그인 중..." : "로그인"}
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
            계정이 없으신가요?{" "}
            <Link
              to="/signup"
              style={{
                color: "#3b82f6",
                textDecoration: "none",
                fontWeight: "500"
              }}
            >
              회원가입
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

