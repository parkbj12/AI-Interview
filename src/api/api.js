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
    
    if (error.code === 'ERR_CERT_AUTHORITY_INVALID' || error.message?.includes('certificate') || error.message?.includes('CERT')) {
      const currentAPIUrl = API_URL;
      const backendUrl = currentAPIUrl.replace('/api', '');
      error.userMessage = `인증서 오류가 발생했습니다. 브라우저에서 ${backendUrl} 에 접속하여 인증서를 먼저 수락해주세요.`;
    }
    
    if (error.code === 'ERR_NETWORK' || error.code === 'ECONNREFUSED' || error.message?.includes('Network Error')) {
      const currentAPIUrl = API_URL;
      const isLocalhost = currentAPIUrl.includes('localhost') || currentAPIUrl.includes('127.0.0.1');
      
      if (isLocalhost) {
        error.userMessage = '백엔드 서버에 연결할 수 없습니다. 백엔드 서버가 실행 중인지 확인하고, 다른 컴퓨터에서 접속하는 경우 .env 파일에 서버 주소를 설정해주세요.';
      } else {
        error.userMessage = `백엔드 서버(${currentAPIUrl})에 연결할 수 없습니다. 서버가 실행 중인지 확인해주세요.`;
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
  create: (data) => api.post('/interviews', data, {
    timeout: 60000, // 비디오 면접 데이터가 크므로 60초로 설정
  }),
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
    api.post('/feedback/batch', data, {
      timeout: 120000, // 피드백 생성은 시간이 오래 걸릴 수 있으므로 120초(2분)로 설정
    }),
};

export default api;

