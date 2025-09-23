import './globals.css'
import type { Metadata } from 'next'
import { BottomNav } from './_components/BottomNav'

export const metadata: Metadata = {
  title: '점심 추천',
  description: '날씨와 취향을 고려한 맞춤 점심 메뉴 추천',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      </head>
      <body className="min-h-screen bg-neutral-50 pb-20 font-sans antialiased">
        <div className="min-h-screen pb-16">
          {children}
        </div>
        <BottomNav />
      </body>
    </html>
  )
}
