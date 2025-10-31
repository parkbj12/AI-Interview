# MongoDB 연동 가이드

## 완료된 작업

✅ MongoDB 라이브러리 설치 (`mongodb`, `mongoose`)
✅ MongoDB API 클라이언트 함수 추가 (`src/api/api.js`)
✅ 백엔드 서버 예시 코드 생성 (`backend-example/`)
✅ MongoDB 스키마 정의 (`src/models/User.js`)

## 다음 단계

### 1. MongoDB Atlas 설정
1. [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) 접속
2. 무료 계정 생성 및 클러스터 생성
3. 연결 문자열 받기

### 2. 백엔드 서버 구축
```bash
cd backend-example
npm install
```

`.env` 파일 생성:
```
MONGODB_URI=your-mongodb-connection-string
JWT_SECRET=your-secret-key
PORT=3001
```

서버 실행:
```bash
npm run dev
```

### 3. 프론트엔드 환경 변수 설정
프로젝트 루트에 `.env` 파일 생성:
```
REACT_APP_API_URL=http://localhost:3001/api
```

### 4. AuthContext MongoDB 연동 (선택사항)
현재는 로컬 스토리지를 사용하고 있습니다. MongoDB로 전환하려면:

1. `src/context/AuthContext.jsx` 수정
2. `userAPI.signup`, `userAPI.login` 사용
3. JWT 토큰 관리 추가

## 현재 상태

- ✅ 프론트엔드 API 클라이언트 준비 완료
- ✅ 백엔드 서버 예시 코드 준비 완료
- ⏳ MongoDB Atlas 설정 필요
- ⏳ 백엔드 서버 실행 필요
- ⏳ AuthContext MongoDB 연동 (선택사항)

## API 사용 예시

```javascript
import { userAPI, interviewAPI } from './api/api';

// 회원가입
const user = await userAPI.signup(email, password, name);

// 로그인
const { user, token } = await userAPI.login(email, password);

// 면접 기록 저장
const interview = await interviewAPI.saveInterview({
  jobType: 'developer',
  difficulty: 'medium',
  questions: [...],
  answers: {...},
  feedbacks: {...},
  score: 85
});
```

## 참고

- 백엔드 서버는 별도 폴더(`backend-example/`)에서 실행하세요
- 프론트엔드와 백엔드는 다른 포트에서 실행됩니다
- CORS 설정이 되어 있어 프론트엔드에서 API 호출이 가능합니다

