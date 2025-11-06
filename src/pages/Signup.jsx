import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Signup = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [passwordMatch, setPasswordMatch] = useState(null); // null: 확인 안함, true: 일치, false: 불일치
  const { signup } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    const newFormData = {
      ...formData,
      [name]: value,
    };
    setFormData(newFormData);

    // 비밀번호 일치 여부 실시간 확인
    if (name === 'password' || name === 'confirmPassword') {
      if (newFormData.confirmPassword) {
        if (newFormData.password === newFormData.confirmPassword) {
          setPasswordMatch(true);
        } else {
          setPasswordMatch(false);
        }
      } else {
        setPasswordMatch(null);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // 비밀번호 길이 확인
    if (formData.password.length < 6) {
      setError('비밀번호는 최소 6자 이상이어야 합니다.');
      return;
    }

    // 비밀번호 일치 확인
    if (formData.password !== formData.confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.');
      setPasswordMatch(false);
      return;
    }

    const result = await signup({
      name: formData.name,
      email: formData.email,
      password: formData.password,
    });

    if (result.success) {
      navigate('/');
    } else {
      setError(result.error);
    }
  };

  return (
    <div className="signup-page">
      <div className="signup-container">
        <h1>회원가입</h1>
        <form onSubmit={handleSubmit}>
          {error && <div className="error-message">{error}</div>}
          <div className="form-group">
            <label htmlFor="name">이름</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="email">이메일</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">비밀번호</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              minLength={6}
            />
            {formData.password && formData.password.length < 6 && (
              <small className="form-hint" style={{ color: '#f59e0b' }}>
                비밀번호는 최소 6자 이상이어야 합니다.
              </small>
            )}
          </div>
          <div className="form-group">
            <label htmlFor="confirmPassword">비밀번호 확인</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              className={passwordMatch === false ? 'input-error' : passwordMatch === true ? 'input-success' : ''}
            />
            {passwordMatch === true && formData.confirmPassword && (
              <div className="password-match-message success">
                <span className="match-icon">✓</span>
                비밀번호가 일치합니다.
              </div>
            )}
            {passwordMatch === false && formData.confirmPassword && (
              <div className="password-match-message error">
                <span className="match-icon">✗</span>
                비밀번호가 일치하지 않습니다.
              </div>
            )}
          </div>
          <button type="submit" className="btn btn-primary">
            회원가입
          </button>
        </form>
        <p>
          이미 계정이 있으신가요? <Link to="/login">로그인</Link>
        </p>
      </div>
    </div>
  );
};

export default Signup;

