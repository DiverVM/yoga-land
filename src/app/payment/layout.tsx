import type { ReactNode } from "react";
import { SiteHeader } from "@/components/site-header";

export default function PaymentLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <SiteHeader showMenu={false} />
      {children}
    </>
  );
}
