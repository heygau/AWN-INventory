'use client';

import { useMemo, useState } from 'react';
import { createClient } from '../../../../utils/supabase/client';

type Profile = {
  id: string;
  full_name: string | null;
  email: string | null;
  manager_id: string | null;
};

type Item = {
  id: string;
  name: string;
  supplier: string | null;
  unit_cost: number | null;
  stock_balance: number | null;
  category: string | null;
};

type RequestFormProps = {
  profile: Profile;
  items: Item[];
};

type CartItem = {
  item: Item;
  quantity: number;
  size?: string;
};

const NAVY = '#1B2B4B';
const GREEN = '#4A7C3F';

export default function RequestForm({ profile, items }: RequestFormProps) {
  const [activeCategory, setActiveCategory] = useState<string>('Uniform');
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [notes, setNotes] = useState('');
  const [selectedSizes, setSelectedSizes] = useState<Record<string, string>>({});
  const [selectedQuantities, setSelectedQuantities] = useState<Record<string, number>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const categories = ['Uniform', 'Laptop', 'Phone', 'Accessory'];
  const uniformSizes = ['XS', 'S', 'M', 'L', 'XL', '2XL'];

  const filteredItems = useMemo(
    () =>
      items.filter(
        (item) =>
          (item.category ?? '').toLowerCase() === activeCategory.toLowerCase(),
      ),
    [items, activeCategory],
  );

  const totalCost = useMemo(
    () =>
      cartItems.reduce(
        (sum, cartItem) =>
          sum + (cartItem.item.unit_cost ?? 0) * cartItem.quantity,
        0,
      ),
    [cartItems],
  );

  const formatCurrency = (value: number) =>
    `$${value.toFixed(2)}`;

  const handleAddToCart = (item: Item) => {
    const isUniform =
      (item.category ?? '').toLowerCase() === 'uniform'.toLowerCase();
    const size = isUniform
      ? selectedSizes[item.id] ?? uniformSizes[2] // default M
      : undefined;
    const quantity = selectedQuantities[item.id] ?? 1;

    if (quantity <= 0) {
      return;
    }

    setCartItems((prev) => {
      const existingIndex = prev.findIndex(
        (cartItem) =>
          cartItem.item.id === item.id &&
          (cartItem.size ?? '') === (size ?? ''),
      );

      if (existingIndex !== -1) {
        const updated = [...prev];
        const newQuantity = Math.min(
          10,
          updated[existingIndex].quantity + quantity,
        );
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: newQuantity,
        };
        return updated;
      }

      return [...prev, { item, quantity, size }];
    });
  };

  const handleRemoveFromCart = (index: number) => {
    setCartItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    setSubmitError(null);
    setSuccessMessage(null);

    if (cartItems.length === 0) {
      setSubmitError('Add at least one item to your cart.');
      return;
    }

    setSubmitting(true);

    try {
      const supabase = createClient();
      const total = totalCost;

      const { data: request, error: requestError } = await supabase
        .from('requests')
        .insert({
          user_id: profile.id,
          notes: notes || null,
          total_cost: total,
          status: 'pending',
        })
        .select('id')
        .single();

      if (requestError || !request) {
        throw requestError ?? new Error('Failed to create request.');
      }

      const { error: itemsError } = await supabase.from('request_items').insert(
        cartItems.map((cartItem) => ({
          request_id: request.id,
          item_id: cartItem.item.id,
          quantity: cartItem.quantity,
          size: cartItem.size ?? null,
          unit_cost: cartItem.item.unit_cost ?? 0,
        })),
      );

      if (itemsError) {
        throw itemsError;
      }

      // Fire-and-forget manager notification email
      if (profile.manager_id) {
        try {
          const { data: managerProfile } = await supabase
            .from('profiles')
            .select('email')
            .eq('id', profile.manager_id)
            .single();

          const managerEmail =
            (managerProfile as { email: string | null } | null)
              ?.email ?? null;

          if (managerEmail) {
            const itemsPayload = cartItems.map((cartItem) => ({
              name: cartItem.item.name,
              quantity: cartItem.quantity,
              size: cartItem.size ?? null,
            }));

            void fetch('/api/notify', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                type: 'manager_alert',
                to: managerEmail,
                employeeName:
                  profile.full_name ?? profile.email ?? 'Employee',
                items: itemsPayload,
              }),
            }).catch(() => {
              // Ignore notification errors on the client.
            });
          }
        } catch {
          // Ignore manager lookup / notification errors.
        }
      }

      setSuccessMessage(
        'Request submitted! Your manager will be notified.',
      );
      setCartItems([]);
      setNotes('');
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : 'Failed to submit request. Please try again.';
      setSubmitError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSignOut = async () => {
    const supabase = createClient();
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
          display: 'flex',
          gap: 24,
          boxSizing: 'border-box',
        }}
      >
        {/* Left: Items and filters */}
        <section
          style={{
            flex: 2,
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
          }}
        >
          {/* Category Tabs */}
          <div
            style={{
              display: 'flex',
              gap: 8,
              marginBottom: 8,
              flexWrap: 'wrap',
            }}
          >
            {categories.map((category) => {
              const isActive =
                category.toLowerCase() === activeCategory.toLowerCase();
              return (
                <button
                  key={category}
                  type="button"
                  onClick={() => setActiveCategory(category)}
                  style={{
                    padding: '8px 14px',
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

          {/* Items Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
              gap: 16,
            }}
          >
            {filteredItems.map((item) => {
              const isUniform =
                (item.category ?? '').toLowerCase() ===
                'uniform'.toLowerCase();
              const selectedSize = selectedSizes[item.id] ?? uniformSizes[2];
              const selectedQuantity = selectedQuantities[item.id] ?? 1;

              return (
                <div
                  key={item.id}
                  style={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: 12,
                    padding: 16,
                    boxShadow: '0 2px 10px rgba(0,0,0,0.04)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8,
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
                        color: NAVY,
                        fontSize: 14,
                      }}
                    >
                      {item.name}
                    </span>
                    {item.supplier && (
                      <span
                        style={{
                          fontSize: 12,
                          color: '#6B7280',
                        }}
                      >
                        Supplier: {item.supplier}
                      </span>
                    )}
                    <span
                      style={{
                        fontSize: 12,
                        color: '#111827',
                      }}
                    >
                      Unit cost:{' '}
                      {formatCurrency(item.unit_cost ?? 0)}
                    </span>
                    <span
                      style={{
                        fontSize: 12,
                        color: '#4B5563',
                      }}
                    >
                      Stock balance:{' '}
                      {item.stock_balance ?? 0}
                    </span>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      marginTop: 8,
                    }}
                  >
                    {isUniform && (
                      <select
                        value={selectedSize}
                        onChange={(event) =>
                          setSelectedSizes((prev) => ({
                            ...prev,
                            [item.id]: event.target.value,
                          }))
                        }
                        style={{
                          padding: '6px 8px',
                          borderRadius: 8,
                          border: '1px solid #D1D5DB',
                          fontSize: 12,
                          outline: 'none',
                          backgroundColor: '#FFFFFF',
                        }}
                      >
                        {uniformSizes.map((size) => (
                          <option key={size} value={size}>
                            {size}
                          </option>
                        ))}
                      </select>
                    )}

                    <select
                      value={String(selectedQuantity)}
                      onChange={(event) =>
                        setSelectedQuantities((prev) => ({
                          ...prev,
                          [item.id]: Number(event.target.value),
                        }))
                      }
                      style={{
                        padding: '6px 8px',
                        borderRadius: 8,
                        border: '1px solid #D1D5DB',
                        fontSize: 12,
                        outline: 'none',
                        backgroundColor: '#FFFFFF',
                      }}
                    >
                      {Array.from({ length: 10 }, (_, index) => index + 1).map(
                        (value) => (
                          <option key={value} value={value}>
                            {value}
                          </option>
                        ),
                      )}
                    </select>

                    <button
                      type="button"
                      onClick={() => handleAddToCart(item)}
                      style={{
                        marginLeft: 'auto',
                        padding: '8px 10px',
                        borderRadius: 999,
                        border: 'none',
                        backgroundColor: GREEN,
                        color: '#FFFFFF',
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      Add to Cart
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Right: Cart panel */}
        <aside
          style={{
            flex: 1,
            backgroundColor: '#FFFFFF',
            borderRadius: 12,
            padding: 16,
            boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
            display: 'flex',
            flexDirection: 'column',
            maxWidth: 360,
            minWidth: 280,
          }}
        >
          <h2
            style={{
              margin: 0,
              marginBottom: 12,
              fontSize: 16,
              fontWeight: 600,
              color: NAVY,
            }}
          >
            Cart
          </h2>

          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              marginBottom: 12,
            }}
          >
            {cartItems.length === 0 ? (
              <p
                style={{
                  fontSize: 13,
                  color: '#6B7280',
                  margin: 0,
                }}
              >
                No items added yet.
              </p>
            ) : (
              <ul
                style={{
                  listStyle: 'none',
                  margin: 0,
                  padding: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                }}
              >
                {cartItems.map((cartItem, index) => (
                  <li
                    key={`${cartItem.item.id}-${index}`}
                    style={{
                      border: '1px solid #E5E7EB',
                      borderRadius: 8,
                      padding: 8,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 4,
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <span
                        style={{
                          fontSize: 13,
                          fontWeight: 600,
                          color: NAVY,
                        }}
                      >
                        {cartItem.item.name}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveFromCart(index)}
                        style={{
                          border: 'none',
                          backgroundColor: 'transparent',
                          color: '#9CA3AF',
                          fontSize: 12,
                          cursor: 'pointer',
                        }}
                      >
                        Remove
                      </button>
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontSize: 12,
                        color: '#4B5563',
                      }}
                    >
                      <span>
                        Qty: {cartItem.quantity}
                        {cartItem.size ? ` · Size: ${cartItem.size}` : ''}
                      </span>
                      <span>
                        {formatCurrency(
                          (cartItem.item.unit_cost ?? 0) *
                            cartItem.quantity,
                        )}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div
            style={{
              marginBottom: 12,
              borderTop: '1px solid #E5E7EB',
              paddingTop: 8,
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: 14,
              fontWeight: 600,
              color: NAVY,
            }}
          >
            <span>Total</span>
            <span>{formatCurrency(totalCost)}</span>
          </div>

          <label
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
              fontSize: 13,
              color: '#4B5563',
              marginBottom: 12,
            }}
          >
            Notes
            <textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              rows={3}
              style={{
                resize: 'vertical',
                minHeight: 60,
                padding: 8,
                borderRadius: 8,
                border: '1px solid #D1D5DB',
                fontSize: 13,
                outline: 'none',
                fontFamily: 'inherit',
              }}
            />
          </label>

          {submitError && (
            <p
              style={{
                color: '#DC2626',
                fontSize: 12,
                margin: '0 0 8px 0',
              }}
            >
              {submitError}
            </p>
          )}

          {successMessage && (
            <p
              style={{
                color: GREEN,
                fontSize: 12,
                margin: '0 0 8px 0',
              }}
            >
              {successMessage}
            </p>
          )}

          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            style={{
              marginTop: 'auto',
              width: '100%',
              padding: '10px 12px',
              borderRadius: 999,
              border: 'none',
              backgroundColor: NAVY,
              color: '#FFFFFF',
              fontSize: 14,
              fontWeight: 600,
              cursor: submitting ? 'default' : 'pointer',
              opacity: submitting ? 0.7 : 1,
            }}
          >
            {submitting ? 'Submitting...' : 'Submit Request'}
          </button>
        </aside>
      </main>
    </div>
  );
}

