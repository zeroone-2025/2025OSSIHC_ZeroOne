import { NextRequest, NextResponse } from "next/server";
import { findNearestCity } from "@/lib/geocode/korea";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const lat = url.searchParams.get("lat");
    const lng = url.searchParams.get("lng");

    if (!lat || !lng) {
      return NextResponse.json({ error: "MISSING_COORDS" }, { status: 400 });
    }

    // 카카오 REST API 키가 있는 경우 카카오 API 사용
    if (process.env.KAKAO_REST_API_KEY) {
      try {
        const response = await fetch(
          `https://dapi.kakao.com/v2/local/geo/coord2address.json?x=${lng}&y=${lat}`,
          {
            headers: {
              Authorization: `KakaoAK ${process.env.KAKAO_REST_API_KEY}`,
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          const document = data.documents?.[0];

          if (document) {
            const roadAddress = document.road_address;
            const jibunAddress = document.address;

            // 도로명 주소 우선, 없으면 지번 주소
            const address = roadAddress || jibunAddress;

            if (address) {
              const fullAddress = roadAddress
                ? `${address.region_1depth_name} ${address.region_2depth_name} ${address.region_3depth_name}`
                : `${address.region_1depth_name} ${address.region_2depth_name} ${address.region_3depth_name}`;

              return NextResponse.json({
                address: fullAddress,
                city: address.region_1depth_name, // 시/도
                district: address.region_2depth_name, // 시/군/구
                dong: address.region_3depth_name, // 동/읍/면
                full: roadAddress
                  ? `${address.region_1depth_name} ${address.region_2depth_name} ${address.region_3depth_name} ${roadAddress.road_name} ${roadAddress.main_building_no}${roadAddress.sub_building_no ? '-' + roadAddress.sub_building_no : ''}`
                  : `${address.region_1depth_name} ${address.region_2depth_name} ${address.region_3depth_name} ${jibunAddress.main_address_no}${jibunAddress.sub_address_no ? '-' + jibunAddress.sub_address_no : ''}`,
                source: "kakao"
              });
            }
          }
        }
      } catch (kakaoError) {
        console.warn("Kakao geocoding failed:", kakaoError);
      }
    }

    // Nominatim API fallback (무료, 하지만 한국 주소 정확도가 떨어짐)
    try {
      console.log(`Trying Nominatim for ${lat}, ${lng}`);
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=ko&zoom=18&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'WhatMeal-App/1.0'
          }
        }
      );

      console.log(`Nominatim response status: ${response.status}`);

      if (response.ok) {
        const data = await response.json();
        console.log("Nominatim data:", JSON.stringify(data, null, 2));

        if (data.address) {
          const addr = data.address;
          // OpenStreetMap 한국 주소 구조 개선
          const city = addr.city || addr.county || addr.state || addr.province;
          const district = addr.city_district || addr.suburb || addr.borough || addr.town || addr.municipality;
          const dong = addr.neighbourhood || addr.quarter || addr.hamlet || addr.village || addr.residential;

          const addressText = `${city || ''} ${district || ''} ${dong || ''}`.trim();

          return NextResponse.json({
            address: addressText || data.display_name,
            city: city || '',
            district: district || '',
            dong: dong || '',
            full: data.display_name,
            source: "nominatim"
          });
        }
      } else {
        console.warn(`Nominatim API failed with status ${response.status}`);
      }
    } catch (nominatimError) {
      console.warn("Nominatim geocoding failed:", nominatimError);
    }

    // 로컬 데이터베이스에서 가장 가까운 도시 찾기
    const nearestCity = findNearestCity(parseFloat(lat), parseFloat(lng));

    if (nearestCity) {
      return NextResponse.json({
        address: `${nearestCity.city} ${nearestCity.district} ${nearestCity.dong || ''}`.trim(),
        city: nearestCity.city,
        district: nearestCity.district,
        dong: nearestCity.dong || '',
        full: `${nearestCity.city} ${nearestCity.district} ${nearestCity.dong || ''}`.trim(),
        source: "local_database"
      });
    }

    // 모든 방법 실패시 좌표만 반환
    return NextResponse.json({
      address: `위도 ${parseFloat(lat).toFixed(4)}, 경도 ${parseFloat(lng).toFixed(4)}`,
      city: "",
      district: "",
      dong: "",
      full: `좌표: ${lat}, ${lng}`,
      source: "coordinates"
    });

  } catch (error: any) {
    console.error("Geocoding API failed:", error);
    return NextResponse.json({
      error: "GEOCODING_FAILED",
      detail: error?.message || String(error)
    }, { status: 500 });
  }
}