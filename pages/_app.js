// Copyright © 2025 jaymarnz, https://github.com/jaymarnz
// See LICENSE for details

import '@/styles/globals.css';

import 'lightgallery/css/lightgallery.css';
import 'lightgallery/css/lg-transitions.css';
import 'lightgallery/css/lg-fullscreen.css';

import { Oswald } from 'next/font/google';

const appfont = Oswald({
  subsets: ['latin'],
  display: 'swap',
  weight: ['300', '500'],
  fallback: ['Helvetica', 'Arial', 'sans-serif'],
});

export default function App({ Component, pageProps }) {
  return (
    <main className={appfont.className}>
      <style jsx global>{`
        :root {
          --font-app: ${appfont.style.fontFamily};
        }
      `}</style>
      <Component {...pageProps} />
    </main>
  );
}