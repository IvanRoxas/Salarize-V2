import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from 'react-hot-toast';

export const metadata: Metadata = {
  title: "Salarize V2",
  description: "Modern Employee Management System",
  icons: {
    icon: '/icon.svg?v=2',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen bg-slate-50 transition-colors duration-300">
        <Toaster position="top-right" toastOptions={{
          style: { borderRadius: '10px', fontWeight: 500, fontSize: '14px' },
          success: { style: { background: '#2ECC71', color: '#fff' } },
          error: { style: { background: '#ef4444', color: '#fff' } },
        }} />
        {children}
      </body>
    </html>
  );
}
