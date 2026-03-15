import MapContainer from '@/components/MapContainer';
import type { Mountain, MountainsApiResponse } from '@/types';

export const dynamic = 'force-dynamic';

async function getMountains(): Promise<Mountain[]> {
  const backendUrl = process.env.BACKEND_URL ?? 'http://localhost:3001';

  try {
    const res = await fetch(`${backendUrl}/api/mountains`, {
      cache: 'no-store',
    });

    if (!res.ok) {
      throw new Error(`API 응답 오류: ${res.status}`);
    }

    const json: MountainsApiResponse = await res.json();
    return json.data;
  } catch (err) {
    console.error('산 데이터를 불러오는 데 실패했습니다:', err);
    return [];
  }
}

export default async function Home() {
  const mountains = await getMountains();

  return (
    <main className="h-screen flex flex-col bg-gray-50">
      {/* 헤더 */}
      <header className="flex-shrink-0 bg-green-800 text-white px-5 py-3 flex items-center shadow-md z-40 relative">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🏔️</span>
          <div>
            <h1 className="text-base font-extrabold tracking-tight leading-none">
              Seoul Hiking Navigator
            </h1>
            <p className="text-green-300 text-xs font-medium mt-0.5 leading-none">
              서울 등산로 네비게이터
            </p>
          </div>
        </div>
      </header>

      {/* 지도 컨테이너 */}
      <div className="flex-1 relative min-h-0">
        {mountains.length === 0 ? (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
            <div className="text-center">
              <div className="text-5xl mb-4">⚠️</div>
              <h2 className="text-lg font-bold text-gray-700 mb-2">데이터를 불러올 수 없습니다</h2>
              <p className="text-sm text-gray-500 mb-4">백엔드 서버가 실행 중인지 확인해주세요.</p>
              <code className="bg-gray-200 text-gray-700 text-xs px-3 py-2 rounded-lg block">
                cd backend &amp;&amp; npm run dev
              </code>
            </div>
          </div>
        ) : (
          <MapContainer mountains={mountains} />
        )}
      </div>
    </main>
  );
}
