import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    const result = await login(email, password);
    if (result.success) {
      navigate('/');
    } else {
      setError(result.error);
    }
  };

  // 인증서 오류인지 확인
  const isCertError = error?.includes('인증서 오류') || error?.includes('certificate') || error?.includes('CERT');
  const backendUrl = process.env.REACT_APP_API_URL?.replace('/api', '') || 'https://172.16.17.182:3001';

  return (
    <div className="login-page">
      <div className="login-container">
        <h1>로그인</h1>
        <form onSubmit={handleSubmit}>
          {error && (
            <div className={`error-message ${isCertError ? 'cert-error' : ''}`} style={{
              padding: '1rem',
              backgroundColor: isCertError ? 'rgba(239, 68, 68, 0.1)' : 'rgba(239, 68, 68, 0.1)',
              border: `2px solid ${isCertError ? '#ef4444' : '#ef4444'}`,
              borderRadius: 'var(--radius-md)',
              marginBottom: '1rem'
            }}>
              <div style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>⚠️ {isCertError ? '인증서 오류' : '오류'}</div>
              <div style={{ marginBottom: isCertError ? '0.75rem' : '0' }}>{error}</div>
              {isCertError && (
                <div style={{ 
                  marginTop: '0.75rem', 
                  padding: '0.75rem', 
                  backgroundColor: 'rgba(99, 102, 241, 0.1)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.9rem'
                }}>
                  <div style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>📋 해결 방법:</div>
                  <ol style={{ margin: 0, paddingLeft: '1.25rem', lineHeight: '1.8' }}>
                    <li>새 탭에서 <a href={backendUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary-color)', textDecoration: 'underline' }}>{backendUrl}</a> 접속</li>
                    <li>"고급" 또는 "Advanced" 버튼 클릭</li>
                    <li>"안전하지 않음으로 이동" 또는 "Proceed to ... (unsafe)" 클릭</li>
                    <li>인증서 수락 후 이 페이지로 돌아와 다시 로그인 시도</li>
                  </ol>
                </div>
              )}
            </div>
          )}
          <div className="form-group">
            <label htmlFor="email">이메일</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">비밀번호</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="btn btn-primary">
            로그인
          </button>
        </form>
        <p>
          계정이 없으신가요? <Link to="/signup">회원가입</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;

