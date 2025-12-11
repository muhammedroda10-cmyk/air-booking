import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Voyager - Air Ticket Booking",
  description: "Book your flights easily with Voyager",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
