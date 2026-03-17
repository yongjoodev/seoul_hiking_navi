'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import type { Mountain, TrailCourse } from '@/types';

interface NaverMapProps {
  mountains: Mountain[];
  selectedMountain: Mountain | null;
  onMountainClick: (mountain: Mountain) => void;
  activeCourse: TrailCourse | null;
}

const SEOUL_CENTER = { lat: 37.5665, lng: 126.978 };
const MAP_INITIAL_ZOOM = 11;

function createMarkerContent(mountain: Mountain, isSelected: boolean): string {
  const bgColor = isSelected ? '#1b5e20' : '#2e7d32';
  const borderColor = isSelected ? '#a5d6a7' : '#ffffff';
  const scale = isSelected ? 'scale(1.2)' : 'scale(1)';
  const shadow = isSelected
    ? '0 4px 12px rgba(0,0,0,0.5)'
    : '0 2px 6px rgba(0,0,0,0.3)';

  return `
    <div style="
      display: flex;
      flex-direction: column;
      align-items: center;
      cursor: pointer;
      transform: ${scale};
      transform-origin: bottom center;
      transition: transform 0.2s ease;
      user-select: none;
    ">
      <div style="
        background: ${bgColor};
        border: 2.5px solid ${borderColor};
        border-radius: 50%;
        width: 34px;
        height: 34px;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: ${shadow};
        font-size: 17px;
        line-height: 1;
      ">⛰️</div>
      <div style="
        background: ${bgColor};
        color: #ffffff;
        font-size: 11px;
        font-weight: 700;
        padding: 2px 7px;
        border-radius: 10px;
        margin-top: 3px;
        white-space: nowrap;
        box-shadow: ${shadow};
        border: 1px solid ${borderColor};
        font-family: 'Noto Sans KR', 'Apple SD Gothic Neo', sans-serif;
        letter-spacing: -0.3px;
      ">${mountain.name}</div>
    </div>
  `;
}

export default function NaverMap({ mountains, selectedMountain, onMountainClick, activeCourse }: NaverMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<naver.maps.Map | null>(null);
  const markersRef = useRef<Map<number, naver.maps.Marker>>(new Map());
  const selectedIdRef = useRef<number | null>(null);
  const polylinesRef = useRef<naver.maps.Polyline[]>([]);
  const trailMarkersRef = useRef<naver.maps.Marker[]>([]);
  const onMountainClickRef = useRef(onMountainClick);
  const myLocationMarkerRef = useRef<naver.maps.Marker | null>(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);

  useEffect(() => { onMountainClickRef.current = onMountainClick; });

  const handleMyLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setGpsError('이 브라우저는 GPS를 지원하지 않습니다.');
      return;
    }
    setGpsLoading(true);
    setGpsError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGpsLoading(false);
        const { latitude, longitude } = pos.coords;
        const map = mapInstanceRef.current;
        if (!map) return;

        // 기존 마커 제거
        if (myLocationMarkerRef.current) {
          myLocationMarkerRef.current.setMap(null);
        }

        const marker = new naver.maps.Marker({
          position: new naver.maps.LatLng(latitude, longitude),
          map,
          icon: {
            content: `<div style="
              width:18px;height:18px;
              background:#2563eb;
              border:3px solid #fff;
              border-radius:50%;
              box-shadow:0 0 0 4px rgba(37,99,235,0.25),0 2px 6px rgba(0,0,0,0.3);
            "></div>`,
            anchor: new naver.maps.Point(9, 9),
          },
          zIndex: 10,
        });
        myLocationMarkerRef.current = marker;

        map.morph(new naver.maps.LatLng(latitude, longitude), 15, {
          duration: 500,
          easing: 'easeOutCubic',
        });
      },
      (err) => {
        setGpsLoading(false);
        if (err.code === err.PERMISSION_DENIED) {
          setGpsError('위치 권한이 거부되었습니다.');
        } else {
          setGpsError('위치를 가져올 수 없습니다.');
        }
        setTimeout(() => setGpsError(null), 3000);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  const updateMarkerIcon = useCallback((id: number, isSelected: boolean) => {
    const marker = markersRef.current.get(id);
    const mountain = mountains.find((m) => m.id === id);
    if (!marker || !mountain) return;

    marker.setIcon({
      content: createMarkerContent(mountain, isSelected),
      anchor: new naver.maps.Point(17, 37),
    });
  }, [mountains]);

  const initializeMap = useCallback(() => {
    if (!mapRef.current || !window.naver?.maps || mapInstanceRef.current) return;

    const map = new naver.maps.Map(mapRef.current, {
      center: new naver.maps.LatLng(SEOUL_CENTER.lat, SEOUL_CENTER.lng),
      zoom: MAP_INITIAL_ZOOM,
      minZoom: 10,
      maxZoom: 18,
      mapTypeId: naver.maps.MapTypeId.TERRAIN,
      zoomControl: true,
      scaleControl: true,
      mapDataControl: false,
      logoControl: true,
    });

    mapInstanceRef.current = map;

    mountains.forEach((mountain) => {
      const marker = new naver.maps.Marker({
        position: new naver.maps.LatLng(mountain.lat, mountain.lng),
        map,
        icon: {
          content: createMarkerContent(mountain, false),
          anchor: new naver.maps.Point(17, 37),
        },
        title: mountain.name,
        clickable: true,
      });

      markersRef.current.set(mountain.id, marker);

      naver.maps.Event.addListener(marker, 'click', () => {
        onMountainClickRef.current(mountain);
      });
    });
  }, [mountains]);

  // 스크립트 로드 감지 및 지도 초기화
  useEffect(() => {
    const checkNaverLoaded = () => {
      if (window.naver?.maps) {
        initializeMap();
        return true;
      }
      return false;
    };

    if (checkNaverLoaded()) return;

    // 스크립트가 아직 로드 중이라면 polling
    const interval = setInterval(() => {
      if (checkNaverLoaded()) {
        clearInterval(interval);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [initializeMap]);

  // 선택된 산 변경 시 마커 업데이트 및 지도 이동
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    if (selectedIdRef.current !== null) {
      updateMarkerIcon(selectedIdRef.current, false);
    }

    if (selectedMountain) {
      selectedIdRef.current = selectedMountain.id;
      updateMarkerIcon(selectedMountain.id, true);
      mapInstanceRef.current.morph(
        new naver.maps.LatLng(selectedMountain.lat, selectedMountain.lng),
        15,
        { duration: 500, easing: 'easeOutCubic' }
      );
    } else {
      selectedIdRef.current = null;
      mapInstanceRef.current.setZoom(MAP_INITIAL_ZOOM, true);
    }
  }, [selectedMountain, updateMarkerIcon]);

  // 활성 코스 polyline + waypoint 마커 렌더링
  useEffect(() => {
    // 기존 polyline 및 마커 제거
    polylinesRef.current.forEach(pl => pl.setMap(null));
    polylinesRef.current = [];
    trailMarkersRef.current.forEach(m => m.setMap(null));
    trailMarkersRef.current = [];

    if (!mapInstanceRef.current || !activeCourse) return;

    const allPoints: naver.maps.LatLng[] = [];

    activeCourse.segments.forEach((seg) => {
      const path = seg.map((p) => {
        const latlng = new naver.maps.LatLng(p.lat, p.lng);
        allPoints.push(latlng);
        return latlng;
      });
      const polyline = new naver.maps.Polyline({
        path,
        strokeColor: '#f97316',
        strokeWeight: 4,
        strokeOpacity: 0.95,
        strokeStyle: 'solid',
        map: mapInstanceRef.current!,
      });
      polylinesRef.current.push(polyline);
    });

    if (allPoints.length === 0) return;

    // 시작 마커 (초록)
    const startPoint = activeCourse.segments[0][0];
    const startMarker = new naver.maps.Marker({
      position: new naver.maps.LatLng(startPoint.lat, startPoint.lng),
      map: mapInstanceRef.current,
      icon: {
        content: `<div style="width:28px;height:28px;background:#16a34a;border:3px solid #fff;border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 6px rgba(0,0,0,0.4);font-size:13px;line-height:1;">🚶</div>`,
        anchor: new naver.maps.Point(14, 14),
      },
    });
    trailMarkersRef.current.push(startMarker);

    // 종료 마커 (빨강)
    const lastSeg = activeCourse.segments[activeCourse.segments.length - 1];
    const endPoint = lastSeg[lastSeg.length - 1];
    const endMarker = new naver.maps.Marker({
      position: new naver.maps.LatLng(endPoint.lat, endPoint.lng),
      map: mapInstanceRef.current,
      icon: {
        content: `<div style="width:28px;height:28px;background:#dc2626;border:3px solid #fff;border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 6px rgba(0,0,0,0.4);font-size:13px;line-height:1;">🏁</div>`,
        anchor: new naver.maps.Point(14, 14),
      },
    });
    trailMarkersRef.current.push(endMarker);

    // 웨이포인트 마커 렌더링
    const waypointInfoWindows: naver.maps.InfoWindow[] = [];
    let openInfoWindow: naver.maps.InfoWindow | null = null;

    const CATEGORY_ICON: Record<string, string> = {
      TRANS: '🚏',    // 교통/들머리
      SCENERY: '🌿',  // 경관
      SIGN: '🪧',     // 이정표
      REST: '🪑',     // 쉼터
      VIEW: '🔭',     // 전망대
      PHOTO: '📷',    // 포토존
      SUMMIT: '⛰️',  // 정상
      WATER: '💧',    // 약수
      FOOD: '🍱',     // 식당
      PARKING: '🅿️', // 주차장
      TOILET: '🚻',   // 화장실
    };
    const CATEGORY_LABEL: Record<string, string> = {
      TRANS: '교통/들머리',
      SCENERY: '경관',
      SIGN: '이정표',
      REST: '쉼터',
      VIEW: '전망대',
      PHOTO: '포토존',
      SUMMIT: '정상',
      WATER: '약수터',
      FOOD: '식당',
      PARKING: '주차장',
      TOILET: '화장실',
    };

    (activeCourse.waypoints || []).forEach((wpt) => {
      const icon = CATEGORY_ICON[wpt.category] || '📍';
      const eleText = wpt.ele > 0 ? `<span style="color:#64748b;font-size:10px;"> · ${Math.round(wpt.ele)}m</span>` : '';

      const marker = new naver.maps.Marker({
        position: new naver.maps.LatLng(wpt.lat, wpt.lng),
        map: mapInstanceRef.current!,
        icon: {
          content: `<div style="
            display:flex;flex-direction:column;align-items:center;cursor:pointer;
          ">
            <div style="
              width:22px;height:22px;
              background:#fff;
              border:2px solid #3b82f6;
              border-radius:50%;
              display:flex;align-items:center;justify-content:center;
              box-shadow:0 1px 4px rgba(0,0,0,0.3);
              font-size:11px;line-height:1;
            ">${icon}</div>
            <div style="
              background:#1e40af;
              color:#fff;
              font-size:9px;
              font-weight:600;
              padding:1px 5px;
              border-radius:6px;
              margin-top:2px;
              white-space:nowrap;
              max-width:80px;
              overflow:hidden;
              text-overflow:ellipsis;
              box-shadow:0 1px 3px rgba(0,0,0,0.3);
              font-family:'Noto Sans KR',sans-serif;
            ">${wpt.name}</div>
          </div>`,
          anchor: new naver.maps.Point(11, 22),
        },
        zIndex: 5,
      });

      const infoWindow = new naver.maps.InfoWindow({
        content: `<div style="
          padding:8px 12px;
          font-family:'Noto Sans KR',sans-serif;
          min-width:120px;
          max-width:200px;
        ">
          <div style="font-weight:700;font-size:13px;color:#1e293b;margin-bottom:3px;">
            ${icon} ${wpt.name}
          </div>
          <div style="font-size:11px;color:#64748b;">
            ${wpt.category ? `유형: ${CATEGORY_LABEL[wpt.category] ?? wpt.category}` : ''}${eleText}
          </div>
        </div>`,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        anchorSize: new naver.maps.Size(8, 8),
        backgroundColor: '#fff',
        pixelOffset: new naver.maps.Point(0, -5),
      });

      waypointInfoWindows.push(infoWindow);

      naver.maps.Event.addListener(marker, 'click', () => {
        if (openInfoWindow) {
          openInfoWindow.close();
          if (openInfoWindow === infoWindow) {
            openInfoWindow = null;
            return;
          }
        }
        infoWindow.open(mapInstanceRef.current!, marker);
        openInfoWindow = infoWindow;
      });

      trailMarkersRef.current.push(marker);
    });

    // 경로 전체가 보이도록 fitBounds
    const lats = allPoints.map(p => p.lat());
    const lngs = allPoints.map(p => p.lng());
    const sw = new naver.maps.LatLng(Math.min(...lats), Math.min(...lngs));
    const ne = new naver.maps.LatLng(Math.max(...lats), Math.max(...lngs));
    setTimeout(() => {
      mapInstanceRef.current?.fitBounds(new naver.maps.LatLngBounds(sw, ne), {
        top: 60, right: 60, bottom: 60, left: 60,
      });
    }, 200);

    // 지도 클릭 시 열린 InfoWindow 닫기
    const mapClickListener = naver.maps.Event.addListener(mapInstanceRef.current, 'click', () => {
      if (openInfoWindow) {
        openInfoWindow.close();
        openInfoWindow = null;
      }
    });

    return () => {
      naver.maps.Event.removeListener(mapClickListener);
      waypointInfoWindows.forEach(iw => iw.close());
    };
  }, [activeCourse]);

  return (
    <div className="relative w-full h-full">
      <div ref={mapRef} className="w-full h-full" />

      {/* 현재 위치 버튼 — 지도 우하단 */}
      <div className="absolute bottom-14 md:bottom-8 right-3 z-20 flex flex-col items-end gap-2" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
        {gpsError && (
          <div className="bg-red-500 text-white text-xs font-medium px-3 py-1.5 rounded-lg shadow-md whitespace-nowrap">
            {gpsError}
          </div>
        )}
        <button
          onClick={handleMyLocation}
          disabled={gpsLoading}
          className="w-10 h-10 bg-white rounded-full shadow-[0_2px_8px_rgba(0,0,0,0.2)] flex items-center justify-center hover:bg-gray-50 active:bg-gray-100 transition-colors disabled:opacity-60"
          aria-label="현재 위치"
          title="현재 위치"
        >
          {gpsLoading ? (
            <svg className="w-5 h-5 text-blue-500 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/>
            </svg>
          ) : (
            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="3" strokeWidth="2"/>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 2v3M12 19v3M2 12h3M19 12h3"/>
              <circle cx="12" cy="12" r="8" strokeWidth="1.5" strokeDasharray="3 2"/>
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}
