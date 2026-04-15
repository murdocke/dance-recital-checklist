import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Recital Checklist Generator",
  description: "Create a printable recital checklist for your studio."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
