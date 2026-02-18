'use client';

import { useMemo } from 'react';
import { createClient } from '../../../../utils/supabase/client';
import type { OrderSummary } from './page';

type Profile = {
  id: string;
  full_name: string | null;
};

type OrderHistoryProps = {
  profile: Profile;
  orders: OrderSummary[];
};

const NAVY = '#1B2B4B';
const GREEN = '#4A7C3F';
const GOLD = '#C9922A';
const RED = '#B91C1C';
const BLUE = '#2563EB';

export default function OrderHistory({ profile, orders }: OrderHistoryProps) {
  const supabase = createClient();

  const hasOrders = orders.length > 0;

  const totalSpent = useMemo(
    () => orders.reduce((sum, order) => sum + order.totalCost, 0),
    [orders],
  );

  const formatCurrency = (value: number) => `$${value.toFixed(2)}`;

  const formatDateTime = (value: string) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return value;
    }
    return date.toLocaleString();
  };

  const getStatusStyles = (status: string) => {
    const normalized = status.toLowerCase();

    if (normalized === 'pending') {
      return {
        label: 'Pending',
        backgroundColor: '#FEF3C7',
        color: GOLD,
      };
    }

    if (normalized === 'approved') {
      return {
        label: 'Approved',
        backgroundColor: '#DBEAFE',
        color: BLUE,
      };
    }

    if (normalized === 'dispatched') {
      return {
        label: 'Dispatched',
        backgroundColor: '#DCFCE7',
        color: GREEN,
      };
    }

    if (normalized === 'rejected') {
      return {
        label: 'Rejected',
        backgroundColor: '#FEE2E2',
        color: RED,
      };
    }

    return {
      label: status,
      backgroundColor: '#E5E7EB',
      color: '#374151',
    };
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#F4F6F9',
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
      }}
    >
      {/* Header */}
      <header
        style={{
          backgroundColor: NAVY,
          color: '#FFFFFF',
          padding: '12px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 8,
              backgroundColor: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: NAVY,
              fontWeight: 700,
              fontSize: 18,
            }}
          >
            AWN
          </div>
          <span
            style={{
              fontWeight: 600,
              fontSize: 18,
            }}
          >
            Asset Requests
          </span>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 16,
          }}
        >
          <span
            style={{
              fontSize: 14,
            }}
          >
            {profile.full_name ?? 'Employee'}
          </span>
          <button
            type="button"
            onClick={handleSignOut}
            style={{
              padding: '8px 14px',
              borderRadius: 999,
              border: '1px solid #FFFFFF',
              backgroundColor: 'transparent',
              color: '#FFFFFF',
              fontSize: 13,
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            Sign Out
          </button>
        </div>
      </header>

      {/* Content */}
      <main
        style={{
          flex: 1,
          padding: 24,
          boxSizing: 'border-box',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 16,
            gap: 12,
            flexWrap: 'wrap',
          }}
        >
          <h1
            style={{
              margin: 0,
              fontSize: 22,
              color: NAVY,
            }}
          >
            My Order History
          </h1>

          {hasOrders && (
            <div
              style={{
                fontSize: 13,
                color: '#4B5563',
              }}
            >
              Total spent:{' '}
              <span
                style={{
                  fontWeight: 600,
                  color: NAVY,
                }}
              >
                {formatCurrency(totalSpent)}
              </span>
            </div>
          )}
        </div>

        {!hasOrders && (
          <p
            style={{
              fontSize: 14,
              color: '#6B7280',
            }}
          >
            You haven&apos;t submitted any requests yet.
          </p>
        )}

        {hasOrders && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
            }}
          >
            {orders.map((order) => {
              const statusStyles = getStatusStyles(order.status);

              return (
                <div
                  key={order.id}
                  style={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: 12,
                    padding: 16,
                    boxShadow: '0 2px 10px rgba(0,0,0,0.04)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 10,
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: 12,
                      flexWrap: 'wrap',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 2,
                      }}
                    >
                      <span
                        style={{
                          fontSize: 14,
                          fontWeight: 600,
                          color: NAVY,
                        }}
                      >
                        Request placed
                      </span>
                      <span
                        style={{
                          fontSize: 12,
                          color: '#4B5563',
                        }}
                      >
                        {formatDateTime(order.createdAt)}
                      </span>
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                      }}
                    >
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          padding: '3px 10px',
                          borderRadius: 999,
                          fontSize: 12,
                          fontWeight: 600,
                          backgroundColor: statusStyles.backgroundColor,
                          color: statusStyles.color,
                        }}
                      >
                        {statusStyles.label}
                      </span>
                      <span
                        style={{
                          fontSize: 13,
                          fontWeight: 600,
                          color: NAVY,
                        }}
                      >
                        Total: {formatCurrency(order.totalCost)}
                      </span>
                    </div>
                  </div>

                  <div
                    style={{
                      borderTop: '1px solid #E5E7EB',
                      paddingTop: 8,
                    }}
                  >
                    <ul
                      style={{
                        listStyle: 'none',
                        margin: 0,
                        padding: 0,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 4,
                        fontSize: 13,
                        color: '#374151',
                      }}
                    >
                      {order.items.map((item) => (
                        <li
                          key={item.id}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                          }}
                        >
                          <span>
                            {item.name} · Qty {item.quantity}
                            {item.size ? ` · Size ${item.size}` : ''}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

