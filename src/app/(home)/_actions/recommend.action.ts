'use server';

import { recommendRestaurants } from '@/lib/recommend';
import { UserProfile } from '@/types/profile';

interface Location {
  lat: number;
  lng: number;
}

interface WeatherSnapshot {
  condition: string;
  temperature: number;
}

export async function getRecommendations(
  menu: string,
  userLocation: Location,
  profile: UserProfile,
  weather: WeatherSnapshot
) {
  try {
    const recommendations = await recommendRestaurants(
      menu,
      profile,
      weather,
      userLocation
    );

    return {
      success: true,
      data: recommendations
    };
  } catch (error) {
    console.error('Failed to get recommendations:', error);
    return {
      success: false,
      error: 'Failed to get restaurant recommendations'
    };
  }
}