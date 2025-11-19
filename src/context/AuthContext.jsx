import React, { createContext, useState, useContext, useEffect } from 'react';
import { authAPI, userAPI } from '../api/api';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 로컬 스토리지에서 사용자 정보 로드 및 토큰 검증
    const loadUser = async () => {
      const storedUser = localStorage.getItem('user');
      const token = localStorage.getItem('token');
      
      if (storedUser && token) {
        // local-token인 경우 로컬 스토리지 사용자 정보만 사용
        if (token === 'local-token') {
          try {
            setUser(JSON.parse(storedUser));
          } catch (error) {
            console.error('Failed to parse user data:', error);
            localStorage.removeItem('user');
            localStorage.removeItem('token');
          }
          setLoading(false);
          return;
        }
        
        // 실제 JWT 토큰인 경우 백엔드에서 검증
        try {
          const response = await userAPI.getProfile();
          setUser(response.data);
          // 최신 사용자 정보로 업데이트
          localStorage.setItem('user', JSON.stringify(response.data));
        } catch (error) {
          // 토큰이 유효하지 않으면 로그아웃 처리
          console.warn('토큰 검증 실패, 로그아웃 처리:', error);
          localStorage.removeItem('user');
          localStorage.removeItem('token');
          setUser(null);
        }
      }
      setLoading(false);
    };
    
    loadUser();
  }, []);

  const login = async (email, password) => {
    try {
      const response = await authAPI.login(email, password);
      const { user, token } = response.data;
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      setUser(user);
      
      return { success: true };
    } catch (error) {
      // 인증서 오류 처리
      if (error.code === 'ERR_CERT_AUTHORITY_INVALID' || error.message?.includes('certificate') || error.message?.includes('CERT')) {
        const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';
        const backendUrl = apiUrl.replace('/api', '');
        return {
          success: false,
          error: `인증서 오류가 발생했습니다. 먼저 브라우저에서 ${backendUrl} 에 접속하여 인증서를 수락해주세요. (고급 → 안전하지 않음으로 이동)`,
        };
      }
      
      // 백엔드 연결 실패 시 로컬 스토리지 사용 (오프라인 모드)
      if (error.code === 'ERR_NETWORK' || error.code === 'ECONNREFUSED') {
        // 로컬 스토리지에서 사용자 확인
        const users = JSON.parse(localStorage.getItem('localUsers') || '[]');
        const user = users.find(u => u.email === email && u.password === password);
        
        if (user) {
          const localUser = { id: user.id, name: user.name, email: user.email };
          localStorage.setItem('user', JSON.stringify(localUser));
          localStorage.setItem('token', 'local-token');
          setUser(localUser);
          return { success: true };
        }
        
        return {
          success: false,
          error: '백엔드 서버에 연결할 수 없습니다. 로컬 모드로 전환하거나 회원가입을 먼저 진행해주세요.',
        };
      }
      
      return {
        success: false,
        error: error.response?.data?.message || '로그인에 실패했습니다.',
      };
    }
  };

  const signup = async (userData) => {
    try {
      const response = await authAPI.signup(userData);
      const { user, token } = response.data;
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      setUser(user);
      
      return { success: true };
    } catch (error) {
      // 백엔드 연결 실패 시 로컬 스토리지 사용 (오프라인 모드)
      if (error.code === 'ERR_NETWORK' || error.code === 'ECONNREFUSED') {
        // 로컬 스토리지에 사용자 저장
        const users = JSON.parse(localStorage.getItem('localUsers') || '[]');
        const newUser = {
          id: Date.now().toString(),
          name: userData.name,
          email: userData.email,
          password: userData.password, // 실제로는 해시화해야 하지만, 로컬 모드이므로 간단히 저장
          createdAt: new Date().toISOString(),
        };
        
        // 이메일 중복 확인
        if (users.find(u => u.email === userData.email)) {
          return {
            success: false,
            error: '이미 등록된 이메일입니다.',
          };
        }
        
        users.push(newUser);
        localStorage.setItem('localUsers', JSON.stringify(users));
        
        const localUser = { id: newUser.id, name: newUser.name, email: newUser.email };
        localStorage.setItem('user', JSON.stringify(localUser));
        localStorage.setItem('token', 'local-token');
        setUser(localUser);
        
        return { success: true };
      }
      
      return {
        success: false,
        error: error.response?.data?.message || '회원가입에 실패했습니다.',
      };
    }
  };

  const logout = async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      // 백엔드 연결 실패해도 로그아웃은 정상 처리
      if (error.code !== 'ERR_NETWORK' && error.code !== 'ECONNREFUSED') {
        console.error('Logout error:', error);
      }
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setUser(null);
    }
  };

  const updateUser = async (userData) => {
    try {
      const response = await userAPI.updateProfile(userData);
      const updatedUser = response.data;
      
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
      
      return { success: true, user: updatedUser };
    } catch (error) {
      // 백엔드 연결 실패 시 로컬 스토리지 업데이트
      if (error.code === 'ERR_NETWORK' || error.code === 'ECONNREFUSED') {
        // 로컬 스토리지에서 사용자 업데이트
        const users = JSON.parse(localStorage.getItem('localUsers') || '[]');
        const userIndex = users.findIndex(u => u.id === user?.id || u.email === user?.email);
        
        if (userIndex !== -1) {
          // 비밀번호 변경 처리
          if (userData.newPassword) {
            if (!userData.currentPassword) {
              return {
                success: false,
                error: '현재 비밀번호를 입력해주세요.',
              };
            }
            // 로컬 모드에서는 간단히 비밀번호 저장 (실제로는 해시화해야 함)
            if (users[userIndex].password !== userData.currentPassword) {
              return {
                success: false,
                error: '현재 비밀번호가 올바르지 않습니다.',
              };
            }
            users[userIndex].password = userData.newPassword;
          }
          
          if (userData.name) users[userIndex].name = userData.name;
          if (userData.email) {
            // 이메일 중복 확인
            const emailExists = users.find(u => u.email === userData.email && u.id !== users[userIndex].id);
            if (emailExists) {
              return {
                success: false,
                error: '이미 등록된 이메일입니다.',
              };
            }
            users[userIndex].email = userData.email;
          }
          localStorage.setItem('localUsers', JSON.stringify(users));
          
          const localUser = { id: users[userIndex].id, name: users[userIndex].name, email: users[userIndex].email };
          localStorage.setItem('user', JSON.stringify(localUser));
          setUser(localUser);
          return { success: true, user: localUser };
        }
        
        return {
          success: false,
          error: '사용자를 찾을 수 없습니다.',
        };
      }
      
      return {
        success: false,
        error: error.response?.data?.message || '정보 수정에 실패했습니다.',
      };
    }
  };

  const deleteAccount = async (password) => {
    try {
      await userAPI.deleteAccount(password);
      
      // 로컬 스토리지에서 사용자 데이터 삭제
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      // 로컬 사용자 목록에서도 삭제
      const users = JSON.parse(localStorage.getItem('localUsers') || '[]');
      const updatedUsers = users.filter(u => u.id !== user?.id && u.email !== user?.email);
      localStorage.setItem('localUsers', JSON.stringify(updatedUsers));
      
      // 면접 기록도 삭제
      localStorage.removeItem('interviews');
      
      setUser(null);
      
      return { success: true };
    } catch (error) {
      // 백엔드 연결 실패 시 로컬 스토리지에서 삭제
      if (error.code === 'ERR_NETWORK' || error.code === 'ECONNREFUSED') {
        // 로컬 스토리지에서 사용자 삭제
        const users = JSON.parse(localStorage.getItem('localUsers') || '[]');
        const userToDelete = users.find(u => u.id === user?.id || u.email === user?.email);
        
        if (userToDelete && userToDelete.password === password) {
          const updatedUsers = users.filter(u => u.id !== userToDelete.id);
          localStorage.setItem('localUsers', JSON.stringify(updatedUsers));
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          localStorage.removeItem('interviews');
          setUser(null);
          return { success: true };
        }
        
        return {
          success: false,
          error: '비밀번호가 올바르지 않습니다.',
        };
      }
      
      return {
        success: false,
        error: error.response?.data?.message || '회원탈퇴에 실패했습니다.',
      };
    }
  };

  const value = {
    user,
    loading,
    login,
    signup,
    logout,
    updateUser,
    deleteAccount,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

