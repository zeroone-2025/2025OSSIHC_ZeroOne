import { NextRequest, NextResponse } from 'next/server';
import { rankDishes, deriveFlags, getAutumnFallback, type WeatherContext } from '@/lib/reco-core';

interface WeatherResponse {
  source: string;
  weather: WeatherContext;
  error?: string;
}

export async function POST(req: NextRequest) {
  try {
    const { lat, lng, topN = 5 } = await req.json();

    if (typeof lat !== 'number' || typeof lng !== 'number') {
      return NextResponse.json({ error: 'INVALID_COORDS' }, { status: 400 });
    }

    // Fetch weather data
    let weatherData: WeatherContext;
    let source = 'fallback';

    try {
      const base = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:8080';
      const weatherUrl = new URL('/api/weather/live', base);
      weatherUrl.searchParams.set('lat', String(lat));
      weatherUrl.searchParams.set('lng', String(lng));

      const weatherResponse = await fetch(weatherUrl.toString(), { cache: 'no-store' });

      if (weatherResponse.ok) {
        const weatherJson: WeatherResponse = await weatherResponse.json();
        weatherData = weatherJson.weather;
        source = weatherJson.source;
      } else {
        // Fallback if weather API fails
        weatherData = getAutumnFallback();
      }
    } catch {
      // Fallback if weather API is unreachable
      weatherData = getAutumnFallback();
    }

    // Generate flags and rank dishes
    const flags = deriveFlags(weatherData);
    const rankedDishes = rankDishes(weatherData, topN);

    // Format response - convert flags object to string array
    const flagsArray = Object.entries(flags)
      .filter(([_, value]) => value > 0.3)
      .map(([key, _]) => key);

    // Get menu names from ranked dishes
    const menus = rankedDishes.map(dish => dish.name_ko);

    return NextResponse.json({
      menus,
      flags: flagsArray,
      source
    });

  } catch (error: any) {
    // Ultimate fallback - always return something
    const fallbackWeather = getAutumnFallback();
    const flags = deriveFlags(fallbackWeather);
    const rankedDishes = rankDishes(fallbackWeather, 5);

    // Format fallback response
    const flagsArray = Object.entries(flags)
      .filter(([_, value]) => value > 0.3)
      .map(([key, _]) => key);

    const menus = rankedDishes.map(dish => dish.name_ko);

    return NextResponse.json({
      menus,
      flags: flagsArray,
      source: 'fallback',
      error: error?.message
    }, { status: 200 }); // Return 200 even on error since we have fallback data
  }
}
