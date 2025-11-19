import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { interviewAPI } from '../api/api';

const MyPage = () => {
  const { user, logout, updateUser, deleteAccount } = useAuth();
  const navigate = useNavigate();
  const [interviews, setInterviews] = useState([]);
  const [filteredInterviews, setFilteredInterviews] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ 
    name: '', 
    email: '', 
    currentPassword: '', 
    newPassword: '', 
    confirmPassword: '' 
  });
  const [updateLoading, setUpdateLoading] = useState(false);
  const [updateError, setUpdateError] = useState('');
  const [updateSuccess, setUpdateSuccess] = useState(false);
  const [showPasswordFields, setShowPasswordFields] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  useEffect(() => {
    loadInterviews();
    if (user) {
      setFormData({ 
        name: user.name || '', 
        email: user.email || '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    }
  }, [user]);

  const loadInterviews = async () => {
    try {
      setLoading(true);
      let loadedInterviews = [];
      
      // 백엔드에서 면접 기록 로드 시도
      if (user) {
        try {
          const response = await interviewAPI.getAll();
          loadedInterviews = response.data || [];
        } catch (error) {
          console.warn('백엔드에서 면접 기록 로드 실패, 로컬 스토리지에서 로드:', error);
        }
      }
      
      // 백엔드에서 데이터를 가져오지 못한 경우 로컬 스토리지에서 로드
      if (loadedInterviews.length === 0) {
        const storedInterviews = localStorage.getItem('interviews');
        if (storedInterviews) {
          loadedInterviews = JSON.parse(storedInterviews);
        }
      }
      
      setInterviews(loadedInterviews);
      setFilteredInterviews(loadedInterviews);
      setLoading(false);
    } catch (error) {
      console.error('Failed to load interviews:', error);
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    const query = e.target.value.toLowerCase();
    setSearchQuery(query);
    
    if (!query.trim()) {
      setFilteredInterviews(interviews);
      return;
    }
    
    const filtered = interviews.filter((interview) => {
      const jobMatch = interview.job?.toLowerCase().includes(query);
      const companyMatch = interview.companyName?.toLowerCase().includes(query);
      const difficultyMatch = interview.difficulty?.toLowerCase().includes(query);
      const questionsMatch = interview.questions?.some(q => 
        (typeof q === 'string' ? q : q.text || '').toLowerCase().includes(query)
      );
      
      return jobMatch || companyMatch || difficultyMatch || questionsMatch;
    });
    
    setFilteredInterviews(filtered);
  };

  const handleDelete = async (interviewId) => {
    if (!window.confirm('정말 이 면접 기록을 삭제하시겠습니까?')) {
      return;
    }
    
    try {
      let deleteSuccess = false;
      
      // 백엔드에서 삭제 시도
      if (user) {
        try {
          await interviewAPI.delete(interviewId);
          deleteSuccess = true;
          // 백엔드에서 삭제 성공한 경우, 다시 로드해서 동기화
          await loadInterviews();
          return;
        } catch (error) {
          console.warn('백엔드 삭제 실패, 로컬 스토리지에서 삭제:', error);
        }
      }
      
      // 백엔드 삭제가 실패했거나 사용자가 없는 경우 로컬 스토리지에서 삭제
      const storedInterviews = JSON.parse(localStorage.getItem('interviews') || '[]');
      const updatedInterviews = storedInterviews.filter(iv => iv.id !== interviewId && iv._id !== interviewId);
      localStorage.setItem('interviews', JSON.stringify(updatedInterviews));
      
      // 상태 업데이트
      const updated = interviews.filter(iv => (iv.id || iv._id) !== interviewId);
      setInterviews(updated);
      
      // 검색 쿼리가 있으면 필터링된 목록도 업데이트
      if (searchQuery.trim()) {
        handleSearch({ target: { value: searchQuery } });
      } else {
        setFilteredInterviews(updated);
      }
    } catch (error) {
      console.error('면접 기록 삭제 오류:', error);
      alert('면접 기록 삭제에 실패했습니다.');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleEdit = () => {
    setIsEditing(true);
    setUpdateError('');
    setUpdateSuccess(false);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setFormData({ 
      name: user?.name || '', 
      email: user?.email || '',
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
    setUpdateError('');
    setUpdateSuccess(false);
    setShowPasswordFields(false);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (submitData) => {
    setUpdateLoading(true);
    setUpdateError('');
    setUpdateSuccess(false);

    // 비밀번호 변경 시 유효성 검사
    if (submitData.newPassword) {
      if (!submitData.currentPassword) {
        setUpdateError('현재 비밀번호를 입력해주세요.');
        setUpdateLoading(false);
        return;
      }
      if (submitData.newPassword.length < 6) {
        setUpdateError('새 비밀번호는 최소 6자 이상이어야 합니다.');
        setUpdateLoading(false);
        return;
      }
      if (submitData.newPassword !== submitData.confirmPassword) {
        setUpdateError('새 비밀번호와 확인 비밀번호가 일치하지 않습니다.');
        setUpdateLoading(false);
        return;
      }
    }

    // 비밀번호 변경이 아닌 경우 비밀번호 필드 제거
    // 이메일은 변경하지 않음
    const updateData = {
      name: submitData.name,
    };
    
    if (submitData.newPassword) {
      updateData.currentPassword = submitData.currentPassword;
      updateData.newPassword = submitData.newPassword;
    }

    const result = await updateUser(updateData);
    
    if (result.success) {
      setUpdateSuccess(true);
      setIsEditing(false);
      setShowPasswordFields(false);
      setFormData({ 
        name: result.user?.name || user?.name || '', 
        email: result.user?.email || user?.email || '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setTimeout(() => setUpdateSuccess(false), 3000);
    } else {
      setUpdateError(result.error || '정보 수정에 실패했습니다.');
    }
    
    setUpdateLoading(false);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    await handleSubmit(formData);
  };

  const handleDeleteAccount = async () => {
    if (!deletePassword.trim()) {
      setDeleteError('비밀번호를 입력해주세요.');
      return;
    }

    setDeleteLoading(true);
    setDeleteError('');

    const result = await deleteAccount(deletePassword);

    if (result.success) {
      alert('회원탈퇴가 완료되었습니다.');
      navigate('/');
    } else {
      setDeleteError(result.error || '회원탈퇴에 실패했습니다.');
      setDeleteLoading(false);
    }
  };

  const openDeleteModal = () => {
    setShowDeleteModal(true);
    setDeletePassword('');
    setDeleteError('');
  };

  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setDeletePassword('');
    setDeleteError('');
  };

  if (loading) {
    return <div className="mypage">로딩 중...</div>;
  }

  return (
    <div className="mypage">
      <header>
        <h1>마이페이지</h1>
        <button onClick={handleLogout} className="btn btn-secondary">
          로그아웃
        </button>
      </header>

      <main>
        {/* 회원정보 섹션 */}
        <section className="profile-section">
          <div className="section-header">
            <h2>회원정보</h2>
            {!isEditing && (
              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={handleEdit} className="btn btn-primary btn-edit" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  수정하기
                </button>
                <button onClick={openDeleteModal} className="btn btn-danger" style={{ backgroundColor: '#dc3545', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  회원탈퇴
                </button>
              </div>
            )}
          </div>

          {!isEditing ? (
            <div className="profile-info-card">
              <div className="profile-info-item">
                <div className="info-label">
                  <span className="info-icon">👤</span>
                  이름
                </div>
                <div className="info-value">{user?.name || '-'}</div>
              </div>
              <div className="profile-info-item">
                <div className="info-label">
                  <span className="info-icon">📧</span>
                  이메일
                </div>
                <div className="info-value">{user?.email || '-'}</div>
              </div>
            </div>
          ) : (
            <form onSubmit={handleFormSubmit} className="profile-edit-form">
              <div className="form-group">
                <label htmlFor="name">
                  <span className="label-icon">👤</span>
                  이름
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="이름을 입력하세요"
                  required
                  autoFocus
                />
              </div>
              <div className="form-group">
                <label htmlFor="email">
                  <span className="label-icon">📧</span>
                  이메일
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  disabled
                  className="input-disabled"
                  placeholder="이메일을 입력하세요"
                />
                <small className="form-hint">이메일은 변경할 수 없습니다.</small>
              </div>

              {/* 비밀번호 변경 섹션 */}
              <div className="password-section">
                {!showPasswordFields ? (
                  <button
                    type="button"
                    onClick={() => setShowPasswordFields(true)}
                    className="btn-password-toggle"
                  >
                    <span className="label-icon">🔒</span>
                    비밀번호 변경하기
                  </button>
                ) : (
                  <>
                    <div className="password-header">
                      <span className="label-icon">🔒</span>
                      <span>비밀번호 변경</span>
                      <button
                        type="button"
                        onClick={() => {
                          setShowPasswordFields(false);
                          setFormData(prev => ({
                            ...prev,
                            currentPassword: '',
                            newPassword: '',
                            confirmPassword: ''
                          }));
                        }}
                        className="btn-close-password"
                      >
                        ✕
                      </button>
                    </div>
                    <div className="form-group">
                      <label htmlFor="currentPassword">
                        현재 비밀번호
                      </label>
                      <input
                        type="password"
                        id="currentPassword"
                        name="currentPassword"
                        value={formData.currentPassword}
                        onChange={handleChange}
                        placeholder="현재 비밀번호를 입력하세요"
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="newPassword">
                        새 비밀번호
                      </label>
                      <input
                        type="password"
                        id="newPassword"
                        name="newPassword"
                        value={formData.newPassword}
                        onChange={handleChange}
                        placeholder="새 비밀번호를 입력하세요 (최소 6자)"
                        minLength={6}
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="confirmPassword">
                        새 비밀번호 확인
                      </label>
                      <input
                        type="password"
                        id="confirmPassword"
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        placeholder="새 비밀번호를 다시 입력하세요"
                        minLength={6}
                      />
                    </div>
                  </>
                )}
              </div>
              
              {updateError && (
                <div className="alert-message error-message">
                  <span className="alert-icon">⚠️</span>
                  {updateError}
                </div>
              )}
              {updateSuccess && (
                <div className="alert-message success-message">
                  <span className="alert-icon">✅</span>
                  정보가 성공적으로 수정되었습니다.
                </div>
              )}
              
              <div className="form-actions">
                <button 
                  type="submit" 
                  className="btn btn-primary btn-save" 
                  disabled={updateLoading}
                >
                  {updateLoading ? (
                    <>
                      <span className="loading-spinner"></span>
                      저장 중...
                    </>
                  ) : (
                    '저장하기'
                  )}
                </button>
                <button 
                  type="button" 
                  onClick={handleCancel} 
                  className="btn btn-secondary btn-cancel"
                  disabled={updateLoading}
                >
                  취소
                </button>
              </div>
            </form>
          )}
        </section>

        {/* 회원탈퇴 모달 */}
        {showDeleteModal && (
          <div className="modal-overlay" onClick={closeDeleteModal}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>회원탈퇴</h2>
                <button onClick={closeDeleteModal} className="modal-close">×</button>
              </div>
              <div className="modal-body">
                <p style={{ marginBottom: '20px', color: '#dc3545', fontWeight: 'bold' }}>
                  ⚠️ 정말 회원탈퇴를 하시겠습니까?
                </p>
                <p style={{ marginBottom: '20px' }}>
                  회원탈퇴 시 모든 개인정보, 면접 기록, 질문 게시글 등이 영구적으로 삭제되며 복구할 수 없습니다.
                </p>
                <div className="form-group">
                  <label htmlFor="deletePassword">
                    <span className="label-icon">🔒</span>
                    비밀번호 확인
                  </label>
                  <input
                    type="password"
                    id="deletePassword"
                    value={deletePassword}
                    onChange={(e) => setDeletePassword(e.target.value)}
                    placeholder="비밀번호를 입력하세요"
                    autoFocus
                  />
                </div>
                {deleteError && (
                  <div className="alert-message error-message" style={{ marginTop: '10px' }}>
                    <span className="alert-icon">⚠️</span>
                    {deleteError}
                  </div>
                )}
              </div>
              <div className="modal-footer" style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button
                  onClick={closeDeleteModal}
                  className="btn btn-secondary"
                  disabled={deleteLoading}
                >
                  취소
                </button>
                <button
                  onClick={handleDeleteAccount}
                  className="btn btn-danger"
                  disabled={deleteLoading}
                  style={{ backgroundColor: '#dc3545' }}
                >
                  {deleteLoading ? (
                    <>
                      <span className="loading-spinner"></span>
                      처리 중...
                    </>
                  ) : (
                    '회원탈퇴'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        <nav>
          <Link to="/statistics" className="nav-link">
            통계
          </Link>
        </nav>

        {/* 면접 기록 섹션 */}
        <section className="interview-section">
          <div className="section-header">
            <h2>면접 기록</h2>
            {interviews.length > 0 && (
              <div className="search-box">
                <input
                  type="text"
                  placeholder="검색 (직무, 회사명, 난이도, 질문 내용)"
                  value={searchQuery}
                  onChange={handleSearch}
                  className="search-input"
                />
                <span className="search-icon">🔍</span>
              </div>
            )}
          </div>
          {interviews.length === 0 ? (
            <p>아직 면접 기록이 없습니다.</p>
          ) : filteredInterviews.length === 0 ? (
            <p>검색 결과가 없습니다.</p>
          ) : (
            <div className="interview-list">
              {filteredInterviews.map((interview) => {
                // id 필드 확실히 설정
                const interviewId = interview.id || interview._id;
                return (
                  <div key={interviewId} className="interview-item">
                    <div className="interview-item-header">
                      <h3>
                        {interview.companyName && interview.companyName.trim() 
                          ? `${interview.companyName} - ${interview.job}` 
                          : interview.job || '직무 미지정'}
                      </h3>
                      <span className="interview-score">{interview.score}/10</span>
                    </div>
                    <div className="interview-item-info">
                      <p>📅 날짜: {new Date(interview.date || interview.createdAt).toLocaleDateString('ko-KR')}</p>
                      <p>📊 난이도: {interview.difficulty === 'easy' ? '초급' : interview.difficulty === 'medium' ? '중급' : '고급'}</p>
                      <p>📝 질문 수: {interview.questions?.length || 0}개</p>
                      <p>
                        {(() => {
                          // interviewType이 없으면 answers를 확인해서 자동으로 판단
                          let interviewType = interview.interviewType;
                          if (!interviewType && interview.answers && Array.isArray(interview.answers)) {
                            const hasAudioAnswer = interview.answers.some(answer => 
                              answer && typeof answer === 'object' && (answer.type === 'audio' || answer.base64Audio)
                            );
                            interviewType = hasAudioAnswer ? 'video' : 'text';
                          }
                          return interviewType === 'video' ? '🎥 영상 면접' : '📝 텍스트 면접';
                        })()}
                      </p>
                    </div>
                    <div className="interview-item-actions">
                      <Link to={`/interview/${interviewId}`} className="btn btn-primary">
                        상세 보기
                      </Link>
                      <button 
                        onClick={() => handleDelete(interviewId)} 
                        className="btn btn-danger"
                        title="면접 기록 삭제"
                      >
                        삭제
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default MyPage;

