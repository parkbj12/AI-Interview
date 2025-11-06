# AI-Interview

> AI 기반 실시간 반응형 인터뷰 시뮬레이터 — 취업 준비생이 실제 면접처럼 연습하고, GPT가 답변의 내용·톤·논리성을 평가해주는 웹 서비스

## 📋 목차

- [주요 기능](#주요-기능)
- [기술 스택](#기술-스택)
- [시작하기](#시작하기)
- [프로젝트 구조](#프로젝트-구조)
- [주요 페이지](#주요-페이지)
- [환경 변수 설정](#환경-변수-설정)
- [백엔드 설정](#백엔드-설정)
- [기여하기](#기여하기)
- [라이선스](#라이선스)

## ✨ 주요 기능

### 🎯 면접 연습
- **다양한 직무 지원**: 개발자, 디자이너, 데이터 사이언티스트, 프로덕트 매니저 등 20개 이상의 직무
- **난이도 선택**: 초급, 중급, 고급 난이도 선택 가능
- **면접 모드**: 연습 모드와 실전 모드 구분
- **질문 개수 설정**: 원하는 질문 개수로 면접 진행

### 💬 면접 방식
- **텍스트 면접**: 텍스트로 답변 작성하는 전통적인 면접 방식
- **비디오 면접**: 웹캠을 활용한 실시간 면접 시뮬레이션
- **음성 인식**: 음성으로 답변 가능 (비디오 면접)

### 🤖 AI 피드백
- **자동 평가**: GPT를 활용한 답변 평가
- **상세 피드백**: 완성도, 관련성, 명확성, 구체성 4가지 항목 평가
- **점수 제공**: 각 답변별 점수 및 전체 면접 점수 제공
- **개선 제안**: 구체적인 개선 방안 제시

### 📊 기록 및 통계
- **면접 기록 저장**: 모든 면접 기록 자동 저장
- **상세 기록 보기**: 각 질문별 답변 및 피드백 확인
- **통계 분석**: 면접 통계 및 성장 추이 확인
- **PDF 다운로드**: 면접 기록 PDF로 다운로드 가능

### 📚 질문 관리
- **커스텀 질문**: 사용자 정의 질문 추가 및 관리
- **회사별 질문**: 특정 회사의 면접 질문 생성

## 🛠 기술 스택

### Frontend
- **React 18.2.0** - UI 라이브러리
- **React Router DOM 7.9.4** - 라우팅
- **Axios** - HTTP 클라이언트
- **Lucide React** - 아이콘 라이브러리
- **React Speech Recognition** - 음성 인식
- **jsPDF** - PDF 생성

### Backend (선택사항)
- **Node.js** - 서버 런타임
- **Express** - 웹 프레임워크
- **MongoDB** - 데이터베이스
- **Mongoose** - MongoDB ODM
- **JWT** - 인증 토큰
- **bcrypt** - 비밀번호 해싱

### AI
- **OpenAI GPT-4o-mini** - AI 피드백 생성

## 🚀 시작하기

### 필수 요구사항
- Node.js 16.0 이상
- npm 또는 yarn
- (선택) MongoDB Atlas 계정 (백엔드 사용 시)

### 설치 및 실행

1. **저장소 클론**
```bash
git clone https://github.com/parkbj12/AI-Interview.git
cd AI-Interview
```

2. **의존성 설치**
```bash
npm install
```

3. **환경 변수 설정**
프로젝트 루트에 `.env` 파일 생성:
```env
# 로컬 개발 시
REACT_APP_API_URL=http://localhost:3001/api

# 다른 컴퓨터에서 접속하는 경우, 백엔드 서버의 IP 주소로 변경
# 예: REACT_APP_API_URL=http://192.168.1.100:3001/api
# 백엔드 서버 실행 시 콘솔에 표시되는 "네트워크" URL을 사용하세요
```

4. **개발 서버 실행**
```bash
npm start
```

브라우저에서 [http://localhost:3000](http://localhost:3000) 접속

### 프로덕션 빌드
```bash
npm run build
```

## 📁 프로젝트 구조

```
frontend/
├── public/                 # 정적 파일
│   └── index.html
├── src/
│   ├── api/              # API 통신
│   │   └── api.js
│   ├── components/       # 재사용 컴포넌트
│   │   ├── JobSelector.jsx
│   │   ├── QuestionCard.jsx
│   │   └── QuestionList.jsx
│   ├── config/          # 설정 파일
│   │   └── mongodb.js
│   ├── context/         # Context API
│   │   └── AuthContext.jsx
│   ├── models/          # 데이터 모델
│   │   └── User.js
│   ├── pages/           # 페이지 컴포넌트
│   │   ├── Home.jsx
│   │   ├── Login.jsx
│   │   ├── Signup.jsx
│   │   ├── Interview.jsx
│   │   ├── VideoInterview.jsx
│   │   ├── Feedback.jsx
│   │   ├── MyPage.jsx
│   │   ├── Statistics.jsx
│   │   ├── CustomQuestions.jsx
│   │   ├── InterviewDetail.jsx
│   │   └── Guide.jsx
│   ├── utils/           # 유틸리티 함수
│   ├── App.js           # 메인 앱 컴포넌트
│   ├── index.js         # 엔트리 포인트
│   └── index.css        # 전역 스타일
├── backend-example/     # 백엔드 예시 코드
│   ├── server.js
│   └── package.json
├── package.json
└── README.md
```

## 📄 주요 페이지

### 공개 페이지
- **홈 (`/`)**: 서비스 소개 및 면접 시작
- **로그인 (`/login`)**: 사용자 로그인
- **회원가입 (`/signup`)**: 신규 사용자 가입
- **가이드 (`/guide`)**: 사용 가이드

### 인증 필요 페이지
- **마이페이지 (`/mypage`)**: 면접 기록 관리
- **면접 시작 (`/interview`)**: 텍스트 면접 시작
- **비디오 면접 (`/video-interview`)**: 비디오 면접 시작
- **피드백 (`/feedback`)**: 면접 결과 및 피드백 확인
- **통계 (`/statistics`)**: 면접 통계 확인
- **커스텀 질문 (`/custom-questions`)**: 사용자 정의 질문 관리
- **면접 상세 (`/interview/:id`)**: 특정 면접 기록 상세 보기

## ⚙️ 환경 변수 설정

### 프론트엔드 (.env)
```env
REACT_APP_API_URL=http://localhost:3001/api
```

### 백엔드 (backend-example/.env)
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/interview
JWT_SECRET=your-secret-key
PORT=3001
OPENAI_API_KEY=your-openai-api-key
```

## 🔧 백엔드 설정

백엔드를 사용하려면 MongoDB와 Node.js 서버를 설정해야 합니다.

자세한 설정 방법은 다음 파일을 참고하세요:
- [백엔드 설정 가이드](./backend-example/README.md)
- [MongoDB 연동 가이드](./README_MONGODB.md)

### 빠른 시작

1. **백엔드 서버 실행**
```bash
cd backend-example
npm install
npm run dev
```

2. **MongoDB Atlas 설정**
   - [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)에서 무료 계정 생성
   - 클러스터 생성 및 연결 문자열 복사
   - `.env` 파일에 `MONGODB_URI` 설정

3. **OpenAI API 키 설정**
   - [OpenAI](https://platform.openai.com/)에서 API 키 발급
   - `.env` 파일에 `OPENAI_API_KEY` 설정

> **참고**: 백엔드 없이도 로컬 스토리지를 사용하여 기본 기능을 사용할 수 있습니다.

## 📝 주요 기능 상세

### 면접 진행 흐름
1. 직무 및 난이도 선택
2. 면접 모드 선택 (연습/실전)
3. 질문 개수 설정
4. 면접 시작 및 답변 작성
5. AI 피드백 수신
6. 결과 확인 및 저장

### AI 피드백 평가 항목
- **완성도 (Completeness)**: 질문에 대한 답변의 완성도
- **관련성 (Relevance)**: 질문과 답변의 관련성
- **명확성 (Clarity)**: 답변의 명확성과 이해하기 쉬운 정도
- **구체성 (Detail)**: 구체적인 예시나 경험이 포함된 정도

### 데이터 저장
- **로컬 스토리지**: 기본적으로 브라우저 로컬 스토리지에 저장
- **MongoDB**: 백엔드 서버 사용 시 MongoDB에 저장

## 🤝 기여하기

기여를 환영합니다! 이슈를 등록하거나 Pull Request를 보내주세요.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 라이선스

이 프로젝트는 MIT 라이선스를 따릅니다.

## 👥 기여자

- [@parkbj12](https://github.com/parkbj12)
- [@icecreamqw](https://github.com/icecreamqw)

## 🙏 감사의 말

- OpenAI GPT API
- React 커뮤니티
- 모든 기여자들

---

**면접 준비를 위한 최고의 도구를 만들어가고 있습니다! 🚀**
