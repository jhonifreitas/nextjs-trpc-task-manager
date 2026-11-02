import type { Metadata } from "next";
import Link from "next/link";
import { ToastProvider } from "@/components/toast";
import { TRPCReactProvider } from "@/trpc/client";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Task Manager", template: "%s · Task Manager" },
  description: "A simple task manager built with Next.js and tRPC.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50 text-gray-900 antialiased">
        <TRPCReactProvider>
          <ToastProvider>
            <header className="border-b border-gray-200 bg-white">
              <nav className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3">
                <Link href="/" className="text-lg font-semibold">
                  Task Manager
                </Link>
                <Link
                  href="/tasks/new"
                  className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
                >
                  New task
                </Link>
              </nav>
            </header>
            <main className="mx-auto max-w-2xl px-4 py-8">{children}</main>
          </ToastProvider>
        </TRPCReactProvider>
      </body>
    </html>
  );
}
