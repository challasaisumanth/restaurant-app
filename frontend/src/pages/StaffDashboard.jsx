import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

const StaffDashboard = () => {
  const { user, logout } = useAuth();
  const [tables, setTables] = useState([]);
  const [selectedTable, setSelectedTable] = useState(null);
  const [order, setOrder] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [screen, setScreen] = useState('tables');
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    fetchTables();
    fetchCategories();
  }, []);

  const fetchTables = async () => {
    try {
      const res = await api.get('/tables');
      setTables(res.data.tables);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchCategories = async () => {
  try {
    const res = await api.get('/menu/categories');
    if (res.data.categories?.length > 0) {
      setCategories(res.data.categories);
    }
  } catch (err) { console.error(err); }
};

  const fetchOrder = async (tableNumber) => {
    try {
      const res = await api.get(`/orders/${tableNumber}`);
      setOrder(res.data.order);
      setNotes(res.data.order?.notes || '');
    } catch (err) {
      console.error(err);
    }
  };

  const fetchMenuItems = async () => {
    try {
      const res = await api.get('/menu');
      setMenuItems(res.data.items);
    } catch (err) {
      console.error(err);
    }
  };

  const handleTableClick = async (table) => {
    setSelectedTable(table);
    setScreen('order');
    setSearchQuery('');
    await fetchOrder(table.table_number);
    await fetchMenuItems();
  };

  const addItem = (menuItem) => {
    const currentItems = order?.items || [];
    const existing = currentItems.find(i => i.menuItem_id === menuItem._id);
    let updatedItems;
    if (existing) {
      updatedItems = currentItems.map(i =>
        i.menuItem_id === menuItem._id ? { ...i, quantity: i.quantity + 1 } : i
      );
    } else {
      updatedItems = [...currentItems, {
        menuItem_id: menuItem._id,
        name: menuItem.name,
        price: menuItem.price,
        quantity: 1
      }];
    }
    setOrder(prev => ({ ...prev, items: updatedItems }));
  };

  const updateQuantity = (menuItemId, delta) => {
    const currentItems = order?.items || [];
    const updatedItems = currentItems
      .map(i => i.menuItem_id === menuItemId ? { ...i, quantity: i.quantity + delta } : i)
      .filter(i => i.quantity > 0);
    setOrder(prev => ({ ...prev, items: updatedItems }));
  };

  const saveOrder = async () => {
    if (!order?.items?.length) return;
    setLoading(true);
    try {
      await api.post('/orders', {
        table_number: selectedTable.table_number,
        items: order.items,
        notes
      });
      await fetchTables();
      alert('Order saved successfully!');
    } catch (err) {
      alert('Failed to save order');
    } finally {
      setLoading(false);
    }
  };

  const totalAmount = (order?.items || []).reduce(
    (sum, item) => sum + item.price * item.quantity, 0
  );

  const getStatusColor = (status) => {
    if (status === 'available') return { bg: '#D8F3DC', color: '#2D6A4F', border: 'rgba(45,106,79,0.3)' };
    if (status === 'occupied') return { bg: '#FDECEA', color: '#A33030', border: 'rgba(163,48,48,0.3)' };
    return { bg: '#FFF8E1', color: '#856A00', border: 'rgba(201,168,76,0.3)' };
  };

  const getStatusLabel = (status) => {
    if (status === 'available') return 'Available';
    if (status === 'occupied') return 'Occupied';
    return 'Billing';
  };

  // ─── TABLES SCREEN ────────────────────────────────────────────────────────────
  if (screen === 'tables') {
    return (
      <div style={{ minHeight: '100vh', background: '#FDF8EE', fontFamily: "'DM Sans', sans-serif" }}>
        {/* Header */}
        <div style={{
          background: '#1A1208', padding: '14px 18px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between'
        }}>
          <div>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '16px', color: '#C9A84C' }}>
              ICE MAGIC
            </div>
            <div style={{ fontSize: '10px', color: 'rgba(201,168,76,0.5)' }}>
              Staff Portal
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '11px', color: 'rgba(201,168,76,0.6)' }}>
              {user?.name}
            </span>
            <button onClick={logout} style={{
              fontSize: '11px', color: '#A33030', background: '#FDECEA',
              border: '0.5px solid rgba(163,48,48,0.2)', borderRadius: '8px',
              padding: '4px 10px', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif"
            }}>Logout</button>
          </div>
        </div>

        <div style={{ padding: '20px 16px' }}>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '22px', color: '#1A1208', marginBottom: '4px' }}>
            Tables
          </h2>
          <p style={{ fontSize: '12px', color: '#8A7A5A', marginBottom: '20px' }}>
            Select a table to manage orders
          </p>

          {/* Legend */}
          <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
            {['available', 'occupied', 'billing_pending'].map(s => {
              const c = getStatusColor(s);
              return (
                <div key={s} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: c.color }}></div>
                  <span style={{ fontSize: '10px', color: '#8A7A5A' }}>{getStatusLabel(s)}</span>
                </div>
              );
            })}
          </div>

          {/* Tables Grid */}
          {tables.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#8A7A5A' }}>
              No tables found. Ask admin to create tables.
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
              {tables.map((table) => {
                const c = getStatusColor(table.status);
                return (
                  <div
                    key={table._id}
                    onClick={() => handleTableClick(table)}
                    style={{
                      background: c.bg,
                      border: `0.5px solid ${c.border}`,
                      borderRadius: '12px',
                      padding: '14px 10px',
                      textAlign: 'center',
                      cursor: 'pointer'
                    }}
                  >
                    <div style={{ fontSize: '13px', fontWeight: '500', color: '#1A1208', marginBottom: '3px' }}>
                      {table.table_name || `Table ${table.table_number}`}
                    </div>
                    <div style={{ fontSize: '9px', color: c.color, fontWeight: '500', marginBottom: '4px' }}>
                      {getStatusLabel(table.status)}
                    </div>
                    <div style={{
                      display: 'inline-block', fontSize: '8px',
                      padding: '2px 6px', borderRadius: '6px',
                      background: table.seating_type === 'AC' ? '#E6F1FB' : '#F5E6C0',
                      color: table.seating_type === 'AC' ? '#185FA5' : '#856A00',
                      fontWeight: '500'
                    }}>
                      {table.seating_type || 'Non-AC'}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ─── ORDER SCREEN ─────────────────────────────────────────────────────────────
  return (
    <div style={{ height: '100vh', background: '#FDF8EE', fontFamily: "'DM Sans', sans-serif", display: 'flex', flexDirection: 'column' }}>

      {/* Header */}
      <div style={{
        background: '#1A1208', padding: '14px 18px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexShrink: 0
      }}>
        <button onClick={() => { setScreen('tables'); fetchTables(); }} style={{
          fontSize: '11px', color: 'rgba(201,168,76,0.7)',
          background: 'rgba(201,168,76,0.08)',
          border: '0.5px solid rgba(201,168,76,0.2)',
          borderRadius: '8px', padding: '4px 10px',
          cursor: 'pointer', fontFamily: "'DM Sans', sans-serif"
        }}>← Tables</button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontFamily: "'Playfair Display', serif", fontSize: '14px', color: '#C9A84C' }}>
            {selectedTable?.table_name || `Table ${selectedTable?.table_number}`}
          </span>
          <span style={{
            fontSize: '8px', padding: '2px 6px', borderRadius: '4px',
            background: selectedTable?.seating_type === 'AC' ? '#E6F1FB' : '#F5E6C0',
            color: selectedTable?.seating_type === 'AC' ? '#185FA5' : '#856A00',
            fontWeight: '500'
          }}>
            {selectedTable?.seating_type || 'Non-AC'}
          </span>
        </div>

        <button onClick={logout} style={{
          fontSize: '11px', color: '#A33030', background: '#FDECEA',
          border: '0.5px solid rgba(163,48,48,0.2)', borderRadius: '8px',
          padding: '4px 10px', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif"
        }}>Logout</button>
      </div>

      {/* Order Summary Panel */}
      <div style={{
        background: '#FFFDF7',
        borderBottom: '0.5px solid rgba(201,168,76,0.18)',
        padding: '12px 16px',
        flexShrink: 0
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <span style={{ fontFamily: "'Playfair Display', serif", fontSize: '14px', color: '#1A1208' }}>
            Order Summary
          </span>
          <span style={{ fontFamily: "'Playfair Display', serif", fontSize: '16px', color: '#C9A84C' }}>
            ₹{totalAmount}
          </span>
        </div>

        {(!order?.items?.length) ? (
          <div style={{ fontSize: '11px', color: '#8A7A5A', textAlign: 'center', padding: '6px 0' }}>
            Tap items below to add to order
          </div>
        ) : (
          <div style={{ maxHeight: '120px', overflowY: 'auto' }}>
            {order.items.map(item => (
              <div key={item.menuItem_id} style={{
                display: 'flex', alignItems: 'center',
                justifyContent: 'space-between', padding: '4px 0',
                borderBottom: '0.5px solid rgba(201,168,76,0.08)'
              }}>
                <span style={{ fontSize: '12px', color: '#1A1208', flex: 1 }}>{item.name}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <button onClick={() => updateQuantity(item.menuItem_id, -1)} style={{
                    width: '20px', height: '20px', borderRadius: '50%',
                    border: '0.5px solid rgba(201,168,76,0.3)',
                    background: '#FDF8EE', cursor: 'pointer', fontSize: '12px',
                    color: '#1A1208', display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>−</button>
                  <span style={{ fontSize: '12px', fontWeight: '500', minWidth: '16px', textAlign: 'center' }}>
                    {item.quantity}
                  </span>
                  <button onClick={() => updateQuantity(item.menuItem_id, 1)} style={{
                    width: '20px', height: '20px', borderRadius: '50%',
                    border: '0.5px solid rgba(201,168,76,0.3)',
                    background: '#FDF8EE', cursor: 'pointer', fontSize: '12px',
                    color: '#1A1208', display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>+</button>
                  <span style={{ fontSize: '12px', color: '#C9A84C', minWidth: '40px', textAlign: 'right' }}>
                    ₹{item.price * item.quantity}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Notes + Save */}
        <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
          <input
            placeholder="Special instructions..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            style={{
              flex: 1, padding: '7px 10px',
              border: '0.5px solid rgba(201,168,76,0.3)',
              borderRadius: '8px', fontSize: '11px',
              background: '#FDF8EE', color: '#1A1208',
              outline: 'none', fontFamily: "'DM Sans', sans-serif"
            }}
          />
          <button onClick={saveOrder} disabled={loading || !order?.items?.length} style={{
            padding: '7px 14px',
            background: !order?.items?.length ? '#8A7A5A' : '#C9A84C',
            color: '#1A1208', border: 'none', borderRadius: '8px',
            fontSize: '11px', fontWeight: '500', cursor: 'pointer',
            fontFamily: "'DM Sans', sans-serif", whiteSpace: 'nowrap'
          }}>
            {loading ? '...' : 'Save Order'}
          </button>
        </div>
      </div>

      {/* Menu Items Grid */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px' }}>

        {/* Search Bar */}
        <input
          type="text"
          placeholder="Search items..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            width: '100%', padding: '9px 14px',
            border: '0.5px solid rgba(201,168,76,0.3)',
            borderRadius: '10px', fontSize: '12px',
            background: '#FFFDF7', color: '#1A1208',
            outline: 'none', fontFamily: "'DM Sans', sans-serif",
            marginBottom: '14px'
          }}
        />

        {/* Items grouped by category */}
        {categories.map(category => {
          const categoryItems = menuItems.filter(item =>
            item.category === category &&
            (!searchQuery || item.name.toLowerCase().includes(searchQuery.toLowerCase()))
          );
          if (categoryItems.length === 0) return null;
          return (
            <div key={category} style={{ marginBottom: '20px' }}>
              {/* Category Label */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                <span style={{
                  fontSize: '10px', fontWeight: '500', color: '#8A7A5A',
                  letterSpacing: '1.5px', textTransform: 'uppercase', whiteSpace: 'nowrap'
                }}>{category}</span>
                <div style={{ flex: 1, height: '0.5px', background: 'rgba(201,168,76,0.18)' }}></div>
              </div>

              {/* 3 Column Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                {categoryItems.map(item => {
                  const inOrder = order?.items?.find(i => i.menuItem_id === item._id);
                  return (
                    <div
                      key={item._id}
                      onClick={() => item.availability && addItem(item)}
                      style={{
                        background: '#FFFDF7',
                        border: inOrder ? '1.5px solid #C9A84C' : '0.5px solid rgba(201,168,76,0.18)',
                        borderRadius: '12px', overflow: 'hidden',
                        opacity: item.availability ? 1 : 0.45,
                        cursor: item.availability ? 'pointer' : 'not-allowed',
                        position: 'relative'
                      }}
                    >
                      {/* Image */}
                      <div style={{
                        height: '70px',
                        background: 'linear-gradient(135deg, #f5e8c8, #e8d5a0)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        position: 'relative', overflow: 'hidden'
                      }}>
                        {item.image_url ? (
                          <img src={item.image_url} alt={item.name}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            onError={(e) => { e.target.style.display = 'none'; }}
                          />
                        ) : (
                          <span style={{ fontSize: '24px' }}>🍽️</span>
                        )}
                        {inOrder && (
                          <div style={{
                            position: 'absolute', top: '4px', right: '4px',
                            width: '18px', height: '18px', borderRadius: '50%',
                            background: '#C9A84C', color: '#1A1208',
                            fontSize: '10px', fontWeight: '500',
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                          }}>{inOrder.quantity}</div>
                        )}
                      </div>

                      {/* Info */}
                      <div style={{ padding: '6px 8px 8px' }}>
                        <div style={{
                          fontSize: '10px', fontWeight: '500', color: '#1A1208',
                          marginBottom: '2px', lineHeight: '1.3',
                          overflow: 'hidden', display: '-webkit-box',
                          WebkitLineClamp: 2, WebkitBoxOrient: 'vertical'
                        }}>{item.name}</div>
                        <div style={{ fontSize: '11px', color: '#C9A84C', fontWeight: '500' }}>
                          ₹{item.price}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {menuItems.length === 0 && (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#8A7A5A' }}>
            No menu items found. Ask admin to add items!
          </div>
        )}
      </div>
    </div>
  );
};

export default StaffDashboard;