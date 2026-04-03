import type { Metadata, Viewport } from 'next';
import './globals.css';
import ServiceWorkerRegistration from '@/components/ServiceWorkerRegistration';
import ThemeProvider from '@/components/ThemeProvider';

export const metadata: Metadata = {
  title: 'FitTrack',
  description: 'Suivi sportif et nutrition pour athlètes',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'FitTrack',
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: dark)', color: '#000000' },
    { media: '(prefers-color-scheme: light)', color: '#F2F2F7' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className="dark" suppressHydrationWarning>
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192.svg" />
        {/* Prevent flash: apply stored theme before React hydrates */}
        <script dangerouslySetInnerHTML={{ __html: `
          (function(){
            try {
              var t = localStorage.getItem('theme');
              var d = t ? t === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
              document.documentElement.classList.toggle('dark', d);
            } catch(e){}
          })();
        `}} />
      </head>
      <body>
        <ThemeProvider>
          <ServiceWorkerRegistration />
          <div className="relative z-10 min-h-screen">{children}</div>
        </ThemeProvider>
      </body>
    </html>
  );
}
