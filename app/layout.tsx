import React from 'react';

export const metadata = {
  title: 'OpenStock - Custom Terminal',
  description: 'High-performance real-time market tracker matrices.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="bg-black">
      <body className="antialiased min-h-screen selection:bg-zinc-800 selection:text-white">
        {children}
      </body>
    </html>
  );
}
