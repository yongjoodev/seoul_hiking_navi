# Seoul Hiking Navigator 🏔️
## 서울 등산로 네비게이터

서울특별시에 있는 산의 정보와 등산로를 안내하는 웹 서비스입니다.

---

## 실행 방법

### 1단계: Naver Maps API Key 발급

1. [Naver Cloud Platform](https://www.ncloud.com) 접속 후 로그인
2. **Console** → **AI·NAVER API** → **Maps** 이동
3. 애플리케이션 등록
   - 서비스 URL에 `http://localhost:3000` 추가
4. 발급된 **Client ID** 복사

### 2단계: 환경변수 설정

```bash
# frontend/.env.local 파일 편집
NEXT_PUBLIC_NAVER_MAP_CLIENT_ID=발급받은_Client_ID
BACKEND_URL=http://localhost:3001
```

### 3단계: 백엔드 서버 실행

```bash
cd backend
npm install       # 첫 실행 시
npm run dev       # 개발 서버 (http://localhost:3001)
```

### 4단계: 프론트엔드 서버 실행

```bash
cd frontend
npm install       # 첫 실행 시
npm run dev       # 개발 서버 (http://localhost:3000)
```

---

## API 엔드포인트

| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | `/api/health` | 서버 상태 확인 |
| GET | `/api/mountains` | 서울 전체 산 목록 조회 |
| GET | `/api/mountains/:id` | 특정 산 상세 정보 조회 |

---

## 프로젝트 구조

```
seoul_hiking_navi_2/
├── backend/                    # Node.js (Express) API 서버
│   ├── src/
│   │   ├── data/
│   │   │   └── mountains.js   # 서울 산 데이터 (29개)
│   │   ├── routes/
│   │   │   └── mountains.js   # 산 API 라우터
│   │   └── index.js           # 서버 진입점
│   └── package.json
│
└── frontend/                   # Next.js (React) 앱
    ├── src/
    │   ├── app/
    │   │   ├── layout.tsx     # 루트 레이아웃
    │   │   ├── page.tsx       # 메인 페이지 (서버 컴포넌트)
    │   │   └── globals.css    # 전역 스타일
    │   ├── components/
    │   │   ├── MapContainer.tsx    # 지도+사이드바 컨테이너
    │   │   ├── NaverMap.tsx        # 네이버 지도 컴포넌트
    │   │   └── MountainSidebar.tsx # 산 정보 사이드바
    │   └── types/
    │       ├── index.ts            # 공통 타입 정의
    │       └── naver-maps.d.ts     # Naver Maps 타입 선언
    ├── .env.local             # 환경변수 (직접 작성)
    ├── .env.local.example     # 환경변수 예시
    └── package.json
```

---

## 서울 산 데이터 목록 (해발 100m 이상, 29개)

| # | 산 이름 | 해발고도 | 구 |
|---|---------|----------|-----|
| 1 | 북한산 | 836.5m | 강북구, 도봉구, 은평구 |
| 2 | 도봉산 | 740.2m | 도봉구 |
| 3 | 수락산 | 637.7m | 노원구 |
| 4 | 관악산 | 632.2m | 관악구, 금천구, 동작구 |
| 5 | 청계산 | 618.0m | 서초구 |
| 6 | 불암산 | 507.7m | 노원구 |
| 7 | 사패산 | 552.0m | 도봉구 |
| 8 | 삼성산 | 481.0m | 관악구, 금천구 |
| 9 | 호암산 | 385.0m | 금천구 |
| 10 | 용마산 | 348.1m | 중랑구 |
| 11 | 북악산 | 342.0m | 종로구 |
| 12 | 인왕산 | 338.2m | 종로구, 서대문구 |
| 13 | 국사봉 | 338.0m | 동작구 |
| 14 | 구룡산 | 306.0m | 강남구 |
| 15 | 안산 | 295.9m | 서대문구 |
| 16 | 대모산 | 293.0m | 강남구 |
| 17 | 우면산 | 293.0m | 서초구 |
| 18 | 매봉산 | 293.0m | 강남구 |
| 19 | 아차산 | 285.7m | 광진구 |
| 20 | 망우산 | 282.0m | 중랑구 |
| 21 | 남산 | 262.0m | 중구, 용산구 |
| 22 | 앵봉산 | 252.0m | 은평구 |
| 23 | 백련산 | 215.5m | 은평구 |
| 24 | 봉산 | 209.0m | 은평구 |
| 25 | 용봉산 | 168.0m | 은평구 |
| 26 | 봉제산 | 160.0m | 강서구 |
| 27 | 천장산 | 140.0m | 노원구 |
| 28 | 개화산 | 131.7m | 강서구 |
| 29 | 와우산 | 110.0m | 마포구 |

---

## 기술 스택

| 구분 | 기술 |
|------|------|
| 프론트엔드 | Next.js 15, React, TypeScript, Tailwind CSS |
| 백엔드 | Node.js, Express, CORS |
| 지도 | Naver Maps JavaScript API v3 |
