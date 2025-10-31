import React, { createContext, useState, useContext, useEffect } from "react";
import { userAPI } from "../api/api";

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // 로컬 스토리지에서 사용자 정보 불러오기 (토큰이 있으면 유효성 검증)
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const storedToken = localStorage.getItem("token");
    
    if (storedUser && storedToken) {
      try {
        const userData = JSON.parse(storedUser);
        setUser(userData);
      } catch (error) {
        console.error("사용자 정보 파싱 오류:", error);
        localStorage.removeItem("user");
        localStorage.removeItem("token");
      }
    }
    setLoading(false);
  }, []);

  // 회원가입
  const signup = async (email, password, name) => {
    try {
      // 백엔드 API 호출
      const response = await userAPI.signup(email, password, name);
      
      // 사용자 정보와 토큰 저장
      const userData = {
        id: response.user.id,
        email: response.user.email,
        name: response.user.name
      };
      
      setUser(userData);
      localStorage.setItem("user", JSON.stringify(userData));
      localStorage.setItem("token", response.token);
      
      return userData;
    } catch (error) {
      // 에러 메시지 처리
      const errorMessage = error.response?.data?.error || error.message || "회원가입에 실패했습니다.";
      throw new Error(errorMessage);
    }
  };

  // 로그인
  const login = async (email, password) => {
    try {
      // 백엔드 API 호출
      const response = await userAPI.login(email, password);
      
      // 사용자 정보와 토큰 저장
      const userData = {
        id: response.user.id,
        email: response.user.email,
        name: response.user.name
      };
      
      setUser(userData);
      localStorage.setItem("user", JSON.stringify(userData));
      localStorage.setItem("token", response.token);
      
      return userData;
    } catch (error) {
      // 에러 메시지 처리
      const errorMessage = error.response?.data?.error || error.message || "로그인에 실패했습니다.";
      throw new Error(errorMessage);
    }
  };

  // 로그아웃
  const logout = () => {
    setUser(null);
    localStorage.removeItem("user");
    localStorage.removeItem("token");
  };

  const value = {
    user,
    signup,
    login,
    logout,
    loading
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

