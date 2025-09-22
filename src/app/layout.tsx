import './globals.css'
import type { Metadata } from 'next'

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
      <body className="font-sans antialiased">
        {children}
      </body>
    </html>
  )
}
