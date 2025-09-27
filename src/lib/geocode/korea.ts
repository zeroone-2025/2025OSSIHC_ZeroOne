// 한국 주요 도시/지역 좌표 데이터베이스
// 위경도에서 가장 가까운 도시를 찾기 위한 간단한 데이터

export interface KoreaCity {
  name: string;
  city: string;
  district: string;
  dong?: string;
  lat: number;
  lng: number;
}

export const KOREA_CITIES: KoreaCity[] = [
  // 서울
  { name: "서울 중구", city: "서울특별시", district: "중구", dong: "명동", lat: 37.5636, lng: 126.9975 },
  { name: "서울 강남구", city: "서울특별시", district: "강남구", dong: "역삼동", lat: 37.5017, lng: 127.0365 },
  { name: "서울 마포구", city: "서울특별시", district: "마포구", dong: "홍대입구", lat: 37.5563, lng: 126.9235 },

  // 부산
  { name: "부산 해운대구", city: "부산광역시", district: "해운대구", dong: "우동", lat: 35.1631, lng: 129.1635 },
  { name: "부산 중구", city: "부산광역시", district: "중구", dong: "남포동", lat: 35.0989, lng: 129.0302 },

  // 대구
  { name: "대구 중구", city: "대구광역시", district: "중구", dong: "동성로", lat: 35.8686, lng: 128.6056 },

  // 인천
  { name: "인천 중구", city: "인천광역시", district: "중구", dong: "운서동", lat: 37.4491, lng: 126.4506 },

  // 광주
  { name: "광주 동구", city: "광주광역시", district: "동구", dong: "충장동", lat: 35.1468, lng: 126.9185 },

  // 대전
  { name: "대전 유성구", city: "대전광역시", district: "유성구", dong: "봉명동", lat: 36.3629, lng: 127.3565 },

  // 울산
  { name: "울산 남구", city: "울산광역시", district: "남구", dong: "삼산동", lat: 35.5460, lng: 129.3114 },

  // 경기도
  { name: "수원 영통구", city: "경기도", district: "수원시", dong: "영통동", lat: 37.2836, lng: 127.0536 },
  { name: "성남 분당구", city: "경기도", district: "성남시", dong: "정자동", lat: 37.3636, lng: 127.1145 },
  { name: "고양 일산", city: "경기도", district: "고양시", dong: "일산동구", lat: 37.6583, lng: 126.7761 },

  // 강원도
  { name: "춘천", city: "강원도", district: "춘천시", dong: "교동", lat: 37.8813, lng: 127.7298 },
  { name: "강릉", city: "강원도", district: "강릉시", dong: "교동", lat: 37.7519, lng: 128.8761 },

  // 충청북도
  { name: "청주 상당구", city: "충청북도", district: "청주시", dong: "상당구", lat: 36.6424, lng: 127.4890 },

  // 충청남도
  { name: "천안", city: "충청남도", district: "천안시", dong: "동남구", lat: 36.8151, lng: 127.1139 },

  // 전라북도
  { name: "전주 완산구", city: "전라북도", district: "전주시", dong: "완산구", lat: 35.8242, lng: 127.1480 },
  { name: "군산", city: "전라북도", district: "군산시", dong: "미룡동", lat: 35.9676, lng: 126.7370 },

  // 전라남도
  { name: "목포", city: "전라남도", district: "목포시", dong: "용당동", lat: 34.8118, lng: 126.3922 },
  { name: "여수", city: "전라남도", district: "여수시", dong: "문수동", lat: 34.7604, lng: 127.6622 },

  // 경상북도
  { name: "포항 북구", city: "경상북도", district: "포항시", dong: "북구", lat: 36.0190, lng: 129.3435 },
  { name: "경주", city: "경상북도", district: "경주시", dong: "황남동", lat: 35.8562, lng: 129.2247 },

  // 경상남도
  { name: "창원 성산구", city: "경상남도", district: "창원시", dong: "성산구", lat: 35.2281, lng: 128.6811 },
  { name: "진주", city: "경상남도", district: "진주시", dong: "상평동", lat: 35.1800, lng: 128.1076 },

  // 제주도
  { name: "제주시", city: "제주특별자치도", district: "제주시", dong: "일도동", lat: 33.4996, lng: 126.5312 },
  { name: "서귀포", city: "제주특별자치도", district: "서귀포시", dong: "서귀동", lat: 33.2452, lng: 126.5659 },
];

// 두 점 간의 거리 계산 (단위: km)
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // 지구 반지름 (km)
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a =
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// 가장 가까운 도시 찾기
export function findNearestCity(lat: number, lng: number): KoreaCity | null {
  if (!lat || !lng || !isFinite(lat) || !isFinite(lng)) {
    return null;
  }

  let nearestCity: KoreaCity | null = null;
  let shortestDistance = Infinity;

  for (const city of KOREA_CITIES) {
    const distance = calculateDistance(lat, lng, city.lat, city.lng);
    if (distance < shortestDistance) {
      shortestDistance = distance;
      nearestCity = city;
    }
  }

  // 거리가 100km 이내일 때만 반환 (너무 먼 곳은 추측하지 않음)
  return shortestDistance <= 100 ? nearestCity : null;
}