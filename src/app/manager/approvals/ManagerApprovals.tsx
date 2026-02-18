'use client';

import { useEffect, useMemo, useState } from 'react';
import { createClient } from '../../../../utils/supabase/client';

type ManagerProfile = {
  id: string;
  full_name: string | null;
};

type EmployeeProfile = {
  id: string;
  full_name: string | null;
  branch: string | null;
  manager_id: string | null;
};

type RequestRow = {
  id: string;
  user_id: string;
  created_at: string;
  total_cost: number | null;
  status: string;
};

type RequestItemRow = {
  id: string;
  request_id: string;
  item_id: string;
  quantity: number;
  size: string | null;
};

type ItemRow = {
  id: string;
  name: string;
};

type ApprovalRequest = {
  id: string;
  employeeName: string;
  employeeBranch: string | null;
  createdAt: string;
  totalCost: number;
  items: {
    id: string;
    name: string;
    quantity: number;
    size: string | null;
  }[];
};

type ManagerApprovalsProps = {
  manager: ManagerProfile;
};

const NAVY = '#1B2B4B';
const GREEN = '#4A7C3F';
const RED = '#B91C1C';
const GOLD = '#C9922A';

export default function ManagerApprovals({ manager }: ManagerApprovalsProps) {
  const [requests, setRequests] = useState<ApprovalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const count = useMemo(() => requests.length, [requests]);

  useEffect(() => {
    void loadRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const formatCurrency = (value: number) => `$${value.toFixed(2)}`;

  const loadRequests = async () => {
    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();

      // 1. Employees that report to this manager
      const { data: employees, error: employeesError } =
        await supabase
          .from('profiles')
          .select('id, full_name, branch, manager_id')
          .eq('manager_id', manager.id);

      if (employeesError) {
        throw employeesError;
      }

      if (!employees || employees.length === 0) {
        setRequests([]);
        setLoading(false);
        return;
      }

      const employeeProfiles = employees as EmployeeProfile[];
      const employeeIds = employeeProfiles.map((profile) => profile.id);

      // 2. Pending requests for those employees
      const { data: requestsData, error: requestsError } =
        await supabase
          .from('requests')
          .select('id, user_id, created_at, total_cost, status')
          .eq('status', 'pending')
          .in('user_id', employeeIds);

      if (requestsError) {
        throw requestsError;
      }

      if (!requestsData || requestsData.length === 0) {
        setRequests([]);
        setLoading(false);
        return;
      }

      const requestRows = requestsData as RequestRow[];
      const requestIds = requestRows.map((request) => request.id);

      // 3. Items on those requests
      const { data: requestItemsData, error: requestItemsError } =
        await supabase
          .from('request_items')
          .select('id, request_id, item_id, quantity, size')
          .in('request_id', requestIds);

      if (requestItemsError) {
        throw requestItemsError;
      }

      const requestItemRows = (requestItemsData ??
        []) as RequestItemRow[];
      const itemIds = Array.from(
        new Set(requestItemRows.map((item) => item.item_id)),
      );

      // 4. Item names
      const { data: itemsData, error: itemsError } =
        await supabase
          .from('items')
          .select('id, name')
          .in('id', itemIds);

      if (itemsError) {
        throw itemsError;
      }

      const itemRows = (itemsData ?? []) as ItemRow[];
      const itemMap = new Map(itemRows.map((item) => [item.id, item.name]));
      const employeeMap = new Map(
        employeeProfiles.map((profile) => [profile.id, profile]),
      );

      const approvalRequests: ApprovalRequest[] = requestRows.map(
        (request) => {
          const employee = employeeMap.get(request.user_id);

          const itemsForRequest = requestItemRows
            .filter((requestItem) => requestItem.request_id === request.id)
            .map((requestItem) => ({
              id: requestItem.id,
              name: itemMap.get(requestItem.item_id) ?? 'Item',
              quantity: requestItem.quantity,
              size: requestItem.size,
            }));

          return {
            id: request.id,
            employeeName: employee?.full_name ?? 'Employee',
            employeeBranch: employee?.branch ?? null,
            createdAt: request.created_at,
            totalCost: request.total_cost ?? 0,
            items: itemsForRequest,
          };
        },
      );

      setRequests(approvalRequests);
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : 'Failed to load approvals. Please try again.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  const handleApprove = async (requestId: string) => {
    setActionLoadingId(requestId);
    setError(null);

    try {
      const supabase = createClient();
      const { error: updateError } = await supabase
        .from('requests')
        .update({
          status: 'approved',
          approved_by: manager.id,
        })
        .eq('id', requestId);

      if (updateError) {
        throw updateError;
      }

      await loadRequests();
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : 'Failed to approve request. Please try again.';
      setError(message);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleReject = async (requestId: string) => {
    const reason =
      window.prompt('Please enter a reason for rejecting this request:') ??
      '';

    if (!reason.trim()) {
      return;
    }

    setActionLoadingId(requestId);
    setError(null);

    try {
      const supabase = createClient();
      const { error: updateError } = await supabase
        .from('requests')
        .update({
          status: 'rejected',
        })
        .eq('id', requestId);

      if (updateError) {
        throw updateError;
      }

      await loadRequests();
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : 'Failed to reject request. Please try again.';
      setError(message);
    } finally {
      setActionLoadingId(null);
    }
  };

  const formatDateTime = (value: string) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return value;
    }
    return date.toLocaleString();
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
            Manager Approvals
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
            {manager.full_name ?? 'Manager'}
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
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 16,
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
              Pending Approvals
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

          {loading && (
            <span
              style={{
                fontSize: 13,
                color: '#6B7280',
              }}
            >
              Loading...
            </span>
          )}
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

        {(!loading && requests.length === 0) && (
          <p
            style={{
              fontSize: 14,
              color: '#6B7280',
              margin: 0,
            }}
          >
            No pending approvals — all caught up! ✅
          </p>
        )}

        {requests.length > 0 && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
            }}
          >
            {requests.map((request) => (
              <div
                key={request.id}
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
                    {request.employeeBranch && (
                      <span
                        style={{
                          fontSize: 12,
                          color: '#4B5563',
                        }}
                      >
                        {request.employeeBranch}
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
                    <div>Submitted</div>
                    <div>{formatDateTime(request.createdAt)}</div>
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

                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginTop: 8,
                  }}
                >
                  <span
                    style={{
                      fontWeight: 600,
                      fontSize: 14,
                      color: NAVY,
                    }}
                  >
                    Total: {formatCurrency(request.totalCost)}
                  </span>

                  <div
                    style={{
                      display: 'flex',
                      gap: 8,
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => handleReject(request.id)}
                      disabled={actionLoadingId === request.id}
                      style={{
                        padding: '8px 14px',
                        borderRadius: 999,
                        border: '1px solid #FCA5A5',
                        backgroundColor: '#FEE2E2',
                        color: RED,
                        fontSize: 13,
                        fontWeight: 600,
                        cursor:
                          actionLoadingId === request.id
                            ? 'default'
                            : 'pointer',
                        opacity: actionLoadingId === request.id ? 0.7 : 1,
                      }}
                    >
                      Reject
                    </button>

                    <button
                      type="button"
                      onClick={() => handleApprove(request.id)}
                      disabled={actionLoadingId === request.id}
                      style={{
                        padding: '8px 14px',
                        borderRadius: 999,
                        border: 'none',
                        backgroundColor: GREEN,
                        color: '#FFFFFF',
                        fontSize: 13,
                        fontWeight: 600,
                        cursor:
                          actionLoadingId === request.id
                            ? 'default'
                            : 'pointer',
                        opacity: actionLoadingId === request.id ? 0.7 : 1,
                      }}
                    >
                      Approve
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

