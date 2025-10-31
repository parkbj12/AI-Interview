# MongoDB 백엔드 서버 설정 가이드

## 1. MongoDB Atlas 설정

### 1.1 계정 생성 및 클러스터 생성
1. [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) 접속
2. 무료 계정 생성
3. "Build a Database" 클릭
4. Free 티어 선택 (M0)
5. 클라우드 제공자 및 리전 선택 (서울: Asia Pacific)
6. 클러스터 이름 설정 (예: interview-cluster)
7. "Create" 클릭

### 1.2 데이터베이스 사용자 생성
1. "Database Access" 메뉴 이동
2. "Add New Database User" 클릭
3. Username과 Password 설정 (기억해두세요!)
4. Database User Privileges: "Atlas admin" 선택
5. "Add User" 클릭

### 1.3 네트워크 접근 설정
1. "Network Access" 메뉴 이동
2. "Add IP Address" 클릭
3. 개발 중: "Allow Access from Anywhere" (0.0.0.0/0)
4. 프로덕션: 실제 서버 IP만 허용

### 1.4 연결 문자열 받기
1. "Database" 메뉴로 이동
2. "Connect" 버튼 클릭
3. "Connect your application" 선택
4. 연결 문자열 복사 (예: `mongodb+srv://username:password@cluster.mongodb.net/`)

## 2. 백엔드 서버 설정

### 2.1 패키지 설치
```bash
cd backend-example
npm install
```

### 2.2 환경 변수 설정
`.env` 파일 생성:
```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/interview?retryWrites=true&w=majority
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
PORT=3001
```

### 2.3 서버 실행
```bash
# 개발 모드 (nodemon)
npm run dev

# 프로덕션 모드
npm start
```

## 3. 프론트엔드 설정

프론트엔드 `.env` 파일에 백엔드 URL 추가:
```
REACT_APP_API_URL=http://localhost:3001/api
```

## 4. API 엔드포인트

### 인증
- `POST /api/auth/signup` - 회원가입
- `POST /api/auth/login` - 로그인

### 사용자
- `GET /api/users/:userId` - 사용자 정보 조회
- `PUT /api/users/:userId` - 사용자 정보 업데이트

### 면접 기록
- `POST /api/interviews` - 면접 기록 저장
- `GET /api/interviews/user/:userId` - 사용자 면접 기록 조회
- `GET /api/interviews/:interviewId` - 특정 면접 기록 조회
- `DELETE /api/interviews/:interviewId` - 면접 기록 삭제

## 5. 보안 주의사항

- JWT_SECRET은 반드시 변경하세요
- 프로덕션에서는 네트워크 접근을 제한하세요
- 비밀번호는 bcrypt로 해시하여 저장합니다
- 모든 API는 JWT 토큰 인증이 필요합니다

