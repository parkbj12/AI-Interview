# MongoDB Atlas 클러스터 삭제 및 재생성 가이드

## 1단계: 기존 클러스터 삭제

### 방법 1: MongoDB Atlas 웹사이트에서 삭제

1. **MongoDB Atlas 대시보드 접속**
   - https://www.mongodb.com/cloud/atlas 접속
   - 로그인

2. **클러스터 선택**
   - 삭제할 클러스터를 클릭하여 선택

3. **클러스터 삭제**
   - 클러스터 이름 옆에 있는 **"..." (점 3개)** 메뉴 클릭
   - 또는 클러스터 상세 페이지에서 **"Edit Configuration"** 또는 **"..."** 메뉴 찾기
   - **"Terminate"** 또는 **"Delete Cluster"** 선택
   - 확인 창에서 클러스터 이름을 입력하여 확인
   - **"Terminate Cluster"** 또는 **"Delete"** 버튼 클릭

4. **삭제 완료 대기**
   - 클러스터 삭제는 몇 분 정도 소요됩니다
   - 완료되면 클러스터 목록에서 사라집니다

### 방법 2: 데이터만 삭제 (클러스터는 유지)

클러스터는 유지하고 데이터만 삭제하려면:

1. **MongoDB Atlas 대시보드 접속**
2. **"Browse Collections"** 클릭
3. 각 컬렉션을 선택하고 **"Delete Collection"** 클릭
4. 또는 **"Database"** → **"Drop Database"** 선택

---

## 2단계: 새 클러스터 생성

### 1. 클러스터 생성 시작

1. MongoDB Atlas 대시보드에서 **"Create"** 또는 **"Build a Database"** 버튼 클릭
2. 또는 왼쪽 메뉴에서 **"Database"** → **"Create"** 클릭

### 2. 클러스터 설정

**배포 옵션 선택:**
- **"M0 FREE"** 선택 (무료 티어)
- 또는 유료 플랜 선택 (필요한 경우)

**클라우드 제공자 및 지역:**
- **Cloud Provider**: AWS (기본값) 또는 원하는 제공자 선택
- **Region**: 가장 가까운 지역 선택
  - 한국: `ap-northeast-2` (서울)
  - 일본: `ap-northeast-1` (도쿄)
  - 미국 동부: `us-east-1`
  - 유럽: `eu-west-1`

**클러스터 이름:**
- 원하는 이름 입력 (예: `Cluster0`, `InterviewCluster`)

**추가 설정 (선택사항):**
- **MongoDB Version**: 최신 버전 권장
- **Backup**: 무료 티어는 백업 불가
- **Tags**: ⚠️ **선택사항입니다. 건너뛰어도 됩니다!**
  - 태그는 리소스 관리용 메타데이터입니다
  - 클러스터 동작에는 전혀 영향을 주지 않습니다
  - 여러 클러스터를 관리하거나 비용 추적이 필요한 경우에만 사용
  - 개인 프로젝트나 단일 클러스터 사용 시에는 불필요
  - **"Skip"** 또는 **"Next"** 버튼으로 진행하세요
- **Preload sample dataset**: ⚠️ **선택사항입니다. 건너뛰는 것을 권장합니다!**
  - 샘플 데이터셋(예: 영화 데이터, 에어비앤비 데이터)을 자동으로 로드하는 옵션
  - MongoDB 학습/테스트 목적이면 유용하지만, 실제 프로젝트에는 불필요
  - 빈 데이터베이스로 시작하는 것이 좋습니다
  - 선택하면 샘플 데이터가 추가되어 용량을 차지함
  - **"Skip"** 또는 **"Next"** 버튼으로 진행하세요

### 3. 클러스터 생성 완료

- **"Create Cluster"** 버튼 클릭
- 클러스터 생성에 약 **3-5분** 소요
- 생성 완료까지 대기

---

## 3단계: 데이터베이스 사용자 생성

1. 클러스터 생성 후 **"Create Database User"** 화면이 나타남
2. 또는 **"Database Access"** 메뉴에서 사용자 생성

**사용자 정보 입력:**
- **Username**: 원하는 사용자명 (예: `admin`, `interview_user`)
- **Password**: 강력한 비밀번호 생성
  - 최소 8자 이상
  - 대문자, 소문자, 숫자, 특수문자 포함 권장
  - ⚠️ **비밀번호를 반드시 기록해두세요!**

**권한 설정:**
- **Database User Privileges**: 
  - **"Atlas admin"** 선택 (모든 권한)
  - 또는 **"Read and write to any database"** 선택

3. **"Create Database User"** 클릭

---

## 4단계: 네트워크 접근 설정 (IP 화이트리스트)

1. **"Network Access"** 메뉴로 이동
2. **"Add IP Address"** 클릭

**옵션 1: 현재 IP만 허용 (권장)**
- **"Add My Current IP Address"** 클릭
- 현재 IP 주소가 자동으로 추가됨

**옵션 2: 모든 IP 허용 (개발용, 보안 위험)**
- **"Allow Access from Anywhere"** 클릭
- IP 주소: `0.0.0.0/0` 입력
- ⚠️ 프로덕션 환경에서는 사용하지 마세요!

3. **"Confirm"** 클릭

---

## 5단계: 연결 문자열 받기

1. 클러스터 대시보드에서 **"Connect"** 버튼 클릭
2. **"Connect your application"** 선택
3. **Driver**: `Node.js` 선택
4. **Version**: 최신 버전 선택 (예: `5.5 or later`)
5. **연결 문자열 복사**
   - 예: `mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority`

---

## 6단계: 연결 문자열 수정

복사한 연결 문자열을 다음과 같이 수정:

**원본:**
```
mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
```

**수정:**
1. `<username>` → 3단계에서 만든 사용자명으로 변경
2. `<password>` → 3단계에서 만든 비밀번호로 변경
3. `?retryWrites=true&w=majority` 뒤에 데이터베이스 이름 추가

**최종 형식:**
```
mongodb+srv://admin:mypassword123@cluster0.xxxxx.mongodb.net/interview?retryWrites=true&w=majority&appName=interview
```

**비밀번호에 특수문자가 있는 경우:**
- URL 인코딩 필요
- 예: `password@123` → `password%40123`
- 예: `password#123` → `password%23123`

**특수문자 인코딩 참고:**
- `@` → `%40`
- `#` → `%23`
- `%` → `%25`
- `&` → `%26`
- `+` → `%2B`
- `=` → `%3D`

---

## 7단계: .env 파일 업데이트

`backend-example` 폴더에 `.env` 파일을 생성하거나 수정:

```env
MONGODB_URI=mongodb+srv://admin:mypassword123@cluster0.xxxxx.mongodb.net/interview?retryWrites=true&w=majority&appName=interview
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
PORT=3001
OPENAI_API_KEY=your-openai-api-key-if-needed
```

⚠️ **주의사항:**
- `.env` 파일은 절대 Git에 커밋하지 마세요!
- 실제 사용자명과 비밀번호를 사용하세요
- 연결 문자열에 `<username>`과 `<password>`가 실제 값으로 교체되어야 합니다

---

## 8단계: 서버 재시작

1. 백엔드 서버 중지 (Ctrl+C)
2. 서버 재시작:

```bash
cd backend-example
npm run dev
```

3. 콘솔에서 연결 확인:
   ```
   ✅ MongoDB 연결 성공
   📋 데이터베이스: interview
   ```

---

## 연결 확인

### 방법 1: 브라우저에서 확인
- http://localhost:3001/health
- `mongodb` 필드가 `"connected"`인지 확인

### 방법 2: API로 확인
```bash
# PowerShell에서
Invoke-RestMethod -Uri "http://localhost:3001/health" | ConvertTo-Json

# 또는 브라우저에서
http://localhost:3001/api/debug/users
```

---

## 문제 해결

### 연결 실패 시:

1. **IP 화이트리스트 확인**
   - MongoDB Atlas → Network Access
   - 현재 IP가 추가되어 있는지 확인
   - IP가 변경되었다면 다시 추가 필요

2. **사용자명/비밀번호 확인**
   - Database Access 메뉴에서 사용자 정보 확인
   - 비밀번호에 특수문자가 있으면 URL 인코딩 확인

3. **연결 문자열 형식 확인**
   - 데이터베이스 이름이 포함되어 있는지 확인
   - 예: `/interview?` 형식

4. **방화벽/VPN 확인**
   - 회사 네트워크나 VPN이 연결을 차단하는지 확인
   - 필요시 네트워크 관리자에게 문의

5. **클러스터 상태 확인**
   - 클러스터가 정상적으로 생성되었는지 확인
   - 클러스터가 삭제되거나 중지되지 않았는지 확인

### 일반적인 오류:

**"Authentication failed"**
- 사용자명 또는 비밀번호가 잘못됨
- 비밀번호에 특수문자가 있으면 URL 인코딩 필요

**"Connection timeout"**
- IP 화이트리스트에 현재 IP가 없음
- 네트워크 연결 문제

**"Invalid connection string"**
- 연결 문자열 형식이 잘못됨
- 데이터베이스 이름이 빠졌거나 잘못됨

---

## 빠른 참조

### 클러스터 삭제
1. Atlas 대시보드 → 클러스터 선택 → "..." → "Terminate"

### 새 클러스터 생성
1. "Create" → M0 FREE 선택 → Region 선택 → "Create Cluster"

### 사용자 생성
1. "Database Access" → "Add New Database User" → 사용자 정보 입력

### IP 추가
1. "Network Access" → "Add IP Address" → 현재 IP 추가

### 연결 문자열
1. 클러스터 → "Connect" → "Connect your application" → Node.js → 복사

---

## 완료 체크리스트

- [ ] 기존 클러스터 삭제 완료
- [ ] 새 클러스터 생성 완료
- [ ] 데이터베이스 사용자 생성 완료
- [ ] IP 화이트리스트 설정 완료
- [ ] 연결 문자열 받기 완료
- [ ] 연결 문자열 수정 완료 (사용자명, 비밀번호, 데이터베이스 이름)
- [ ] .env 파일 생성/수정 완료
- [ ] 서버 재시작 완료
- [ ] 연결 확인 완료 (http://localhost:3001/health)

