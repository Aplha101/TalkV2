import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="en" className="dark">
      <Head>
        <meta charSet="utf-8" />
        <meta name="theme-color" content="#5865F2" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <body className="bg-background text-text font-sans antialiased">
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}