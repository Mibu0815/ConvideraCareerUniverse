import type { Metadata } from "next";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { TargetRoleProvider } from "@/context";
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
            {children}
          </TargetRoleProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
