# MongoDB Atlas 클러스터 생성 가이드

## 1단계: MongoDB Atlas 계정 생성 및 로그인

1. [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) 접속
2. "Try Free" 버튼 클릭하여 무료 계정 생성
3. 이메일 인증 완료 후 로그인

## 2단계: 새 클러스터 생성

1. **"Create" 또는 "Build a Database"** 클릭
2. **클러스터 설정:**
   - **Cloud Provider**: AWS (기본값)
   - **Region**: 가장 가까운 지역 선택 (예: `ap-northeast-2` - 서울)
   - **Cluster Tier**: **M0 FREE** (무료 티어) 선택
   - **Cluster Name**: 원하는 이름 입력 (예: `Cluster0`)
3. **"Create Cluster"** 클릭 (약 3-5분 소요)

## 3단계: 데이터베이스 사용자 생성

1. 클러스터 생성 후 **"Create Database User"** 화면이 나타남
2. **Username**: 원하는 사용자명 입력 (예: `admin`)
3. **Password**: 강력한 비밀번호 생성 (기억해두세요!)
4. **Database User Privileges**: "Atlas admin" 선택
5. **"Create Database User"** 클릭

## 4단계: 네트워크 접근 설정 (IP 화이트리스트)

1. **"Add My Current IP Address"** 클릭 (현재 IP 자동 추가)
2. 또는 **"Allow Access from Anywhere"** 클릭하여 모든 IP 허용 (개발용)
   - IP 주소: `0.0.0.0/0`
3. **"Finish and Close"** 클릭

## 5단계: 연결 문자열 받기

1. 클러스터 대시보드에서 **"Connect"** 버튼 클릭
2. **"Connect your application"** 선택
3. **Driver**: Node.js 선택
4. **Version**: 최신 버전 선택
5. **연결 문자열 복사** (예: `mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority`)

## 6단계: 연결 문자열 수정

복사한 연결 문자열에서:
- `<username>` → 3단계에서 만든 사용자명으로 변경
- `<password>` → 3단계에서 만든 비밀번호로 변경
- `?retryWrites=true&w=majority` 뒤에 데이터베이스 이름 추가: `?retryWrites=true&w=majority&appName=interview`

**최종 예시:**
```
mongodb+srv://admin:mypassword123@cluster0.xxxxx.mongodb.net/interview?retryWrites=true&w=majority&appName=interview
```

## 7단계: .env 파일에 연결 문자열 추가

`backend-example` 폴더에 `.env` 파일을 생성하고 다음 내용 추가:

```env
MONGODB_URI=mongodb+srv://admin:mypassword123@cluster0.xxxxx.mongodb.net/interview?retryWrites=true&w=majority&appName=interview
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
PORT=3001
OPENAI_API_KEY=your-openai-api-key-if-needed
```

⚠️ **주의**: 
- `.env` 파일은 절대 Git에 커밋하지 마세요!
- 실제 비밀번호와 사용자명을 사용하세요
- 연결 문자열에 `<username>`과 `<password>`가 실제 값으로 교체되어야 합니다

## 8단계: 서버 재시작

`.env` 파일을 생성한 후 백엔드 서버를 재시작하면 새로운 MongoDB 클러스터에 연결됩니다.

```bash
# 서버 중지 후
cd backend-example
npm run dev
```

## 연결 확인

서버가 시작되면 콘솔에 다음 메시지가 표시됩니다:
```
✅ MongoDB 연결 성공
📋 데이터베이스: interview
```

또는 브라우저에서 확인:
- http://localhost:3001/health

## 문제 해결

### 연결 실패 시:
1. IP 화이트리스트에 현재 IP가 추가되었는지 확인
2. 사용자명과 비밀번호가 올바른지 확인
3. 연결 문자열에 특수문자가 있으면 URL 인코딩 필요 (예: `@` → `%40`)
4. 방화벽이나 VPN이 연결을 차단하는지 확인

### 비밀번호에 특수문자가 있는 경우:
- `@`, `#`, `%`, `&` 등의 특수문자는 URL 인코딩 필요
- 예: `password@123` → `password%40123`



