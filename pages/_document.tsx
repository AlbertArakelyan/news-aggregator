import { Html, Head, Main, NextScript } from "next/document";

import { THEME_INIT_SCRIPT } from "@/lib/theme";

export default function Document() {
  return (
    <Html lang="en" suppressHydrationWarning>
      <Head>
        {/*
          Must run blocking, before first paint, or a dark-theme visitor gets a
          white flash while React boots. That rules out next/script — this has to
          be a plain inline <script> in <head>.
        */}
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </Head>
      <body className="antialiased bg-background text-text-color">
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
