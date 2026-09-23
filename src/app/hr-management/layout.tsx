//Layout.tsx is the main parent file

import type { Metadata } from "next";
import Script from "next/script";
import './globals.css';
import PageAuthentication from "./PageAuthentication";
import LayoutClientWrapper from "./layoutClientWrapper";
import HrmModuleAccessGuard from "@/components/auth/HrmModuleAccessGuard";

export const metadata: Metadata = {
  title: "Human Resource Management",
  description: "Powered by NextJS",
};

export default function RootLayout({children,}: Readonly<{children: React.ReactNode;}>) {
  return (
    <html lang="en">
      <head>
        <Script src="/runtime-config.js" strategy="beforeInteractive" />
      </head>
      <body className="Human-Resource-Management">

        <PageAuthentication>
          <HrmModuleAccessGuard>
            <LayoutClientWrapper>
              {children}
            </LayoutClientWrapper>
          </HrmModuleAccessGuard>
        </PageAuthentication>

      </body>
    </html>
  );
}
