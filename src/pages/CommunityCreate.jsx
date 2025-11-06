import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { questionAPI } from '../api/api';

const CommunityCreate = () => {
  const { isAuthenticated, user, login } = useAuth();
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [images, setImages] = useState([]);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 로그인 확인
  React.useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files);
    const imagePromises = files.map(file => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          resolve(reader.result);
        };
        reader.readAsDataURL(file);
      });
    });

    Promise.all(imagePromises).then(newImages => {
      setImages([...images, ...newImages]);
    });
  };

  const removeImage = (index) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!title.trim()) {
      setError('제목을 입력해주세요.');
      return;
    }

    if (!content.trim()) {
      setError('내용을 입력해주세요.');
      return;
    }

    setError('');
    setIsSubmitting(true);
    
    // 먼저 토큰 확인 및 필요시 백엔드 로그인 시도
    const token = localStorage.getItem('token');
    if (token === 'local-token') {
      // 로컬 토큰인 경우 백엔드에 먼저 로그인 시도
      const localUsers = JSON.parse(localStorage.getItem('localUsers') || '[]');
      const localUser = localUsers.find(u => u.email === user?.email);
      
      if (localUser && localUser.password) {
        try {
          console.log('🔄 로컬 토큰 감지, 백엔드 로그인 시도 중...');
          const loginResult = await login(localUser.email, localUser.password);
          
          if (!loginResult.success) {
            setError('백엔드 서버에 연결할 수 없습니다. 네트워크 연결을 확인해주세요.');
            setIsSubmitting(false);
            return;
          }
          console.log('✅ 백엔드 로그인 성공, 실제 JWT 토큰 받음');
        } catch (loginErr) {
          console.error('❌ 백엔드 로그인 실패:', loginErr);
          setError('백엔드 서버에 연결할 수 없습니다. 네트워크 연결을 확인해주세요.');
          setIsSubmitting(false);
          return;
        }
      } else {
        setError('백엔드 서버에 연결하려면 다시 로그인해주세요.');
        setIsSubmitting(false);
        return;
      }
    }
    
    try {
      await questionAPI.createCommunity(title, content, images);
      navigate('/custom-questions');
    } catch (err) {
      // 401 또는 403 에러: 토큰이 유효하지 않음 - 다시 로그인 필요
      if (err.response?.status === 401 || err.response?.status === 403) {
        const currentToken = localStorage.getItem('token');
        
        // 이미 위에서 로컬 토큰 처리를 했으므로, 여기서는 실제 JWT 토큰이 만료된 경우
        if (currentToken && currentToken !== 'local-token') {
          console.error('❌ JWT 토큰이 만료되었거나 유효하지 않습니다');
          setError('인증 토큰이 만료되었습니다. 다시 로그인해주세요.');
          setIsSubmitting(false);
          // 토큰 삭제 후 로그인 페이지로 이동
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setTimeout(() => {
            navigate('/login', { state: { returnTo: '/community/create', message: '인증이 만료되어 다시 로그인이 필요합니다.' } });
          }, 1500);
          return;
        } else {
          // 로컬 토큰인데도 여기 왔다면 백엔드 로그인이 실패한 것
          setError('백엔드 서버에 연결할 수 없습니다. 네트워크 연결을 확인해주세요.');
          setIsSubmitting(false);
          return;
        }
      }
      
      // 네트워크 오류인 경우에만 로컬 스토리지에 저장
      if (err.code === 'ERR_NETWORK' || err.code === 'ECONNREFUSED') {
        const post = {
          _id: Date.now().toString(),
          id: Date.now().toString(),
          title: title.trim(),
          content: content.trim(),
          images: images,
          userId: user?.id,
          userName: user?.name || '익명',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          comments: [],
        };
        const storedPosts = JSON.parse(localStorage.getItem('communityQuestions') || '[]');
        const newPosts = [post, ...storedPosts];
        localStorage.setItem('communityQuestions', JSON.stringify(newPosts));
        
        alert('네트워크 연결이 끊어져 로컬 스토리지에 저장했습니다. 연결이 복구되면 서버에 동기화됩니다.');
        navigate('/custom-questions');
      } else {
        setError(err.response?.data?.message || '게시글 등록에 실패했습니다.');
        setIsSubmitting(false);
      }
    }
  };

  const handleCancel = () => {
    navigate('/custom-questions');
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="community-create-page">
      <div className="community-create-header">
        <h1>새글작성</h1>
        <button onClick={handleCancel} className="btn btn-secondary">
          취소
        </button>
      </div>

      <form onSubmit={handleSubmit} className="community-create-form">
        <div className="form-group">
          <label htmlFor="title">제목</label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="제목을 입력하세요..."
            className="post-title-input"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="content">내용</label>
          <textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="내용을 입력하세요..."
            rows={10}
            required
          />
        </div>

        <div className="form-group">
          <label>사진 추가</label>
          <div className="image-upload-section">
            <label className="image-upload-label">
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageSelect}
                style={{ display: 'none' }}
              />
              <span className="btn btn-secondary">사진 선택</span>
            </label>
            {images.length > 0 && (
              <div className="image-preview-list">
                {images.map((img, index) => (
                  <div key={index} className="image-preview">
                    <img src={img} alt={`미리보기 ${index + 1}`} />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="remove-image-btn"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {error && <div className="error-message">{error}</div>}

        <div className="form-actions">
          <button 
            type="submit" 
            className="btn btn-primary"
            disabled={isSubmitting}
          >
            {isSubmitting ? '등록 중...' : '등록하기'}
          </button>
          <button 
            type="button"
            onClick={handleCancel} 
            className="btn btn-secondary"
            disabled={isSubmitting}
          >
            취소
          </button>
        </div>
      </form>
    </div>
  );
};

export default CommunityCreate;

