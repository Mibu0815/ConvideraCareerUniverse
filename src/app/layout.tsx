import type { Metadata } from "next";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { TargetRoleProvider, FocusSkillProvider } from "@/context";
import { FloatingFocusBar } from "@/components/FloatingFocusBar";
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
      <body className="antialiased">
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
