import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { questionAPI } from '../api/api';
import { useNavigate, Link } from 'react-router-dom';

const CustomQuestions = () => {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editImages, setEditImages] = useState([]);
  const [error, setError] = useState('');
  const [commentTexts, setCommentTexts] = useState({});
  const [expandedComments, setExpandedComments] = useState({});

  useEffect(() => {
    loadCommunityPosts();
  }, []);

  const loadCommunityPosts = async () => {
    setLoading(true);
    try {
      const response = await questionAPI.getCommunity();
      const postsData = response.data || [];
      setPosts(postsData);
      localStorage.setItem('communityQuestions', JSON.stringify(postsData));
      
      // 각 게시글의 댓글 로드
      for (const post of postsData) {
        loadComments(post._id || post.id);
      }
    } catch (err) {
      console.error('게시글 로드 실패:', err);
      // 네트워크 오류 또는 토큰 만료/유효하지 않은 경우 로컬 스토리지에서 로드
      if (err.code === 'ERR_NETWORK' || err.code === 'ECONNREFUSED' || err.response?.status === 401) {
        const stored = localStorage.getItem('communityQuestions');
        if (stored) {
          const storedPosts = JSON.parse(stored);
          setPosts(storedPosts);
        } else {
          setPosts([]);
        }
      } else {
        setPosts([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const loadComments = async (postId) => {
    try {
      const response = await questionAPI.getComments(postId);
      setPosts(prevPosts => prevPosts.map(post => 
        (post._id === postId || post.id === postId) 
          ? { ...post, comments: response.data || [] }
          : post
      ));
    } catch (err) {
      // 댓글 로드 실패는 무시
    }
  };

  const handleImageSelect = (e, isEdit = false) => {
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

    Promise.all(imagePromises).then(images => {
      if (isEdit) {
        setEditImages([...editImages, ...images]);
      }
    });
  };

  const removeImage = (index, isEdit = false) => {
    if (isEdit) {
      setEditImages(editImages.filter((_, i) => i !== index));
    }
  };

  // 이름 마스킹 함수 (가운데 글자를 *로)
  const maskName = (name) => {
    if (!name || name === '익명') return '익명';
    if (name.length === 1) return '*';
    if (name.length === 2) return name[0] + '*';
    // 3글자 이상인 경우 가운데 글자들을 *로
    const firstChar = name[0];
    const lastChar = name[name.length - 1];
    const middleStars = '*'.repeat(name.length - 2);
    return firstChar + middleStars + lastChar;
  };

  const handleEditStart = (post) => {
    setEditingId(post._id || post.id);
    setEditTitle(post.title || '');
    setEditContent(post.content || '');
    setEditImages(post.images || []);
  };

  const handleEditCancel = () => {
    setEditingId(null);
    setEditTitle('');
    setEditContent('');
    setEditImages([]);
  };

  const handleEditSave = async (postId) => {
    if (!editTitle.trim()) {
      setError('제목을 입력해주세요.');
      return;
    }

    if (!editContent.trim()) {
      setError('내용을 입력해주세요.');
      return;
    }

    setError('');
    
    try {
      const response = await questionAPI.updateCommunity(postId, editTitle, editContent, editImages);
      const updatedPosts = posts.map(p => 
        (p._id === postId || p.id === postId) ? response.data : p
      );
      setPosts(updatedPosts);
      localStorage.setItem('communityQuestions', JSON.stringify(updatedPosts));
      handleEditCancel();
    } catch (err) {
      if (err.code === 'ERR_NETWORK' || err.code === 'ECONNREFUSED') {
        const updatedPosts = posts.map(p => 
          (p._id === postId || p.id === postId) ? {
            ...p,
            title: editTitle.trim(),
            content: editContent.trim(),
            images: editImages,
            updatedAt: new Date().toISOString(),
          } : p
        );
        setPosts(updatedPosts);
        localStorage.setItem('communityQuestions', JSON.stringify(updatedPosts));
        handleEditCancel();
      } else {
        setError(err.response?.data?.message || '게시글 수정에 실패했습니다.');
      }
    }
  };

  const handleDelete = async (postId) => {
    if (!window.confirm('이 게시글을 삭제하시겠습니까?')) {
      return;
    }

    try {
      await questionAPI.deleteCommunity(postId);
      const updatedPosts = posts.filter(p => p._id !== postId && p.id !== postId);
      setPosts(updatedPosts);
      localStorage.setItem('communityQuestions', JSON.stringify(updatedPosts));
    } catch (err) {
      if (err.code === 'ERR_NETWORK' || err.code === 'ECONNREFUSED') {
        const updatedPosts = posts.filter(p => p._id !== postId && p.id !== postId);
        setPosts(updatedPosts);
        localStorage.setItem('communityQuestions', JSON.stringify(updatedPosts));
      } else {
        setError(err.response?.data?.message || '게시글 삭제에 실패했습니다.');
      }
    }
  };

  const handleCommentAdd = async (postId) => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    const text = commentTexts[postId] || '';
    if (!text.trim()) {
      return;
    }

    try {
      const response = await questionAPI.createComment(postId, text);
      // 댓글 작성 성공 시 즉시 UI 업데이트
      const updatedPosts = posts.map(post => 
        (post._id === postId || post.id === postId) 
          ? { ...post, comments: [...(post.comments || []), response.data] }
          : post
      );
      setPosts(updatedPosts);
      localStorage.setItem('communityQuestions', JSON.stringify(updatedPosts));
      setCommentTexts({ ...commentTexts, [postId]: '' });
      
      // 댓글 작성 후 서버에서 최신 댓글 목록 다시 로드
      setTimeout(() => {
        loadComments(postId);
      }, 100);
    } catch (err) {
      console.error('댓글 작성 오류:', err);
      // 네트워크 오류 또는 인증 오류인 경우 로컬 스토리지에 저장
      if (err.code === 'ERR_NETWORK' || err.code === 'ECONNREFUSED' || err.response?.status === 401 || err.response?.status === 403) {
        const comment = {
          _id: Date.now().toString(),
          id: Date.now().toString(),
          postId,
          text: text.trim(),
          userId: user?.id,
          userName: user?.name || '익명',
          createdAt: new Date().toISOString(),
        };
        const updatedPosts = posts.map(post => 
          (post._id === postId || post.id === postId) 
            ? { ...post, comments: [...(post.comments || []), comment] }
            : post
        );
        setPosts(updatedPosts);
        localStorage.setItem('communityQuestions', JSON.stringify(updatedPosts));
        setCommentTexts({ ...commentTexts, [postId]: '' });
      } else {
        alert(err.response?.data?.message || '댓글 작성에 실패했습니다.');
      }
    }
  };

  const handleCommentDelete = async (postId, commentId) => {
    if (!window.confirm('이 댓글을 삭제하시겠습니까?')) {
      return;
    }

    try {
      await questionAPI.deleteComment(postId, commentId);
      setPosts(prevPosts => prevPosts.map(post => 
        (post._id === postId || post.id === postId) 
          ? { ...post, comments: (post.comments || []).filter(c => 
              c._id !== commentId && c.id !== commentId
            )}
          : post
      ));
    } catch (err) {
      if (err.code === 'ERR_NETWORK' || err.code === 'ECONNREFUSED') {
        setPosts(prevPosts => prevPosts.map(post => 
          (post._id === postId || post.id === postId) 
            ? { ...post, comments: (post.comments || []).filter(c => 
                c._id !== commentId && c.id !== commentId
              )}
            : post
        ));
      }
    }
  };

  const canEdit = (post) => {
    if (!isAuthenticated || !user) return false;
    return post.userId === user.id || post.userId?.toString() === user.id?.toString();
  };

  const canDeleteComment = (comment) => {
    if (!isAuthenticated || !user) return false;
    return comment.userId === user.id || comment.userId?.toString() === user.id?.toString();
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return '방금 전';
    if (minutes < 60) return `${minutes}분 전`;
    if (hours < 24) return `${hours}시간 전`;
    if (days < 7) return `${days}일 전`;
    return date.toLocaleDateString('ko-KR');
  };

  const toggleComments = (postId) => {
    setExpandedComments(prev => ({
      ...prev,
      [postId]: !prev[postId]
    }));
    
    // 댓글 펼칠 때 로드
    if (!expandedComments[postId]) {
      loadComments(postId);
    }
  };

  return (
    <div className="custom-questions-page">
      <div className="community-header">
        <h1>커뮤니티</h1>
        {isAuthenticated && (
          <Link to="/community/create" className="btn btn-primary">
            새글작성
          </Link>
        )}
      </div>
      <p className="subtitle">
        다른 사용자들과 면접 질문을 공유해보세요
      </p>

      {!isAuthenticated && (
        <div className="login-prompt">
          <p>게시글을 작성하려면 <a href="/login">로그인</a>이 필요합니다.</p>
        </div>
      )}

      <div className="questions-list">
        {loading ? (
          <div className="loading">게시글을 불러오는 중...</div>
        ) : posts.length === 0 ? (
          <p className="empty-message">등록된 게시글이 없습니다. 첫 게시글을 작성해보세요!</p>
        ) : (
          <ul>
            {posts.map((post) => (
              <li key={post._id || post.id} className="question-item">
                {editingId === (post._id || post.id) ? (
                  <div className="edit-mode">
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      placeholder="제목"
                      className="post-title-input"
                    />
                    <textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      rows={6}
                      className="edit-textarea"
                    />
                    <div className="image-upload-section">
                      <label className="image-upload-label">
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={(e) => handleImageSelect(e, true)}
                          style={{ display: 'none' }}
                        />
                        <span className="btn btn-secondary">사진 추가</span>
                      </label>
                      {editImages.length > 0 && (
                        <div className="image-preview-list">
                          {editImages.map((img, index) => (
                            <div key={index} className="image-preview">
                              <img src={img} alt={`미리보기 ${index + 1}`} />
                              <button
                                onClick={() => removeImage(index, true)}
                                className="remove-image-btn"
                              >
                                ×
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="edit-actions">
                      <button 
                        onClick={() => handleEditSave(post._id || post.id)} 
                        className="btn btn-primary"
                      >
                        저장
                      </button>
                      <button 
                        onClick={handleEditCancel} 
                        className="btn btn-secondary"
                      >
                        취소
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="question-content" style={{ cursor: 'pointer' }} onClick={() => navigate(`/community/${post._id || post.id}`)}>
                      <h3 className="post-title">{post.title || post.text}</h3>
                      {post.content && (
                        <p className="post-content">{post.content}</p>
                      )}
                      {post.images && post.images.length > 0 && (
                        <div className="post-images">
                          {post.images.map((img, index) => (
                            <img 
                              key={index} 
                              src={img} 
                              alt={`첨부 이미지 ${index + 1}`}
                              className="post-image"
                            />
                          ))}
                        </div>
                      )}
                      <div className="question-meta-info">
                        <span className="author">{maskName(post.userName)}</span>
                        <span className="separator">•</span>
                        <span className="date">{formatDate(post.createdAt)}</span>
                        {post.updatedAt && post.updatedAt !== post.createdAt && (
                          <>
                            <span className="separator">•</span>
                            <span className="updated">수정됨</span>
                          </>
                        )}
                      </div>
                      
                      {/* 댓글 섹션 */}
                      <div className="comments-section" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleComments(post._id || post.id);
                          }}
                          className="toggle-comments-btn"
                        >
                          댓글 {post.comments?.length || 0}개
                        </button>
                        
                        {expandedComments[post._id || post.id] && (
                          <div className="comments-list">
                            {post.comments && post.comments.length > 0 ? (
                              post.comments.map((comment) => (
                                <div key={comment._id || comment.id} className="comment-item">
                                  <div className="comment-content">
                                    <span className="comment-author">{maskName(comment.userName)}</span>
                                    <span className="comment-text">{comment.text}</span>
                                    <span className="comment-date">{formatDate(comment.createdAt)}</span>
                                  </div>
                                  {canDeleteComment(comment) && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleCommentDelete(post._id || post.id, comment._id || comment.id);
                                      }}
                                      className="delete-comment-btn"
                                    >
                                      삭제
                                    </button>
                                  )}
                                </div>
                              ))
                            ) : (
                              <p className="no-comments">댓글이 없습니다.</p>
                            )}
                            
                            {isAuthenticated && (
                              <div className="add-comment">
                                <textarea
                                  value={commentTexts[post._id || post.id] || ''}
                                  onChange={(e) => {
                                    e.stopPropagation();
                                    setCommentTexts({
                                      ...commentTexts,
                                      [post._id || post.id]: e.target.value
                                    });
                                  }}
                                  onClick={(e) => e.stopPropagation()}
                                  placeholder="댓글을 입력하세요..."
                                  rows={3}
                                  className="comment-input"
                                />
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleCommentAdd(post._id || post.id);
                                  }}
                                  className="btn btn-primary"
                                  style={{ marginTop: '0.5rem' }}
                                >
                                  댓글 작성
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    {canEdit(post) && (
                      <div className="question-actions" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditStart(post);
                          }}
                          className="edit-btn"
                          title="수정"
                        >
                          수정
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(post._id || post.id);
                          }}
                          className="delete-btn"
                          title="삭제"
                        >
                          삭제
                        </button>
                      </div>
                    )}
                  </>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default CustomQuestions;
