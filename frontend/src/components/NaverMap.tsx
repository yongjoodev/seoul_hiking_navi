'use client';

import { useEffect, useRef, useCallback } from 'react';
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

  useEffect(() => { onMountainClickRef.current = onMountainClick; });

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

  // 활성 코스 polyline 렌더링
  useEffect(() => {
    // 기존 polyline 및 시작/종료 마커 제거
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
        content: `<div style="
          width:28px;height:28px;
          background:#16a34a;
          border:3px solid #fff;
          border-radius:50%;
          display:flex;align-items:center;justify-content:center;
          box-shadow:0 2px 6px rgba(0,0,0,0.4);
          font-size:13px;line-height:1;
        ">🚶</div>`,
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
        content: `<div style="
          width:28px;height:28px;
          background:#dc2626;
          border:3px solid #fff;
          border-radius:50%;
          display:flex;align-items:center;justify-content:center;
          box-shadow:0 2px 6px rgba(0,0,0,0.4);
          font-size:13px;line-height:1;
        ">🏁</div>`,
        anchor: new naver.maps.Point(14, 14),
      },
    });
    trailMarkersRef.current.push(endMarker);

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
  }, [activeCourse]);

  return (
    <div ref={mapRef} className="w-full h-full" />
  );
}
