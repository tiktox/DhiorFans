import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="es">
      <Head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#000000" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover, user-scalable=no" />
        
        {/* CRÍTICO: Prevenir fullscreen en iOS */}
        <meta name="apple-touch-fullscreen" content="no" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="apple-mobile-web-app-title" content="Dhirofans" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}