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

    // Format response
    const items = rankedDishes.map(dish => ({
      id: dish.id,
      name: dish.name_ko,
      name_en: dish.name_en,
      category: dish.category,
      score: Math.round(dish.score * 100) / 100, // Round to 2 decimal places
      tags: dish.tags,
      price_tier: dish.price_tier,
      average_price_krw: dish.average_price_krw
    }));

    return NextResponse.json({
      weather: weatherData,
      flags,
      items,
      source
    });

  } catch (error: any) {
    // Ultimate fallback - always return something
    const fallbackWeather = getAutumnFallback();
    const flags = deriveFlags(fallbackWeather);
    const rankedDishes = rankDishes(fallbackWeather, 5);

    const items = rankedDishes.map(dish => ({
      id: dish.id,
      name: dish.name_ko,
      name_en: dish.name_en,
      category: dish.category,
      score: Math.round(dish.score * 100) / 100,
      tags: dish.tags,
      price_tier: dish.price_tier,
      average_price_krw: dish.average_price_krw
    }));

    return NextResponse.json({
      weather: fallbackWeather,
      flags,
      items,
      source: 'fallback',
      error: error?.message
    }, { status: 200 }); // Return 200 even on error since we have fallback data
  }
}
