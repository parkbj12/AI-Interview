# 다른 컴퓨터에서 접속하기

## 1. 현재 컴퓨터의 IP 주소 확인

### Windows:
```powershell
ipconfig
```
- "IPv4 주소" 항목을 찾으세요 (예: 192.168.0.100)

### Mac/Linux:
```bash
ifconfig
# 또는
ip addr
```

## 2. 방화벽 설정

### Windows:
1. Windows Defender 방화벽 설정 열기
2. "고급 설정" 클릭
3. "인바운드 규칙" → "새 규칙"
4. "포트" 선택 → "다음"
5. "TCP" 선택, "특정 로컬 포트"에 `3000, 3001` 입력
6. "연결 허용" 선택 → 다음 → 완료

### Mac:
```bash
# 터미널에서 실행
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --add /System/Library/CoreServices/Application\ Firewall.app/Contents/Resources/firewalltool
```

## 3. 프론트엔드 설정

프로젝트 루트에 `.env` 파일 생성:

**방법 1: .env.example 복사**
```bash
copy .env.example .env
```

**방법 2: 직접 생성**
프로젝트 루트에 `.env` 파일을 만들고 다음 내용 추가:
```
HOST=0.0.0.0
PORT=3000
REACT_APP_API_URL=http://[내부IP]:3001/api
```

**예시 (IP가 192.168.0.100인 경우):**
```
HOST=0.0.0.0
PORT=3000
REACT_APP_API_URL=http://192.168.0.100:3001/api
```

> ⚠️ `[내부IP]`를 실제 IP 주소로 변경하세요!
> 
> IP 주소 확인 방법:
> - Windows: `ipconfig` 실행 후 "IPv4 주소" 확인
> - Mac/Linux: `ifconfig` 또는 `ip addr` 실행

## 4. 백엔드 설정

`backend-example` 폴더의 `.env` 파일에 추가:
```
HOST=0.0.0.0
PORT=3001
```

## 5. 서버 실행

### 프론트엔드 (터미널 1):
```bash
npm start
```

### 백엔드 (터미널 2):
```bash
cd backend-example
npm run dev
```

## 6. 다른 컴퓨터에서 접속

같은 네트워크(와이파이/이더넷)에 연결된 다른 컴퓨터의 브라우저에서:

```
http://[현재컴퓨터IP]:3000
```

**예시:**
```
http://192.168.0.100:3000
```

## 문제 해결

### 접속이 안 될 때:
1. ✅ 같은 네트워크에 연결되어 있는지 확인
2. ✅ 방화벽에서 포트 3000, 3001이 열려있는지 확인
3. ✅ IP 주소가 올바른지 확인 (`ipconfig`로 다시 확인)
4. ✅ 서버가 실행 중인지 확인
5. ✅ 백엔드 서버도 실행 중인지 확인

### API 오류가 발생할 때:
- `.env` 파일의 `REACT_APP_API_URL`이 올바른 IP 주소를 가리키는지 확인
- 백엔드 서버가 0.0.0.0으로 리스닝 중인지 확인

## 참고

- **개발 환경용**: 이 설정은 같은 네트워크 내에서만 접속 가능합니다
- **프로덕션**: 실제 배포 시에는 도메인과 HTTPS를 사용하세요
- **보안**: 개발 환경에서는 방화벽 설정에 주의하세요

