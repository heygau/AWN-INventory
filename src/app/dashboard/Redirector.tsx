'use client';

import { useEffect } from 'react';

type RedirectorProps = {
  to: string;
};

export default function Redirector({ to }: RedirectorProps) {
  useEffect(() => {
    if (!to) return;
    window.location.href = to;
  }, [to]);

  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F4F6F9',
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: '50%',
            border: '3px solid #1B2B4B',
            borderTopColor: 'transparent',
          }}
        />
        <p
          style={{
            margin: 0,
            color: '#1B2B4B',
            fontSize: 14,
          }}
        >
          Redirecting...
        </p>
      </div>
    </main>
  );
}

