'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Mountain, TrailData, TrailCourse } from '@/types';

// ── 즐겨찾기 훅 (localStorage) ────────────────────────────────────
const FAVORITES_KEY = 'seoul_hiking_favorites';

function useFavorites() {
  const [favorites, setFavorites] = useState<Set<number>>(() => {
    if (typeof window === 'undefined') return new Set();
    try {
      const stored = localStorage.getItem(FAVORITES_KEY);
      return stored ? new Set<number>(JSON.parse(stored)) : new Set();
    } catch {
      return new Set();
    }
  });

  useEffect(() => {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify([...favorites]));
  }, [favorites]);

  const toggle = useCallback((id: number) => {
    setFavorites(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  return { favorites, toggle };
}

// ── 상수: 난이도별 스타일 ──────────────────────────────────────────
const DIFFICULTY_ACCENT: Record<string, string> = {
  '초급': 'bg-sky-500',
  '중급': 'bg-amber-500',
  '보통': 'bg-amber-500',
  '고급': 'bg-red-500',
  '상급': 'bg-red-500',
  '어려움': 'bg-red-500',
};
const DIFFICULTY_BADGE: Record<string, string> = {
  '초급': 'bg-sky-50 text-sky-700 border-sky-200',
  '중급': 'bg-amber-50 text-amber-700 border-amber-200',
  '보통': 'bg-amber-50 text-amber-700 border-amber-200',
  '고급': 'bg-red-50 text-red-700 border-red-200',
  '상급': 'bg-red-50 text-red-700 border-red-200',
  '어려움': 'bg-red-50 text-red-700 border-red-200',
};
// 산 목록 카드용 소형 배지
const DIFFICULTY_LIST_BADGE: Record<string, string> = {
  '초급': 'bg-sky-100 text-sky-700',
  '초급~중급': 'bg-teal-100 text-teal-700',
  '중급': 'bg-amber-100 text-amber-700',
  '중급~고급': 'bg-orange-100 text-orange-700',
  '고급': 'bg-red-100 text-red-700',
  '상급': 'bg-red-100 text-red-700',
};

function formatTime(mins: number): string {
  if (mins < 60) return `${mins}분`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}시간 ${m}분` : `${h}시간`;
}

interface MountainSidebarProps {
  mountains: Mountain[];
  selectedMountain: Mountain | null;
  onMountainSelect: (mountain: Mountain) => void;
  onBack: () => void;
  trailData: TrailData | null;
  activeCourse: TrailCourse | null;
  onCourseSelect: (course: TrailCourse | null) => void;
}

// 난이도 정렬 우선순위
const DIFFICULTY_ORDER: Record<string, number> = {
  '초급': 1,
  '초급~중급': 2,
  '중급': 3,
  '중급~고급': 4,
  '고급': 5,
  '상급': 6,
};

type SortKey = 'default' | 'name' | 'altitude' | 'difficulty';
type DifficultyFilter = '전체' | '초급' | '초급~중급' | '중급' | '중급~고급' | '고급';

function MountainList({
  mountains,
  onSelect,
  favorites,
  onFavoriteToggle,
}: {
  mountains: Mountain[];
  onSelect: (m: Mountain) => void;
  favorites: Set<number>;
  onFavoriteToggle: (id: number) => void;
}) {
  const [query, setQuery] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('default');
  const [difficultyFilter, setDifficultyFilter] = useState<DifficultyFilter>('전체');
  const [nationalParkOnly, setNationalParkOnly] = useState(false);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  const DIFFICULTY_FILTERS: DifficultyFilter[] = ['전체', '초급', '초급~중급', '중급', '중급~고급', '고급'];

  const processed = mountains
    .filter(m => m.name.toLowerCase().includes(query.toLowerCase()))
    .filter(m => !nationalParkOnly || m.nationalPark)
    .filter(m => difficultyFilter === '전체' || m.difficulty === difficultyFilter)
    .filter(m => !showFavoritesOnly || favorites.has(m.id))
    .sort((a, b) => {
      if (sortKey === 'name') return a.name.localeCompare(b.name, 'ko');
      if (sortKey === 'altitude') return b.altitude - a.altitude;
      if (sortKey === 'difficulty') {
        return (DIFFICULTY_ORDER[a.difficulty ?? ''] ?? 99) - (DIFFICULTY_ORDER[b.difficulty ?? ''] ?? 99);
      }
      return 0;
    });

  const hasFilter = nationalParkOnly || difficultyFilter !== '전체';

  return (
    <div className="flex flex-col h-full">
      {/* 사이드바 헤더 */}
      <div className="flex-shrink-0 bg-green-800 text-white px-5 py-3 lg:py-4">
        {/* PC 헤더 (lg 이상) */}
        <div className="hidden lg:flex items-center gap-2.5 mb-3">
          <span className="text-2xl">🏔️</span>
          <div>
            <h2 className="font-extrabold text-base leading-tight">서울 등산로</h2>
            <p className="text-green-300 text-xs mt-0.5">목록 클릭 또는 지도 마커 선택</p>
          </div>
        </div>
        {/* 태블릿 헤더 (md ~ lg) */}
        <div className="hidden md:flex lg:hidden items-center gap-2 mb-2">
          <span className="text-xl">🏔️</span>
          <div>
            <h2 className="font-extrabold text-sm leading-tight">서울 등산로</h2>
            <p className="text-green-300 text-[11px] mt-0.5 leading-none">마커 또는 목록 선택</p>
          </div>
        </div>
        {/* 모바일 헤더 (바텀시트 내부) */}
        <div className="flex items-center gap-2 mb-2 md:hidden">
          <span className="text-base">🏔️</span>
          <h2 className="font-extrabold text-sm leading-tight">서울 등산로</h2>
        </div>
        {/* 전체 / 즐겨찾기 탭 */}
        <div className="flex mb-2.5 gap-1">
          <button
            onClick={() => setShowFavoritesOnly(false)}
            className={`flex-1 text-xs font-semibold py-1 rounded-md transition-colors ${
              !showFavoritesOnly ? 'bg-white text-green-700' : 'text-green-300 hover:text-white'
            }`}
          >
            전체 ({mountains.length})
          </button>
          <button
            onClick={() => setShowFavoritesOnly(true)}
            className={`flex-1 text-xs font-semibold py-1 rounded-md transition-colors flex items-center justify-center gap-1 ${
              showFavoritesOnly ? 'bg-white text-red-500' : 'text-green-300 hover:text-white'
            }`}
          >
            <svg className="w-3 h-3" fill={showFavoritesOnly ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            즐겨찾기 ({favorites.size})
          </button>
        </div>
        {/* 검색창 */}
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="산 이름 검색..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-green-700/60 border border-green-600 rounded-lg text-sm text-white placeholder-green-400 focus:outline-none focus:ring-2 focus:ring-white/40 focus:bg-green-700"
          />
        </div>
      </div>

      {/* 정렬 & 필터 컨트롤 */}
      <div className="flex-shrink-0 px-3 py-2.5 bg-gray-50 border-b border-gray-100 space-y-2">
        {/* 정렬 + 국립공원 토글 */}
        <div className="flex items-center gap-2">
          <select
            value={sortKey}
            onChange={e => setSortKey(e.target.value as SortKey)}
            className="flex-1 text-xs text-gray-600 bg-white border border-gray-200 rounded-md px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-green-400 cursor-pointer"
          >
            <option value="default">기본 순서</option>
            <option value="name">이름순</option>
            <option value="altitude">고도 높은순</option>
            <option value="difficulty">난이도 낮은순</option>
          </select>
          <button
            onClick={() => setNationalParkOnly(v => !v)}
            className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-md border transition-colors flex-shrink-0 ${
              nationalParkOnly
                ? 'bg-amber-100 text-amber-700 border-amber-300'
                : 'bg-white text-gray-500 border-gray-200 hover:border-amber-300 hover:text-amber-600'
            }`}
          >
            <span>🏞️</span>국립공원
          </button>
        </div>
        {/* 난이도 필터 칩 */}
        <div className="flex gap-1 overflow-x-auto pb-0.5 no-scrollbar">
          {DIFFICULTY_FILTERS.map(d => (
            <button
              key={d}
              onClick={() => setDifficultyFilter(d)}
              className={`flex-shrink-0 text-[11px] font-semibold px-2 py-1 rounded-full border transition-colors ${
                difficultyFilter === d
                  ? d === '전체'
                    ? 'bg-green-600 text-white border-green-600'
                    : `${DIFFICULTY_LIST_BADGE[d] ?? 'bg-gray-200 text-gray-700'} border-transparent`
                  : 'bg-white text-gray-400 border-gray-200 hover:border-gray-300 hover:text-gray-600'
              }`}
            >
              {d}
            </button>
          ))}
        </div>
      </div>

      {/* 결과 개수 + 필터 초기화 */}
      <div className="flex-shrink-0 px-4 py-2 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
        <p className="text-xs text-gray-500">
          <span className="font-semibold text-gray-700">{processed.length}</span>개의 산
        </p>
        {hasFilter && (
          <button
            onClick={() => { setDifficultyFilter('전체'); setNationalParkOnly(false); }}
            className="text-[11px] text-gray-400 hover:text-red-500 transition-colors"
          >
            필터 초기화 ✕
          </button>
        )}
      </div>

      {/* 산 목록 */}
      <div className="flex-1 overflow-y-auto sidebar-scroll">
        {processed.map(mountain => (
          <div key={mountain.id} className="relative border-b border-gray-100 group">
            <button
              onClick={() => onSelect(mountain)}
              className="w-full text-left px-4 py-3.5 pr-10 hover:bg-green-50 active:bg-green-100 transition-colors"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-green-200 transition-colors">
                    <span className="text-sm">⛰️</span>
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-semibold text-gray-800 text-sm group-hover:text-green-700 transition-colors truncate">
                        {mountain.name}
                      </span>
                      {mountain.nationalPark && (
                        <span className="flex-shrink-0 bg-amber-100 text-amber-700 text-[10px] font-bold px-1.5 py-0.5 rounded">국립</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-gray-400">{mountain.altitude.toLocaleString()}m</span>
                      {mountain.difficulty && (
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold flex-shrink-0 ${DIFFICULTY_LIST_BADGE[mountain.difficulty] ?? 'bg-gray-100 text-gray-600'}`}>
                          {mountain.difficulty}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <svg className="w-4 h-4 text-gray-300 group-hover:text-green-500 flex-shrink-0 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>
            {/* 하트 버튼 */}
            <button
              onClick={e => { e.stopPropagation(); onFavoriteToggle(mountain.id); }}
              className="absolute right-1 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-full hover:bg-red-50 transition-colors"
              aria-label={favorites.has(mountain.id) ? '즐겨찾기 해제' : '즐겨찾기 추가'}
            >
              <svg
                className={`w-4 h-4 transition-colors ${favorites.has(mountain.id) ? 'text-red-500 fill-red-500' : 'text-gray-300 fill-none hover:text-red-400'}`}
                stroke="currentColor" viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </button>
          </div>
        ))}
        {processed.length === 0 && (
          <div className="py-16 text-center text-gray-400">
            <div className="text-4xl mb-3">{showFavoritesOnly ? '💔' : '🔍'}</div>
            <p className="text-sm font-medium">{showFavoritesOnly ? '즐겨찾기한 산이 없습니다' : '검색 결과가 없습니다'}</p>
            <p className="text-xs mt-1 text-gray-300">{showFavoritesOnly ? '하트를 눌러 즐겨찾기를 추가해보세요' : '다른 이름으로 검색해보세요'}</p>
          </div>
        )}
        <div className="h-4" />
      </div>
    </div>
  );
}

function MountainDetail({
  mountain,
  onBack,
  trailData,
  activeCourse,
  onCourseSelect,
  isFavorite,
  onFavoriteToggle,
}: {
  mountain: Mountain;
  onBack: () => void;
  trailData: TrailData | null;
  activeCourse: TrailCourse | null;
  onCourseSelect: (course: TrailCourse | null) => void;
  isFavorite: boolean;
  onFavoriteToggle: (id: number) => void;
}) {
  return (
    <div className="flex flex-col h-full">
      {/* 뒤로가기 내비 */}
      <div className="flex-shrink-0 bg-green-800 text-white px-4 py-3 flex items-center gap-3">
        <button
          onClick={onBack}
          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-green-700 transition-colors flex-shrink-0"
          aria-label="목록으로"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="min-w-0 flex-1">
          <p className="text-green-300 text-xs leading-none">산 정보</p>
          <h2 className="font-extrabold text-base leading-tight mt-0.5 truncate">{mountain.name}</h2>
        </div>
        {/* 헤더 하트 버튼 */}
        <button
          onClick={() => onFavoriteToggle(mountain.id)}
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-green-700 transition-colors flex-shrink-0"
          aria-label={isFavorite ? '즐겨찾기 해제' : '즐겨찾기 추가'}
        >
          <svg
            className={`w-5 h-5 transition-colors ${isFavorite ? 'text-red-400 fill-red-400' : 'text-green-400 fill-none'}`}
            stroke="currentColor" viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        </button>
      </div>

      {/* 스크롤 컨텐츠 */}
      <div className="flex-1 overflow-y-auto sidebar-scroll">
        {/* 산 히어로 */}
        <div className="bg-gradient-to-br from-green-700 to-green-900 text-white px-5 py-5">
          <div className="flex items-start justify-between gap-2">
            <h2 className="text-2xl font-extrabold leading-tight tracking-tight">
              {mountain.name}
            </h2>
            {mountain.nationalPark && (
              <span className="flex-shrink-0 bg-amber-400 text-amber-900 text-xs font-bold px-2.5 py-1 rounded-full mt-1">
                국립공원
              </span>
            )}
          </div>
          <div className="mt-4 flex items-center gap-3">
            <div className="bg-white/15 rounded-xl px-4 py-2 text-center">
              <p className="text-green-200 text-xs font-medium">해발고도</p>
              <p className="text-white font-extrabold text-xl leading-tight">
                {mountain.altitude.toLocaleString()}
                <span className="text-sm font-medium ml-0.5">m</span>
              </p>
            </div>
            {mountain.difficulty && (
              <div className="bg-white/15 rounded-xl px-4 py-2 text-center">
                <p className="text-green-200 text-xs font-medium">난이도</p>
                <p className="text-white font-bold text-sm leading-tight mt-0.5">
                  {mountain.difficulty}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* 기본 정보 */}
        <div className="px-5 py-4 space-y-4">
          <div>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">소개</h3>
            <p className="text-sm text-gray-700 leading-relaxed">{mountain.description}</p>
          </div>
          {mountain.features.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">주요 특징</h3>
              <div className="flex flex-wrap gap-1.5">
                {mountain.features.map((feature) => (
                  <button
                    key={feature}
                    onClick={() => window.open(`https://search.naver.com/search.naver?query=${encodeURIComponent(mountain.name + ' ' + feature)}`, '_blank', 'noopener,noreferrer')}
                    className="bg-green-50 text-green-800 text-xs font-medium px-2.5 py-1 rounded-full border border-green-100 hover:bg-green-100 hover:border-green-300 hover:text-green-900 active:bg-green-200 transition-colors cursor-pointer"
                  >
                    {feature}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 등산 코스 */}
        {trailData && trailData.courses.length > 0 && (
          <div className="pb-4">
            <div className="px-5 py-2.5 bg-gray-50 border-y border-gray-100 flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">등산 코스</span>
              <span className="text-xs font-bold text-green-700">총 {trailData.courses.length}개</span>
            </div>
            <div>
              {trailData.courses.map((course) => {
                const isActive = activeCourse?.id === course.id;
                const allPts = course.segments.flatMap(s => s);
                const hasEle = allPts.some(p => p.ele !== 0);
                const eles = hasEle ? allPts.map(p => p.ele) : null;
                const accentColor = DIFFICULTY_ACCENT[course.difficulty ?? ''] ?? 'bg-green-500';

                return (
                  <button
                    key={course.id}
                    onClick={() => onCourseSelect(course)}
                    className={`w-full text-left border-b border-gray-100 transition-colors relative ${
                      isActive ? 'bg-green-50' : 'bg-white hover:bg-gray-50'
                    }`}
                  >
                    {/* 좌측 난이도 액센트 바 — 활성 코스일 때만 표시 */}
                    {isActive && (
                      <div className={`absolute left-0 top-0 bottom-0 w-1 ${accentColor}`} />
                    )}

                    <div className="pl-5 pr-4 py-3.5">
                      {/* 코스명 + 정상 아이콘 */}
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-1.5 min-w-0">
                          {/* 깃발 아이콘 — ohiking.today icon_topflag 참고 */}
                          <svg className={`w-3.5 h-3.5 flex-shrink-0 ${isActive ? 'text-green-600' : 'text-gray-300'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/>
                            <line x1="4" y1="22" x2="4" y2="15"/>
                          </svg>
                          <span className={`text-sm font-bold truncate ${isActive ? 'text-green-700' : 'text-gray-800'}`}>
                            {course.name}
                          </span>
                        </div>
                        {isActive && (
                          <span className="flex-shrink-0 bg-green-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                            지도 표시 중
                          </span>
                        )}
                      </div>

                      {/* 정보 칩 행 */}
                      <div className="flex items-center flex-wrap gap-1.5">
                        {course.difficulty && (
                          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded border ${
                            DIFFICULTY_BADGE[course.difficulty] ?? 'bg-gray-50 text-gray-600 border-gray-200'
                          }`}>
                            {course.difficulty}
                          </span>
                        )}
                        {course.uphillTime && (
                          <span className="flex items-center gap-1 text-[11px] text-gray-500 bg-gray-50 border border-gray-200 px-2 py-0.5 rounded">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7"/>
                            </svg>
                            {formatTime(course.uphillTime)}
                          </span>
                        )}
                        {course.downhillTime && (
                          <span className="flex items-center gap-1 text-[11px] text-gray-500 bg-gray-50 border border-gray-200 px-2 py-0.5 rounded">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"/>
                            </svg>
                            {formatTime(course.downhillTime)}
                          </span>
                        )}
                        {course.uphillTime && course.downhillTime && (
                          <span className="flex items-center gap-1 text-[11px] text-orange-600 bg-orange-50 border border-orange-200 px-2 py-0.5 rounded font-semibold">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <circle cx="12" cy="12" r="10" strokeWidth="2"/>
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6l4 2"/>
                            </svg>
                            총 {formatTime(course.uphillTime + course.downhillTime)}
                          </span>
                        )}
                        <span className="flex items-center gap-1 text-[11px] text-gray-500 bg-gray-50 border border-gray-200 px-2 py-0.5 rounded">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"/>
                          </svg>
                          {course.distance}km
                        </span>
                        {eles && (
                          <span className="flex items-center gap-1 text-[11px] text-gray-500 bg-gray-50 border border-gray-200 px-2 py-0.5 rounded">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 10l7-7 7 7M5 19l7-7 7 7"/>
                            </svg>
                            {Math.round(Math.min(...eles))}~{Math.round(Math.max(...eles))}m
                          </span>
                        )}

                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {trailData === null && (
          <div className="px-5 py-6 text-center text-gray-400">
            <div className="text-3xl mb-2">🥾</div>
            <p className="text-xs">등산 코스 데이터가 없습니다</p>
          </div>
        )}

        <div className="h-4" />
      </div>
    </div>
  );
}

export default function MountainSidebar({
  mountains,
  selectedMountain,
  onMountainSelect,
  onBack,
  trailData,
  activeCourse,
  onCourseSelect,
}: MountainSidebarProps) {
  const { favorites, toggle } = useFavorites();

  if (selectedMountain) {
    return (
      <MountainDetail
        mountain={selectedMountain}
        onBack={onBack}
        trailData={trailData}
        activeCourse={activeCourse}
        onCourseSelect={onCourseSelect}
        isFavorite={favorites.has(selectedMountain.id)}
        onFavoriteToggle={toggle}
      />
    );
  }
  return (
    <MountainList
      mountains={mountains}
      onSelect={onMountainSelect}
      favorites={favorites}
      onFavoriteToggle={toggle}
    />
  );
}
