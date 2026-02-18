'use client';

import { useMemo, useState } from 'react';
import { createClient } from '../../../../utils/supabase/client';
import AdminNav from '../../../components/AdminNav';

type Item = {
  id: string;
  name: string;
  category: string | null;
  size: string | null;
  supplier: string | null;
  stock_balance: number | null;
  unit_cost: number | null;
  low_stock_threshold: number | null;
};

type StockDashboardProps = {
  items: Item[];
};

const NAVY = '#1B2B4B';
const GREEN = '#4A7C3F';
const RED = '#B91C1C';
const BLUE = '#2563EB';

const CATEGORIES = ['All', 'Uniform', 'Laptop', 'Phone', 'Accessory'];

export default function StockDashboard({ items }: StockDashboardProps) {
  const [itemsState, setItemsState] = useState<Item[]>(items);
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState<string>('Uniform');
  const [newSize, setNewSize] = useState('');
  const [newSupplier, setNewSupplier] = useState('');
  const [newUnitCost, setNewUnitCost] = useState('');
  const [newLowStockThreshold, setNewLowStockThreshold] = useState('');

  const [receiveRowId, setReceiveRowId] = useState<string | null>(null);
  const [receiveQty, setReceiveQty] = useState('');
  const [receiveDate, setReceiveDate] = useState('');
  const [receiveError, setReceiveError] = useState<string | null>(null);

  const supabase = createClient();

  const refreshItems = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: fetchError } = await supabase
        .from('items')
        .select(
          'id, name, category, size, supplier, stock_balance, unit_cost, low_stock_threshold',
        );

      if (fetchError) {
        throw fetchError;
      }

      setItemsState((data ?? []) as Item[]);
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : 'Failed to refresh items. Please try again.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  const totalStockValue = useMemo(
    () =>
      itemsState.reduce(
        (sum, item) =>
          sum +
          (item.stock_balance ?? 0) * (item.unit_cost ?? 0),
        0,
      ),
    [itemsState],
  );

  const lowStockCount = useMemo(
    () =>
      itemsState.filter(
        (item) =>
          item.stock_balance !== null &&
          item.low_stock_threshold !== null &&
          item.stock_balance <= item.low_stock_threshold,
      ).length,
    [itemsState],
  );

  const totalItems = itemsState.length;

  const filteredItems = useMemo(() => {
    if (activeCategory === 'All') {
      return itemsState;
    }
    const categoryLower = activeCategory.toLowerCase();
    return itemsState.filter(
      (item) =>
        (item.category ?? '').toLowerCase() === categoryLower,
    );
  }, [activeCategory, itemsState]);

  const formatCurrency = (value: number) => `$${value.toFixed(2)}`;

  const handleSaveNewItem = async () => {
    setError(null);

    if (!newName.trim()) {
      setError('Item name is required.');
      return;
    }

    setLoading(true);

    try {
      const unitCost =
        newUnitCost.trim() === ''
          ? null
          : Number.parseFloat(newUnitCost);
      const lowThreshold =
        newLowStockThreshold.trim() === ''
          ? null
          : Number.parseInt(newLowStockThreshold, 10);

      const { error: insertError } = await supabase
        .from('items')
        .insert({
          name: newName.trim(),
          category: newCategory,
          size: newSize.trim() || null,
          supplier: newSupplier.trim() || null,
          unit_cost: Number.isNaN(unitCost) ? null : unitCost,
          low_stock_threshold: Number.isNaN(lowThreshold)
            ? null
            : lowThreshold,
          stock_balance: 0,
        });

      if (insertError) {
        throw insertError;
      }

      setNewName('');
      setNewCategory('Uniform');
      setNewSize('');
      setNewSupplier('');
      setNewUnitCost('');
      setNewLowStockThreshold('');
      setShowAddForm(false);

      await refreshItems();
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : 'Failed to add item. Please try again.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const openReceiveForm = (itemId: string) => {
    setReceiveRowId((current) =>
      current === itemId ? null : itemId,
    );
    setReceiveQty('');
    setReceiveDate('');
    setReceiveError(null);
  };

  const handleSaveReceiveStock = async (item: Item) => {
    setReceiveError(null);

    const qty = Number.parseInt(receiveQty, 10);

    if (Number.isNaN(qty) || qty <= 0) {
      setReceiveError('Quantity received must be a positive number.');
      return;
    }

    if (!receiveDate) {
      setReceiveError('Received date is required.');
      return;
    }

    setLoading(true);

    try {
      const { error: insertError } = await supabase
        .from('stock_received')
        .insert({
          item_id: item.id,
          qty_received: qty,
          received_date: receiveDate,
        });

      if (insertError) {
        throw insertError;
      }

      const newBalance = (item.stock_balance ?? 0) + qty;

      const { error: updateError } = await supabase
        .from('items')
        .update({
          stock_balance: newBalance,
        })
        .eq('id', item.id);

      if (updateError) {
        throw updateError;
      }

      setReceiveRowId(null);
      setReceiveQty('');
      setReceiveDate('');

      await refreshItems();
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : 'Failed to receive stock. Please try again.';
      setReceiveError(message);
    } finally {
      setLoading(false);
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
                Admin — Stock Management
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
            {/* Summary + Add button */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                gap: 16,
                marginBottom: 20,
                flexWrap: 'wrap',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  flex: 1,
                  gap: 16,
                  flexWrap: 'wrap',
                }}
              >
                {/* Total Stock Value */}
                <div
                  style={{
                    flex: '1 1 200px',
                    backgroundColor: '#FFFFFF',
                    borderRadius: 12,
                    padding: 16,
                    boxShadow: '0 2px 10px rgba(0,0,0,0.04)',
                  }}
                >
                  <div
                    style={{
                      fontSize: 13,
                      color: '#6B7280',
                      marginBottom: 4,
                    }}
                  >
                    Total Stock Value
                  </div>
                  <div
                    style={{
                      fontSize: 20,
                      fontWeight: 700,
                      color: NAVY,
                    }}
                  >
                    {formatCurrency(totalStockValue)}
                  </div>
                </div>

                {/* Low Stock Items */}
                <div
                  style={{
                    flex: '1 1 200px',
                    backgroundColor: '#FFFFFF',
                    borderRadius: 12,
                    padding: 16,
                    boxShadow: '0 2px 10px rgba(0,0,0,0.04)',
                    border: `1px solid ${RED}`,
                  }}
                >
                  <div
                    style={{
                      fontSize: 13,
                      color: '#6B7280',
                      marginBottom: 4,
                    }}
                  >
                    Low Stock Items
                  </div>
                  <div
                    style={{
                      fontSize: 20,
                      fontWeight: 700,
                      color: RED,
                    }}
                  >
                    {lowStockCount}
                  </div>
                </div>

                {/* Total Items */}
                <div
                  style={{
                    flex: '1 1 200px',
                    backgroundColor: '#FFFFFF',
                    borderRadius: 12,
                    padding: 16,
                    boxShadow: '0 2px 10px rgba(0,0,0,0.04)',
                  }}
                >
                  <div
                    style={{
                      fontSize: 13,
                      color: '#6B7280',
                      marginBottom: 4,
                    }}
                  >
                    Total Items
                  </div>
                  <div
                    style={{
                      fontSize: 20,
                      fontWeight: 700,
                      color: NAVY,
                    }}
                  >
                    {totalItems}
                  </div>
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-end',
                  gap: 8,
                }}
              >
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
                  {showAddForm ? 'Cancel' : 'Add New Item'}
                </button>
              </div>
            </div>

            {showAddForm && (
              <section
                style={{
                  marginBottom: 20,
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
                  New Item
                </h2>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns:
                      'repeat(auto-fit, minmax(180px, 1fr))',
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
                    Name
                    <input
                      value={newName}
                      onChange={(event) => setNewName(event.target.value)}
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
                    Category
                    <select
                      value={newCategory}
                      onChange={(event) =>
                        setNewCategory(event.target.value)
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
                      {CATEGORIES.filter(
                        (category) => category !== 'All',
                      ).map((category) => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
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
                    Size
                    <input
                      value={newSize}
                      onChange={(event) => setNewSize(event.target.value)}
                      placeholder="Optional"
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
                    Supplier
                    <input
                      value={newSupplier}
                      onChange={(event) => setNewSupplier(event.target.value)}
                      placeholder="Optional"
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
                    Unit Cost
                    <input
                      type="number"
                      step="0.01"
                      value={newUnitCost}
                      onChange={(event) =>
                        setNewUnitCost(event.target.value)
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
                    Low Stock Threshold
                    <input
                      type="number"
                      value={newLowStockThreshold}
                      onChange={(event) =>
                        setNewLowStockThreshold(event.target.value)
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
                  onClick={handleSaveNewItem}
                  disabled={loading}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 999,
                    border: 'none',
                    backgroundColor: NAVY,
                    color: '#FFFFFF',
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: loading ? 'default' : 'pointer',
                    opacity: loading ? 0.7 : 1,
                  }}
                >
                  {loading ? 'Saving...' : 'Save Item'}
                </button>
              </section>
            )}

            {/* Filters */}
            <div
              style={{
                display: 'flex',
                gap: 8,
                marginBottom: 12,
                flexWrap: 'wrap',
              }}
            >
              {CATEGORIES.map((category) => {
                const isActive = category === activeCategory;
                return (
                  <button
                    key={category}
                    type="button"
                    onClick={() => setActiveCategory(category)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: 999,
                      border: isActive
                        ? `1px solid ${NAVY}`
                        : '1px solid #D1D5DB',
                      backgroundColor: isActive ? NAVY : '#FFFFFF',
                      color: isActive ? '#FFFFFF' : '#374151',
                      fontSize: 13,
                      fontWeight: isActive ? 600 : 500,
                      cursor: 'pointer',
                    }}
                  >
                    {category}
                  </button>
                );
              })}
            </div>

            {loading && (
              <p
                style={{
                  fontSize: 13,
                  color: '#6B7280',
                  margin: '0 0 8px 0',
                }}
              >
                Loading...
              </p>
            )}

            {/* Main Table */}
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
                    <th style={{ padding: '8px 6px' }}>Category</th>
                    <th style={{ padding: '8px 6px' }}>Size</th>
                    <th style={{ padding: '8px 6px' }}>Supplier</th>
                    <th style={{ padding: '8px 6px' }}>Stock Balance</th>
                    <th style={{ padding: '8px 6px' }}>Unit Cost</th>
                    <th style={{ padding: '8px 6px' }}>Status</th>
                    <th style={{ padding: '8px 6px', textAlign: 'right' }}>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.map((item) => {
                    const isLow =
                      item.stock_balance !== null &&
                      item.low_stock_threshold !== null &&
                      item.stock_balance <= item.low_stock_threshold;

                    return (
                      <>
                        <tr
                          key={item.id}
                          style={{
                            borderBottom: '1px solid #F3F4F6',
                            backgroundColor: '#FFFFFF',
                          }}
                        >
                          <td
                            style={{
                              padding: '8px 6px',
                              borderLeft: isLow
                                ? `4px solid ${RED}`
                                : `4px solid transparent`,
                            }}
                          >
                            <span
                              style={{
                                fontWeight: 500,
                                color: '#111827',
                              }}
                            >
                              {item.name}
                            </span>
                          </td>
                          <td
                            style={{ padding: '8px 6px', color: '#4B5563' }}
                          >
                            {item.category ?? '-'}
                          </td>
                          <td
                            style={{ padding: '8px 6px', color: '#4B5563' }}
                          >
                            {item.size ?? '-'}
                          </td>
                          <td
                            style={{ padding: '8px 6px', color: '#4B5563' }}
                          >
                            {item.supplier ?? '-'}
                          </td>
                          <td
                            style={{ padding: '8px 6px', color: '#111827' }}
                          >
                            {item.stock_balance ?? 0}
                          </td>
                          <td
                            style={{ padding: '8px 6px', color: '#111827' }}
                          >
                            {formatCurrency(item.unit_cost ?? 0)}
                          </td>
                          <td style={{ padding: '8px 6px' }}>
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                padding: '2px 8px',
                                borderRadius: 999,
                                fontSize: 11,
                                fontWeight: 600,
                                backgroundColor: isLow
                                  ? '#FEE2E2'
                                  : '#DCFCE7',
                                color: isLow ? RED : GREEN,
                              }}
                            >
                              {isLow ? 'LOW' : 'OK'}
                            </span>
                          </td>
                          <td
                            style={{
                              padding: '8px 6px',
                              textAlign: 'right',
                            }}
                          >
                            <button
                              type="button"
                              onClick={() => openReceiveForm(item.id)}
                              style={{
                                padding: '6px 10px',
                                borderRadius: 999,
                                border: 'none',
                                backgroundColor: BLUE,
                                color: '#FFFFFF',
                                fontSize: 12,
                                fontWeight: 500,
                                cursor: 'pointer',
                              }}
                            >
                              Receive Stock
                            </button>
                          </td>
                        </tr>
                        {receiveRowId === item.id && (
                          <tr
                            key={`${item.id}-receive`}
                            style={{
                              backgroundColor: '#F9FAFB',
                            }}
                          >
                            <td
                              colSpan={8}
                              style={{
                                padding: 12,
                              }}
                            >
                              <div
                                style={{
                                  display: 'flex',
                                  flexWrap: 'wrap',
                                  gap: 12,
                                  alignItems: 'flex-end',
                                }}
                              >
                                <label
                                  style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: 4,
                                    fontSize: 12,
                                    color: '#4B5563',
                                  }}
                                >
                                  Quantity Received
                                  <input
                                    type="number"
                                    value={receiveQty}
                                    onChange={(event) =>
                                      setReceiveQty(event.target.value)
                                    }
                                    style={{
                                      padding: 6,
                                      borderRadius: 8,
                                      border: '1px solid #D1D5DB',
                                      fontSize: 12,
                                      outline: 'none',
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
                                  Received Date
                                  <input
                                    type="date"
                                    value={receiveDate}
                                    onChange={(event) =>
                                      setReceiveDate(event.target.value)
                                    }
                                    style={{
                                      padding: 6,
                                      borderRadius: 8,
                                      border: '1px solid #D1D5DB',
                                      fontSize: 12,
                                      outline: 'none',
                                    }}
                                  />
                                </label>

                                <button
                                  type="button"
                                  onClick={() =>
                                    handleSaveReceiveStock(item)
                                  }
                                  disabled={loading}
                                  style={{
                                    padding: '8px 14px',
                                    borderRadius: 999,
                                    border: 'none',
                                    backgroundColor: GREEN,
                                    color: '#FFFFFF',
                                    fontSize: 13,
                                    fontWeight: 600,
                                    cursor: loading
                                      ? 'default'
                                      : 'pointer',
                                    opacity: loading ? 0.7 : 1,
                                  }}
                                >
                                  {loading ? 'Saving...' : 'Save'}
                                </button>

                                {receiveError && (
                                  <span
                                    style={{
                                      fontSize: 12,
                                      color: RED,
                                    }}
                                  >
                                    {receiveError}
                                  </span>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    );
                  })}

                  {filteredItems.length === 0 && (
                    <tr>
                      <td
                        colSpan={8}
                        style={{
                          padding: 16,
                          textAlign: 'center',
                          fontSize: 13,
                          color: '#6B7280',
                        }}
                      >
                        No items found for this filter.
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

