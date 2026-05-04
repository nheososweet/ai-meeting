import type { Metadata } from "next";
import localFont from "next/font/local";
import Script from "next/script";
import { Providers } from "./providers";
import "@cyntler/react-doc-viewer/dist/index.css";
import "./globals.css";


// const themeInitScript = `
// (() => {
//   try {
//     const savedTheme = localStorage.getItem("theme");
//     const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
//     const shouldUseDark = savedTheme ? savedTheme === "dark" : prefersDark;

//     document.documentElement.classList.toggle("dark", shouldUseDark);
//   } catch {
//     // Ignore theme init errors to avoid blocking page render.
//   }
// })();
// `;

const themeInitScript = `
(() => {
  try {
    document.documentElement.classList.remove("dark");
  } catch {
    // Ignore theme init errors to avoid blocking page render.
  }
})();
`;

const openSans = localFont({
  src: [
    {
      path: "../public/fonts/open-sans/OpenSans-Light.ttf",
      weight: "300",
      style: "normal",
    },
    {
      path: "../public/fonts/open-sans/OpenSans-Regular.ttf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../public/fonts/open-sans/OpenSans-Medium.ttf",
      weight: "500",
      style: "normal",
    },
    {
      path: "../public/fonts/open-sans/OpenSans-SemiBold.ttf",
      weight: "600",
      style: "normal",
    },
    {
      path: "../public/fonts/open-sans/OpenSans-Bold.ttf",
      weight: "700",
      style: "normal",
    },
    {
      path: "../public/fonts/open-sans/OpenSans-ExtraBold.ttf",
      weight: "800",
      style: "normal",
    },
  ],
  variable: "--font-open-sans",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  ),
  applicationName: "Hệ thống báo cáo biên bản cuộc họp",
  title: {
    default: "Hệ thống báo cáo biên bản cuộc họp",
    template: "%s | Hệ thống báo cáo biên bản cuộc họp",
  },
  description:
    "Nền tảng phiên dịch âm thanh thông minh hỗ trợ dịch băng, quản lý biên bản và theo dõi lịch sử cuộc họp.",
  keywords: [
    "hệ thống phiên dịch âm thanh thông minh",
    "phiên dịch âm thanh",
    "dịch băng cuộc họp",
    "quản lý biên bản",
    "transcript",
  ],
  openGraph: {
    title: "Hệ thống báo cáo biên bản cuộc họp",
    description:
      "Nền tảng phiên dịch âm thanh thông minh hỗ trợ dịch băng, quản lý biên bản và theo dõi lịch sử cuộc họp.",
    locale: "vi_VN",
    type: "website",
    siteName: "Hệ thống báo cáo biên bản cuộc họp",
  },
  twitter: {
    card: "summary_large_image",
    title: "Hệ thống báo cáo biên bản cuộc họp",
    description:
      "Nền tảng phiên dịch âm thanh thông minh hỗ trợ dịch băng, quản lý biên bản và theo dõi lịch sử cuộc họp.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      suppressHydrationWarning
      lang="vi"
      className={`${openSans.variable} h-full antialiased`}
    >
      <head>
        <Script id="theme-init" strategy="beforeInteractive">{themeInitScript}</Script>
      </head>
      <body className="min-h-full flex flex-col">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
