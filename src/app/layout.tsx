import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { TargetRoleProvider, FocusSkillProvider } from "@/context";
import { FloatingFocusBar } from "@/components/FloatingFocusBar";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
  weight: ["400", "500", "600", "700"],
});

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
    <html lang="en" className={inter.variable}>
      <body className="antialiased font-body">
        <AuthProvider>
          <TargetRoleProvider>
            <FocusSkillProvider>
              {children}
              <FloatingFocusBar />
            </FocusSkillProvider>
          </TargetRoleProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
