import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Avinyaa Platform",
  description: "Multi-tenant transport & installs booking platform",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
