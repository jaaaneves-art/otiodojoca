export default function ComerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="bg-orange-50">
      {children}
    </div>
  );
}
