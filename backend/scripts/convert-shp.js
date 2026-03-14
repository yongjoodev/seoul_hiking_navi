/**
 * SHP → JSON 변환 스크립트 (산림청 ITRF2000 TM → WGS84)
 * 사용법: node scripts/convert-shp.js <shp경로> <mountainId> <mountainName> <출력파일명>
 */
const shapefile = require('shapefile');
const proj4 = require('proj4');
const fs = require('fs');
const path = require('path');

const ITRF2000_TM = '+proj=tmerc +lat_0=38 +lon_0=127 +k=1 +x_0=200000 +y_0=600000 +ellps=GRS80 +units=m +no_defs';
const WGS84 = '+proj=longlat +ellps=WGS84 +datum=WGS84 +no_defs';

const shpPath      = process.argv[2];
const mountainId   = parseInt(process.argv[3], 10);
const mountainName = process.argv[4];
const outputName   = process.argv[5];

if (!shpPath || !mountainId || !mountainName || !outputName) {
  console.error('사용법: node scripts/convert-shp.js <shp경로> <mountainId> <mountainName> <출력파일명>');
  process.exit(1);
}

function toWGS84(x, y) {
  return proj4(ITRF2000_TM, WGS84, [x, y]);
}

function haversineDistance(a, b) {
  const R = 6371;
  const dLat = (b.lat - a.lat) * Math.PI / 180;
  const dLng = (b.lng - a.lng) * Math.PI / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * Math.PI / 180) * Math.cos(b.lat * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.asin(Math.sqrt(h));
}

(async () => {
  const source = await shapefile.open(shpPath, undefined, { encoding: 'euc-kr' });
  const features = [];
  let fieldsPrinted = false;

  while (true) {
    const result = await source.read();
    if (result.done) break;
    const feat = result.value;
    if (!fieldsPrinted) {
      console.log('\n【DBF 속성 필드】');
      console.log(JSON.stringify(feat.properties, null, 2));
      fieldsPrinted = true;
    }
    features.push(feat);
  }

  console.log(`\n총 feature 수: ${features.length}`);

  // PMNTN_NM 기준으로 코스 그룹화 (null이면 '기타 구간')
  const courseMap = new Map();

  features.forEach((f) => {
    const geo = f.geometry;
    if (!geo) return;
    const props = f.properties || {};
    const key = props.PMNTN_NM || `${mountainName} 등산로`;

    if (!courseMap.has(key)) {
      courseMap.set(key, { segments: [], difficulties: new Set(), uphillTimes: [], downhillTimes: [] });
    }
    const group = courseMap.get(key);

    let coords = [];
    if (geo.type === 'LineString') coords = geo.coordinates;
    else if (geo.type === 'MultiLineString') geo.coordinates.forEach(l => coords.push(...l));
    if (coords.length < 2) return;

    const pts = coords.map(c => {
      const [lng, lat] = toWGS84(c[0], c[1]);
      return {
        lat: parseFloat(lat.toFixed(7)),
        lng: parseFloat(lng.toFixed(7)),
        ele: parseFloat((c[2] ?? 0).toFixed(1)),
      };
    });

    group.segments.push(pts);
    if (props.PMNTN_DFFL) group.difficulties.add(props.PMNTN_DFFL);
    if (props.PMNTN_UPPL) group.uphillTimes.push(props.PMNTN_UPPL);
    if (props.PMNTN_GODN) group.downhillTimes.push(props.PMNTN_GODN);
  });

  const courses = [...courseMap.entries()].map(([name, group], idx) => {
    let totalDist = 0;
    group.segments.forEach(seg => {
      for (let i = 1; i < seg.length; i++) totalDist += haversineDistance(seg[i - 1], seg[i]);
    });

    const course = {
      id: idx + 1,
      name,
      distance: parseFloat(totalDist.toFixed(2)),
      segments: group.segments,
    };

    const diffStr = [...group.difficulties].join(', ');
    if (diffStr) course.difficulty = diffStr;
    const maxUphill = group.uphillTimes.length ? Math.max(...group.uphillTimes) : 0;
    const maxDownhill = group.downhillTimes.length ? Math.max(...group.downhillTimes) : 0;
    if (maxUphill) course.uphillTime = maxUphill;
    if (maxDownhill) course.downhillTime = maxDownhill;

    return course;
  });

  const output = { mountainId, mountainName, courses };

  const outDir = path.join(__dirname, '../src/data/trails');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, `${outputName}.json`);
  fs.writeFileSync(outPath, JSON.stringify(output, null, 2), 'utf8');

  console.log(`\n✅ 변환 완료: ${outPath}`);
  console.log(`   코스 수: ${courses.length}개`);
  courses.forEach(c => {
    console.log(`   [${c.id}] ${c.name} — ${c.segments.length}세그먼트, ${c.distance}km${c.difficulty ? ', ' + c.difficulty : ''}`);
  });
})();
