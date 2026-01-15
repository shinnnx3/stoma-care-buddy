# Stoma Care Buddy

AI 기반 장루 상태 진단 및 건강 관리 애플리케이션

## 소개

Stoma Care Buddy는 장루 보유자들의 일상적인 장루 관리를 돕기 위한 모바일 웹 애플리케이션입니다. AI 이미지 분석과 체계적인 문진 시스템을 통해 장루 상태를 진단하고, 적절한 관리 방법을 안내합니다.

## 주요 기능

### 1. AI 기반 장루 이미지 분석
- 장루 사진을 촬영하면 AI가 자동으로 상태를 분석
- 괴사, 허혈, 피부염 등 이상 징후 감지
- 밝기 보정을 통한 정확한 분석 지원

### 2. 체계적인 문진 시스템
- 응급 상황 선별을 위한 사전 문진
- AI 분석 결과에 따른 맞춤형 추가 문진
- 다중 진단 및 위험도(정상/주의/위험) 자동 산정

### 3. 건강 기록 관리
- 진단 기록 저장 및 히스토리 조회
- 캘린더 기반 일별 기록 확인
- 밝기값 변화 추이 비교 (7일 전 대비)

### 4. 일일 체크리스트
- 오늘의 할 일 관리
- 장루 관리 루틴 체크

## 기술 스택

- **Frontend**: React 18, TypeScript
- **Build Tool**: Vite
- **UI Framework**: shadcn/ui, Tailwind CSS
- **Backend**: Supabase (인증, 데이터베이스)

## 시작하기

### 필수 요구사항
- Node.js 18 이상
- npm 또는 yarn

### 설치

```bash
# 저장소 클론
git clone <repository-url>
cd stoma-care-buddy

# 의존성 설치
npm install

# 개발 서버 실행
npm run dev
```

### 환경 변수 설정

`.env` 파일을 생성하고 다음 변수를 설정하세요:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_API_URL=your_api_server_url
```

## 스크립트

```bash
npm run dev      # 개발 서버 실행
npm run build    # 프로덕션 빌드
npm run preview  # 빌드된 앱 미리보기
npm run lint     # ESLint 검사
```

## 프로젝트 구조

```
src/
├── components/     # UI 컴포넌트
│   ├── ui/         # shadcn/ui 기본 컴포넌트
│   └── ...         # 커스텀 컴포넌트
├── contexts/       # React Context (인증 등)
├── hooks/          # 커스텀 훅
├── integrations/   # 외부 서비스 연동 (Supabase)
├── lib/            # 유틸리티 함수
│   ├── api.ts      # API 호출
│   ├── triage.ts   # 문진 엔진
│   └── utils.ts    # 공통 유틸
├── pages/          # 페이지 컴포넌트
└── assets/         # 이미지 등 정적 자원
```

## 주의사항

본 서비스는 참고용이며, 정확한 진단은 반드시 의료 전문가와 상담하세요.

## 라이선스

Private - All Rights Reserved
