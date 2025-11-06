import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { questionAPI } from '../api/api';

const CommunityDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    loadPost();
  }, [id]);

  const loadPost = async () => {
    setLoading(true);
    try {
      const response = await questionAPI.getCommunity();
      const posts = response.data || [];
      const foundPost = posts.find(p => (p._id === id || p.id === id));
      
      if (foundPost) {
        setPost(foundPost);
        loadComments(foundPost._id || foundPost.id);
      } else {
        // 로컬 스토리지에서 찾기
        const stored = localStorage.getItem('communityQuestions');
        if (stored) {
          const storedPosts = JSON.parse(stored);
          const foundPost = storedPosts.find(p => (p._id === id || p.id === id));
          if (foundPost) {
            setPost(foundPost);
          }
        }
      }
    } catch (err) {
      console.error('게시글 로드 실패:', err);
      // 로컬 스토리지에서 찾기
      const stored = localStorage.getItem('communityQuestions');
      if (stored) {
        const storedPosts = JSON.parse(stored);
        const foundPost = storedPosts.find(p => (p._id === id || p.id === id));
        if (foundPost) {
          setPost(foundPost);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const loadComments = async (postId) => {
    try {
      const response = await questionAPI.getComments(postId);
      setPost(prev => ({ ...prev, comments: response.data || [] }));
    } catch (err) {
      // 댓글 로드 실패는 무시
    }
  };

  const handleCommentAdd = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    if (!commentText.trim()) {
      return;
    }

    const postId = post._id || post.id;
    try {
      const response = await questionAPI.createComment(postId, commentText);
      setPost(prev => ({
        ...prev,
        comments: [...(prev.comments || []), response.data]
      }));
      setCommentText('');
      // 댓글 작성 후 목록 새로고침
      loadComments(postId);
    } catch (err) {
      console.error('댓글 작성 오류:', err);
      // 네트워크 오류 또는 인증 오류인 경우 로컬 스토리지에 저장
      if (err.code === 'ERR_NETWORK' || err.code === 'ECONNREFUSED' || err.response?.status === 401 || err.response?.status === 403) {
        const comment = {
          _id: Date.now().toString(),
          id: Date.now().toString(),
          postId,
          text: commentText.trim(),
          userId: user?.id,
          userName: user?.name || '익명',
          createdAt: new Date().toISOString(),
        };
        setPost(prev => ({
          ...prev,
          comments: [...(prev.comments || []), comment]
        }));
        setCommentText('');
        // 로컬 스토리지 업데이트
        const stored = localStorage.getItem('communityQuestions');
        if (stored) {
          const storedPosts = JSON.parse(stored);
          const updatedPosts = storedPosts.map(p => 
            (p._id === postId || p.id === postId)
              ? { ...p, comments: [...(p.comments || []), comment] }
              : p
          );
          localStorage.setItem('communityQuestions', JSON.stringify(updatedPosts));
        }
      } else {
        alert(err.response?.data?.message || '댓글 작성에 실패했습니다.');
      }
    }
  };

  const handleCommentDelete = async (commentId) => {
    if (!window.confirm('이 댓글을 삭제하시겠습니까?')) {
      return;
    }

    const postId = post._id || post.id;
    try {
      await questionAPI.deleteComment(postId, commentId);
      setPost(prev => ({
        ...prev,
        comments: (prev.comments || []).filter(c =>
          c._id !== commentId && c.id !== commentId
        )
      }));
    } catch (err) {
      if (err.code === 'ERR_NETWORK' || err.code === 'ECONNREFUSED') {
        setPost(prev => ({
          ...prev,
          comments: (prev.comments || []).filter(c =>
            c._id !== commentId && c.id !== commentId
          )
        }));
      }
    }
  };

  const maskName = (name) => {
    if (!name || name === '익명') return '익명';
    if (name.length === 1) return '*';
    if (name.length === 2) return name[0] + '*';
    const firstChar = name[0];
    const lastChar = name[name.length - 1];
    const middleStars = '*'.repeat(name.length - 2);
    return firstChar + middleStars + lastChar;
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

  const canDeleteComment = (comment) => {
    if (!isAuthenticated || !user) return false;
    return comment.userId === user.id || comment.userId?.toString() === user.id?.toString();
  };

  if (loading) {
    return <div className="custom-questions-page"><div className="loading">게시글을 불러오는 중...</div></div>;
  }

  if (!post) {
    return <div className="custom-questions-page"><p className="empty-message">게시글을 찾을 수 없습니다.</p></div>;
  }

  return (
    <div className="custom-questions-page">
      <div className="community-header">
        <button onClick={() => navigate('/custom-questions')} className="btn btn-secondary">
          ← 목록으로
        </button>
      </div>

      <div className="question-item" style={{ marginTop: '2rem' }}>
        <div className="question-content" style={{ width: '100%' }}>
          <h3 className="post-title">{post.title || post.text}</h3>
          {post.content && (
            <p className="post-content" style={{ whiteSpace: 'pre-wrap', marginTop: '1rem' }}>
              {post.content}
            </p>
          )}
          {post.images && post.images.length > 0 && (
            <div className="post-images" style={{ marginTop: '1rem' }}>
              {post.images.map((img, index) => (
                <img
                  key={index}
                  src={img}
                  alt={`첨부 이미지 ${index + 1}`}
                  className="post-image"
                  style={{ maxWidth: '100%', borderRadius: 'var(--radius-md)', marginBottom: '0.5rem' }}
                />
              ))}
            </div>
          )}
          <div className="question-meta-info" style={{ marginTop: '1rem' }}>
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
          <div className="comments-section" style={{ marginTop: '2rem', paddingTop: '2rem', borderTop: '2px solid var(--border-color)' }}>
            <h4 style={{ marginBottom: '1.5rem', fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              댓글 {post.comments?.length || 0}개
            </h4>

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
                        onClick={() => handleCommentDelete(comment._id || comment.id)}
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
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="댓글을 입력하세요..."
                    rows={3}
                    className="comment-input"
                  />
                  <button
                    onClick={handleCommentAdd}
                    className="btn btn-primary"
                    style={{ marginTop: '0.5rem' }}
                  >
                    댓글 작성
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommunityDetail;

