import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";

export const metadata: Metadata = {
  title: "Dance Recital Checklist (Free Printable PDF)",
  description: "Create a printable recital checklist for your studio."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {children}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-BLCBXFXKBF"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-BLCBXFXKBF');
          `}
        </Script>
      </body>
    </html>
  );
}
