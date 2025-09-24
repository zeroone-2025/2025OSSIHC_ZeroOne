import './globals.css'
import type { Metadata } from 'next'
import { BottomNav } from './_components/BottomNav'

export const metadata: Metadata = {
  title: '이유식',
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
      <body className="min-h-screen bg-brand-pale pb-20 font-sans antialiased">
        <div className="flex min-h-screen flex-col pb-16">
          <header className="sticky top-0 z-40 border-b border-brand-pale bg-white/95 py-4 backdrop-blur">
            <div className="mx-auto flex w-full max-w-screen-sm items-center justify-center px-4">
              <h1 className="text-2xl font-extrabold tracking-tight text-brand">이유식</h1>
            </div>
          </header>
          <main className="mx-auto flex-1 w-full max-w-screen-sm px-4 pb-20 pt-6">
            {children}
          </main>
        </div>
        <BottomNav />
      </body>
    </html>
  )
}
