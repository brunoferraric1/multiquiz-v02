import React from 'react';

export default function LandingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="bg-[#1a1f2e]">{children}</div>;
}
