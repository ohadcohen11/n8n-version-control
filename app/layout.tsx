import type { Metadata } from "next";
import StyledComponentsRegistry from "../lib/registry";
import { GlobalStyles } from "./styles/GlobalStyles";

export const metadata: Metadata = {
  title: "n8n Git Dashboard",
  description: "Manage and sync your n8n workflows with GitHub",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <StyledComponentsRegistry>
          <GlobalStyles />
          {children}
        </StyledComponentsRegistry>
      </body>
    </html>
  );
}
