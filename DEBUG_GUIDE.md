# 🐛 디버깅 가이드

## 수정 내역

### ✅ 백엔드 수정 (main.py)
1. **에러 처리 개선**
   - 에러 발생 시 HTTP 500 상태 코드 반환
   - 상세한 traceback 출력
   ```python
   except Exception as e:
       print(f"Server Error: {str(e)}")
       import traceback
       traceback.print_exc()
       raise HTTPException(status_code=500, detail=str(e))
   ```

### ✅ 프론트엔드 수정

#### 1. API 레이어 (src/lib/api.ts)
   - 백엔드 에러 응답 체크 추가
   ```typescript
   const result = await response.json();

   // Check if backend returned an error
   if (result.status === "error") {
     throw new Error(result.message || "Backend error occurred");
   }
   ```

#### 2. Home 페이지 (src/pages/Home.tsx)
   - 더 자세한 에러 메시지 표시
   ```typescript
   const errorMessage = error instanceof Error ? error.message : "Unknown error";
   alert(`서버 연결 실패: ${errorMessage}\n디버그 모드로 진행합니다.`);
   ```

## 🔍 디버깅 방법

### 1. 백엔드 로그 확인
```bash
# 실시간 로그 확인
tail -f /tmp/claude/-Users-yunsu-Documents-projects-nuna-stoma-server/tasks/b583ae0.output

# 에러만 필터링
tail -f /tmp/claude/-Users-yunsu-Documents-projects-nuna-stoma-server/tasks/b583ae0.output | grep -i error
```

### 2. 프론트엔드 콘솔 확인
브라우저 개발자 도구 (F12) → Console 탭
- API 요청/응답 확인
- 에러 메시지 확인

### 3. 네트워크 탭 확인
브라우저 개발자 도구 → Network 탭
- `/upload` 요청 찾기
- Status Code 확인 (200 OK vs 500 Error)
- Response 탭에서 실제 응답 데이터 확인

## 🚨 일반적인 에러 케이스

### Case 1: "Backend error occurred"
**원인**: 백엔드에서 처리 중 에러 발생

**확인 방법**:
```bash
# 백엔드 로그에서 에러 확인
tail -50 /tmp/claude/.../*.output | grep -A 10 "Server Error"
```

**일반적인 원인**:
- 모델 파일 로드 실패
- Supabase 연결 실패
- 이미지 처리 실패

### Case 2: "HTTP error! status: 500"
**원인**: 백엔드 내부 서버 에러

**해결**:
1. 백엔드 로그 확인
2. 모델 파일 존재 확인:
   ```bash
   ls -la /Users/yunsu/Documents/projects/nuna/stoma-server/models/
   ```
3. 서버 재시작

### Case 3: "Failed to fetch" 또는 CORS 에러
**원인**:
- ngrok 터널이 죽음
- 잘못된 API URL
- CORS 설정 문제

**해결**:
```bash
# ngrok 상태 확인
curl https://your-ngrok-url.ngrok-free.dev/

# .env 확인
cat /Users/yunsu/Documents/projects/nuna/stoma-care-buddy/.env | grep VITE_API_URL
```

### Case 4: "Storage endpoint URL should have a trailing slash"
**원인**: Supabase storage URL 형식 경고 (동작은 됨)

**무시해도 됨** - 경고일 뿐 에러 아님

## 📝 체크리스트

이미지 업로드 실패 시 순서대로 확인:

1. **백엔드 서버 실행 중?**
   ```bash
   curl http://localhost:8000/
   # {"message":"Stoma Care Server Running"}
   ```

2. **ngrok 터널 활성?**
   ```bash
   curl https://your-ngrok-url.ngrok-free.dev/
   # {"message":"Stoma Care Server Running"}
   ```

3. **프론트엔드 환경 변수 올바름?**
   ```bash
   cat .env | grep VITE_API_URL
   # VITE_API_URL="https://your-ngrok-url.ngrok-free.dev"
   ```

4. **모델 파일 존재?**
   ```bash
   ls -la stoma-server/models/*.pt stoma-server/models/*.pth
   ```

5. **브라우저 콘솔에 에러?**
   - F12 → Console 탭 확인

6. **백엔드 로그에 에러?**
   ```bash
   tail -50 backend.log | grep -i error
   ```

## 🔧 빠른 수정

### 서버 재시작
```bash
# 백엔드 재시작
cd /Users/yunsu/Documents/projects/nuna/stoma-server
pkill -f uvicorn
source venv/bin/activate
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### ngrok 재시작
```bash
pkill ngrok
ngrok http 8000
# 새 URL을 .env에 업데이트
```

### 프론트엔드 재시작
```bash
cd /Users/yunsu/Documents/projects/nuna/stoma-care-buddy
npm run dev
```

## 💡 개발 팁

### 로컬 테스트 (ngrok 없이)
```bash
# .env 수정
VITE_API_URL="http://localhost:8000"

# 프론트 실행
npm run dev

# 브라우저에서 http://localhost:5173 접속
```

### API 직접 테스트
```bash
# 파일 업로드 테스트
curl -X POST https://your-ngrok-url.ngrok-free.dev/upload \
  -F "file=@test_image.jpg" \
  -F "user_id=test_user"
```

### Supabase 연결 테스트
```python
from supabase import create_client

SUPABASE_URL = "https://uvlfxtacgpkixdnbdibu.supabase.co"
SUPABASE_KEY = "your-key"

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
result = supabase.table("diagnosis_logs").select("*").limit(1).execute()
print(result)
```
