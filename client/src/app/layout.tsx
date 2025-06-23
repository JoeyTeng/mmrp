import "./globals.css";
import { Suspense } from "react";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v15-appRouter";
import Loading from "@/components/layout/Loading";

export const metadata = {
  title: "Multimedia Research Pipeline",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>
        <AppRouterCacheProvider options={{ enableCssLayer: true }}>
          <Suspense fallback={<Loading />}>{children}</Suspense>
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}
