'use client';

import { useState, useEffect } from 'react';
import { ThumbsUp, ThumbsDown } from 'lucide-react';
import { getVisits } from '../../../lib/store';
import { Visit, Restaurant } from '../../../lib/types';

export default function HistoryPage() {
  const [visits, setVisits] = useState<Visit[]>([]);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const response = await fetch('/data/restaurants.json');
        const restaurantData: Restaurant[] = await response.json();
        setRestaurants(restaurantData);

        const visitData = getVisits();
        const sortedVisits = visitData.sort((a, b) => b.timestamp - a.timestamp).slice(0, 20);
        setVisits(sortedVisits);
      } catch (error) {
        console.error('Failed to load history:', error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const getRestaurantById = (id: string): Restaurant | undefined => {
    return restaurants.find(r => r.id === id);
  };

  const formatDate = (timestamp: number): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return '오늘';
    if (diffDays === 1) return '어제';
    if (diffDays < 7) return `${diffDays}일 전`;
    return date.toLocaleDateString('ko-KR');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">로딩</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-md mx-auto">
        <h1 className="text-2xl font-bold text-center mb-6">방문 기록</h1>

        {visits.length === 0 ? (
          <div className="text-center text-gray-500">
            <p>방문 기록이 없습니다.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {visits.map((visit, index) => {
              const restaurant = getRestaurantById(visit.restaurantId);
              if (!restaurant) return null;

              return (
                <div key={index} className="bg-white rounded-lg shadow p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="font-bold text-lg">{restaurant.name}</h3>
                      <p className="text-gray-600 text-sm">{restaurant.category}</p>
                      <p className="text-gray-500 text-xs">{formatDate(visit.timestamp)}</p>
                    </div>
                    <div className="ml-4">
                      {visit.liked ? (
                        <div className="flex items-center text-green-600">
                          <ThumbsUp size={20} />
                          <span className="ml-1 text-sm">좋아요</span>
                        </div>
                      ) : (
                        <div className="flex items-center text-red-600">
                          <ThumbsDown size={20} />
                          <span className="ml-1 text-sm">패스</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-2">
                    <div className="flex flex-wrap gap-1">
                      {restaurant.tags.slice(0, 3).map(tag => (
                        <span key={tag} className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-6 text-center">
          <a
            href="/"
            className="bg-blue-500 text-white py-2 px-6 rounded hover:bg-blue-600"
          >
            홈으로
          </a>
        </div>
      </div>
    </div>
  );
}