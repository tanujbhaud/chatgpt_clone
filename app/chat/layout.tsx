export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="flex-1 flex">{children}</div>;
}
