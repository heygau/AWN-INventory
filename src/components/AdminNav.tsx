'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { createClient } from '../../utils/supabase/client';

const NAVY = '#1B2B4B';
const GREEN = '#4A7C3F';
const RED = '#B91C1C';

type NavLink = {
  href: string;
  label: string;
  icon: string;
};

const LINKS: NavLink[] = [
  { href: '/admin/stock', label: 'Stock Management', icon: '📦' },
  { href: '/admin/dispatch', label: 'Dispatch Queue', icon: '🚚' },
  { href: '/admin/users', label: 'User Management', icon: '👥' },
  { href: '/admin/reports', label: 'Reports', icon: '📊' },
];

export default function AdminNav() {
  const supabase = createClient();
  const pathname = usePathname();
  const [hovered, setHovered] = useState<string | null>(null);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  return (
    <aside
      style={{
        position: 'fixed',
        left: 0,
        top: 0,
        bottom: 0,
        width: 220,
        backgroundColor: NAVY,
        color: '#FFFFFF',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        paddingTop: 20,
        paddingBottom: 20,
        boxSizing: 'border-box',
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
      }}
    >
      <div>
        <div
          style={{
            paddingLeft: 20,
            paddingRight: 20,
            marginBottom: 24,
          }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 10,
              backgroundColor: GREEN,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: 18,
            }}
          >
            AWN
          </div>
          <div
            style={{
              marginTop: 8,
              fontSize: 12,
              color: '#E5E7EB',
            }}
          >
            Admin Panel
          </div>
        </div>

        <nav>
          {LINKS.map((link) => {
            const isActive =
              pathname === link.href ||
              pathname.startsWith(`${link.href}/`);
            const isHovered = hovered === link.href;

            return (
              <Link
                key={link.href}
                href={link.href}
                onMouseEnter={() => setHovered(link.href)}
                onMouseLeave={() => setHovered((current) =>
                  current === link.href ? null : current,
                )}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '12px 20px',
                  textDecoration: 'none',
                  color: '#FFFFFF',
                  fontSize: 14,
                  backgroundColor: isActive
                    ? GREEN
                    : isHovered
                    ? 'rgba(255,255,255,0.1)'
                    : 'transparent',
                  cursor: 'pointer',
                  transition: 'background-color 0.15s ease',
                }}
              >
                <span
                  style={{
                    width: 20,
                    textAlign: 'center',
                  }}
                >
                  {link.icon}
                </span>
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      <div
        style={{
          paddingLeft: 20,
          paddingRight: 20,
        }}
      >
        <button
          type="button"
          onClick={handleSignOut}
          style={{
            width: '100%',
            padding: '10px 12px',
            borderRadius: 999,
            border: 'none',
            backgroundColor: RED,
            color: '#FFFFFF',
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Sign Out
        </button>
      </div>
    </aside>
  );
}

