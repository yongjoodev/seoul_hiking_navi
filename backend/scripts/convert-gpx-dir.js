/**
 * GPX 디렉토리 → JSON 변환 스크립트
 * 각 GPX 파일을 하나의 코스로 변환합니다.
 * 사용법: node scripts/convert-gpx-dir.js <gpx폴더경로> <mountainId> <mountainName> <출력파일명>
 */
const xml2js = require('xml2js');
const fs = require('fs');
const path = require('path');

// process.argv[2..5] 가 한글 경로일 때 깨지는 것을 방지하기 위해
// stdin 으로도 받을 수 있도록 하고, argv 는 Buffer → string 으로 재 디코딩
function getArg(idx) {
  return Buffer.from(process.argv[idx] || '', 'binary').toString('utf8').replace(/\ufffd/g, '') || process.argv[idx];
}

const gpxDir    = process.argv[2];
const mountainId   = parseInt(process.argv[3], 10);
const mountainName = process.argv[4];
const outputName   = process.argv[5];

if (!gpxDir || !mountainId || !mountainName || !outputName) {
  console.error('사용법: node scripts/convert-gpx-dir.js <gpx폴더경로> <mountainId> <mountainName> <출력파일명>');
  process.exit(1);
}

function haversineDistance(a, b) {
  const R = 6371;
  const dLat = (b.lat - a.lat) * Math.PI / 180;
  const dLng = (b.lng - a.lng) * Math.PI / 180;
  const h = Math.sin(dLat / 2) ** 2 +
    Math.cos(a.lat * Math.PI / 180) * Math.cos(b.lat * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.asin(Math.sqrt(h));
}

// CDATA 포함 xml2js 파싱값 → 문자열 추출
function cdataText(field) {
  if (!field) return '';
  const v = Array.isArray(field) ? field[0] : field;
  if (v && typeof v === 'object' && v._) return String(v._).trim();
  return String(v || '').trim();
}

// GPX sym/type 값 → 프론트엔드 카테고리 코드 변환
function symToCategory(sym, type) {
  const s = sym.toLowerCase();
  if (s.includes('summit')) return 'SUMMIT';
  if (s.includes('trail') || s.includes('trailhead') || type === '출발점') return 'TRANS';
  if (s.includes('parking')) return 'PARKING';
  if (s.includes('restroom') || s.includes('toilet')) return 'TOILET';
  if (s.includes('water')) return 'WATER';
  if (s.includes('restaurant') || s.includes('food')) return 'FOOD';
  if (s.includes('scenic') || s.includes('viewpoint')) return 'VIEW';
  if (type === '정상') return 'SUMMIT';
  return 'SIGN';
}

async function parseGpxFile(filePath) {
  const xml = fs.readFileSync(filePath, 'utf8');
  const parsed = await xml2js.parseStringPromise(xml, { trim: true });
  const gpx = parsed.gpx;

  // 트랙 세그먼트 파싱
  const segments = [];
  const trkList = gpx.trk || [];

  trkList.forEach((trk) => {
    const trksegs = trk.trkseg || [];
    trksegs.forEach((trkseg) => {
      const pts = (trkseg.trkpt || []).map((pt) => {
        const lat = parseFloat(pt.$.lat);
        const lng = parseFloat(pt.$.lon);
        const ele = pt.ele ? parseFloat(parseFloat(pt.ele[0]).toFixed(1)) : 0;
        return { lat, lng, ele };
      }).filter(p => !isNaN(p.lat) && !isNaN(p.lng));

      if (pts.length >= 2) segments.push(pts);
    });
  });

  // 웨이포인트(wpt) 파싱
  const waypoints = (gpx.wpt || []).map((wpt) => {
    const lat = parseFloat(wpt.$.lat);
    const lng = parseFloat(wpt.$.lon);
    const ele = wpt.ele ? parseFloat(parseFloat(wpt.ele[0]).toFixed(1)) : 0;
    const name = cdataText(wpt.name);
    const sym = cdataText(wpt.sym);
    const type = cdataText(wpt.type);
    const category = symToCategory(sym, type);
    return { lat, lng, ele, name, category };
  }).filter(w => !isNaN(w.lat) && !isNaN(w.lng) && w.name);

  // GPX 이름 (메타데이터 또는 트랙명)
  let gpxName = '';
  try {
    gpxName = cdataText(gpx.metadata?.[0]?.name) ||
              cdataText(trkList[0]?.name) || '';
  } catch (_) {}

  let totalDist = 0;
  segments.forEach((seg) => {
    for (let i = 1; i < seg.length; i++) totalDist += haversineDistance(seg[i - 1], seg[i]);
  });

  const allPts = segments.flat();
  const hasEle = allPts.some(p => p.ele !== 0);

  return { segments, totalDist, hasEle, waypoints, gpxName };
}

(async () => {
  // Node.js 가 argv 를 latin1 로 읽는 경우 재인코딩
  let resolvedDir = gpxDir;
  try {
    // 경로가 존재하지 않으면 latin1→utf8 재해석 시도
    if (!fs.existsSync(resolvedDir)) {
      resolvedDir = Buffer.from(gpxDir, 'latin1').toString('utf8');
    }
  } catch (_) {}

  if (!fs.existsSync(resolvedDir)) {
    console.error('폴더를 찾을 수 없습니다:', resolvedDir);
    process.exit(1);
  }

  const files = fs.readdirSync(resolvedDir)
    .filter(f => f.toLowerCase().endsWith('.gpx'))
    .sort();

  console.log(`\n발견된 GPX 파일: ${files.length}개`);

  const courses = [];

  for (let i = 0; i < files.length; i++) {
    const filePath = path.join(resolvedDir, files[i]);
    const { segments, totalDist, hasEle, waypoints, gpxName } = await parseGpxFile(filePath);

    if (segments.length === 0) {
      console.log(`  [스킵] ${files[i]} — 유효한 포인트 없음`);
      continue;
    }

    // 파일명에서 코스명 추출: 호암산_0000000003.gpx → prefix=호암산, num=3
    //                          삼성산국기대_0000000001.gpx → prefix=삼성산국기대, num=1
    const nameMatch = files[i].match(/^(.+?)_(\d+)\.gpx$/i);
    const prefix = nameMatch ? nameMatch[1] : mountainName;
    const fileNum = nameMatch ? parseInt(nameMatch[2], 10) : i + 1;

    // GPX 메타데이터 이름 우선, 없으면 파일명 기반 생성
    let courseName = gpxName;
    if (!courseName) {
      const samePrefix = files.filter(f => {
        const m = f.match(/^(.+?)_(\d+)\.gpx$/i);
        return m && m[1] === prefix;
      });
      courseName = samePrefix.length > 1 ? `${prefix} 코스 ${fileNum}` : prefix;
    }

    const course = {
      id: courses.length + 1,
      name: courseName,
      distance: parseFloat(totalDist.toFixed(2)),
      segments,
    };

    if (waypoints.length > 0) {
      course.waypoints = waypoints;
    }

    const allPts = segments.flat();
    if (hasEle) {
      const eles = allPts.map(p => p.ele);
      console.log(`  [${course.id}] ${courseName} — ${segments.length}세그먼트, ${course.distance}km, 고도 ${Math.round(Math.min(...eles))}m~${Math.round(Math.max(...eles))}m, 웨이포인트 ${waypoints.length}개`);
    } else {
      console.log(`  [${course.id}] ${courseName} — ${segments.length}세그먼트, ${course.distance}km (고도없음), 웨이포인트 ${waypoints.length}개`);
    }

    courses.push(course);
  }

  const output = { mountainId, mountainName, courses };

  const outDir = path.join(__dirname, '../src/data/trails');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, `${outputName}.json`);
  fs.writeFileSync(outPath, JSON.stringify(output, null, 2), 'utf8');

  console.log(`\n✅ 변환 완료: ${outPath} (${courses.length}개 코스)`);
})();
