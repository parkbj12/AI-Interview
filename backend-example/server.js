// 백엔드 서버 예시 (Node.js + Express + MongoDB)
// 별도의 백엔드 폴더에서 실행하세요

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const OpenAI = require('openai');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// OpenAI 클라이언트 초기화
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// 미들웨어
app.use(cors());
app.use(express.json());

// MongoDB 연결
let MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://your-connection-string';

// .env 파일에서 읽은 URI가 URL 인코딩되지 않은 경우를 대비해 처리
// 비밀번호에 특수문자가 있는 경우 자동으로 인코딩
if (MONGODB_URI.includes('<') || MONGODB_URI.includes('>') || MONGODB_URI.includes('!')) {
  // 이미 인코딩된 경우를 제외하고, 특수문자가 있으면 수동으로 처리
  const urlParts = MONGODB_URI.match(/mongodb\+srv:\/\/([^:]+):([^@]+)@(.+)/);
  if (urlParts && !urlParts[2].startsWith('%')) {
    // 비밀번호가 인코딩되지 않은 경우
    const encodedPassword = encodeURIComponent(urlParts[2]);
    MONGODB_URI = `mongodb+srv://${urlParts[1]}:${encodedPassword}@${urlParts[3]}`;
  }
}

console.log('MongoDB 연결 시도 중...');
console.log('연결 문자열:', MONGODB_URI.replace(/:[^:@]+@/, ':****@')); // 비밀번호 숨김

// 연결 상태 추적
let isMongoConnected = false;

// 연결 재시도 로직
const connectMongoDB = async () => {
  try {
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 30000, // 30초 타임아웃
    });
    isMongoConnected = true;
    console.log('✅ MongoDB 연결 성공');
    console.log('데이터베이스:', mongoose.connection.name);
    console.log('호스트:', mongoose.connection.host);
  } catch (err) {
    isMongoConnected = false;
    console.error('❌ MongoDB 연결 실패:', err.message);
    if (err.message.includes('authentication') || err.message.includes('bad auth')) {
      console.error('⚠️ 인증 실패: 사용자 이름 또는 비밀번호를 확인하세요.');
      console.error('   - MongoDB Atlas의 Database Access에서 사용자 확인');
      console.error('   - 비밀번호에 특수문자가 있으면 URL 인코딩 필요');
    } else if (err.message.includes('ENOTFOUND') || err.message.includes('ECONNREFUSED') || err.message.includes('getaddrinfo')) {
      console.error('⚠️ 네트워크 오류: MongoDB Atlas의 Network Access 설정을 확인하세요.');
      console.error('   - Network Access에서 IP 주소 추가 (개발: 0.0.0.0/0)');
    } else if (err.message.includes('timeout')) {
      console.error('⚠️ 연결 타임아웃: MongoDB Atlas 클러스터가 실행 중인지 확인하세요.');
    }
    console.error('전체 에러 상세:', err);
    // 5초 후 재시도
    console.log('5초 후 재연결 시도...');
    setTimeout(connectMongoDB, 5000);
  }
};

connectMongoDB();

// 연결 상태 이벤트 리스너
mongoose.connection.on('connected', () => {
  isMongoConnected = true;
  console.log('MongoDB 연결됨');
});

mongoose.connection.on('error', (err) => {
  isMongoConnected = false;
  console.error('MongoDB 연결 오류:', err);
});

mongoose.connection.on('disconnected', () => {
  isMongoConnected = false;
  console.log('MongoDB 연결 끊김');
});

// 스키마 정의
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const interviewSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  jobType: { type: String, required: true },
  difficulty: { type: String, required: true },
  questions: [{
    id: Number,
    question: String
  }],
  answers: { type: Object, default: {} },
  feedbacks: { type: Object, default: {} },
  score: { type: Number },
  completedAt: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);
const Interview = mongoose.model('Interview', interviewSchema);

// JWT 미들웨어
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: '인증 토큰이 필요합니다.' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key', (err, user) => {
    if (err) {
      return res.status(403).json({ error: '유효하지 않은 토큰입니다.' });
    }
    req.user = user;
    next();
  });
};

// 회원가입
app.post('/api/auth/signup', async (req, res) => {
  try {
    // MongoDB 연결 상태 확인 및 대기
    const maxWaitTime = 5000; // 최대 5초 대기
    const checkInterval = 100; // 100ms마다 확인
    let waited = 0;
    
    while (mongoose.connection.readyState !== 1 && waited < maxWaitTime) {
      await new Promise(resolve => setTimeout(resolve, checkInterval));
      waited += checkInterval;
    }
    
    if (mongoose.connection.readyState !== 1) {
      const stateMessages = {
        0: 'disconnected (연결 안 됨)',
        1: 'connected (연결됨)',
        2: 'connecting (연결 중)',
        3: 'disconnecting (연결 해제 중)'
      };
      console.log('⚠️ 회원가입 시도 시 MongoDB 연결 상태:', mongoose.connection.readyState, stateMessages[mongoose.connection.readyState]);
      return res.status(503).json({ 
        error: '데이터베이스 연결이 되지 않았습니다. 잠시 후 다시 시도해주세요.',
        details: `MongoDB 연결 상태: ${mongoose.connection.readyState} (${stateMessages[mongoose.connection.readyState]})`,
        hint: 'MongoDB Atlas의 Network Access 설정을 확인하세요.'
      });
    }

    const { email, password, name } = req.body;

    // 이메일 중복 확인
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: '이미 가입된 이메일입니다.' });
    }

    // 비밀번호 해시
    const hashedPassword = await bcrypt.hash(password, 10);

    // 사용자 생성
    const user = new User({
      email,
      password: hashedPassword,
      name
    });

    await user.save();

    // JWT 토큰 생성
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    res.status(201).json({
      user: {
        id: user._id,
        email: user.email,
        name: user.name
      },
      token
    });
  } catch (error) {
    console.error('회원가입 오류:', error);
    res.status(500).json({ error: '회원가입에 실패했습니다.' });
  }
});

// 로그인
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // 사용자 찾기
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: '이메일 또는 비밀번호가 올바르지 않습니다.' });
    }

    // 비밀번호 확인
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: '이메일 또는 비밀번호가 올바르지 않습니다.' });
    }

    // JWT 토큰 생성
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    res.json({
      user: {
        id: user._id,
        email: user.email,
        name: user.name
      },
      token
    });
  } catch (error) {
    console.error('로그인 오류:', error);
    res.status(500).json({ error: '로그인에 실패했습니다.' });
  }
});

// 사용자 정보 업데이트
app.put('/api/users/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const updates = req.body;

    // 본인 정보만 수정 가능
    if (req.user.userId !== userId) {
      return res.status(403).json({ error: '권한이 없습니다.' });
    }

    // 비밀번호 변경 시 해시 처리
    if (updates.password) {
      updates.password = await bcrypt.hash(updates.password, 10);
    }

    updates.updatedAt = new Date();

    const user = await User.findByIdAndUpdate(userId, updates, { new: true });
    if (!user) {
      return res.status(404).json({ error: '사용자를 찾을 수 없습니다.' });
    }

    res.json({
      id: user._id,
      email: user.email,
      name: user.name
    });
  } catch (error) {
    console.error('사용자 정보 업데이트 오류:', error);
    res.status(500).json({ error: '사용자 정보 업데이트에 실패했습니다.' });
  }
});

// 사용자 정보 조회
app.get('/api/users/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId).select('-password');
    
    if (!user) {
      return res.status(404).json({ error: '사용자를 찾을 수 없습니다.' });
    }

    res.json(user);
  } catch (error) {
    console.error('사용자 정보 조회 오류:', error);
    res.status(500).json({ error: '사용자 정보 조회에 실패했습니다.' });
  }
});

// 면접 기록 저장
app.post('/api/interviews', authenticateToken, async (req, res) => {
  try {
    const interview = new Interview({
      ...req.body,
      userId: req.user.userId
    });

    await interview.save();
    res.status(201).json(interview);
  } catch (error) {
    console.error('면접 기록 저장 오류:', error);
    res.status(500).json({ error: '면접 기록 저장에 실패했습니다.' });
  }
});

// 사용자의 면접 기록 조회
app.get('/api/interviews/user/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    
    // 본인 기록만 조회 가능
    if (req.user.userId !== userId) {
      return res.status(403).json({ error: '권한이 없습니다.' });
    }

    const interviews = await Interview.find({ userId }).sort({ createdAt: -1 });
    res.json(interviews);
  } catch (error) {
    console.error('면접 기록 조회 오류:', error);
    res.status(500).json({ error: '면접 기록 조회에 실패했습니다.' });
  }
});

// 특정 면접 기록 조회
app.get('/api/interviews/:interviewId', authenticateToken, async (req, res) => {
  try {
    const { interviewId } = req.params;
    const interview = await Interview.findById(interviewId);

    if (!interview) {
      return res.status(404).json({ error: '면접 기록을 찾을 수 없습니다.' });
    }

    // 본인 기록만 조회 가능
    if (interview.userId.toString() !== req.user.userId) {
      return res.status(403).json({ error: '권한이 없습니다.' });
    }

    res.json(interview);
  } catch (error) {
    console.error('면접 기록 조회 오류:', error);
    res.status(500).json({ error: '면접 기록 조회에 실패했습니다.' });
  }
});

// 면접 기록 삭제
app.delete('/api/interviews/:interviewId', authenticateToken, async (req, res) => {
  try {
    const { interviewId } = req.params;
    const interview = await Interview.findById(interviewId);

    if (!interview) {
      return res.status(404).json({ error: '면접 기록을 찾을 수 없습니다.' });
    }

    // 본인 기록만 삭제 가능
    if (interview.userId.toString() !== req.user.userId) {
      return res.status(403).json({ error: '권한이 없습니다.' });
    }

    await Interview.findByIdAndDelete(interviewId);
    res.json({ message: '면접 기록이 삭제되었습니다.' });
  } catch (error) {
    console.error('면접 기록 삭제 오류:', error);
    res.status(500).json({ error: '면접 기록 삭제에 실패했습니다.' });
  }
});

// 기업별 질문 생성 엔드포인트
app.post('/api/generate-questions', async (req, res) => {
  try {
    const { companyName, jobType, difficulty = "medium", count = 5 } = req.body;

    if (!companyName || !jobType) {
      return res.status(400).json({ error: '기업명과 직무가 필요합니다.' });
    }

    if (!process.env.OPENAI_API_KEY) {
      console.warn('OpenAI API 키가 설정되지 않았습니다. 모의 질문을 반환합니다.');
      return res.json({
        questions: [
          { id: 1, question: `${companyName}에 지원하게 된 이유는 무엇인가요?`, difficulty },
          { id: 2, question: `${companyName}의 비즈니스 모델에 대해 어떻게 이해하고 있나요?`, difficulty },
          { id: 3, question: `${jobType} 직무에서 가장 중요하다고 생각하는 역량은 무엇인가요?`, difficulty }
        ]
      });
    }

    // OpenAI API 호출
    console.log('기업별 질문 생성 요청:', { companyName, jobType, difficulty, count });
    
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `당신은 면접 전문가입니다. 특정 기업과 직무에 맞는 면접 질문을 생성합니다.

요구사항:
1. 질문은 ${companyName} 기업에 특화되어야 합니다.
2. ${jobType} 직무와 관련된 실무 질문이어야 합니다.
3. 난이도는 ${difficulty} 수준이어야 합니다.
4. 총 ${count}개의 질문을 생성해야 합니다.
5. 각 질문은 실제 면접에서 나올 수 있는 현실적인 질문이어야 합니다.

반드시 JSON 객체 형식으로 응답해주세요:
{
  "questions": [
    {
      "id": 1,
      "question": "질문 내용",
      "difficulty": "${difficulty}"
    },
    ...
  ]
}`
        },
        {
          role: "user",
          content: `${companyName}의 ${jobType} 직무에 지원하는 면접생을 위한 면접 질문 ${count}개를 생성해주세요. 
기업의 특성과 해당 직무의 요구사항을 반영한 실무적인 질문으로 작성해주세요.`
        }
      ],
      response_format: { type: "json_object" },
      max_tokens: 2000,
      temperature: 0.8
    });

    const responseContent = completion.choices[0].message.content;
    console.log('OpenAI API 응답 받음:', responseContent.substring(0, 300));
    
    try {
      const parsedResponse = JSON.parse(responseContent);
      
      // questions 필드가 있으면 사용, 없으면 전체를 배열로 처리
      let questions = parsedResponse.questions || parsedResponse;
      
      // 배열이 아닌 경우 처리
      if (!Array.isArray(questions)) {
        questions = Object.values(questions).filter(q => q && q.question);
      }
      
      // ID가 없으면 추가
      questions = questions.map((q, index) => ({
        id: q.id || Date.now() + index,
        question: q.question || q,
        difficulty: q.difficulty || difficulty
      }));
      
      res.json({ questions });
    } catch (parseError) {
      console.warn('JSON 파싱 실패:', parseError);
      // 파싱 실패 시 기본 질문 반환
      res.json({
        questions: [
          { id: 1, question: `${companyName}에 지원하게 된 이유는 무엇인가요?`, difficulty },
          { id: 2, question: `${companyName}의 비즈니스 모델에 대해 어떻게 이해하고 있나요?`, difficulty },
          { id: 3, question: `${jobType} 직무에서 가장 중요하다고 생각하는 역량은 무엇인가요?`, difficulty }
        ]
      });
    }
  } catch (error) {
    console.error('기업별 질문 생성 오류:', error);
    
    // OpenAI API 오류 시 기본 질문 반환
    const { companyName, jobType, difficulty = "medium" } = req.body;
    res.json({
      questions: [
        { id: 1, question: `${companyName || '해당 기업'}에 지원하게 된 이유는 무엇인가요?`, difficulty },
        { id: 2, question: `${companyName || '해당 기업'}의 비즈니스 모델에 대해 어떻게 이해하고 있나요?`, difficulty },
        { id: 3, question: `${jobType || '해당 직무'} 직무에서 가장 중요하다고 생각하는 역량은 무엇인가요?`, difficulty }
      ]
    });
  }
});

// AI 피드백 생성 엔드포인트
app.post('/api/feedback', async (req, res) => {
  try {
    const { question, answer } = req.body;

    if (!question || !answer) {
      return res.status(400).json({ error: '질문과 답변이 필요합니다.' });
    }

    if (!process.env.OPENAI_API_KEY) {
      console.warn('OpenAI API 키가 설정되지 않았습니다. 모의 피드백을 반환합니다.');
      const mockData = generateMockFeedback(question, answer);
      return res.json(mockData);
    }

    // OpenAI API 호출
    console.log('OpenAI API 호출 시작:', { question: question.substring(0, 50), answerLength: answer.length });
    
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `당신은 면접 전문가입니다. 면접 답변을 평가하고 피드백을 제공합니다.

평가 항목:
1. 완성도 (completeness): 질문에 대한 답변의 완성도 (0-100)
2. 관련성 (relevance): 질문과 답변의 관련성 (0-100)
3. 명확성 (clarity): 답변의 명확성과 이해하기 쉬운 정도 (0-100)
4. 구체성 (detail): 구체적인 예시나 경험이 포함된 정도 (0-100)
5. 전체 점수 (score): 위 항목들의 평균 (0-100)

반드시 JSON 형식으로 응답해주세요:
{
  "feedback": "3-5줄의 간결한 피드백 텍스트 (강점 1개, 개선점 1개)",
  "score": 75,
  "evaluation": {
    "completeness": 80,
    "relevance": 70,
    "clarity": 85,
    "detail": 65
  }
}`
        },
        {
          role: "user",
          content: `면접 질문: "${question}"

면접자의 답변: "${answer}"

위 답변을 평가하고 JSON 형식으로 응답해주세요.`
        }
      ],
      response_format: { type: "json_object" },
      max_tokens: 500,
      temperature: 0.7
    });

    const responseContent = completion.choices[0].message.content;
    console.log('OpenAI API 응답 받음:', responseContent.substring(0, 200));
    
    try {
      const parsedResponse = JSON.parse(responseContent);
      
      // JSON 파싱 성공 시 구조화된 데이터 반환
      res.json({
        feedback: parsedResponse.feedback || "피드백을 생성하지 못했습니다.",
        score: parsedResponse.score || 50,
        evaluation: parsedResponse.evaluation || {
          completeness: 50,
          relevance: 50,
          clarity: 50,
          detail: 50
        }
      });
    } catch (parseError) {
      // JSON 파싱 실패 시 텍스트만 반환 (하위 호환성)
      console.warn('JSON 파싱 실패, 텍스트만 반환:', parseError);
      res.json({
        feedback: responseContent,
        score: 50,
        evaluation: {
          completeness: 50,
          relevance: 50,
          clarity: 50,
          detail: 50
        }
      });
    }
  } catch (error) {
    console.error('OpenAI API 오류:', error);
    console.error('오류 상세:', {
      message: error.message,
      status: error.status,
      code: error.code,
      type: error.type
    });
    
    // OpenAI API 오류 시 모의 피드백 반환
    if (error.status === 401 || error.status === 403) {
      console.error('OpenAI API 키가 유효하지 않습니다.');
      const mockData = generateMockFeedback(req.body.question, req.body.answer);
      return res.status(500).json({ 
        error: 'OpenAI API 키가 유효하지 않습니다.',
        ...mockData
      });
    }

    if (error.code === 'ECONNREFUSED' || error.message.includes('fetch')) {
      console.error('OpenAI API 서버 연결 실패 - 네트워크 오류');
    }

    // 네트워크 오류 등 기타 오류 시 모의 피드백 반환
    const mockData = generateMockFeedback(req.body.question || '', req.body.answer || '');
    res.json(mockData);
  }
});

// 모의 피드백 생성 함수 (폴백용)
function generateMockFeedback(question, answer) {
  const answerLength = answer ? answer.length : 0;
  
  let feedback = "답변을 잘 들어주셨습니다. ";
  let completeness = 70;
  let relevance = 70;
  let clarity = 70;
  let detail = 60;
  
  if (answerLength < 50) {
    feedback += "답변이 다소 짧습니다. 구체적인 예시나 경험을 추가하면 더 좋을 것 같습니다. ";
    completeness = 50;
    detail = 40;
  } else if (answerLength > 200) {
    feedback += "상세한 답변을 해주셨네요. 핵심 내용을 더 명확하게 정리하면 좋겠습니다. ";
    completeness = 85;
    detail = 80;
    clarity = 75;
  } else {
    feedback += "적절한 길이의 답변을 해주셨습니다. ";
    completeness = 75;
    detail = 65;
  }
  
  // 답변에 키워드가 있는지 확인
  const hasKeywords = /경험|프로젝트|학습|문제|해결|개선|성과|성장|팀워크|소통|도전|목표|계획|분석|결과|효과/.test(answer);
  if (hasKeywords) {
    detail += 10;
    relevance += 5;
  }
  
  feedback += "실제 경험을 바탕으로 한 구체적인 사례를 더 포함하면 면접관에게 더 좋은 인상을 줄 수 있을 것입니다.";
  
  const score = Math.round((completeness + relevance + clarity + detail) / 4);
  
  return {
    feedback,
    score: Math.min(100, score),
    evaluation: {
      completeness: Math.min(100, completeness),
      relevance: Math.min(100, relevance),
      clarity: Math.min(100, clarity),
      detail: Math.min(100, detail)
    }
  };
}

// 개발용: 모든 사용자 조회 (비밀번호 제외)
app.get('/api/admin/users', async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ error: '데이터베이스 연결이 되지 않았습니다.' });
    }
    
    const users = await User.find({}).select('-password').sort({ createdAt: -1 });
    res.json({
      count: users.length,
      users: users
    });
  } catch (error) {
    console.error('사용자 조회 오류:', error);
    res.status(500).json({ error: '사용자 조회에 실패했습니다.' });
  }
});

const HOST = process.env.HOST || '0.0.0.0';
app.listen(PORT, HOST, () => {
  console.log(`서버가 포트 ${PORT}에서 실행 중입니다.`);
  console.log(`로컬 접속: http://localhost:${PORT}/api/admin/users`);
  console.log(`네트워크 접속: http://[내부IP]:${PORT}/api/admin/users`);
  if (process.env.OPENAI_API_KEY) {
    console.log('✅ OpenAI API 연결 준비 완료');
  } else {
    console.log('⚠️  OpenAI API 키가 설정되지 않았습니다. .env 파일에 OPENAI_API_KEY를 추가하세요.');
  }
});

