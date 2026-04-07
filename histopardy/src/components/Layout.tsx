import React from 'react';

interface LayoutProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export default function Layout({ children, className = '', style }: LayoutProps) {
  return (
    <div
      style={{
        height: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        position: 'relative',
        ...style,
      }}
      className={className}
    >
      {children}
    </div>
  );
}
