'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import NaverMap from '@/components/NaverMap';
import MountainSidebar from '@/components/MountainSidebar';
import type { Mountain, TrailData, TrailApiResponse, TrailCourse } from '@/types';

// 고도 그래프 — 지도 위 절대 오버레이
function ElevationChart({ course, onClose }: { course: TrailCourse; onClose: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // 실제 표시 크기에 맞춰 canvas 해상도 설정 (모바일 선명도)
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.scale(dpr, dpr);

    const points = course.segments.flatMap(s => s);
    if (points.length < 2) return;
    if (points.every(p => p.ele === 0)) return;

    const eles = points.map(p => p.ele);
    const minEle = Math.min(...eles);
    const maxEle = Math.max(...eles);
    const eleRange = maxEle - minEle || 1;

    const W = rect.width;
    const H = rect.height;
    const padL = 44, padR = 12, padT = 10, padB = 24;
    const chartW = W - padL - padR;
    const chartH = H - padT - padB;

    ctx.clearRect(0, 0, W, H);

    // 배경
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, W, H);

    // 격자선
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    const gridLines = 4;
    for (let i = 0; i <= gridLines; i++) {
      const y = padT + (chartH / gridLines) * i;
      ctx.beginPath();
      ctx.moveTo(padL, y);
      ctx.lineTo(padL + chartW, y);
      ctx.stroke();

      const eleVal = maxEle - (eleRange / gridLines) * i;
      ctx.fillStyle = '#94a3b8';
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(`${Math.round(eleVal)}m`, padL - 4, y + 3);
    }

    // 그라디언트 영역
    const grad = ctx.createLinearGradient(0, padT, 0, padT + chartH);
    grad.addColorStop(0, 'rgba(34,197,94,0.5)');
    grad.addColorStop(1, 'rgba(34,197,94,0.03)');

    ctx.beginPath();
    points.forEach((p, i) => {
      const x = padL + (i / (points.length - 1)) * chartW;
      const y = padT + chartH - ((p.ele - minEle) / eleRange) * chartH;
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.lineTo(padL + chartW, padT + chartH);
    ctx.lineTo(padL, padT + chartH);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();

    // 라인
    ctx.beginPath();
    ctx.strokeStyle = '#16a34a';
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';
    points.forEach((p, i) => {
      const x = padL + (i / (points.length - 1)) * chartW;
      const y = padT + chartH - ((p.ele - minEle) / eleRange) * chartH;
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.stroke();

    // 거리 라벨
    ctx.fillStyle = '#94a3b8';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'center';
    const distLabels = Math.min(5, Math.floor(chartW / 50));
    for (let i = 0; i <= distLabels; i++) {
      const x = padL + (chartW / distLabels) * i;
      const dist = (course.distance / distLabels) * i;
      ctx.fillText(`${dist.toFixed(1)}km`, x, H - 6);
    }
  }, [course]);

  const all = course.segments.flatMap(s => s);
  const hasEle = all.some(p => p.ele !== 0);

  return (
    <div className="absolute bottom-0 left-0 right-0 z-40 bg-white/96 backdrop-blur-sm border-t border-gray-200 shadow-[0_-4px_12px_rgba(0,0,0,0.12)] px-3 pt-2 pb-2">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-semibold text-gray-600 truncate mr-2">📈 {course.name}</span>
        <div className="flex items-center gap-2 flex-shrink-0">
          {hasEle && (
            <span className="text-xs text-gray-400 hidden sm:inline">
              {Math.round(Math.min(...all.map(p => p.ele)))}m ~ {Math.round(Math.max(...all.map(p => p.ele)))}m
            </span>
          )}
          <button
            onClick={onClose}
            className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="고도 그래프 닫기"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
      <canvas ref={canvasRef} className="w-full h-[100px] rounded" style={{ display: 'block' }} />
    </div>
  );
}

interface MapContainerProps {
  mountains: Mountain[];
}

export default function MapContainer({ mountains }: MapContainerProps) {
  const [selectedMountain, setSelectedMountain] = useState<Mountain | null>(null);
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);
  const [scriptError, setScriptError] = useState(false);
  const [trailData, setTrailData] = useState<TrailData | null>(null);
  const [activeCourse, setActiveCourse] = useState<TrailCourse | null>(null);
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false);

  const clientId = process.env.NEXT_PUBLIC_NAVER_MAP_CLIENT_ID ?? '';

  // 백엔드 워밍업: 앱 로드 시 슬립 상태인 Render 인스턴스를 미리 깨움
  useEffect(() => {
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:3001';
    fetch(`${backendUrl}/api/mountains`).catch(() => {});
  }, []);

  const handleMountainSelect = (mountain: Mountain) => {
    setSelectedMountain(mountain);
    setActiveCourse(null);
    setMobileSheetOpen(true);
  };

  const handleBackToList = () => {
    setSelectedMountain(null);
    setTrailData(null);
    setActiveCourse(null);
  };

  const handleCourseSelect = useCallback((course: TrailCourse | null) => {
    setActiveCourse((prev) => (prev?.id === course?.id ? null : course));
    // 모바일: 코스 선택 시 시트 닫아서 지도 표시
    if (course) setMobileSheetOpen(false);
  }, []);

  // 산 선택 시 등산로 데이터 fetch
  useEffect(() => {
    if (!selectedMountain) {
      setTrailData(null);
      setActiveCourse(null);
      return;
    }
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:3001';
    fetch(`${backendUrl}/api/trails/${selectedMountain.id}`)
      .then((r) => r.ok ? r.json() as Promise<TrailApiResponse> : Promise.reject(r.status))
      .then((json) => setTrailData(json.data))
      .catch(() => setTrailData(null));
  }, [selectedMountain]);
  useEffect(() => {
    if (!clientId || clientId === 'YOUR_NAVER_MAP_CLIENT_ID') {
      console.error('NEXT_PUBLIC_NAVER_MAP_CLIENT_ID 환경변수가 설정되지 않았습니다.');
      setScriptError(true);
      return;
    }

    // 이미 로드된 경우
    if (window.naver?.maps) {
      setIsScriptLoaded(true);
      return;
    }

    // 이미 스크립트 태그가 삽입돼 있다면 로드 완료까지 폴링
    const existingScript = document.getElementById('naver-maps-script');
    if (existingScript) {
      const checkLoaded = setInterval(() => {
        if (window.naver?.maps) {
          setIsScriptLoaded(true);
          clearInterval(checkLoaded);
        }
      }, 100);
      return () => clearInterval(checkLoaded);
    }

    // 스크립트 동적 삽입
    const script = document.createElement('script');
    script.id = 'naver-maps-script';
    script.src = `https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${clientId}`;
    script.async = true;
    script.onload = () => setIsScriptLoaded(true);
    script.onerror = () => {
      console.error('Naver Maps 스크립트 로드 실패 - Client ID를 확인하세요:', clientId);
      setScriptError(true);
    };
    document.head.appendChild(script);
  }, [clientId]);

  return (
    <div className="h-full w-full flex flex-col md:flex-row overflow-hidden">
      {/* 데스크탑 좌측 사이드바 (md 이상에서만 표시) */}
      <div className="hidden md:flex flex-shrink-0 w-[340px] bg-white border-r border-gray-200 overflow-hidden shadow-[2px_0_8px_rgba(0,0,0,0.06)]">
        <MountainSidebar
          mountains={mountains}
          selectedMountain={selectedMountain}
          onMountainSelect={handleMountainSelect}
          onBack={handleBackToList}
          trailData={trailData}
          activeCourse={activeCourse}
          onCourseSelect={handleCourseSelect}
        />
      </div>

      {/* 지도 영역 */}
      <div className="flex-1 relative min-w-0 min-h-0">
        {scriptError ? (
          <div className="w-full h-full flex items-center justify-center bg-gray-100">
            <div className="text-center px-6">
              <div className="text-4xl mb-3">⚠️</div>
              <p className="text-sm font-bold text-gray-700 mb-1">네이버 지도 로드 실패</p>
              <p className="text-xs text-gray-500">
                <code className="bg-gray-200 px-1 py-0.5 rounded">
                  NEXT_PUBLIC_NAVER_MAP_CLIENT_ID
                </code>
                를 확인하세요
              </p>
            </div>
          </div>
        ) : !isScriptLoaded ? (
          <div className="w-full h-full flex items-center justify-center bg-gray-100">
            <div className="text-center text-gray-500">
              <div className="text-4xl mb-3 animate-pulse">🗺️</div>
              <p className="text-sm font-medium">지도를 불러오는 중...</p>
            </div>
          </div>
        ) : (
          <NaverMap
            mountains={mountains}
            selectedMountain={selectedMountain}
            onMountainClick={handleMountainSelect}
            activeCourse={activeCourse}
          />
        )}

        {/* 고도 그래프 — 지도 위 하단 오버레이 */}
        {activeCourse && activeCourse.segments.flatMap(s => s).some(p => p.ele !== 0) && (
          <ElevationChart course={activeCourse} onClose={() => setActiveCourse(null)} />
        )}

        {/* 모바일 하단 시트 (md 미만에서만 표시) */}
        <div
          className={`md:hidden absolute inset-x-0 bottom-0 z-30 bg-white rounded-t-2xl shadow-[0_-4px_16px_rgba(0,0,0,0.15)] transition-transform duration-300 ease-in-out ${
            mobileSheetOpen ? 'translate-y-0' : 'translate-y-[calc(100%-52px)]'
          }`}
          style={{ height: '68vh' }}
        >
          {/* 핸들 탭 */}
          <button
            className="w-full flex flex-col items-center pt-2.5 pb-1.5 focus:outline-none"
            onClick={() => setMobileSheetOpen(v => !v)}
            aria-label={mobileSheetOpen ? '목록 접기' : '목록 펼치기'}
          >
            <div className="w-10 h-1 bg-gray-300 rounded-full mb-1" />
            <span className="text-[11px] text-gray-400 font-medium">
              {mobileSheetOpen ? '접기' : `🏔️ ${selectedMountain ? selectedMountain.name : '산 목록 보기'}`}
            </span>
          </button>
          {/* 사이드바 콘텐츠 */}
          <div className="h-[calc(100%-40px)] overflow-hidden">
            <MountainSidebar
              mountains={mountains}
              selectedMountain={selectedMountain}
              onMountainSelect={handleMountainSelect}
              onBack={handleBackToList}
              trailData={trailData}
              activeCourse={activeCourse}
              onCourseSelect={handleCourseSelect}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

