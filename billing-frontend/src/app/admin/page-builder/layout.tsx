export default function PageBuilderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Return children without any admin layout wrapper
  // This ensures the page builder has full screen access
  return <>{children}</>;
}
