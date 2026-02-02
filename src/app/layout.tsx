import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Career Universe | Convidera",
  description: "Interactive career development platform with gap analysis",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
