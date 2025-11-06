import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

// 백엔드 서버 연결 확인
const checkBackendConnection = async () => {
  try {
    await axios.get(`${API_URL.replace('/api', '')}/health`, { timeout: 2000 });
    return true;
  } catch (error) {
    return false;
  }
};

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 5000,
});

// 요청 인터셉터 - 토큰 추가
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    // 인증이 필요 없는 엔드포인트는 토큰 없이도 정상
    const authEndpoints = ['/auth/login', '/auth/signup'];
    const isAuthEndpoint = authEndpoints.some(endpoint => 
      config.url?.includes(endpoint)
    );
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      // 디버깅: 토큰이 있는지 확인 (인증 필요한 엔드포인트만)
      if (!isAuthEndpoint) {
        console.log('🔑 토큰 전송:', {
          url: config.url,
          hasToken: !!token,
          tokenType: token === 'local-token' ? 'local-token' : 'JWT',
          tokenPreview: token !== 'local-token' ? token.substring(0, 20) + '...' : 'local-token',
        });
      }
    } else {
      // 로그인/회원가입은 토큰이 없어도 정상이므로 경고하지 않음
      if (!isAuthEndpoint) {
        console.warn('⚠️ 토큰이 없습니다:', config.url);
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 응답 인터셉터 - 에러 처리
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // 인증이 필요 없는 엔드포인트는 제외
    const authEndpoints = ['/auth/login', '/auth/signup'];
    const isAuthEndpoint = authEndpoints.some(endpoint => 
      error.config?.url?.includes(endpoint)
    );
    
    // 네트워크 오류 처리 (백엔드 서버에 연결할 수 없는 경우)
    if (error.code === 'ERR_NETWORK' || error.code === 'ECONNREFUSED' || error.message?.includes('Network Error')) {
      const currentAPIUrl = API_URL;
      const isLocalhost = currentAPIUrl.includes('localhost') || currentAPIUrl.includes('127.0.0.1');
      
      if (isLocalhost) {
        console.error('❌ 백엔드 서버에 연결할 수 없습니다.');
        console.error('💡 해결 방법:');
        console.error('   1. 백엔드 서버가 실행 중인지 확인하세요.');
        console.error('   2. 다른 컴퓨터에서 접속하는 경우, .env 파일에 백엔드 서버 IP를 설정하세요.');
        console.error(`   3. 예: REACT_APP_API_URL=http://192.168.1.100:3001/api`);
        console.error(`   현재 API URL: ${currentAPIUrl}`);
        
        // 에러 객체에 사용자 친화적인 메시지 추가
        error.userMessage = '백엔드 서버에 연결할 수 없습니다. 백엔드 서버가 실행 중인지 확인하고, 다른 컴퓨터에서 접속하는 경우 .env 파일에 서버 주소를 설정해주세요.';
      } else {
        console.error(`❌ 백엔드 서버에 연결할 수 없습니다: ${currentAPIUrl}`);
        error.userMessage = `백엔드 서버(${currentAPIUrl})에 연결할 수 없습니다. 서버가 실행 중인지 확인해주세요.`;
      }
    }
    
    // 401 또는 403 에러 처리 (토큰이 유효하지 않은 경우)
    if ((error.response?.status === 401 || error.response?.status === 403) && !isAuthEndpoint) {
      const token = localStorage.getItem('token');
      
      // 로컬 토큰인 경우 백엔드에서 검증할 수 없으므로 에러로 처리하지 않고
      // 로컬 스토리지 사용을 위해 에러를 그대로 전달
      if (token === 'local-token') {
        console.warn('로컬 토큰 사용 중. 백엔드 인증이 필요합니다.');
        // 로컬 토큰인 경우 특별한 처리는 하지 않고 그대로 전달
        // 호출하는 쪽에서 처리하도록 함
      } else {
        // 실제 토큰이 유효하지 않은 경우
        console.warn('인증 토큰이 유효하지 않습니다. 로그인이 필요할 수 있습니다.');
        // 토큰 삭제 (선택적 - 사용자가 다시 로그인하도록 유도)
        // localStorage.removeItem('token');
        // localStorage.removeItem('user');
      }
    }
    return Promise.reject(error);
  }
);

// 인증 API
export const authAPI = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  signup: (userData) => api.post('/auth/signup', userData),
  logout: () => api.post('/auth/logout'),
};

// 사용자 API
export const userAPI = {
  getProfile: () => api.get('/users/profile'),
  updateProfile: (data) => api.put('/users/profile', data),
  deleteAccount: (password) => api.delete('/users/profile', { data: { password } }),
};

// 면접 API
export const interviewAPI = {
  create: (data) => api.post('/interviews', data),
  getAll: () => api.get('/interviews'),
  getById: (id) => api.get(`/interviews/${id}`),
  update: (id, data) => api.put(`/interviews/${id}`, data),
  delete: (id) => api.delete(`/interviews/${id}`),
};

// 질문 API
export const questionAPI = {
  generateQuestions: (companyName, job, difficulty, questionCount) => 
    api.post('/questions/generate', { companyName, job, difficulty, questionCount }, {
      timeout: 60000, // 질문 생성은 시간이 오래 걸릴 수 있으므로 60초로 설정
    }),
  // 커뮤니티 질문 API
  createCommunity: (title, content, images) => 
    api.post('/questions/community', { title, content, images }),
  getCommunity: () => 
    api.get('/questions/community'),
  updateCommunity: (id, title, content, images) => 
    api.put(`/questions/community/${id}`, { title, content, images }),
  deleteCommunity: (id) => api.delete(`/questions/community/${id}`),
  // 댓글 API
  createComment: (postId, text) => 
    api.post(`/questions/community/${postId}/comments`, { text }),
  getComments: (postId) => 
    api.get(`/questions/community/${postId}/comments`),
  deleteComment: (postId, commentId) => 
    api.delete(`/questions/community/${postId}/comments/${commentId}`),
};

// 피드백 API
export const feedbackAPI = {
  generate: (interviewId, answerId, answer, question, job, difficulty) => 
    api.post(`/feedback/${interviewId}/${answerId}`, { answer, question, job, difficulty }),
  generateBatch: (data) => 
    api.post('/feedback/batch', data),
};

export default api;

