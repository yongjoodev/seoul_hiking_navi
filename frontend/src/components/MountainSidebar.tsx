'use client';

import { useState } from 'react';
import type { Mountain, TrailData, TrailCourse } from '@/types';

// ── 상수: 난이도별 스타일 ──────────────────────────────────────────
const DIFFICULTY_ACCENT: Record<string, string> = {
  '초급': 'bg-sky-500',
  '중급': 'bg-amber-500',
  '고급': 'bg-red-500',
  '상급': 'bg-red-500',
};
const DIFFICULTY_BADGE: Record<string, string> = {
  '초급': 'bg-sky-50 text-sky-700 border-sky-200',
  '중급': 'bg-amber-50 text-amber-700 border-amber-200',
  '고급': 'bg-red-50 text-red-700 border-red-200',
  '상급': 'bg-red-50 text-red-700 border-red-200',
};
// 산 목록 카드용 소형 배지
const DIFFICULTY_LIST_BADGE: Record<string, string> = {
  '초급': 'bg-sky-100 text-sky-700',
  '중급': 'bg-amber-100 text-amber-700',
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

function MountainList({
  mountains,
  onSelect,
}: {
  mountains: Mountain[];
  onSelect: (m: Mountain) => void;
}) {
  const [query, setQuery] = useState('');
  const filtered = mountains.filter(m =>
    m.name.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full">
      {/* 사이드바 헤더 */}
      <div className="flex-shrink-0 bg-green-800 text-white px-5 py-4">
        <div className="flex items-center gap-2.5 mb-3">
          <span className="text-2xl">🏔️</span>
          <div>
            <h2 className="font-extrabold text-base leading-tight">서울 등산로</h2>
            <p className="text-green-300 text-xs mt-0.5">목록 클릭 또는 지도 마커 선택</p>
          </div>
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

      {/* 결과 개수 */}
      <div className="flex-shrink-0 px-4 py-2 bg-gray-50 border-b border-gray-100">
        <p className="text-xs text-gray-500">
          <span className="font-semibold text-gray-700">{filtered.length}</span>개의 산
        </p>
      </div>

      {/* 산 목록 */}
      <div className="flex-1 overflow-y-auto sidebar-scroll">
        {filtered.map(mountain => (
          <button
            key={mountain.id}
            onClick={() => onSelect(mountain)}
            className="w-full text-left px-4 py-3.5 border-b border-gray-100 hover:bg-green-50 active:bg-green-100 transition-colors group"
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
        ))}
        {filtered.length === 0 && (
          <div className="py-16 text-center text-gray-400">
            <div className="text-4xl mb-3">🔍</div>
            <p className="text-sm font-medium">검색 결과가 없습니다</p>
            <p className="text-xs mt-1 text-gray-300">다른 이름으로 검색해보세요</p>
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
}: {
  mountain: Mountain;
  onBack: () => void;
  trailData: TrailData | null;
  activeCourse: TrailCourse | null;
  onCourseSelect: (course: TrailCourse | null) => void;
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
        <div className="min-w-0">
          <p className="text-green-300 text-xs leading-none">산 정보</p>
          <h2 className="font-extrabold text-base leading-tight mt-0.5 truncate">{mountain.name}</h2>
        </div>
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
                  <span
                    key={feature}
                    className="bg-green-50 text-green-800 text-xs font-medium px-2.5 py-1 rounded-full border border-green-100"
                  >
                    {feature}
                  </span>
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
                              <circle cx="12" cy="12" r="10" strokeWidth="2"/>
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6l4 2"/>
                            </svg>
                            {formatTime(course.uphillTime)}
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
  if (selectedMountain) {
    return (
      <MountainDetail
        mountain={selectedMountain}
        onBack={onBack}
        trailData={trailData}
        activeCourse={activeCourse}
        onCourseSelect={onCourseSelect}
      />
    );
  }
  return <MountainList mountains={mountains} onSelect={onMountainSelect} />;
}
