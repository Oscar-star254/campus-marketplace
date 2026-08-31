import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";

export const metadata: Metadata = {
  title: "The Quad — campus marketplace",
  description: "Buy and sell on campus — new and secondhand, arranged safely.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <div className="app-shell">
          <Sidebar />
          <div className="main-col">
            <Topbar />
            <main>{children}</main>
          </div>
        </div>
      </body>
    </html>
  );
}
