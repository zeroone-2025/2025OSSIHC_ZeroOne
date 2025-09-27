import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

interface KakaoAddressResponse {
  documents: Array<{
    address: {
      address_name: string;
      region_1depth_name: string; // 시/도
      region_2depth_name: string; // 시/군/구
      region_3depth_name: string; // 동/읍/면
      main_address_no: string;
      sub_address_no: string;
    };
    road_address?: {
      address_name: string;
      region_1depth_name: string;
      region_2depth_name: string;
      region_3depth_name: string;
      road_name: string;
      underground_yn: string;
      main_building_no: string;
      sub_building_no: string;
      building_name: string;
    };
  }>;
}

interface KakaoKeywordResponse {
  documents: Array<{
    place_name: string;
    category_name: string;
    category_group_code: string;
    category_group_name: string;
    phone: string;
    address_name: string;
    road_address_name: string;
    id: string;
    place_url: string;
    distance: string;
    x: string; // 경도
    y: string; // 위도
  }>;
}

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const lat = url.searchParams.get("lat");
    const lng = url.searchParams.get("lng");

    if (!lat || !lng) {
      return NextResponse.json({ error: "MISSING_COORDS" }, { status: 400 });
    }

    if (!process.env.KAKAO_REST_API_KEY) {
      return NextResponse.json({
        error: "NO_KAKAO_KEY",
        message: "카카오 REST API 키가 필요합니다. .env.local에 KAKAO_REST_API_KEY를 설정해주세요."
      }, { status: 503 });
    }

    const headers = {
      Authorization: `KakaoAK ${process.env.KAKAO_REST_API_KEY}`,
    };

    try {
      // 1단계: 주변 500m 이내 주요 장소(POI) 검색 - 학교 카테고리
      const nearbyPlacesResponse = await fetch(
        `https://dapi.kakao.com/v2/local/search/category.json?category_group_code=SC4&x=${lng}&y=${lat}&radius=500&sort=distance`,
        { headers }
      );

      let nearbyPlace = null;
      if (nearbyPlacesResponse.ok) {
        const nearbyData: KakaoKeywordResponse = await nearbyPlacesResponse.json();
        // 가장 가까운 주요 장소 선택
        if (nearbyData.documents && nearbyData.documents.length > 0) {
          nearbyPlace = nearbyData.documents[0];
        }
      }

      // 2단계: 키워드 검색으로 주변 건물/대학교/병원 등 찾기
      const keywordResponse = await fetch(
        `https://dapi.kakao.com/v2/local/search/keyword.json?query=대학교 병원 학교&x=${lng}&y=${lat}&radius=500&sort=distance`,
        { headers }
      );

      let keywordPlace = null;
      if (keywordResponse.ok) {
        const keywordData: KakaoKeywordResponse = await keywordResponse.json();
        // 대학교, 병원, 주요 건물 우선 선택
        const priorityPlace = keywordData.documents?.find(place =>
          place.category_name.includes('대학교') ||
          place.category_name.includes('병원') ||
          place.category_name.includes('학교') ||
          place.category_name.includes('관공서') ||
          place.place_name.includes('대학교') ||
          place.place_name.includes('병원') ||
          place.place_name.includes('캠퍼스')
        );

        keywordPlace = priorityPlace || keywordData.documents?.[0];
      }

      // 3단계: 기본 주소 변환
      const addressResponse = await fetch(
        `https://dapi.kakao.com/v2/local/geo/coord2address.json?x=${lng}&y=${lat}`,
        { headers }
      );

      if (!addressResponse.ok) {
        throw new Error(`카카오 지도 API 오류: ${addressResponse.status}`);
      }

      const addressData: KakaoAddressResponse = await addressResponse.json();
      const document = addressData.documents?.[0];

      if (!document) {
        throw new Error("주소 정보를 찾을 수 없습니다");
      }

      const roadAddress = document.road_address;
      const jibunAddress = document.address;
      const baseAddress = roadAddress || jibunAddress;

      // 결과 조합: 주요 장소가 있으면 우선 표시
      let displayName = "";
      let category = "";
      let icon = "📍";

      if (keywordPlace) {
        displayName = keywordPlace.place_name;

        // 카테고리별 아이콘 설정
        if (keywordPlace.category_name.includes('대학교') || keywordPlace.place_name.includes('대학교')) {
          icon = "🎓";
          category = "university";
        } else if (keywordPlace.category_name.includes('병원')) {
          icon = "🏥";
          category = "hospital";
        } else if (keywordPlace.category_name.includes('학교')) {
          icon = "🏫";
          category = "school";
        } else if (keywordPlace.category_name.includes('관공서')) {
          icon = "🏛️";
          category = "government";
        } else if (keywordPlace.category_name.includes('지하철역') || keywordPlace.place_name.includes('역')) {
          icon = "🚇";
          category = "station";
        } else if (keywordPlace.category_name.includes('마트') || keywordPlace.category_name.includes('쇼핑')) {
          icon = "🛍️";
          category = "shopping";
        } else {
          icon = "🏢";
          category = "building";
        }
      } else if (nearbyPlace) {
        displayName = nearbyPlace.place_name;
        category = "nearby";

        // 학교 카테고리에서 찾은 경우 적절한 아이콘 적용
        if (nearbyPlace.place_name.includes('대학교') || nearbyPlace.place_name.includes('대학') || nearbyPlace.place_name.includes('캠퍼스')) {
          icon = "🎓";
          category = "university";
        } else if (nearbyPlace.place_name.includes('초등학교') || nearbyPlace.place_name.includes('중학교') || nearbyPlace.place_name.includes('고등학교') || nearbyPlace.place_name.includes('학교')) {
          icon = "🏫";
          category = "school";
        }
      }

      // 주소 구성
      const city = baseAddress.region_1depth_name;
      const district = baseAddress.region_2depth_name;
      const dong = baseAddress.region_3depth_name;

      let finalAddress = "";
      let fullAddress = "";

      if (displayName) {
        finalAddress = `${icon} ${displayName}`;
        fullAddress = `${city} ${district} ${dong} ${displayName}`;
      } else {
        finalAddress = `${city} ${district} ${dong}`;
        fullAddress = roadAddress
          ? `${city} ${district} ${dong} ${roadAddress.road_name} ${roadAddress.main_building_no}${roadAddress.sub_building_no ? '-' + roadAddress.sub_building_no : ''}`
          : `${city} ${district} ${dong} ${jibunAddress.main_address_no}${jibunAddress.sub_address_no ? '-' + jibunAddress.sub_address_no : ''}`;
      }

      const result = {
        address: finalAddress,
        city: city,
        district: district,
        dong: dong,
        full: fullAddress,
        source: "kakao",
        ...(displayName && {
          poi: {
            name: displayName,
            category: category,
            icon: icon,
            distance: keywordPlace?.distance || nearbyPlace?.distance
          }
        })
      };

      return NextResponse.json(result);

    } catch (kakaoError: any) {
      console.error("카카오 지도 API 오류:", kakaoError);

      // 카카오 API 실패시 간단한 fallback
      return NextResponse.json({
        address: `위도 ${parseFloat(lat).toFixed(4)}, 경도 ${parseFloat(lng).toFixed(4)}`,
        city: "",
        district: "",
        dong: "",
        full: `카카오 API 오류: ${kakaoError.message}`,
        source: "fallback",
        error: "KAKAO_API_FAILED"
      });
    }

  } catch (error: any) {
    console.error("Geocoding API failed:", error);
    return NextResponse.json({
      error: "GEOCODING_FAILED",
      detail: error?.message || String(error)
    }, { status: 500 });
  }
}