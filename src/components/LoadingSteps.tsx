'use client';

import { useState, useEffect } from 'react';

interface LoadingStepsProps {
  onDone: () => void;
  stepDuration?: number;
}

export default function LoadingSteps({ onDone, stepDuration = 500 }: LoadingStepsProps) {
  const steps = [
    '최신 기상 데이터를 불러오는 중입니다…',
    '온도·습도·풍속·강수량을 분석 중…',
    '하늘상태/강수형태로 가중치를 보정하는 중…',
    '후보 메뉴를 스코어링하는 중…',
    '상위 3개 메뉴를 정렬하는 중…',
    '거의 완료! 결과를 정리하고 있어요…'
  ];

  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    if (currentStep < steps.length) {
      const timer = setTimeout(() => {
        setCurrentStep(prev => prev + 1);
      }, stepDuration);

      return () => clearTimeout(timer);
    } else {
      // All steps completed, wait a bit then call onDone
      const finalTimer = setTimeout(() => {
        onDone();
      }, stepDuration);

      return () => clearTimeout(finalTimer);
    }
  }, [currentStep, steps.length, stepDuration, onDone]);

  const progress = (currentStep / steps.length) * 100;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
      <div className="max-w-md w-full px-6">
        <div className="space-y-3 mb-8">
          {steps.map((step, index) => (
            <div
              key={index}
              className={`flex items-center gap-3 text-lg font-medium transition-opacity duration-300 ${
                index <= currentStep ? 'text-white' : 'text-white/50'
              }`}
            >
              <div className="w-6 h-6 flex items-center justify-center flex-shrink-0">
                {index < currentStep ? (
                  <span className="text-green-500 text-xl animate-bounce">✅</span>
                ) : index === currentStep ? (
                  <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <span className="text-gray-500">⏳</span>
                )}
              </div>
              <span className="flex-1">{step}</span>
            </div>
          ))}
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-700 rounded-full h-2">
          <div
            className="bg-blue-500 h-2 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
}