import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Corporate Bond Radar Terminal',
  description: 'AI Platform BigTech Corporate Bond Spreads & US 10Y Treasury Tracker',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Outfit:wght@500;600;700;800&display=swap" rel="stylesheet" />
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
      </head>
      <body style={{ margin: 0, padding: 0, backgroundColor: '#0b0f19', color: '#f1f5f9', fontFamily: "'Inter', sans-serif" }}>
        {children}
      </body>
    </html>
  );
}
