// 한국 주요 장소(POI) 데이터베이스
// 건물명, 대학교, 상가, 랜드마크 등의 구체적인 위치 정보

export interface POI {
  name: string;
  category: 'university' | 'hospital' | 'shopping' | 'government' | 'station' | 'landmark' | 'company' | 'school';
  city: string;
  district: string;
  dong?: string;
  lat: number;
  lng: number;
  radius: number; // 이 장소로 인식할 반경 (미터)
}

export const KOREA_POIS: POI[] = [
  // 전북 대학교 및 주요 장소
  {
    name: "전북대학교", category: "university",
    city: "전라북도", district: "전주시", dong: "덕진구",
    lat: 35.8469, lng: 127.1294, radius: 800
  },
  {
    name: "전주한옥마을", category: "landmark",
    city: "전라북도", district: "전주시", dong: "완산구",
    lat: 35.8154, lng: 127.1530, radius: 500
  },
  {
    name: "군산대학교", category: "university",
    city: "전라북도", district: "군산시", dong: "미룡동",
    lat: 35.9774, lng: 126.7370, radius: 600
  },

  // 서울 주요 장소
  {
    name: "서울대학교", category: "university",
    city: "서울특별시", district: "관악구", dong: "신림동",
    lat: 37.4601, lng: 126.9507, radius: 1000
  },
  {
    name: "연세대학교", category: "university",
    city: "서울특별시", district: "서대문구", dong: "신촌동",
    lat: 37.5665, lng: 126.9387, radius: 600
  },
  {
    name: "고려대학교", category: "university",
    city: "서울특별시", district: "성북구", dong: "안암동",
    lat: 37.5896, lng: 127.0254, radius: 600
  },
  {
    name: "홍익대학교", category: "university",
    city: "서울특별시", district: "마포구", dong: "상수동",
    lat: 37.5512, lng: 126.9246, radius: 400
  },
  {
    name: "강남역", category: "station",
    city: "서울특별시", district: "강남구", dong: "역삼동",
    lat: 37.4979, lng: 127.0276, radius: 300
  },
  {
    name: "홍대입구역", category: "station",
    city: "서울특별시", district: "마포구", dong: "상수동",
    lat: 37.5563, lng: 126.9235, radius: 300
  },
  {
    name: "명동", category: "shopping",
    city: "서울특별시", district: "중구", dong: "명동",
    lat: 37.5636, lng: 126.9975, radius: 400
  },
  {
    name: "코엑스", category: "shopping",
    city: "서울특별시", district: "강남구", dong: "삼성동",
    lat: 37.5126, lng: 127.0587, radius: 300
  },
  {
    name: "서울시청", category: "government",
    city: "서울특별시", district: "중구", dong: "태평로1가",
    lat: 37.5665, lng: 126.9780, radius: 200
  },

  // 부산 주요 장소
  {
    name: "부산대학교", category: "university",
    city: "부산광역시", district: "금정구", dong: "장전동",
    lat: 35.2332, lng: 129.0845, radius: 800
  },
  {
    name: "해운대해수욕장", category: "landmark",
    city: "부산광역시", district: "해운대구", dong: "우동",
    lat: 35.1587, lng: 129.1603, radius: 500
  },
  {
    name: "부산역", category: "station",
    city: "부산광역시", district: "동구", dong: "초량동",
    lat: 35.1156, lng: 129.0411, radius: 300
  },

  // 대구 주요 장소
  {
    name: "경북대학교", category: "university",
    city: "대구광역시", district: "북구", dong: "산격동",
    lat: 35.8895, lng: 128.6120, radius: 800
  },

  // 광주 주요 장소
  {
    name: "전남대학교", category: "university",
    city: "광주광역시", district: "북구", dong: "용봉동",
    lat: 35.1760, lng: 126.9097, radius: 800
  },

  // 대전 주요 장소
  {
    name: "충남대학교", category: "university",
    city: "대전광역시", district: "유성구", dong: "궁동",
    lat: 36.3658, lng: 127.3447, radius: 800
  },
  {
    name: "KAIST", category: "university",
    city: "대전광역시", district: "유성구", dong: "구성동",
    lat: 36.3726, lng: 127.3604, radius: 600
  },

  // 인천 주요 장소
  {
    name: "인천국제공항", category: "landmark",
    city: "인천광역시", district: "중구", dong: "운서동",
    lat: 37.4491, lng: 126.4506, radius: 1000
  },

  // 수원 주요 장소
  {
    name: "성균관대학교", category: "university",
    city: "경기도", district: "수원시", dong: "장안구",
    lat: 37.2930, lng: 126.9738, radius: 600
  },

  // 울산 주요 장소
  {
    name: "울산대학교", category: "university",
    city: "울산광역시", district: "남구", dong: "무거동",
    lat: 35.5425, lng: 129.2665, radius: 600
  },

  // 포항 주요 장소
  {
    name: "포항공과대학교", category: "university",
    city: "경상북도", district: "포항시", dong: "남구",
    lat: 36.0140, lng: 129.3259, radius: 600
  },

  // 춘천 주요 장소
  {
    name: "강원대학교", category: "university",
    city: "강원도", district: "춘천시", dong: "효자동",
    lat: 37.8688, lng: 127.7417, radius: 800
  },

  // 제주 주요 장소
  {
    name: "제주대학교", category: "university",
    city: "제주특별자치도", district: "제주시", dong: "아라동",
    lat: 33.4532, lng: 126.5700, radius: 600
  },

  // 병원
  {
    name: "서울대학교병원", category: "hospital",
    city: "서울특별시", district: "종로구", dong: "연건동",
    lat: 37.5799, lng: 126.9967, radius: 300
  },
  {
    name: "삼성서울병원", category: "hospital",
    city: "서울특별시", district: "강남구", dong: "일원동",
    lat: 37.4884, lng: 127.0857, radius: 300
  },

  // 주요 기업
  {
    name: "삼성전자 본사", category: "company",
    city: "경기도", district: "수원시", dong: "영통구",
    lat: 37.2571, lng: 127.0561, radius: 400
  },
];

// 두 점 간의 거리 계산 (단위: 미터)
function calculateDistanceInMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000; // 지구 반지름 (미터)
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a =
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// 주변 POI 찾기 (가장 가까운 것 우선)
export function findNearbyPOI(lat: number, lng: number): POI | null {
  if (!lat || !lng || !isFinite(lat) || !isFinite(lng)) {
    return null;
  }

  let nearestPOI: POI | null = null;
  let shortestDistance = Infinity;

  for (const poi of KOREA_POIS) {
    const distance = calculateDistanceInMeters(lat, lng, poi.lat, poi.lng);

    // POI의 지정된 반경 내에 있고, 가장 가까운 것을 선택
    if (distance <= poi.radius && distance < shortestDistance) {
      shortestDistance = distance;
      nearestPOI = poi;
    }
  }

  return nearestPOI;
}

// POI 카테고리별 아이콘 반환
export function getPOIIcon(category: POI['category']): string {
  switch (category) {
    case 'university': return '🎓';
    case 'hospital': return '🏥';
    case 'shopping': return '🛍️';
    case 'government': return '🏛️';
    case 'station': return '🚇';
    case 'landmark': return '🏛️';
    case 'company': return '🏢';
    case 'school': return '🏫';
    default: return '📍';
  }
}