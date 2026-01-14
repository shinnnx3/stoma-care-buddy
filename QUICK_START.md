# ⚡ Quick Start Guide

## 🚀 30초 만에 시작하기

### 1단계: 백엔드 실행
```bash
cd /Users/yunsu/Documents/projects/nuna/stoma-server
source venv/bin/activate
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### 2단계: ngrok 시작
```bash
# 새 터미널에서
ngrok http 8000
```

**출력된 URL 복사** (예: `https://abc123.ngrok-free.app`)

### 3단계: 프론트엔드 환경 변수 설정
```bash
cd /Users/yunsu/Documents/projects/nuna/stoma-care-buddy

# .env 파일 수정
echo 'VITE_API_URL="https://abc123.ngrok-free.app"' >> .env
```

### 4단계: 로컬 테스트
```bash
npm run dev
```

브라우저에서 http://localhost:5173 열기

## 📤 Vercel 배포

### A. CLI로 배포 (가장 빠름)
```bash
# 1회만: Vercel CLI 설치
npm install -g vercel

# 로그인
vercel login

# 배포
vercel --prod

# 환경 변수 설정
vercel env add VITE_API_URL
# 값 입력: https://your-ngrok-url.ngrok-free.app
```

### B. GitHub로 배포
```bash
# 1. 코드 푸시
git add .
git commit -m "Ready for deployment"
git push origin main

# 2. Vercel 웹사이트
# - vercel.com 접속
# - Import GitHub 프로젝트
# - 환경 변수 추가:
#   VITE_API_URL = https://your-ngrok-url.ngrok-free.app
# - Deploy 클릭
```

## ✅ 체크리스트

배포 전:
- [ ] 백엔드 서버 실행 (`http://localhost:8000` 응답 확인)
- [ ] ngrok 실행 (URL 복사)
- [ ] 프론트 `.env` 업데이트
- [ ] 로컬 테스트 성공

배포 후:
- [ ] Vercel 환경 변수 설정
- [ ] 배포 성공
- [ ] 웹사이트 접속 확인
- [ ] 이미지 업로드 테스트

## 🔧 테스트 방법

### 백엔드 테스트
```bash
# 로컬
curl http://localhost:8000/
# {"message":"Stoma Care Server Running"}

# ngrok
curl https://your-ngrok-url.ngrok-free.app/
# {"message":"Stoma Care Server Running"}
```

### 프론트엔드 테스트
1. 카메라로 이미지 촬영
2. 업로드 클릭
3. 결과 확인:
   - 처리된 이미지
   - Necrosis class (1-4)
   - 밝기 메시지

## 💡 팁

### ngrok URL 자동 업데이트
```bash
# ngrok-update.sh
#!/bin/bash
URL=$(curl -s http://localhost:4040/api/tunnels | jq -r '.tunnels[0].public_url')
echo "VITE_API_URL=\"$URL\"" > .env.production
echo "✅ Updated to: $URL"
```

### 빠른 재배포
```bash
# ngrok 재시작 후
./ngrok-update.sh
vercel --prod
```

## 📱 주요 API

### POST /upload
```javascript
const formData = new FormData();
formData.append("file", imageBlob);
formData.append("user_id", "user123");

const response = await fetch(`${API_URL}/upload`, {
  method: "POST",
  body: formData,
});

// Response
{
  "status": "success",
  "data": {
    "image_url": "https://...",
    "necrosis_class": 2,
    "brightness_val": 156.8,
    "brightness_message": "지난 주보다 12.3% 밝아졌습니다."
  }
}
```

## 🐛 문제 해결

### CORS 에러
→ ngrok URL이 환경 변수에 정확히 설정되었는지 확인

### 이미지 업로드 실패
→ 백엔드 서버와 ngrok 모두 실행 중인지 확인

### Vercel 빌드 실패
```bash
npm run build  # 로컬에서 먼저 테스트
```

## 🎯 다음 단계

- [ ] 데이터베이스 히스토리 보기 구현
- [ ] 사용자 인증 추가
- [ ] PWA 기능 추가
- [ ] 다국어 지원

완료! 🎉
