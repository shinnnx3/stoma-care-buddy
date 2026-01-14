# 🚀 Stoma Care Buddy 배포 가이드

프론트엔드(Vercel) + 백엔드(ngrok) 연동 가이드

## 📋 전체 구조

```
Frontend (Vercel)
   ↓ API calls
Backend (ngrok tunnel)
   ↓ localhost:8000
FastAPI Server (로컬)
```

## 🔧 1. 백엔드 설정 (ngrok)

### Step 1: ngrok 설치 및 가입
```bash
# ngrok 설치
brew install ngrok

# ngrok 가입 (무료)
# https://dashboard.ngrok.com/signup 에서 가입

# authtoken 설정 (대시보드에서 복사)
ngrok config add-authtoken YOUR_AUTH_TOKEN
```

### Step 2: 백엔드 서버 실행
```bash
cd /Users/yunsu/Documents/projects/nuna/stoma-server

# 가상환경 활성화
source venv/bin/activate

# 서버 시작
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Step 3: ngrok 터널 시작
```bash
# 새 터미널에서
ngrok http 8000
```

**출력 예시:**
```
Forwarding  https://abc123.ngrok-free.app -> http://localhost:8000
```

**이 URL을 복사하세요!** ↑

## 🎨 2. 프론트엔드 설정 (Vercel)

### Step 1: 환경 변수 설정
```bash
cd /Users/yunsu/Documents/projects/nuna/stoma-care-buddy

# .env.production 파일 수정
nano .env.production
```

**ngrok URL로 업데이트:**
```bash
VITE_API_URL="https://abc123.ngrok-free.app"
```

### Step 2: Vercel 배포

#### 옵션 A: Vercel CLI (추천)
```bash
# Vercel CLI 설치
npm install -g vercel

# 로그인
vercel login

# 배포
vercel --prod
```

#### 옵션 B: GitHub 연동
1. GitHub에 푸시:
```bash
git add .
git commit -m "Configure for Vercel deployment"
git push origin main
```

2. Vercel 웹사이트에서:
   - https://vercel.com 접속
   - "New Project" 클릭
   - GitHub 저장소 선택
   - 환경 변수 추가:
     - `VITE_API_URL` = `https://your-ngrok-url.ngrok-free.app`
   - Deploy 클릭

## 🔄 3. 로컬 테스트

### 백엔드 테스트
```bash
# 서버가 실행 중인지 확인
curl http://localhost:8000/
# {"message":"Stoma Care Server Running"}

# ngrok 터널 확인
curl https://your-ngrok-url.ngrok-free.app/
# {"message":"Stoma Care Server Running"}
```

### 프론트엔드 테스트
```bash
cd /Users/yunsu/Documents/projects/nuna/stoma-care-buddy

# 로컬 개발 서버 실행
npm run dev
```

브라우저에서 `http://localhost:5173` 열기

## 📱 4. API 엔드포인트

### POST /upload
이미지 업로드 및 분석

**Request:**
```javascript
const formData = new FormData();
formData.append("file", imageBlob, "stoma_image.jpg");
formData.append("user_id", "user123");

fetch("https://your-ngrok-url.ngrok-free.app/upload", {
  method: "POST",
  body: formData,
});
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "image_url": "https://...",
    "necrosis_class": 2,
    "brightness_val": 156.8,
    "brightness_message": "지난 주보다 12.3% 밝아졌습니다."
  },
  "message": "진단 완료"
}
```

## ⚠️ 중요 사항

### ngrok 제한사항 (무료 버전)
- ✅ URL은 8시간마다 변경됨
- ✅ 재시작할 때마다 URL 변경
- ⚠️ URL이 바뀌면 Vercel 환경 변수를 업데이트해야 함

### URL 업데이트 방법
1. ngrok 재시작 → 새 URL 얻기
2. Vercel 대시보드 접속
3. 프로젝트 → Settings → Environment Variables
4. `VITE_API_URL` 업데이트
5. Redeploy 클릭

### 고정 URL 원하면 (유료)
- ngrok Pro: $8/월 - 고정 도메인
- ngrok Business: $20/월 - 여러 고정 도메인

## 🐛 트러블슈팅

### CORS 에러
```
Access-Control-Allow-Origin error
```
**해결:** 백엔드 CORS 설정이 이미 `allow_origins=["*"]`로 되어 있음. ngrok URL 확인.

### 이미지 업로드 실패
```
Failed to upload image
```
**체크:**
1. 백엔드 서버 실행 중? `ps aux | grep uvicorn`
2. ngrok 터널 활성? `curl ngrok-url`
3. 환경 변수 올바름? `.env.production` 확인

### Vercel 빌드 실패
```
Build failed
```
**해결:**
```bash
# 로컬에서 빌드 테스트
npm run build

# 타입 에러 확인
npm run lint
```

## 📊 모니터링

### ngrok 요청 확인
- http://localhost:4040 (ngrok 대시보드)
- 모든 HTTP 요청/응답 실시간 확인

### Vercel 로그 확인
```bash
vercel logs
```

## 🎯 체크리스트

### 배포 전
- [ ] 백엔드 서버 실행 중
- [ ] ngrok 터널 시작됨
- [ ] ngrok URL 복사됨
- [ ] `.env.production` 업데이트됨
- [ ] 로컬 테스트 완료

### 배포 후
- [ ] Vercel 환경 변수 설정됨
- [ ] Vercel 배포 성공
- [ ] 프론트엔드 접속 확인
- [ ] 이미지 업로드 테스트

## 📞 다음 단계

1. ngrok 시작하고 URL 복사
2. `.env.production` 업데이트
3. Vercel 배포
4. 테스트!

## 💡 팁

### 개발 중
```bash
# 로컬 프론트 + 로컬 백엔드
VITE_API_URL="http://localhost:8000" npm run dev
```

### 프로덕션
```bash
# Vercel 프론트 + ngrok 백엔드
# .env.production에 ngrok URL 설정
vercel --prod
```

### ngrok 재시작 스크립트
```bash
#!/bin/bash
# restart-ngrok.sh
pkill ngrok
ngrok http 8000 > /dev/null &
sleep 2
curl http://localhost:4040/api/tunnels | jq -r '.tunnels[0].public_url'
```

이제 배포 준비 완료! 🎉
