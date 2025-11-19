const express = require('express');
const https = require('https');
const http = require('http');
const fs = require('fs');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { OpenAI } = require('openai');

// .env 파일 로드
const envPath = require('path').join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
} else {
  dotenv.config();
}

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
// 오디오 base64 데이터를 포함한 큰 페이로드를 처리하기 위해 크기 제한 증가 (50MB)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// MongoDB 연결 (선택사항)
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/interview';
let isMongoConnected = false;

// MongoDB 연결 함수 (재시도 로직 포함)
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 10;

const connectMongoDB = async (isRetry = false) => {
  try {
    if (isRetry) {
      reconnectAttempts++;
    } else {
      reconnectAttempts = 0;
    }
    
    const mongooseOptions = {
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 30000,
      retryWrites: true,
      retryReads: true,
      directConnection: false,
      autoIndex: true,
    };
    
    if (process.platform === 'win32') {
      mongooseOptions.serverSelectionTimeoutMS = 60000;
      mongooseOptions.connectTimeoutMS = 60000;
    }
    
    if (isRetry && reconnectAttempts > 3) {
      mongooseOptions.serverSelectionTimeoutMS = 90000;
      mongooseOptions.connectTimeoutMS = 90000;
    }
    
    await mongoose.connect(MONGODB_URI, mongooseOptions);
    isMongoConnected = true;
    reconnectAttempts = 0;
  } catch (err) {
    console.error('MongoDB 연결 실패:', err.message);
    
    if (!isRetry) {
      console.log('로컬 메모리 모드로 작동합니다 (데이터는 서버 재시작 시 초기화됩니다)');
    }
    
    isMongoConnected = false;
    
    if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
      const retryDelay = Math.min(10000 * Math.pow(1.5, reconnectAttempts), 60000);
      setTimeout(() => {
        if (mongoose.connection.readyState === 0) {
          connectMongoDB(true);
        }
      }, retryDelay);
    }
  }
};

// 초기 연결 시도
connectMongoDB();

// MongoDB 연결 상태 이벤트 리스너
mongoose.connection.on('connected', () => {
  isMongoConnected = true;
  reconnectAttempts = 0;
});

mongoose.connection.on('error', (err) => {
  console.error('MongoDB 연결 오류:', err);
  isMongoConnected = false;
});

mongoose.connection.on('disconnected', () => {
  isMongoConnected = false;
});

// 메모리 저장소 (MongoDB 없이 사용)
const memoryStore = {
  users: [],
  interviews: [],
  questions: [],
  comments: [],
};

// 스키마 정의
const UserSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  createdAt: { type: Date, default: Date.now },
});

const InterviewSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  job: String,
  difficulty: String,
  mode: String,
  companyName: String, // 회사명 추가
  questions: [String],
  answers: mongoose.Schema.Types.Mixed, // 비디오 면접의 객체 배열도 지원하도록 Mixed 타입으로 변경
  feedbacks: [Object],
  score: Number,
  interviewType: { type: String, default: 'text' }, // 영상 면접인지 텍스트 면접인지 구분
  createdAt: { type: Date, default: Date.now },
});

const QuestionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  userName: String,
  title: String,
  content: String,
  images: [String], // base64 이미지 배열
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const CommentSchema = new mongoose.Schema({
  postId: { type: mongoose.Schema.Types.ObjectId, ref: 'Question' },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  userName: String,
  text: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const User = mongoose.model('User', UserSchema);
const Interview = mongoose.model('Interview', InterviewSchema);
const Question = mongoose.model('Question', QuestionSchema);
const Comment = mongoose.model('Comment', CommentSchema);

// MongoDB 연결 확인 및 데이터베이스 작업 헬퍼
const dbOperations = {
  // 사용자 저장
  saveUser: async (userData) => {
    // 실제 연결 상태 확인 (readyState: 1 = connected)
    const isActuallyConnected = mongoose.connection.readyState === 1;
    
    if (isActuallyConnected) {
      try {
        const user = new User(userData);
        const savedUser = await user.save();
        return savedUser;
      } catch (error) {
        console.error('MongoDB 저장 오류:', error);
        throw error;
      }
    } else {
      const user = { ...userData, _id: Date.now().toString(), createdAt: new Date() };
      memoryStore.users.push(user);
      return user;
    }
  },
  
  // 사용자 찾기
  findUser: async (query) => {
    if (isMongoConnected) {
      try {
        // MongoDB ObjectId 형식 검증 함수
        const isValidObjectId = (id) => {
          if (!id) return false;
          const idStr = id.toString();
          // MongoDB ObjectId는 24자리 hex 문자열
          return /^[0-9a-fA-F]{24}$/.test(idStr);
        };
        
        // id가 전달되면 _id로 변환 (MongoDB는 _id만 인식)
        const mongoQuery = { ...query };
        if (mongoQuery.id && !mongoQuery._id) {
          // ObjectId 형식이 아니면 _id로 변환하지 않음 (email로만 조회)
          if (isValidObjectId(mongoQuery.id)) {
            mongoQuery._id = mongoQuery.id;
          }
          delete mongoQuery.id;
        }
        
        if (mongoQuery._id && !isValidObjectId(mongoQuery._id)) {
          delete mongoQuery._id;
        }
        
        const user = await User.findOne(mongoQuery);
        return user;
      } catch (error) {
        if (error.name === 'CastError' && error.path === '_id' && query.email) {
          try {
            return await User.findOne({ email: query.email });
          } catch (retryError) {
            console.error('재조회 오류:', retryError);
          }
        }
        throw error;
      }
    } else {
      return memoryStore.users.find(u => {
        if (query.email) return u.email === query.email;
        if (query._id) return u._id === query._id || u.id === query._id;
        if (query.id) return u._id === query.id || u.id === query.id;
        return false;
      });
    }
  },
  
  // 사용자 업데이트
  updateUser: async (userId, updateData) => {
    if (isMongoConnected) {
      return await User.findByIdAndUpdate(userId, updateData, { new: true });
    } else {
      const index = memoryStore.users.findIndex(u => u._id === userId || u.id === userId);
      if (index !== -1) {
        memoryStore.users[index] = { 
          ...memoryStore.users[index], 
          ...updateData,
        };
        return memoryStore.users[index];
      }
      return null;
    }
  },
  
  // 사용자 삭제
  deleteUser: async (userId) => {
    if (isMongoConnected) {
      try {
        // 사용자와 관련된 면접 기록도 함께 삭제
        await Interview.deleteMany({ userId });
        // 사용자와 관련된 질문도 함께 삭제
        await Question.deleteMany({ userId });
        // 사용자 삭제
        const deletedUser = await User.findByIdAndDelete(userId);
        if (deletedUser) {
          console.log(`🗑️ MongoDB에서 사용자 삭제 완료: ${deletedUser.email} (ID: ${deletedUser._id})`);
        }
        return deletedUser;
      } catch (error) {
        console.error('❌ MongoDB 사용자 삭제 오류:', error);
        throw error;
      }
    } else {
      // 메모리 저장소에서 삭제
      const index = memoryStore.users.findIndex(u => u._id === userId || u.id === userId);
      if (index !== -1) {
        const deletedUser = memoryStore.users[index];
        // 관련 면접 기록 삭제
        memoryStore.interviews = memoryStore.interviews.filter(i => i.userId !== userId);
        // 관련 질문 삭제
        memoryStore.questions = memoryStore.questions.filter(q => q.userId !== userId);
        // 사용자 삭제
        memoryStore.users.splice(index, 1);
        console.log(`🗑️ 메모리에서 사용자 삭제: ${deletedUser.email}`);
        return deletedUser;
      }
      return null;
    }
  },
  
  // 면접 저장
  saveInterview: async (interviewData) => {
    if (isMongoConnected) {
      const interview = new Interview(interviewData);
      const saved = await interview.save();
      // id 필드 추가
      const interviewObj = saved.toObject();
      if (interviewObj._id) {
        interviewObj.id = interviewObj._id.toString();
      }
      return interviewObj;
    } else {
      const interviewId = Date.now().toString();
      const interview = { 
        ...interviewData, 
        _id: interviewId,
        id: interviewId, // id 필드도 추가
        createdAt: new Date() 
      };
      memoryStore.interviews.push(interview);
      return interview;
    }
  },
  
  // 면접 찾기
  findInterviews: async (query) => {
    if (isMongoConnected) {
      const interviews = await Interview.find(query).sort({ createdAt: -1 });
      // MongoDB 결과에 id 필드 추가
      return interviews.map(interview => {
        const interviewObj = interview.toObject();
        if (interviewObj._id) {
          interviewObj.id = interviewObj._id.toString();
        }
        return interviewObj;
      });
    } else {
      const interviews = memoryStore.interviews.filter(i => {
        if (query.userId) return i.userId === query.userId;
        return true;
      }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      // id 필드 추가
      return interviews.map(interview => {
        if (interview._id && !interview.id) {
          interview.id = interview._id;
        }
        return interview;
      });
    }
  },
  
  // 면접 하나 찾기
  findInterview: async (query) => {
    if (isMongoConnected) {
      // MongoDB에서 검색 시 _id와 id를 모두 지원
      const mongoQuery = {};
      
      // userId 필터는 항상 포함
      if (query.userId) {
        mongoQuery.userId = query.userId;
      }
      
      // _id 또는 id로 검색
      if (query._id || query.id) {
        const searchId = query._id || query.id;
        // ObjectId 형식도 지원하도록 시도
        try {
          if (mongoose.Types.ObjectId.isValid(searchId)) {
            mongoQuery.$or = [
              { _id: new mongoose.Types.ObjectId(searchId) },
              { _id: searchId },
              { id: searchId }
            ];
          } else {
            mongoQuery.$or = [
              { _id: searchId },
              { id: searchId }
            ];
          }
        } catch (error) {
          mongoQuery.$or = [
            { _id: searchId },
            { id: searchId }
          ];
        }
      }
      
      const interview = await Interview.findOne(mongoQuery);
      if (interview) {
        const interviewObj = interview.toObject();
        if (interviewObj._id && !interviewObj.id) {
          interviewObj.id = interviewObj._id.toString();
        }
        return interviewObj;
      }
      return null;
    } else {
      const interview = memoryStore.interviews.find(i => {
        // userId 필터 먼저 확인
        if (query.userId && i.userId !== query.userId) {
          return false;
        }
        // _id 또는 id로 검색
        if (query._id) {
          return i._id === query._id || i.id === query._id;
        }
        if (query.id) {
          return i.id === query.id || i._id === query.id;
        }
        // userId만 있으면 userId로만 필터링
        if (query.userId) {
          return i.userId === query.userId;
        }
        return false;
      });
      if (interview && interview._id && !interview.id) {
        interview.id = interview._id;
      }
      return interview;
    }
  },
  
  // 면접 삭제
  deleteInterview: async (interviewId, userId) => {
    if (isMongoConnected) {
      const deleted = await Interview.findOneAndDelete({ 
        $or: [{ _id: interviewId }, { id: interviewId }],
        userId: userId 
      });
      if (deleted) {
        console.log(`🗑️ MongoDB에서 면접 기록 삭제 완료: ${interviewId}`);
      }
      return deleted;
    } else {
      const index = memoryStore.interviews.findIndex(i => 
        (i._id === interviewId || i.id === interviewId) && i.userId === userId
      );
      if (index !== -1) {
        const deleted = memoryStore.interviews[index];
        memoryStore.interviews.splice(index, 1);
        return deleted;
      }
      return null;
    }
  },
  
  // 질문 저장
  saveQuestion: async (questionData) => {
    if (isMongoConnected) {
      const question = new Question(questionData);
      return await question.save();
    } else {
      const question = { 
        ...questionData, 
        _id: Date.now().toString(), 
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      memoryStore.questions.push(question);
      return question;
    }
  },
  
  // 질문 찾기 (커뮤니티용 - 모든 질문)
  findQuestions: async (query) => {
    if (isMongoConnected) {
      return await Question.find(query || {}).sort({ createdAt: -1 });
    } else {
      return memoryStore.questions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }
  },
  
  // 질문 하나 찾기
  findQuestion: async (id) => {
    if (isMongoConnected) {
      return await Question.findById(id);
    } else {
      return memoryStore.questions.find(q => q._id === id || q.id === id);
    }
  },
  
  // 질문 업데이트
  updateQuestion: async (id, updateData) => {
    if (isMongoConnected) {
      updateData.updatedAt = new Date();
      return await Question.findByIdAndUpdate(id, updateData, { new: true });
    } else {
      const index = memoryStore.questions.findIndex(q => q._id === id || q.id === id);
      if (index !== -1) {
        memoryStore.questions[index] = { 
          ...memoryStore.questions[index], 
          ...updateData,
          updatedAt: new Date(),
        };
        return memoryStore.questions[index];
      }
      return null;
    }
  },
  
  // 질문 삭제
  deleteQuestion: async (id, userId) => {
    if (isMongoConnected) {
      return await Question.findOneAndDelete({ _id: id, userId });
    } else {
      const index = memoryStore.questions.findIndex(q => 
        (q._id === id || q.id === id) && q.userId === userId
      );
      if (index !== -1) {
        memoryStore.questions.splice(index, 1);
        return true;
      }
      return false;
    }
  },
  
  // 댓글 저장
  saveComment: async (commentData) => {
    if (isMongoConnected) {
      const comment = new Comment(commentData);
      return await comment.save();
    } else {
      const comment = { 
        ...commentData, 
        _id: Date.now().toString(),
        id: Date.now().toString(),
        createdAt: new Date(),
      };
      if (!memoryStore.comments) {
        memoryStore.comments = [];
      }
      memoryStore.comments.push(comment);
      return comment;
    }
  },
  
  // 댓글 찾기 (특정 게시글의 댓글들)
  findComments: async (postId) => {
    if (isMongoConnected) {
      return await Comment.find({ postId }).sort({ createdAt: 1 });
    } else {
      if (!memoryStore.comments) {
        memoryStore.comments = [];
      }
      return memoryStore.comments
        .filter(c => c.postId === postId || c.postId?.toString() === postId?.toString())
        .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    }
  },
  
  // 댓글 삭제
  deleteComment: async (commentId, userId) => {
    if (isMongoConnected) {
      const deleted = await Comment.findOneAndDelete({ _id: commentId, userId });
      return deleted;
    } else {
      if (!memoryStore.comments) {
        memoryStore.comments = [];
      }
      const index = memoryStore.comments.findIndex(c => 
        (c._id === commentId || c.id === commentId) && (c.userId === userId || c.userId?.toString() === userId?.toString())
      );
      if (index !== -1) {
        const deleted = memoryStore.comments[index];
        memoryStore.comments.splice(index, 1);
        return deleted;
      }
      return null;
    }
  },
};

// OpenAI 설정
const openaiApiKey = process.env.OPENAI_API_KEY?.trim();

const openai = new OpenAI({
  apiKey: openaiApiKey,
});

// 인증 미들웨어
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: '인증 토큰이 필요합니다.' });
  }

  if (token === 'local-token') {
    return res.status(403).json({ message: '유효하지 않은 토큰입니다.' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'secret', (err, user) => {
    if (err) {
      return res.status(403).json({ message: '유효하지 않은 토큰입니다.' });
    }
    req.user = user;
    next();
  });
};

// 인증 라우트
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    // 중복 체크
    const existingUser = await dbOperations.findUser({ email });
    if (existingUser) {
      return res.status(400).json({ message: '이미 등록된 이메일입니다.' });
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await dbOperations.saveUser({ name, email, password: hashedPassword });

    const token = jwt.sign({ userId: user._id || user.id }, process.env.JWT_SECRET || 'secret');
    
    res.json({
      user: { id: user._id || user.id, name: user.name, email: user.email },
      token,
      storage: isMongoConnected ? 'mongodb' : 'memory',
    });
  } catch (error) {
    console.error('회원가입 오류:', error);
    res.status(400).json({ message: error.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ message: '이메일과 비밀번호를 입력해주세요.' });
    }
    
    const user = await dbOperations.findUser({ email });
    
    if (!user) {
      return res.status(401).json({ message: '이메일 또는 비밀번호가 올바르지 않습니다.' });
    }
    
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      return res.status(401).json({ message: '이메일 또는 비밀번호가 올바르지 않습니다.' });
    }

    const token = jwt.sign({ userId: user._id || user.id }, process.env.JWT_SECRET || 'secret');
    
    res.json({
      user: { id: user._id || user.id, name: user.name, email: user.email },
      token,
    });
  } catch (error) {
    console.error('로그인 오류:', error);
    res.status(500).json({ message: error.message });
  }
});

app.post('/api/auth/logout', authenticateToken, (req, res) => {
  res.json({ message: '로그아웃되었습니다.' });
});

// 사용자 프로필 라우트
app.get('/api/users/profile', authenticateToken, async (req, res) => {
  try {
    const user = await dbOperations.findUser({ id: req.user.userId });
    if (!user) {
      return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
    }
    res.json({ id: user._id || user.id, name: user.name, email: user.email });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.put('/api/users/profile', authenticateToken, async (req, res) => {
  try {
    const { name, email, currentPassword, newPassword } = req.body;
    
    // 비밀번호 변경 처리
    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({ message: '현재 비밀번호를 입력해주세요.' });
      }
      
      const user = await dbOperations.findUser({ id: req.user.userId });
      if (!user) {
        return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
      }
      
      // 현재 비밀번호 확인
      const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
      if (!isPasswordValid) {
        return res.status(400).json({ message: '현재 비밀번호가 올바르지 않습니다.' });
      }
      
      // 새 비밀번호 해시화
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await dbOperations.updateUser(req.user.userId, { password: hashedPassword });
    }
    
    // 이메일 변경 시 중복 체크
    if (email) {
      const existingUser = await dbOperations.findUser({ email });
      if (existingUser && (existingUser._id !== req.user.userId && existingUser.id !== req.user.userId)) {
        return res.status(400).json({ message: '이미 등록된 이메일입니다.' });
      }
    }
    
    const updateData = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    
    const updatedUser = await dbOperations.updateUser(req.user.userId, updateData);
    if (!updatedUser) {
      return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
    }
    
    res.json({ id: updatedUser._id || updatedUser.id, name: updatedUser.name, email: updatedUser.email });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 회원탈퇴
app.delete('/api/users/profile', authenticateToken, async (req, res) => {
  try {
    const { password } = req.body;
    
    // 비밀번호 확인
    if (!password) {
      return res.status(400).json({ message: '비밀번호를 입력해주세요.' });
    }
    
    const user = await dbOperations.findUser({ id: req.user.userId });
    if (!user) {
      return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
    }
    
    // 비밀번호 확인
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: '비밀번호가 올바르지 않습니다.' });
    }
    
    // 사용자 및 관련 데이터 삭제
    await dbOperations.deleteUser(req.user.userId);
    
    res.json({ message: '회원탈퇴가 완료되었습니다.' });
  } catch (error) {
    console.error('❌ 회원탈퇴 오류:', error);
    res.status(500).json({ message: error.message });
  }
});

// 면접 라우트
app.post('/api/interviews', authenticateToken, async (req, res) => {
  try {
    const interview = await dbOperations.saveInterview({
      ...req.body,
      userId: req.user.userId,
    });
    res.json(interview);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

app.get('/api/interviews', authenticateToken, async (req, res) => {
  try {
    const interviews = await dbOperations.findInterviews({ userId: req.user.userId });
    res.json(interviews);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get('/api/interviews/:id', authenticateToken, async (req, res) => {
  try {
    const interviewId = req.params.id;
    
    const interview = await dbOperations.findInterview({
      _id: interviewId,
      id: interviewId,
      userId: req.user.userId,
    });
    
    if (!interview) {
      return res.status(404).json({ message: '면접 기록을 찾을 수 없습니다.' });
    }
    
    if (interview._id && !interview.id) {
      interview.id = interview._id.toString();
    }
    res.json(interview);
  } catch (error) {
    console.error('면접 기록 조회 오류:', error);
    // 에러 상세 정보 로깅
    console.error('에러 스택:', error.stack);
    // 데이터베이스 쿼리 오류는 500, 찾을 수 없는 경우는 404로 처리
    if (error.name === 'CastError' || error.message.includes('not found')) {
      return res.status(404).json({ message: '면접 기록을 찾을 수 없습니다.' });
    }
    res.status(500).json({ message: error.message || '서버 오류가 발생했습니다.' });
  }
});

app.delete('/api/interviews/:id', authenticateToken, async (req, res) => {
  try {
    const interviewId = req.params.id;
    const deleted = await dbOperations.deleteInterview(interviewId, req.user.userId);
    if (!deleted) {
      return res.status(404).json({ message: '면접 기록을 찾을 수 없습니다.' });
    }
    res.json({ message: '면접 기록이 삭제되었습니다.', deleted });
  } catch (error) {
    console.error('❌ 면접 기록 삭제 오류:', error);
    res.status(500).json({ message: error.message });
  }
});

// 피드백 생성 (단일 답변)
app.post('/api/feedback/:interviewId/:answerId', authenticateToken, async (req, res) => {
  try {
    const { answer, question, job, difficulty } = req.body;
    
    const prompt = `당신은 ${job} 포지션을 채용하는 경력 10년 이상의 시니어 면접관입니다. 다음 면접 질문과 답변을 실제 면접관의 관점에서 엄격하고도 건설적으로 평가해주세요.

【면접 정보】
- 직무: ${job}
- 난이도: ${difficulty}
- 질문: ${question}
- 답변: ${answer}

【평가 기준】
1. 완성도 (Completeness): 답변이 질문에 충분히 대응했는가? 핵심 내용이 빠지지 않았는가?
2. 관련성 (Relevance): 직무와의 연관성이 명확한가? ${job} 포지션에 필요한 역량이 드러나는가?
3. 명확성 (Clarity): 전달하고자 하는 메시지가 명확한가? 논리적 흐름이 있는가?
4. 구체성 (Detail): 추상적인 설명만 있는가? 구체적인 사례, 숫자, 경험이 포함되어 있는가?

【평가 방식】
- 각 항목을 0~10점으로 평가하되, 실제 면접에서 기대하는 수준을 기준으로 엄격하게 평가하세요.
- 평균적인 답변은 5~6점, 좋은 답변은 7~8점, 탁월한 답변은 9~10점입니다.
- 점수에 따라 차등을 두고, 모든 답변에 똑같은 점수를 주지 마세요.

【피드백 작성 요구사항】
1. 전체 코멘트: 답변의 강점과 약점을 구체적으로 지적하세요. 답변 내용을 직접 인용하며 평가하세요.
2. 개선 제안: 이 답변을 어떻게 개선할 수 있는지 구체적이고 실행 가능한 제안을 3~5개 제공하세요.
3. 면접관 관점: "이 답변을 듣고 면접관이 어떤 생각을 할까?"를 고려하여 작성하세요.
4. 차별화: 모든 답변에 똑같은 피드백을 주지 말고, 각 답변의 특성에 맞춰 다르게 작성하세요.

응답 형식은 반드시 JSON으로 제공하세요:
{
  "scores": {
    "completeness": 0~10 사이의 정수,
    "relevance": 0~10 사이의 정수,
    "clarity": 0~10 사이의 정수,
    "detail": 0~10 사이의 정수
  },
  "comment": "답변 내용을 구체적으로 언급하며 작성한 상세한 피드백 (최소 200자 이상)",
  "suggestions": ["구체적인 개선 제안1", "구체적인 개선 제안2", "구체적인 개선 제안3", "구체적인 개선 제안4"],
  "strengths": ["답변의 강점1", "답변의 강점2"],
  "weaknesses": ["답변의 약점1", "답변의 약점2"]
}`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      temperature: 0.8, // 다양성을 위해 temperature 증가
    });

    const feedback = JSON.parse(completion.choices[0].message.content);
    res.json(feedback);
  } catch (error) {
    console.error('OpenAI API Error:', error);
    res.status(500).json({ message: '피드백 생성에 실패했습니다.' });
  }
});

// 전체 면접 피드백 생성 (질문-답변 쌍 전체)
app.post('/api/feedback/batch', async (req, res) => {
  try {
    const { questions, answers, job, difficulty, companyName } = req.body;
    
    if (!questions || !answers || questions.length !== answers.length) {
      return res.status(400).json({ message: '질문과 답변의 개수가 일치하지 않습니다.' });
    }

    const feedbacks = [];
    
    // 각 질문-답변 쌍에 대해 개별 피드백 생성
    for (let i = 0; i < questions.length; i++) {
      const question = questions[i].text || questions[i];
      let answer = answers[i];
      
      // 오디오 답변인 경우 텍스트로 변환
      if (answer && typeof answer === 'object' && answer.type === 'audio' && answer.base64Audio) {
        try {
          // base64를 Buffer로 변환
          const audioBuffer = Buffer.from(answer.base64Audio, 'base64');
          
          // 오디오 파일 크기 확인 (너무 작으면 무음으로 간주)
          const audioSizeKB = audioBuffer.length / 1024;
          const duration = answer.duration || 0; // 초 단위
          
          // 무음 또는 빈 오디오 체크
          // 1. 파일 크기가 10KB 미만이거나
          // 2. duration이 1초 미만이거나
          // 3. duration이 0이면 무음으로 간주하고 STT 변환 건너뛰기
          if (audioSizeKB < 10 || duration < 1 || duration === 0) {
            answer = '';
          } else {
            
            // File 객체로 변환 (Whisper API 요구 형식)
            const path = require('path');
            const os = require('os');
            
            // 임시 파일 경로 생성
            const tempDir = os.tmpdir();
            const tempFilePath = path.join(tempDir, `audio_${Date.now()}_${i}.webm`);
            
            // Buffer를 임시 파일로 저장
            fs.writeFileSync(tempFilePath, audioBuffer);
            
            // File 객체 생성 (File-like 객체)
            const file = fs.createReadStream(tempFilePath);
            
            // OpenAI Whisper API로 오디오를 텍스트로 변환
            const transcriptionResponse = await openai.audio.transcriptions.create({
              file: file,
              model: 'whisper-1',
              language: 'ko', // 한국어로 지정
              response_format: 'text',
              temperature: 0,
            });
            
            // 임시 파일 삭제
            fs.unlinkSync(tempFilePath);
            
            // 한글 인코딩 처리
            answer = transcriptionResponse || '';
            if (typeof answer === 'string') {
              // UTF-8 인코딩 보장
              answer = Buffer.from(answer, 'utf8').toString('utf8');
              // 불필요한 공백 제거
              answer = answer.trim();
              
              // 의미 없는 텍스트 필터링
              // 1. 너무 짧은 텍스트 (10자 미만)
              // 2. 일반적인 방송 인사말이나 의미 없는 패턴
              const trimmedAnswer = answer.trim();
              const meaninglessPatterns = [
                /^시청해주셔서\s*감사합니다/i,
                /^MBC\s*뉴스/i,
                /^이덕영/i,
              ];
              
              const isMeaningless = meaninglessPatterns.some(pattern => pattern.test(trimmedAnswer));
              
              if (trimmedAnswer.length < 10 || isMeaningless) {
                answer = '';
              } else {
                answer = trimmedAnswer;
              }
            }
          }
        } catch (error) {
          console.error(`오디오 변환 오류:`, error);
          answer = '';
        }
      }
      
      // 문자열로 변환 (URL인 경우도 처리)
      if (typeof answer === 'string') {
        answer = answer.trim();
      } else {
        answer = '';
      }
      
      if (!answer) {
        feedbacks.push({
          scores: { completeness: 0, relevance: 0, clarity: 0, detail: 0 },
          comment: '답변이 제공되지 않았습니다.',
          suggestions: ['답변을 작성해주세요.'],
          strengths: [],
          weaknesses: ['답변이 없습니다.']
        });
        continue;
      }

      const prompt = `당신은 ${companyName ? companyName + '에서 ' : ''}${job} 포지션을 채용하는 경력 15년 이상의 시니어 면접관입니다. 실제 채용 면접에서 지원자를 평가하는 것과 동일한 엄격한 기준으로 평가하세요. 

⚠️ 중요한 원칙:
- 칭찬만 하지 마세요. 부족한 점을 명확히 지적해야 지원자가 발전할 수 있습니다.
- "괜찮습니다", "좋습니다" 같은 애매한 표현을 피하고, 구체적이고 직접적인 평가를 해주세요.
- 답변이 부족하면 솔직하게 부족하다고 말하세요. 이것이 진짜 면접관의 역할입니다.
- 답변의 실제 품질을 정확히 평가하세요. 모든 답변이 평균 이상이 아닙니다.
- 이 답변은 ${i + 1}번째 질문입니다. 이전 질문들과 완전히 다른 피드백을 작성하세요.

【면접 정보】
${companyName ? `- 회사: ${companyName}` : ''}
- 직무: ${job}
- 난이도: ${difficulty}
- 질문 번호: ${i + 1}/${questions.length}
- 질문: "${question}"
- 답변: "${answer}"

【중요 지침】
1. 이 답변만을 분석하세요. 다른 답변과 비교하거나 일반적인 피드백을 주지 마세요.
2. 답변의 실제 내용을 문자 그대로 분석하세요. 답변에 언급된 구체적인 내용을 인용하세요.
3. 질문의 의도를 파악하고, 답변이 그 의도를 충족하는지 평가하세요.
4. ${job} 직무에 필요한 구체적인 역량과 지식을 기준으로 평가하세요.
5. 답변의 길이, 구조, 구체성, 논리성을 세밀하게 분석하세요.

【평가 기준 (엄격하게 평가)】
1. 완성도 (Completeness): 
   - 질문의 핵심을 이해했는가?
   - 질문에 요구된 모든 요소를 다뤘는가?
   - 답변이 불완전하거나 중간에 끊긴 느낌은 없는가?
   - 예: "자기소개" 질문에 이름, 경력, 지원 동기 등이 모두 포함되었는가?

2. 관련성 (Relevance):
   - ${job} 직무와 직접적으로 연관되는 내용인가?
   - 답변의 내용이 직무 요구사항과 일치하는가?
   - 일반적인 답변이 아닌, 해당 직무에 특화된 내용인가?
   - 예: "프론트엔드 개발자" 질문에 기술 스택, 경험, 프로젝트가 명시되어 있는가?

3. 명확성 (Clarity):
   - 답변의 핵심 메시지가 명확한가?
   - 논리적 흐름이 있는가? (시작→전개→결론)
   - 문장이 이해하기 쉬운가?
   - 예: "그래서", "그런데" 같은 모호한 연결이 아닌 명확한 논리 구조인가?

4. 구체성 (Detail):
   - 추상적인 설명만 있는가, 아니면 구체적인 사례가 있는가?
   - 숫자, 기간, 결과, 기술명 등 구체적 정보가 포함되었는가?
   - STAR 기법(Situation, Task, Action, Result)을 사용했는가?
   - 예: "프로젝트를 했다" vs "6개월간 React 기반 전자상거래 플랫폼 개발을 진행하여 매출 30% 증가"

【점수 부여 기준 (매우 엄격하게 - 실제 면접 기준)】
실제 면접에서 대부분의 지원자는 평균 이하의 답변을 합니다. 이를 반영하여 매우 엄격하게 평가하세요.

- 0-2점: 답변이 거의 없거나 질문과 전혀 무관함. 면접관이 실망할 수준.
- 3-4점: 평균 이하. 답변은 있으나 매우 부족함. 구체성이 전혀 없고 추상적임. 면접관이 "이 지원자는 준비가 안 되었다"고 판단할 수준.
- 5-6점: 평균 수준. 기본적인 답변은 하지만 깊이가 부족하고 구체적 사례가 약함. 면접관이 "괜찮긴 한데..."라고 생각할 수준. 대부분의 지원자가 이 수준입니다.
- 7-8점: 평균 이상. 질문에 잘 대응하고 구체적 사례 포함. 면접관이 "좋은 답변"이라고 평가할만함. 실제 면접에서 이 수준은 드뭅니다.
- 9-10점: 탁월함. 매우 구체적이고, 직무와 완벽히 연관되며, 설득력 있음. 면접관이 "매우 인상적"이라고 평가할 수준. 실제 면접에서 매우 드뭅니다.

⚠️ 절대 금지:
- 모든 답변에 6-8점을 주지 마세요. 실제로는 3-5점이 많아야 합니다.
- 답변이 부족하면 솔직하게 낮은 점수를 주세요.
- 이전 질문들의 점수와 비교하여 다른 점수를 주세요.
- 각 답변의 실제 품질을 정확히 평가하세요.

【피드백 작성 요구사항 (매우 상세하게)】

1. 종합 평가 (comment) - 필수 사항 (엄격하고 솔직하게):
   - 답변의 실제 내용을 직접 인용하며 분석하세요.
   - 예: "답변에서 'React를 사용했다'고만 언급하셨는데, 구체적인 경험 수준이나 프로젝트 기간이 없어 면접관 입장에서는 신뢰하기 어렵습니다" 형태로 구체적이고 솔직하게 평가
   - 답변이 질문에 얼마나 잘 대응했는지, 부족한 부분은 무엇인지 명확히 지적
   - 직무와의 연관성이 부족하면 솔직하게 지적하세요
   - 답변의 구조와 논리적 흐름의 문제점을 명확히 지적
   - 면접관이 이 답변을 듣고 실제로 어떤 생각을 할지 (긍정적이든 부정적이든) 솔직하게 서술
   - "좋은 점도 있지만", "하지만", "문제는" 같은 표현으로 비판적 평가 포함
   - 최소 400자 이상, 가능하면 500-600자로 매우 상세하게 작성
   - 반드시 답변의 실제 내용을 인용하며, 부족한 점을 명확히 지적하세요
   - 이전 질문들과 완전히 다른 평가 관점과 표현을 사용하세요

2. 잘한 점 (strengths) - 솔직하게 평가:
   - 이 답변에 실제로 있는 강점만 나열하세요. 강점이 거의 없으면 1-2개만, 또는 없으면 빈 배열로 반환하세요
   - 답변 내용을 직접 인용하며 설명
   - 예: "답변 초반에 '3년간의 React 개발 경험'을 명시한 것은 좋았습니다. 하지만 구체적인 프로젝트나 성과가 빠져 아쉽습니다"
   - 일반적인 칭찬이 아닌, 이 답변에 실제로 있는 구체적 강점만 언급
   - 강점이 거의 없으면 솔직하게 적게 나열하세요 (0-2개도 가능)
   - 이전 질문들과 다른 강점을 찾으세요

3. 개선이 필요한 점 (weaknesses) - 엄격하게 지적:
   - 이 답변의 구체적인 부족한 부분을 3-5개 명확히 지적하세요. 부족한 점이 많으면 더 많이 나열하세요
   - 답변의 어느 부분이 부족한지 구체적으로 언급하고, 왜 부족한지 설명
   - 예: "답변 전체가 너무 추상적입니다. '프로젝트를 진행했다'는 부분에서 구체적인 기술 스택, 기간, 팀 규모, 성과가 전혀 없어 면접관이 이 지원자의 실력을 파악할 수 없습니다"
   - 질문의 의도와 비교하여 무엇이 빠졌는지, 무엇이 부족한지 명확히 지적
   - "부족합니다", "없습니다", "명확하지 않습니다" 같은 직접적인 표현 사용
   - 이전 질문들과 다른 약점을 찾으세요

4. 개선 제안 (suggestions) - 구체적이고 실행 가능하게, 새로운 관점 제시:
   - 이 답변을 구체적으로 어떻게 개선할 수 있는지 실행 가능한 제안 5-7개 제공
   - 답변의 현재 내용을 직접 인용하며, 구체적으로 어떻게 바꿀지 제안
   - 예: "현재 '프로젝트를 했다'는 부분을 '6개월간 React, TypeScript를 활용한 전자상거래 플랫폼 개발 프로젝트를 진행하며, 프론트엔드 팀원 4명과 협업하여 초기 사용자 10,000명을 달성하고 일평균 거래액 500만원을 기록했다'로 구체화하세요"
   - 질문의 의도에 맞춘 개선 방향 제시
   - STAR 기법 활용 방법 구체적 제안
   - "이렇게 하세요", "이 부분을 추가하세요", "이렇게 바꾸세요" 같은 구체적 지시
   - 이전 질문들과 완전히 다른 개선 제안을 하세요
   - 새로운 관점이나 접근 방식을 제안하세요 (예: "면접관이 궁금해할 수 있는 추가 정보", "다른 지원자와 차별화할 수 있는 포인트", "이 질문에 대한 창의적 답변 방법")

⚠️ 절대 금지 사항 (매우 중요):
- 모든 답변에 똑같은 피드백을 주지 마세요. 각 답변마다 완전히 다른 관점과 표현을 사용하세요.
- 일반적인 조언("구체적으로 작성하세요")만 주지 마세요. 답변의 실제 내용을 언급하며 구체적으로 지적하세요.
- 답변의 실제 내용을 언급하지 않고 평가하지 마세요. 반드시 답변의 특정 부분을 인용하세요.
- 질문의 내용과 무관한 피드백을 주지 마세요.
- "좋습니다", "괜찮습니다" 같은 애매한 표현을 피하세요. 구체적이고 직접적으로 평가하세요.
- 모든 답변을 긍정적으로 평가하지 마세요. 부족한 점을 명확히 지적하세요.
- 이전 질문들과 유사한 표현이나 구조를 사용하지 마세요. 완전히 다른 방식으로 평가하세요.

응답 형식은 반드시 JSON으로 제공하세요:
{
  "scores": {
    "completeness": 0~10 사이의 정수 (답변의 실제 품질에 따라 차등 부여),
    "relevance": 0~10 사이의 정수 (${job} 직무와의 연관성에 따라 차등 부여),
    "clarity": 0~10 사이의 정수 (답변의 명확성과 논리성에 따라 차등 부여),
    "detail": 0~10 사이의 정수 (구체성과 상세함에 따라 차등 부여)
  },
  "comment": "답변의 실제 내용을 직접 인용하며 작성한 매우 상세한 종합 평가 (최소 300자 이상, 가능하면 400-500자)",
  "suggestions": ["답변의 특정 부분을 개선하는 구체적이고 실행 가능한 제안1", "답변의 특정 부분을 개선하는 구체적이고 실행 가능한 제안2", "답변의 특정 부분을 개선하는 구체적이고 실행 가능한 제안3", "답변의 특정 부분을 개선하는 구체적이고 실행 가능한 제안4", "답변의 특정 부분을 개선하는 구체적이고 실행 가능한 제안5"],
  "strengths": ["답변의 실제 내용을 인용한 구체적 강점1", "답변의 실제 내용을 인용한 구체적 강점2", "답변의 실제 내용을 인용한 구체적 강점3"],
  "weaknesses": ["답변의 실제 내용을 인용한 구체적 약점1", "답변의 실제 내용을 인용한 구체적 약점2", "답변의 실제 내용을 인용한 구체적 약점3"]
}`;

      // 각 질문마다 다른 피드백을 위해 질문 번호와 현재 시간을 포함한 고유한 시드 추가
      const uniqueSeed = `${i}_${Date.now()}_${Math.random()}`;
      const enhancedPrompt = `${prompt}\n\n【고유 식별자】\n이 피드백은 ${i + 1}번째 질문에 대한 것입니다. 이전 질문들과 완전히 다른 평가 관점과 표현을 사용하세요. 고유 식별자: ${uniqueSeed}`;

      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: enhancedPrompt }],
        response_format: { type: 'json_object' },
        temperature: 1.0, // 각 질문마다 다른 피드백을 위해 최대한 높은 temperature
      });

      const feedback = JSON.parse(completion.choices[0].message.content);
      feedbacks.push(feedback);
    }

    // 전체 면접 종합평가 생성
    let overallFeedback = null;
    try {
      const allQuestions = questions.map(q => q.text || q).join('\n- ');
      // answers가 문자열 배열이 되었으므로 안전하게 필터링
      const allAnswers = answers
        .filter(a => {
          // 문자열인지 확인 후 trim 체크
          if (!a || typeof a !== 'string') return false;
          const trimmed = a.trim();
          return trimmed.length > 0;
        })
        .map(a => {
          // 안전하게 trim
          return typeof a === 'string' ? a.trim() : '';
        })
        .filter(a => a.length > 0); // 빈 문자열 제거
      
      // 실제 답변이 하나도 없으면 종합평가를 생성하지 않음
      if (allAnswers.length === 0) {
        overallFeedback = {
          overallComment: '모든 질문에 대한 답변이 제공되지 않았습니다. 면접을 완료하려면 모든 질문에 답변해주세요.',
          keyStrengths: [],
          keyWeaknesses: ['모든 질문에 답변하지 않았습니다.'],
          improvementAreas: ['면접 질문에 대한 답변 준비'],
          improvementSuggestions: ['면접 전 질문을 미리 검토하고 답변을 준비하세요.', '답변할 수 없는 질문이 있으면 솔직하게 말하는 것도 중요합니다.'],
          interviewerPerspective: '이 지원자는 면접 질문에 답변하지 않아 평가할 수 없습니다. 면접을 완료하려면 모든 질문에 답변해야 합니다.'
        };
      } else {
        const allAnswersText = allAnswers.join('\n\n---\n\n');
        
        try {
          const overallPrompt = `당신은 ${companyName ? companyName + '에서 ' : ''}${job} 포지션을 채용하는 경력 15년 이상의 시니어 면접관입니다. 실제 채용 결정을 내리는 것과 동일한 엄격한 기준으로 전체 면접을 종합적으로 평가해주세요.

⚠️ 중요한 원칙:
- 칭찬만 하지 마세요. 부족한 점을 명확히 지적해야 지원자가 발전할 수 있습니다.
- "괜찮습니다", "좋습니다" 같은 애매한 표현을 피하고, 구체적이고 직접적인 평가를 해주세요.
- 전체 면접에서 부족한 점이 많으면 솔직하게 지적하세요. 이것이 진짜 면접관의 역할입니다.

【면접 정보】
${companyName ? `- 회사: ${companyName}` : ''}
- 직무: ${job}
- 난이도: ${difficulty}
- 총 질문 수: ${questions.length}개

【전체 질문 목록】
- ${allQuestions}

【전체 답변 내용】
${allAnswersText}

【종합평가 요구사항 (엄격하고 솔직하게)】
1. 전체 면접에서 지원자가 보여준 강점과 약점을 종합적으로 분석하세요. 약점이 많으면 솔직하게 많이 지적하세요.
2. 일관성: 모든 답변에서 일관되게 드러나는 문제점이나 특징이 있는지 평가하세요.
3. 직무 적합성: ${job} 포지션에 얼마나 적합한지 솔직하게 평가하세요. 부적합하면 솔직하게 말하세요.
4. 개선이 필요한 점: 전체 면접에서 가장 크게 개선이 필요한 부분을 구체적으로, 솔직하게 지적하세요. 여러 개 나열하세요.
5. 개선 제안: 다음 면접을 위해 구체적으로 어떤 부분을 보완해야 하는지 실행 가능한 제안을 제공하세요. 구체적으로 작성하세요.
6. 채용 결정 관점: 실제 면접관이라면 이 지원자를 어떻게 평가할지 솔직하게, 비판적으로 서술하세요. "합격할 가능성이 높다/낮다"와 같은 구체적 평가 포함.

⚠️ 중요: 
- 각 답변의 실제 내용을 종합하여 분석하세요. 일반적인 조언이 아닌, 이 지원자의 실제 답변을 기반으로 한 평가여야 합니다.
- 부족한 점이 많으면 솔직하게 많이 지적하세요. 이것이 지원자가 발전할 수 있는 유일한 방법입니다.
- "좋은 점도 있지만", "하지만", "문제는" 같은 표현으로 비판적 평가를 포함하세요.

응답 형식은 반드시 JSON으로 제공하세요:
{
  "overallComment": "전체 면접에 대한 종합 평가 (최소 400자 이상)",
  "keyStrengths": ["전체 면접에서 보여준 주요 강점1", "전체 면접에서 보여준 주요 강점2", "전체 면접에서 보여준 주요 강점3"],
  "keyWeaknesses": ["전체 면접에서 개선이 필요한 주요 약점1", "전체 면접에서 개선이 필요한 주요 약점2", "전체 면접에서 개선이 필요한 주요 약점3"],
  "improvementAreas": ["구체적인 개선이 필요한 영역1", "구체적인 개선이 필요한 영역2", "구체적인 개선이 필요한 영역3"],
  "improvementSuggestions": ["다음 면접을 위한 구체적이고 실행 가능한 개선 제안1", "다음 면접을 위한 구체적이고 실행 가능한 개선 제안2", "다음 면접을 위한 구체적이고 실행 가능한 개선 제안3", "다음 면접을 위한 구체적이고 실행 가능한 개선 제안4"],
  "interviewerPerspective": "면접관 관점에서 이 지원자를 어떻게 평가할지 구체적으로 서술 (최소 200자 이상)"
}`;

          const overallCompletion = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [{ role: 'user', content: overallPrompt }],
            response_format: { type: 'json_object' },
            temperature: 1.0,
          });

          overallFeedback = JSON.parse(overallCompletion.choices[0].message.content);
        } catch (error) {
          console.error('종합평가 생성 오류:', error);
          // 종합평가 실패해도 개별 피드백은 반환
        }
      }
    } catch (error) {
      console.error('종합평가 생성 오류:', error);
      // 종합평가 실패해도 개별 피드백은 반환
    }

    res.json({ feedbacks, overallFeedback });
  } catch (error) {
    console.error('OpenAI API Error:', error);
    res.status(500).json({ message: '피드백 생성에 실패했습니다.' });
  }
});

// AI를 사용한 맞춤 질문 생성 (기업별)
app.post('/api/questions/generate', async (req, res) => {
  try {
    const { companyName, job, difficulty, questionCount } = req.body;
    
    if (!companyName || !job || !questionCount) {
      return res.status(400).json({ message: '기업명, 직무, 질문 수는 필수입니다.' });
    }

    const difficultyText = {
      easy: '초급 (신입 수준)',
      medium: '중급 (경력 2-5년 수준)',
      hard: '고급 (시니어 수준)'
    }[difficulty] || '중급';

    const prompt = `${companyName}의 ${job} 포지션을 위한 면접 질문 ${questionCount}개를 생성해주세요.

요구사항:
- 난이도: ${difficultyText}
- ${companyName}의 기업 문화와 가치관을 반영한 질문
- ${job} 직무에 특화된 기술적, 행동 면접 질문
- 실제 면접에서 자주 나오는 유형의 질문

응답 형식은 반드시 JSON 객체로 다음과 같이 제공해주세요:
{
  "questions": [
    "질문 1",
    "질문 2",
    "질문 3",
    ...
  ]
}

questions 배열에 질문 ${questionCount}개를 정확히 포함해주세요.`;

    const apiKey = process.env.OPENAI_API_KEY?.trim();
    
    if (!apiKey) {
      return res.status(500).json({ 
        message: 'OpenAI API 키가 설정되지 않았습니다. .env 파일에 OPENAI_API_KEY를 추가해주세요.' 
      });
    }
    
    // API 키가 기본값인지 확인
    if (apiKey === 'your-openai-api-key-if-needed') {
      return res.status(500).json({ 
        message: 'OpenAI API 키가 기본값으로 설정되어 있습니다. .env 파일에 실제 API 키를 입력해주세요.' 
      });
    }

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
    });

    if (!completion.choices || !completion.choices[0] || !completion.choices[0].message) {
      throw new Error('OpenAI API 응답 형식이 올바르지 않습니다.');
    }

    let response;
    try {
      response = JSON.parse(completion.choices[0].message.content);
    } catch (parseError) {
      console.error('❌ JSON 파싱 오류:', parseError);
      console.error('❌ 원본 응답:', completion.choices[0].message.content);
      throw new Error('OpenAI API 응답을 파싱할 수 없습니다.');
    }
    
    // OpenAI가 배열을 객체로 반환할 수 있으므로 처리
    let questions = [];
    if (Array.isArray(response)) {
      questions = response;
    } else if (response.questions && Array.isArray(response.questions)) {
      questions = response.questions;
    } else if (response.questions && typeof response.questions === 'object') {
      questions = Object.values(response.questions);
    } else {
      // 객체의 값들을 배열로 변환
      questions = Object.values(response).filter(q => typeof q === 'string');
    }

    // 질문 수가 요청한 것보다 많으면 자르기
    questions = questions.slice(0, questionCount);

    res.json({
      questions: questions,
      companyName,
      job,
      difficulty,
      questionCount: questions.length,
    });
  } catch (error) {
    console.error('❌ OpenAI API Error:', error);
    console.error('❌ Error details:', {
      message: error.message,
      status: error.status,
      code: error.code,
      type: error.type,
      response: error.response?.data,
    });
    console.error('❌ API 키 확인:', process.env.OPENAI_API_KEY ? `${process.env.OPENAI_API_KEY.substring(0, 20)}...` : '없음');
    
    let errorMessage = '질문 생성에 실패했습니다.';
    let statusCode = 500;
    
    // OpenAI API 키 관련 오류
    if (!process.env.OPENAI_API_KEY) {
      errorMessage = 'OpenAI API 키가 설정되지 않았습니다. .env 파일에 OPENAI_API_KEY를 추가해주세요.';
      statusCode = 500;
    } else if (error.message?.includes('API key') || error.message?.includes('authentication') || error.response?.status === 401 || error.status === 401) {
      errorMessage = 'OpenAI API 키가 유효하지 않거나 만료되었습니다. 다음을 확인해주세요:\n1. OpenAI 웹사이트에서 API 키가 활성화되어 있는지 확인\n2. API 키에 충분한 크레딧이 있는지 확인\n3. API 키가 revoke되지 않았는지 확인\n4. 새로운 API 키를 발급받아 .env 파일에 업데이트';
      statusCode = 401;
    } 
    // Rate limit 오류
    else if (error.message?.includes('rate limit') || error.response?.status === 429) {
      errorMessage = 'API 요청 한도를 초과했습니다. 잠시 후 다시 시도해주세요.';
      statusCode = 429;
    }
    // 네트워크 오류
    else if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      errorMessage = 'OpenAI API 서버에 연결할 수 없습니다. 인터넷 연결을 확인해주세요.';
      statusCode = 503;
    }
    // 기타 오류
    else if (error.message) {
      errorMessage = `질문 생성 오류: ${error.message}`;
    }
    
    res.status(statusCode).json({ 
      message: errorMessage,
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? {
        code: error.code,
        status: error.status,
        response: error.response?.data,
      } : undefined,
    });
  }
});

// 커뮤니티 질문 작성 (인증 필요)
app.post('/api/questions/community', authenticateToken, async (req, res) => {
  try {
    const { title, content, images } = req.body;
    
    if (!title || !title.trim()) {
      return res.status(400).json({ message: '제목을 입력해주세요.' });
    }
    
    if (!content || !content.trim()) {
      return res.status(400).json({ message: '내용을 입력해주세요.' });
    }

    // 사용자 정보 가져오기
    const user = await dbOperations.findUser({ id: req.user.userId });
    
    const question = await dbOperations.saveQuestion({
      title: title.trim(),
      content: content.trim(),
      images: images || [],
      userId: req.user.userId,
      userName: user?.name || '익명',
    });
    
    res.json(question);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// 커뮤니티 질문 목록 조회 (인증 불필요)
app.get('/api/questions/community', async (req, res) => {
  try {
    const questions = await dbOperations.findQuestions({});
    res.json(questions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 커뮤니티 질문 수정 (작성자만)
app.put('/api/questions/community/:id', authenticateToken, async (req, res) => {
  try {
    const questionId = req.params.id;
    const userId = req.user.userId;
    const { title, content, images } = req.body;
    
    const question = await dbOperations.findQuestion(questionId);
    
    if (!question) {
      return res.status(404).json({ message: '게시글을 찾을 수 없습니다.' });
    }
    
    if (question.userId?.toString() !== userId.toString() && question.userId !== userId) {
      return res.status(403).json({ message: '수정 권한이 없습니다.' });
    }
    
    const updated = await dbOperations.updateQuestion(questionId, {
      title: title?.trim() || question.title,
      content: content?.trim() || question.content,
      images: images !== undefined ? images : question.images,
    });
    
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 커뮤니티 질문 삭제 (작성자만)
app.delete('/api/questions/community/:id', authenticateToken, async (req, res) => {
  try {
    const questionId = req.params.id;
    const userId = req.user.userId;
    
    const deleted = await dbOperations.deleteQuestion(questionId, userId);
    
    if (!deleted) {
      return res.status(404).json({ message: '게시글을 찾을 수 없거나 삭제 권한이 없습니다.' });
    }
    
    res.json({ message: '게시글이 삭제되었습니다.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 댓글 작성
app.post('/api/questions/community/:id/comments', authenticateToken, async (req, res) => {
  try {
    const postId = req.params.id;
    const { text } = req.body;
    
    if (!text || !text.trim()) {
      return res.status(400).json({ message: '댓글 내용을 입력해주세요.' });
    }

    const user = await dbOperations.findUser({ id: req.user.userId });
    const comment = await dbOperations.saveComment({
      postId,
      text: text.trim(),
      userId: req.user.userId,
      userName: user?.name || '익명',
    });
    
    res.json(comment);
  } catch (error) {
    console.error('댓글 작성 오류:', error);
    res.status(400).json({ message: error.message });
  }
});

// 댓글 목록 조회
app.get('/api/questions/community/:id/comments', async (req, res) => {
  try {
    const postId = req.params.id;
    const comments = await dbOperations.findComments(postId);
    res.json(comments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 댓글 삭제
app.delete('/api/questions/community/:postId/comments/:commentId', authenticateToken, async (req, res) => {
  try {
    const commentId = req.params.commentId;
    const userId = req.user.userId;
    
    const deleted = await dbOperations.deleteComment(commentId, userId);
    
    if (!deleted) {
      return res.status(404).json({ message: '댓글을 찾을 수 없거나 삭제 권한이 없습니다.' });
    }
    
    res.json({ message: '댓글이 삭제되었습니다.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 헬스 체크 엔드포인트
// 루트 경로
app.get('/', (req, res) => {
  res.json({
    message: 'Interview API Server',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      api: '/api',
      auth: {
        signup: 'POST /api/auth/signup',
        login: 'POST /api/auth/login',
        logout: 'POST /api/auth/logout',
        profile: 'GET /api/users/profile'
      },
      interviews: {
        create: 'POST /api/interviews',
        list: 'GET /api/interviews',
        detail: 'GET /api/interviews/:id'
      },
      questions: {
        generate: 'POST /api/questions/generate',
        community: {
          create: 'POST /api/questions/community',
          list: 'GET /api/questions/community',
          comments: {
            create: 'POST /api/questions/community/:id/comments',
            list: 'GET /api/questions/community/:id/comments'
          }
        }
      },
      feedback: {
        create: 'POST /api/feedback/:interviewId/:answerId',
        batch: 'POST /api/feedback/batch'
      }
    },
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString()
  });
});

app.get('/health', (req, res) => {
  const readyState = mongoose.connection.readyState;
  const stateNames = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
  };
  
  res.json({
    status: 'ok',
    mongodb: readyState === 1 ? 'connected' : `disconnected (using memory store)`,
    mongodbReadyState: readyState,
    mongodbStateName: stateNames[readyState] || 'unknown',
    mongodbUri: MONGODB_URI,
    databaseName: mongoose.connection.db?.databaseName || 'not connected',
    timestamp: new Date().toISOString(),
    warning: readyState !== 1 ? '⚠️ 데이터는 메모리에만 저장되며 서버 재시작 시 사라집니다. MongoDB를 연결하세요.' : null,
  });
});


// 서버 시작
const HOST = process.env.HOST || '0.0.0.0'; // 외부 접속 허용
const USE_HTTPS = process.env.USE_HTTPS === 'true'; // 기본값: false (개발 환경에서는 HTTP 권장)

// HTTPS 서버 설정 (자체 서명 인증서)
let server;
if (USE_HTTPS) {
  try {
    // 자체 서명 인증서 생성 (개발용)
    const { execSync } = require('child_process');
    const path = require('path');
    const certDir = path.join(__dirname, 'certs');
    const keyPath = path.join(certDir, 'server.key');
    const certPath = path.join(certDir, 'server.crt');
    
    // 인증서 디렉토리 생성
    if (!fs.existsSync(certDir)) {
      fs.mkdirSync(certDir, { recursive: true });
    }
    
    // 인증서가 없으면 생성
    if (!fs.existsSync(keyPath) || !fs.existsSync(certPath)) {
      console.log('🔐 자체 서명 인증서 생성 중...');
      try {
        // OpenSSL로 인증서 생성 (Windows에서는 Git Bash나 WSL 필요)
        execSync(`openssl req -x509 -newkey rsa:2048 -keyout "${keyPath}" -out "${certPath}" -days 365 -nodes -subj "/C=KR/ST=Seoul/L=Seoul/O=Dev/CN=172.16.17.182"`, {
          stdio: 'inherit',
          cwd: certDir
        });
        console.log('✅ 인증서 생성 완료');
      } catch (error) {
        console.warn('⚠️ OpenSSL로 인증서 생성 실패, 기본 인증서 사용');
        // 간단한 자체 서명 인증서 생성 (Node.js로)
        try {
          // selfsigned v4는 generate 메서드를 사용
          const selfsigned = require('selfsigned');
          const generate = selfsigned.generate || selfsigned; // v4는 generate 메서드, 이전 버전은 직접 함수
          
          if (typeof generate !== 'function') {
            throw new Error('selfsigned.generate는 함수여야 합니다. 패키지가 올바르게 설치되었는지 확인하세요.');
          }
          
          const attrs = [{ name: 'commonName', value: '172.16.17.182' }];
          const pems = generate(attrs, { days: 365 });
          fs.writeFileSync(keyPath, pems.private);
          fs.writeFileSync(certPath, pems.cert);
          console.log('✅ selfsigned로 인증서 생성 완료');
        } catch (selfsignedError) {
          console.error('❌ 인증서 생성 실패:', selfsignedError.message || selfsignedError);
          console.error('💡 해결 방법: npm install selfsigned 실행 또는 USE_HTTPS=false로 설정');
          // 인증서 생성 실패해도 HTTP로 계속 진행
          throw selfsignedError;
        }
      }
    }
    
    const options = {
      key: fs.readFileSync(keyPath),
      cert: fs.readFileSync(certPath)
    };
    
    server = https.createServer(options, app);
    console.log('🔒 HTTPS 서버 모드로 시작합니다.');
  } catch (error) {
    console.warn('⚠️ HTTPS 설정 실패, HTTP로 시작합니다:', error.message);
    server = http.createServer(app);
  }
} else {
  server = http.createServer(app);
  console.log('🌐 HTTP 서버 모드로 시작합니다.');
}

server.listen(PORT, HOST, () => {
  const protocol = USE_HTTPS ? 'https' : 'http';
  console.log(`🚀 서버가 포트 ${PORT}에서 실행 중입니다. (${protocol.toUpperCase()})`);
  const readyState = mongoose.connection.readyState;
  const stateNames = {
    0: '연결 안됨',
    1: '연결됨',
    2: '연결 중',
    3: '연결 해제 중'
  };
  console.log(`📊 MongoDB 상태: ${stateNames[readyState] || '알 수 없음'} (readyState: ${readyState})`);
  console.log(`📋 MongoDB URI: ${MONGODB_URI}`);
  if (readyState === 1) {
    console.log(`📁 데이터베이스: ${mongoose.connection.db.databaseName}`);
  }
  
  // 네트워크 인터페이스 IP 주소 가져오기
  const os = require('os');
  const networkInterfaces = os.networkInterfaces();
  let localIP = 'localhost';
  for (const interfaceName in networkInterfaces) {
    const interfaces = networkInterfaces[interfaceName];
    for (const iface of interfaces) {
      if (iface.family === 'IPv4' && !iface.internal) {
        localIP = iface.address;
        break;
      }
    }
    if (localIP !== 'localhost') break;
  }
  
  console.log(`🌐 서버 URL:`);
  console.log(`   - 로컬: ${protocol}://localhost:${PORT}`);
  console.log(`   - 네트워크: ${protocol}://${localIP}:${PORT}`);
  console.log(`🔍 헬스 체크: ${protocol}://${localIP}:${PORT}/health`);
});

