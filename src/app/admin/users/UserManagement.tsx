'use client';

import { useMemo, useState } from 'react';
import { createClient } from '../../../../utils/supabase/client';
import type { Profile } from './page';
import AdminNav from '../../../components/AdminNav';

const NAVY = '#1B2B4B';
const GREEN = '#4A7C3F';
const GOLD = '#C9922A';
const RED = '#B91C1C';

type UserManagementProps = {
  profiles: Profile[];
};

type EditableProfile = Profile;

export default function UserManagement({ profiles }: UserManagementProps) {
  const supabase = createClient();

  const [search, setSearch] = useState('');
  const [rows, setRows] = useState<EditableProfile[]>(profiles);
  const [error, setError] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);

  const [showAddForm, setShowAddForm] = useState(false);
  const [newFullName, setNewFullName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newBranch, setNewBranch] = useState('');
  const [newCostCentre, setNewCostCentre] = useState('');
  const [newRole, setNewRole] = useState('employee');
  const [newManagerId, setNewManagerId] = useState<string>('');
  const [adding, setAdding] = useState(false);

  const managers = useMemo(
    () => rows.filter((profile) => profile.role === 'manager'),
    [rows],
  );

  const filteredRows = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return rows;
    return rows.filter((profile) => {
      const name = (profile.full_name ?? '').toLowerCase();
      const email = (profile.email ?? '').toLowerCase();
      return name.includes(query) || email.includes(query);
    });
  }, [rows, search]);

  const count = filteredRows.length;

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  const updateProfileField = async (
    id: string,
    changes: Partial<EditableProfile>,
  ) => {
    setError(null);
    setSavingId(id);

    try {
      const { error: updateError } = await supabase
        .from('profiles')
        .update(changes)
        .eq('id', id);

      if (updateError) {
        throw updateError;
      }

      setRows((prev) =>
        prev.map((profile) =>
          profile.id === id ? { ...profile, ...changes } : profile,
        ),
      );
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : 'Failed to save changes. Please try again.';
      setError(message);
    } finally {
      setSavingId(null);
    }
  };

  const handleRoleChange = (id: string, role: string) => {
    void updateProfileField(id, { role });
  };

  const handleManagerChange = (id: string, managerId: string) => {
    void updateProfileField(id, {
      manager_id: managerId || null,
    });
  };

  const handleBlurTextField = (
    id: string,
    field: 'branch' | 'cost_centre',
    value: string,
  ) => {
    void updateProfileField(id, {
      [field]: value.trim() || null,
    } as Partial<EditableProfile>);
  };

  const handleAddStaff = async () => {
    setError(null);

    if (!newFullName.trim() || !newEmail.trim()) {
      setError('Full name and email are required.');
      return;
    }

    setAdding(true);

    try {
      const { data, error: insertError } = await supabase
        .from('profiles')
        .insert({
          full_name: newFullName.trim(),
          email: newEmail.trim(),
          branch: newBranch.trim() || null,
          cost_centre: newCostCentre.trim() || null,
          role: newRole,
          manager_id: newManagerId || null,
        })
        .select(
          'id, full_name, email, branch, cost_centre, role, manager_id',
        )
        .single();

      if (insertError || !data) {
        throw insertError ?? new Error('Failed to add staff member.');
      }

      setRows((prev) => [...prev, data as EditableProfile]);

      setNewFullName('');
      setNewEmail('');
      setNewBranch('');
      setNewCostCentre('');
      setNewRole('employee');
      setNewManagerId('');
      setShowAddForm(false);
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : 'Failed to add staff member. Please try again.';
      setError(message);
    } finally {
      setAdding(false);
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
              <span
                style={{
                  fontWeight: 600,
                  fontSize: 18,
                }}
              >
                Admin — User Management
              </span>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 16,
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
                flexWrap: 'wrap',
                gap: 12,
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 16,
              }}
            >
              {/* Search */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  flex: '1 1 260px',
                }}
              >
                <input
                  type="text"
                  placeholder="Search by name or email..."
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  style={{
                    width: '100%',
                    padding: 10,
                    borderRadius: 999,
                    border: '1px solid #D1D5DB',
                    fontSize: 14,
                    outline: 'none',
                  }}
                />
              </div>

              {/* Add button + count */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                }}
              >
                <span
                  style={{
                    padding: '4px 10px',
                    borderRadius: 999,
                    backgroundColor: GOLD,
                    color: '#1F2933',
                    fontSize: 13,
                    fontWeight: 600,
                  }}
                >
                  {count} staff
                </span>
                <button
                  type="button"
                  onClick={() => setShowAddForm((value) => !value)}
                  style={{
                    padding: '10px 16px',
                    borderRadius: 999,
                    border: 'none',
                    backgroundColor: GREEN,
                    color: '#FFFFFF',
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {showAddForm ? 'Cancel' : 'Add New Staff'}
                </button>
              </div>
            </div>

            {showAddForm && (
              <section
                style={{
                  marginBottom: 16,
                  backgroundColor: '#FFFFFF',
                  borderRadius: 12,
                  padding: 16,
                  boxShadow: '0 2px 10px rgba(0,0,0,0.04)',
                }}
              >
                <h2
                  style={{
                    margin: '0 0 12px 0',
                    fontSize: 16,
                    fontWeight: 600,
                    color: NAVY,
                  }}
                >
                  New Staff Member
                </h2>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns:
                      'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: 12,
                    marginBottom: 12,
                  }}
                >
                  <label
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 4,
                      fontSize: 13,
                      color: '#4B5563',
                    }}
                  >
                    Full name
                    <input
                      value={newFullName}
                      onChange={(event) =>
                        setNewFullName(event.target.value)
                      }
                      style={{
                        padding: 8,
                        borderRadius: 8,
                        border: '1px solid #D1D5DB',
                        fontSize: 13,
                        outline: 'none',
                      }}
                    />
                  </label>

                  <label
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 4,
                      fontSize: 13,
                      color: '#4B5563',
                    }}
                  >
                    Email
                    <input
                      value={newEmail}
                      onChange={(event) =>
                        setNewEmail(event.target.value)
                      }
                      style={{
                        padding: 8,
                        borderRadius: 8,
                        border: '1px solid #D1D5DB',
                        fontSize: 13,
                        outline: 'none',
                      }}
                    />
                  </label>

                  <label
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 4,
                      fontSize: 13,
                      color: '#4B5563',
                    }}
                  >
                    Branch
                    <input
                      value={newBranch}
                      onChange={(event) =>
                        setNewBranch(event.target.value)
                      }
                      style={{
                        padding: 8,
                        borderRadius: 8,
                        border: '1px solid #D1D5DB',
                        fontSize: 13,
                        outline: 'none',
                      }}
                    />
                  </label>

                  <label
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 4,
                      fontSize: 13,
                      color: '#4B5563',
                    }}
                  >
                    Cost centre
                    <input
                      value={newCostCentre}
                      onChange={(event) =>
                        setNewCostCentre(event.target.value)
                      }
                      style={{
                        padding: 8,
                        borderRadius: 8,
                        border: '1px solid #D1D5DB',
                        fontSize: 13,
                        outline: 'none',
                      }}
                    />
                  </label>

                  <label
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 4,
                      fontSize: 13,
                      color: '#4B5563',
                    }}
                  >
                    Role
                    <select
                      value={newRole}
                      onChange={(event) =>
                        setNewRole(event.target.value)
                      }
                      style={{
                        padding: 8,
                        borderRadius: 8,
                        border: '1px solid #D1D5DB',
                        fontSize: 13,
                        outline: 'none',
                        backgroundColor: '#FFFFFF',
                      }}
                    >
                      <option value="employee">Employee</option>
                      <option value="manager">Manager</option>
                      <option value="admin">Admin</option>
                    </select>
                  </label>

                  <label
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 4,
                      fontSize: 13,
                      color: '#4B5563',
                    }}
                  >
                    Manager
                    <select
                      value={newManagerId}
                      onChange={(event) =>
                        setNewManagerId(event.target.value)
                      }
                      style={{
                        padding: 8,
                        borderRadius: 8,
                        border: '1px solid #D1D5DB',
                        fontSize: 13,
                        outline: 'none',
                        backgroundColor: '#FFFFFF',
                      }}
                    >
                      <option value="">No Manager</option>
                      {managers.map((manager) => (
                        <option key={manager.id} value={manager.id}>
                          {manager.full_name ??
                            manager.email ??
                            'Manager'}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                {error && (
                  <p
                    style={{
                      margin: '0 0 8px 0',
                      color: RED,
                      fontSize: 12,
                    }}
                  >
                    {error}
                  </p>
                )}

                <button
                  type="button"
                  onClick={handleAddStaff}
                  disabled={adding}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 999,
                    border: 'none',
                    backgroundColor: NAVY,
                    color: '#FFFFFF',
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: adding ? 'default' : 'pointer',
                    opacity: adding ? 0.7 : 1,
                  }}
                >
                  {adding ? 'Saving...' : 'Save Staff Member'}
                </button>
              </section>
            )}

            {error && !showAddForm && (
              <p
                style={{
                  margin: '0 0 8px 0',
                  color: RED,
                  fontSize: 12,
                }}
              >
                {error}
              </p>
            )}

            {/* Table */}
            <div
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: 12,
                padding: 16,
                boxShadow: '0 2px 10px rgba(0,0,0,0.04)',
                overflowX: 'auto',
              }}
            >
              <table
                style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  fontSize: 13,
                }}
              >
                <thead>
                  <tr
                    style={{
                      textAlign: 'left',
                      color: '#4B5563',
                      borderBottom: '1px solid #E5E7EB',
                    }}
                  >
                    <th style={{ padding: '8px 6px' }}>Name</th>
                    <th style={{ padding: '8px 6px' }}>Email</th>
                    <th style={{ padding: '8px 6px' }}>Branch</th>
                    <th style={{ padding: '8px 6px' }}>Cost Centre</th>
                    <th style={{ padding: '8px 6px' }}>Role</th>
                    <th style={{ padding: '8px 6px' }}>Manager</th>
                    <th style={{ padding: '8px 6px' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRows.map((profile) => {
                    const manager =
                      profile.manager_id &&
                      rows.find(
                        (user) => user.id === profile.manager_id,
                      );

                    return (
                      <tr
                        key={profile.id}
                        style={{
                          borderBottom: '1px solid #F3F4F6',
                        }}
                      >
                        <td style={{ padding: '8px 6px' }}>
                          <span
                            style={{
                              fontWeight: 500,
                              color: '#111827',
                            }}
                          >
                            {profile.full_name ?? '—'}
                          </span>
                        </td>
                        <td
                          style={{
                            padding: '8px 6px',
                            color: '#4B5563',
                          }}
                        >
                          {profile.email ?? '—'}
                        </td>
                        <td style={{ padding: '8px 6px' }}>
                          <input
                            defaultValue={profile.branch ?? ''}
                            onBlur={(event) =>
                              handleBlurTextField(
                                profile.id,
                                'branch',
                                event.target.value,
                              )
                            }
                            style={{
                              padding: 6,
                              borderRadius: 8,
                              border: '1px solid #D1D5DB',
                              fontSize: 12,
                              outline: 'none',
                              width: '100%',
                            }}
                          />
                        </td>
                        <td style={{ padding: '8px 6px' }}>
                          <input
                            defaultValue={profile.cost_centre ?? ''}
                            onBlur={(event) =>
                              handleBlurTextField(
                                profile.id,
                                'cost_centre',
                                event.target.value,
                              )
                            }
                            style={{
                              padding: 6,
                              borderRadius: 8,
                              border: '1px solid #D1D5DB',
                              fontSize: 12,
                              outline: 'none',
                              width: '100%',
                            }}
                          />
                        </td>
                        <td style={{ padding: '8px 6px' }}>
                          <select
                            value={profile.role ?? 'employee'}
                            onChange={(event) =>
                              handleRoleChange(
                                profile.id,
                                event.target.value,
                              )
                            }
                            style={{
                              padding: 6,
                              borderRadius: 8,
                              border: '1px solid #D1D5DB',
                              fontSize: 12,
                              outline: 'none',
                              backgroundColor: '#FFFFFF',
                            }}
                          >
                            <option value="employee">Employee</option>
                            <option value="manager">Manager</option>
                            <option value="admin">Admin</option>
                          </select>
                        </td>
                        <td style={{ padding: '8px 6px' }}>
                          <select
                            value={profile.manager_id ?? ''}
                            onChange={(event) =>
                              handleManagerChange(
                                profile.id,
                                event.target.value,
                              )
                            }
                            style={{
                              padding: 6,
                              borderRadius: 8,
                              border: '1px solid #D1D5DB',
                              fontSize: 12,
                              outline: 'none',
                              backgroundColor: '#FFFFFF',
                              minWidth: 140,
                            }}
                          >
                            <option value="">
                              {manager ? 'No Manager' : 'No Manager'}
                            </option>
                            {managers.map((managerOption) => (
                              <option
                                key={managerOption.id}
                                value={managerOption.id}
                              >
                                {managerOption.full_name ??
                                  managerOption.email ??
                                  'Manager'}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td
                          style={{
                            padding: '8px 6px',
                            fontSize: 12,
                            color:
                              savingId === profile.id
                                ? '#6B7280'
                                : '#9CA3AF',
                          }}
                        >
                          {savingId === profile.id ? 'Saving…' : '—'}
                        </td>
                      </tr>
                    );
                  })}

                  {filteredRows.length === 0 && (
                    <tr>
                      <td
                        colSpan={7}
                        style={{
                          padding: 16,
                          textAlign: 'center',
                          fontSize: 13,
                          color: '#6B7280',
                        }}
                      >
                        No staff found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

