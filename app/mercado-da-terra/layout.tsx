import MarketplaceNavbar from "@/components/mercado-da-terra/marketplace-navbar";

export default function MarketplaceLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <MarketplaceNavbar />
      {children}
    </>
  );
}