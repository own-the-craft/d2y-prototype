import "./globals.css";
import { Providers } from "./providers";

export const metadata = {
  title: "D2Y Portals",
  description: "Daily2you partner/admin/support portals",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="nl">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
