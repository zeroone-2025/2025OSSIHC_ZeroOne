import './globals.css';
import type { Metadata } from 'next';
import { WeatherThemeProvider } from '@/theme/WeatherThemeContext';

export const metadata: Metadata = {
  title: '오늘 점심 추천',
  description: '현재 위치 날씨 기반 지금 뭐 먹지? 추천',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined" rel="stylesheet" />
      </head>
      <body className="min-h-screen font-sans antialiased">
        <WeatherThemeProvider>
          {children}
        </WeatherThemeProvider>
      </body>
    </html>
  );
}
