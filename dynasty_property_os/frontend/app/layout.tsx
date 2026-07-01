export const metadata = {
  title: 'Dynasty PropertyOS',
  description: 'Real estate digital twin platform'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
