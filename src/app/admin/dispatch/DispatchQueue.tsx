'use client';

import { useMemo, useState } from 'react';
import { createClient } from '../../../../utils/supabase/client';
import type { DispatchRequest } from './page';
import AdminNav from '../../../components/AdminNav';

const NAVY = '#1B2B4B';
const GREEN = '#4A7C3F';
const GOLD = '#C9922A';
const RED = '#B91C1C';

type DispatchQueueProps = {
  requests: DispatchRequest[];
};

export default function DispatchQueue({ requests }: DispatchQueueProps) {
  const [requestsState, setRequestsState] = useState<DispatchRequest[]>(requests);
  const [error, setError] = useState<string | null>(null);
  const [savingCostId, setSavingCostId] = useState<string | null>(null);
  const [dispatchingId, setDispatchingId] = useState<string | null>(null);

  const supabase = createClient();

  const count = useMemo(() => requestsState.length, [requestsState]);

  const formatCurrency = (value: number) => `$${value.toFixed(2)}`;

  const formatDateTime = (value: string) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return value;
    }
    return date.toLocaleString();
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  const handleChangeCost = (
    requestId: string,
    field: 'embroideryCost' | 'shippingCost',
    value: string,
  ) => {
    setRequestsState((prev) =>
      prev.map((request) => {
        if (request.id !== requestId) return request;

        const parsed = value.trim() === '' ? 0 : Number.parseFloat(value);
        return {
          ...request,
          [field]: Number.isNaN(parsed) ? request[field] : parsed,
        };
      }),
    );
  };

  const handleBlurCost = async (requestId: string) => {
    setError(null);
    setSavingCostId(requestId);

    try {
      const request = requestsState.find((row) => row.id === requestId);
      if (!request) {
        throw new Error('Request not found.');
      }

      const { error: costError } = await supabase.from('request_costs').upsert({
        request_id: requestId,
        embroidery_cost: request.embroideryCost,
        shipping_cost: request.shippingCost,
      });

      if (costError) {
        throw costError;
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : 'Failed to save costs. Please try again.';
      setError(message);
    } finally {
      setSavingCostId(null);
    }
  };

  const handleMarkDispatched = async (requestId: string) => {
    setError(null);
    setDispatchingId(requestId);

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        throw userError;
      }

      if (!user) {
        throw new Error('You must be signed in to dispatch orders.');
      }

      const { error: updateError } = await supabase
        .from('requests')
        .update({
          status: 'dispatched',
          dispatched_by: user.id,
          dispatched_at: new Date().toISOString(),
        })
        .eq('id', requestId);

      if (updateError) {
        throw updateError;
      }

      setRequestsState((prev) =>
        prev.filter((request) => request.id !== requestId),
      );
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : 'Failed to mark as dispatched. Please try again.';
      setError(message);
    } finally {
      setDispatchingId(null);
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        minHeight: '100vh',
      }}
    >
      <AdminNav />
      <div
        style={{
          marginLeft: 220,
          flex: 1,
        }}
      >
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
            </div>

            <div
              style={{
                flex: 1,
                display: 'flex',
                justifyContent: 'center',
              }}
            >
              <span
                style={{
                  fontWeight: 600,
                  fontSize: 18,
                }}
              >
                Admin — Dispatch Queue
              </span>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                minWidth: 120,
              }}
            >
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
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 16,
                gap: 8,
                flexWrap: 'wrap',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <h1
                  style={{
                    margin: 0,
                    fontSize: 22,
                    color: NAVY,
                  }}
                >
                  Approved Orders Ready to Dispatch
                </h1>
                <span
                  style={{
                    minWidth: 28,
                    padding: '4px 10px',
                    borderRadius: 999,
                    backgroundColor: GOLD,
                    color: '#1F2933',
                    fontSize: 13,
                    fontWeight: 600,
                    textAlign: 'center',
                  }}
                >
                  {count}
                </span>
              </div>
            </div>

            {error && (
              <p
                style={{
                  color: RED,
                  fontSize: 13,
                  margin: '0 0 12px 0',
                }}
              >
                {error}
              </p>
            )}

            {requestsState.length === 0 && (
              <div
                style={{
                  marginTop: 24,
                  textAlign: 'center',
                }}
              >
                <div
                  style={{
                    fontSize: 36,
                    marginBottom: 8,
                  }}
                >
                  ✅
                </div>
                <p
                  style={{
                    fontSize: 14,
                    color: '#4B5563',
                    margin: 0,
                  }}
                >
                  All orders dispatched — nothing pending! ✅
                </p>
              </div>
            )}

            {requestsState.length > 0 && (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 16,
                }}
              >
                {requestsState.map((request) => {
                  const totalCost =
                    request.itemsCost +
                    (request.embroideryCost ?? 0) +
                    (request.shippingCost ?? 0);

                  return (
                    <div
                      key={request.id}
                      style={{
                        backgroundColor: '#FFFFFF',
                        borderRadius: 12,
                        padding: 16,
                        boxShadow: '0 2px 10px rgba(0,0,0,0.04)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 12,
                      }}
                    >
                      {/* Header info */}
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'flex-start',
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
                              fontWeight: 600,
                              fontSize: 15,
                              color: NAVY,
                            }}
                          >
                            {request.employeeName}
                          </span>
                          {request.branch && (
                            <span
                              style={{
                                fontSize: 12,
                                color: '#4B5563',
                              }}
                            >
                              {request.branch}
                            </span>
                          )}
                          {request.costCentre && (
                            <span
                              style={{
                                fontSize: 12,
                                color: '#4B5563',
                              }}
                            >
                              Cost centre: {request.costCentre}
                            </span>
                          )}
                        </div>

                        <div
                          style={{
                            textAlign: 'right',
                            fontSize: 12,
                            color: '#6B7280',
                          }}
                        >
                          <div>Approved</div>
                          <div>{formatDateTime(request.approvedAt)}</div>
                        </div>
                      </div>

                      {/* Items */}
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
                          {request.items.map((item) => (
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

                      {/* Costs */}
                      <div
                        style={{
                          display: 'flex',
                          flexWrap: 'wrap',
                          gap: 12,
                          alignItems: 'flex-end',
                        }}
                      >
                        <div
                          style={{
                            fontSize: 13,
                            color: '#4B5563',
                          }}
                        >
                          Items cost:{' '}
                          <span
                            style={{
                              fontWeight: 600,
                              color: NAVY,
                            }}
                          >
                            {formatCurrency(request.itemsCost)}
                          </span>
                        </div>

                        <label
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 4,
                            fontSize: 12,
                            color: '#4B5563',
                          }}
                        >
                          Embroidery cost
                          <input
                            type="number"
                            step="0.01"
                            defaultValue={String(
                              request.embroideryCost ?? 0,
                            )}
                            onBlur={(event) => {
                              handleChangeCost(
                                request.id,
                                'embroideryCost',
                                event.target.value,
                              );
                              void handleBlurCost(request.id);
                            }}
                            style={{
                              padding: 6,
                              borderRadius: 8,
                              border: '1px solid #D1D5DB',
                              fontSize: 12,
                              outline: 'none',
                              minWidth: 120,
                            }}
                          />
                        </label>

                        <label
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 4,
                            fontSize: 12,
                            color: '#4B5563',
                          }}
                        >
                          Shipping cost
                          <input
                            type="number"
                            step="0.01"
                            defaultValue={String(
                              request.shippingCost ?? 0,
                            )}
                            onBlur={(event) => {
                              handleChangeCost(
                                request.id,
                                'shippingCost',
                                event.target.value,
                              );
                              void handleBlurCost(request.id);
                            }}
                            style={{
                              padding: 6,
                              borderRadius: 8,
                              border: '1px solid #D1D5DB',
                              fontSize: 12,
                              outline: 'none',
                              minWidth: 120,
                            }}
                          />
                        </label>

                        <div
                          style={{
                            marginLeft: 'auto',
                            fontSize: 14,
                            fontWeight: 600,
                            color: NAVY,
                          }}
                        >
                          Total:{' '}
                          <span>{formatCurrency(totalCost)}</span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'flex-end',
                          marginTop: 4,
                        }}
                      >
                        <button
                          type="button"
                          onClick={() =>
                            void handleMarkDispatched(request.id)
                          }
                          disabled={dispatchingId === request.id}
                          style={{
                            padding: '10px 18px',
                            borderRadius: 999,
                            border: 'none',
                            backgroundColor: GREEN,
                            color: '#FFFFFF',
                            fontSize: 14,
                            fontWeight: 600,
                            cursor:
                              dispatchingId === request.id
                                ? 'default'
                                : 'pointer',
                            opacity: dispatchingId === request.id ? 0.7 : 1,
                          }}
                        >
                          {dispatchingId === request.id
                            ? 'Dispatching...'
                            : 'Mark as Dispatched'}
                        </button>
                      </div>

                      {savingCostId === request.id && (
                        <div
                          style={{
                            fontSize: 12,
                            color: '#6B7280',
                          }}
                        >
                          Saving costs...
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

