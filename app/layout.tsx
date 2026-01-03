import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { TodoProvider } from "@/context/TodoContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "I do",
  description: "A simple and elegant task management app",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <TodoProvider>{children}</TodoProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
