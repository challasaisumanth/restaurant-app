import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { QRCodeCanvas } from 'qrcode.react';
import api from '../utils/api';

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const [screen, setScreen] = useState('dashboard');
  const [tables, setTables] = useState([]);
  const [bills, setBills] = useState([]);
  const [allMenuItems, setAllMenuItems] = useState([]);
  const [staff, setStaff] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState(['Veg-Starters', 'Paneer-Items', 'Ice Cream', 'Beverage']);
  const [selectedTable, setSelectedTable] = useState(null);
  const [order, setOrder] = useState(null);
  const [menuSearch, setMenuSearch] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeMenuTab, setActiveMenuTab] = useState('Starters');

  const [customerName, setCustomerName] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [showBillModal, setShowBillModal] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  const [menuForm, setMenuForm] = useState({
    name: '', category: 'Starters', ac_price: '', non_ac_price: '',
    image_url: '', description: '', availability: true
  });
  const [editingMenu, setEditingMenu] = useState(null);
  const [showMenuForm, setShowMenuForm] = useState(false);

  const [newCategory, setNewCategory] = useState('');
  const [showCategoryForm, setShowCategoryForm] = useState(false);

  const [staffForm, setStaffForm] = useState({ name: '', username: '', password: '' });
  const [showStaffForm, setShowStaffForm] = useState(false);

  const [editingTable, setEditingTable] = useState(null);
  const [editTableName, setEditTableName] = useState('');
  const [editTableType, setEditTableType] = useState('non-ac');

  // QR States
  const [showQrModal, setShowQrModal] = useState(false);
  const [qrTable, setQrTable] = useState(null);

  useEffect(() => {
    fetchTables();
    fetchBills();
    fetchCategories();
  }, []);

  const fetchTables = async () => {
    try {
      const res = await api.get('/tables');
      setTables(res.data.tables);
    } catch (err) { console.error(err); }
  };

  const fetchBills = async () => {
    try {
      const res = await api.get('/bills/history');
      setBills(res.data.bills);
    } catch (err) { console.error(err); }
  };

  const fetchMenu = async () => {
    try {
      const res = await api.get('/menu');
      setMenuItems(res.data.items);
    } catch (err) { console.error(err); }
  };

  const fetchStaff = async () => {
    try {
      const res = await api.get('/staff');
      setStaff(res.data.staff);
    } catch (err) { console.error(err); }
  };

  const fetchOrder = async (tableNumber) => {
    try {
      const res = await api.get(`/orders/${tableNumber}`);
      setOrder(res.data.order);
      setNotes(res.data.order?.notes || '');
    } catch (err) { console.error(err); }
  };

  const fetchAllMenuItems = async () => {
    try {
      const res = await api.get('/menu');
      setAllMenuItems(res.data.items);
    } catch (err) { console.error(err); }
  };

  const fetchCategories = async () => {
    try {
      const res = await api.get('/menu/categories');
      if (res.data.categories && res.data.categories.length > 0) {
        setCategories(res.data.categories);
        setActiveMenuTab(res.data.categories[0]);
      }
    } catch (err) { console.error(err); }
  };

  const handleScreenChange = (s) => {
    setScreen(s);
    if (s === 'bills') fetchBills();
    if (s === 'menu') { fetchMenu(); fetchCategories(); }
    if (s === 'staff') fetchStaff();
    if (s === 'tables') fetchTables();
  };

  const handleTableClick = async (table) => {
    setSelectedTable(table);
    setMenuSearch('');
    setScreen('order');
    await fetchOrder(table.table_number);
    await fetchAllMenuItems();
  };

  const getItemPrice = (menuItem) => {
    if (selectedTable?.type === 'ac') return menuItem.ac_price;
    return menuItem.non_ac_price;
  };

  const addItem = (menuItem) => {
    const price = getItemPrice(menuItem);
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
        price: price,
        quantity: 1
      }];
    }
    setOrder(prev => ({ ...prev, items: updatedItems }));
  };

  const updateQuantity = (menuItemId, delta) => {
    const updatedItems = (order?.items || [])
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
      alert('Order saved!');
    } catch (err) { alert('Failed to save order'); }
    finally { setLoading(false); }
  };

  const handleGenerateBill = async () => {
    if (!customerName) return alert('Please enter customer name');
    setLoading(true);
    try {
      await api.post('/bills', {
        customer_name: customerName,
        table_number: selectedTable.table_number,
        items: order.items,
        total_amount: totalAmount,
        payment_method: paymentMethod
      });
      setShowBillModal(false);
      setCustomerName('');
      setPaymentMethod('Cash');
      setOrder(null);
      await fetchTables();
      await fetchBills();
      setScreen('tables');
      alert('Bill generated successfully!');
    } catch (err) { alert('Failed to generate bill'); }
    finally { setLoading(false); }
  };

  const handleAddMenu = async () => {
    if (!menuForm.name || !menuForm.ac_price || !menuForm.non_ac_price || !menuForm.category) {
      return alert('Please fill name, category, AC price and Non-AC price');
    }
    setLoading(true);
    try {
      if (editingMenu) {
        await api.put(`/menu/${editingMenu._id}`, menuForm);
      } else {
        await api.post('/menu', menuForm);
      }
      setMenuForm({ name: '', category: activeMenuTab, ac_price: '', non_ac_price: '', image_url: '', description: '', availability: true });
      setEditingMenu(null);
      setShowMenuForm(false);
      fetchMenu();
    } catch (err) { alert('Failed to save menu item'); }
    finally { setLoading(false); }
  };

  const handleDeleteMenu = async (id) => {
    if (!window.confirm('Delete this item?')) return;
    try {
      await api.delete(`/menu/${id}`);
      fetchMenu();
    } catch (err) { alert('Failed to delete'); }
  };

  const handleToggleAvailability = async (id) => {
    try {
      await api.patch(`/menu/${id}/toggle`);
      fetchMenu();
    } catch (err) { alert('Failed to toggle'); }
  };

  const handleAddCategory = async () => {
    if (!newCategory.trim()) return;
    const trimmed = newCategory.trim();
    try {
      const res = await api.post('/menu/categories', { category: trimmed });
      setCategories(res.data.categories);
      setNewCategory('');
      setShowCategoryForm(false);
      setActiveMenuTab(trimmed);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to add category');
    }
  };

  const handleDeleteCategory = async (cat) => {
    const defaults = ['Veg-Starters', 'Paneer-Items', 'Ice Cream', 'Beverage'];
    if (defaults.includes(cat)) return alert('Cannot delete default categories!');
    if (!window.confirm(`Delete category "${cat}"?`)) return;
    try {
      const res = await api.delete(`/menu/categories/${cat}`);
      setCategories(res.data.categories);
      if (activeMenuTab === cat) setActiveMenuTab(res.data.categories[0] || '');
    } catch (err) { alert('Failed to delete category'); }
  };

  const handleAddStaff = async () => {
    setLoading(true);
    try {
      await api.post('/staff', staffForm);
      setStaffForm({ name: '', username: '', password: '' });
      setShowStaffForm(false);
      fetchStaff();
      alert('Staff created!');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create staff');
    } finally { setLoading(false); }
  };

  const handleDeleteStaff = async (id) => {
    if (!window.confirm('Delete this staff?')) return;
    try {
      await api.delete(`/staff/${id}`);
      fetchStaff();
    } catch (err) { alert('Failed to delete staff'); }
  };

  const handleCreateTable = async () => {
    const num = prompt('Enter table number:');
    if (!num) return;
    const type = window.confirm('Is this an AC table?\nClick OK for AC, Cancel for Non-AC')
      ? 'ac' : 'non-ac';
    try {
      await api.post('/tables', { table_number: parseInt(num), type });
      fetchTables();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create table');
    }
  };

  const handleEditTableName = async (table) => {
    if (!editTableName.trim()) return;
    try {
      await api.put(`/tables/${table.table_number}`, {
        table_name: editTableName.trim(),
        type: editTableType
      });
      setEditingTable(null);
      setEditTableName('');
      setEditTableType('non-ac');
      await fetchTables();
    } catch (err) {
      alert('Failed to update table: ' + (err.response?.data?.message || err.message));
    }
  };
  const handleImageUpload = async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  setUploadingImage(true);
  try {
    const formData = new FormData();
    formData.append('image', file);
    const res = await api.post('/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    setMenuForm(prev => ({ ...prev, image_url: res.data.image_url }));
  } catch (err) {
    alert('Image upload failed. Try pasting URL instead.');
  } finally {
    setUploadingImage(false);
  }
};

  const handleDeleteTable = async (tableNumber) => {
    if (!window.confirm(`Delete Table ${tableNumber}?`)) return;
    try {
      await api.delete(`/tables/${tableNumber}`);
      await fetchTables();
    } catch (err) {
      alert('Failed to delete table: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleDownloadQR = () => {
    const canvas = document.getElementById('qr-canvas');
    if (canvas) {
      const link = document.createElement('a');
      link.download = `table-${qrTable.table_number}-qr.png`;
      link.href = canvas.toDataURL();
      link.click();
    }
  };

  const totalAmount = (order?.items || []).reduce(
    (sum, item) => sum + (Number(item.price) || 0) * (Number(item.quantity) || 0), 0
  );

  const formatAmount = (value) => {
    const amount = (Number(value) || 0).toFixed(2);
    return amount.endsWith('.00') ? amount.slice(0, -3) : amount;
  };

  const getStatusColor = (status) => {
    if (status === 'available') return { bg: '#D8F3DC', color: '#2D6A4F', border: 'rgba(45,106,79,0.3)' };
    if (status === 'occupied') return { bg: '#FDECEA', color: '#A33030', border: 'rgba(163,48,48,0.3)' };
    return { bg: '#FFF8E1', color: '#856A00', border: 'rgba(201,168,76,0.3)' };
  };

  const st = { fontFamily: "'DM Sans', sans-serif" };

  const inputStyle = {
    width: '100%', padding: '9px 12px',
    border: '0.5px solid rgba(201,168,76,0.3)',
    borderRadius: '8px', fontSize: '13px',
    background: '#FFFDF7', color: '#1A1208',
    outline: 'none', fontFamily: "'DM Sans', sans-serif",
    marginBottom: '10px'
  };

  const NavBar = ({ showBack = false }) => (
    <div style={{
      background: '#1A1208', padding: '12px 18px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      position: 'sticky', top: 0, zIndex: 10
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {showBack && (
          <button onClick={() => handleScreenChange('tables')} style={{
            fontSize: '11px', color: 'rgba(201,168,76,0.7)',
            background: 'rgba(201,168,76,0.08)',
            border: '0.5px solid rgba(201,168,76,0.2)',
            borderRadius: '8px', padding: '4px 10px',
            cursor: 'pointer', fontFamily: "'DM Sans', sans-serif"
          }}>← Back</button>
        )}
        <span style={{ fontFamily: "'Playfair Display', serif", fontSize: '15px', color: '#C9A84C' }}>
          ICE MAGIC
        </span>
      </div>
      <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
        {['dashboard', 'tables', 'bills', 'menu', 'staff'].map(tab => (
          <button key={tab} onClick={() => handleScreenChange(tab)} style={{
            fontSize: '10px',
            background: screen === tab ? '#C9A84C' : 'rgba(201,168,76,0.08)',
            color: screen === tab ? '#1A1208' : 'rgba(201,168,76,0.7)',
            border: '0.5px solid rgba(201,168,76,0.2)',
            borderRadius: '6px', padding: '4px 8px',
            cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
            textTransform: 'capitalize'
          }}>{tab}</button>
        ))}
        <button onClick={logout} style={{
          fontSize: '10px', color: '#A33030', background: '#FDECEA',
          border: '0.5px solid rgba(163,48,48,0.2)',
          borderRadius: '6px', padding: '4px 8px',
          cursor: 'pointer', fontFamily: "'DM Sans', sans-serif"
        }}>Logout</button>
      </div>
    </div>
  );

  // ─── DASHBOARD ───────────────────────────────────────────────────────────────
  if (screen === 'dashboard') {
    const occupied = tables.filter(t => t.status === 'occupied').length;
    const available = tables.filter(t => t.status === 'available').length;
    const billing = tables.filter(t => t.status === 'billing_pending').length;
    const todayBills = bills.filter(b =>
      new Date(b.createdAt).toDateString() === new Date().toDateString()
    );
    const todayEarnings = todayBills.reduce((sum, b) => sum + b.total_amount, 0);
    const todayCount = todayBills.length;

    return (
      <div style={{ minHeight: '100vh', background: '#FDF8EE', ...st }}>
        <NavBar />
        <div style={{ padding: '20px 16px' }}>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '22px', color: '#1A1208', marginBottom: '4px' }}>Dashboard</h2>
          <p style={{ fontSize: '12px', color: '#8A7A5A', marginBottom: '20px' }}>Welcome back, {user?.name}!</p>

          <div style={{
            background: '#1A1208', borderRadius: '16px', padding: '20px',
            marginBottom: '16px', border: '0.5px solid rgba(201,168,76,0.3)',
            position: 'relative', overflow: 'hidden'
          }}>
            <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '100px', height: '100px', borderRadius: '50%', background: 'rgba(201,168,76,0.06)' }}></div>
            <div style={{ fontSize: '11px', color: 'rgba(201,168,76,0.6)', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '8px' }}>Today's Earnings</div>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '36px', color: '#C9A84C', marginBottom: '6px' }}>₹{todayEarnings.toLocaleString('en-IN')}</div>
            <div style={{ display: 'flex', gap: '16px' }}>
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)' }}>{todayCount} bill{todayCount !== 1 ? 's' : ''} today</div>
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)' }}>{new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' })}</div>
            </div>
            {todayCount > 0 && (
              <div style={{ display: 'flex', gap: '8px', marginTop: '12px', flexWrap: 'wrap' }}>
                {['Cash', 'UPI', 'Card'].map(method => {
                  const mt = todayBills.filter(b => b.payment_method === method).reduce((s, b) => s + b.total_amount, 0);
                  if (mt === 0) return null;
                  return (
                    <div key={method} style={{ background: 'rgba(201,168,76,0.12)', border: '0.5px solid rgba(201,168,76,0.2)', borderRadius: '8px', padding: '4px 10px' }}>
                      <span style={{ fontSize: '9px', color: 'rgba(201,168,76,0.6)' }}>{method} </span>
                      <span style={{ fontSize: '11px', color: '#C9A84C', fontWeight: '500' }}>₹{mt.toLocaleString('en-IN')}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
            {[
              { label: 'Available Tables', value: available, color: '#2D6A4F', bg: '#D8F3DC' },
              { label: 'Occupied Tables', value: occupied, color: '#A33030', bg: '#FDECEA' },
              { label: 'Billing Pending', value: billing, color: '#856A00', bg: '#FFF8E1' },
              { label: 'Total Tables', value: tables.length, color: '#1A1208', bg: '#F5E6C0' },
            ].map(card => (
              <div key={card.label} style={{ background: card.bg, borderRadius: '14px', padding: '16px', border: `0.5px solid ${card.color}22` }}>
                <div style={{ fontSize: '11px', color: card.color, marginBottom: '6px' }}>{card.label}</div>
                <div style={{ fontSize: '28px', fontWeight: '500', color: card.color }}>{card.value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ─── TABLES ───────────────────────────────────────────────────────────────────
  if (screen === 'tables') {
    return (
      <div style={{ minHeight: '100vh', background: '#FDF8EE', ...st }}>
        <NavBar />
        <div style={{ padding: '20px 16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '22px', color: '#1A1208' }}>Tables</h2>
              <p style={{ fontSize: '12px', color: '#8A7A5A' }}>Tap a table to manage orders</p>
            </div>
            <button onClick={handleCreateTable} style={{ background: '#C9A84C', color: '#1A1208', border: 'none', borderRadius: '10px', padding: '8px 16px', fontSize: '12px', fontWeight: '500', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>+ Add Table</button>
          </div>

          <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
            {[['#2D6A4F', 'Available'], ['#A33030', 'Occupied'], ['#856A00', 'Billing']].map(([c, l]) => (
              <div key={l} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: c }}></div>
                <span style={{ fontSize: '10px', color: '#8A7A5A' }}>{l}</span>
              </div>
            ))}
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ fontSize: '9px', padding: '1px 6px', borderRadius: '4px', background: '#DBEAFE', color: '#1D4ED8' }}>AC</span>
              <span style={{ fontSize: '9px', padding: '1px 6px', borderRadius: '4px', background: '#F3F4F6', color: '#374151' }}>Non-AC</span>
              <span style={{ fontSize: '10px', color: '#8A7A5A' }}>Table Type</span>
            </div>
          </div>

          {tables.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#8A7A5A' }}>No tables yet. Click "+ Add Table"!</div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
              {tables.map(table => {
                const c = getStatusColor(table.status);
                const isEditing = editingTable?._id === table._id;
                return (
                  <div key={table._id} style={{ background: c.bg, border: `0.5px solid ${c.border}`, borderRadius: '14px', padding: '12px 8px', textAlign: 'center', position: 'relative' }}>

                    {/* Action Buttons */}
                    <div style={{ position: 'absolute', top: '5px', right: '5px', display: 'flex', gap: '3px' }}>
                      {/* QR Button */}
                      <button onClick={(e) => {
                        e.stopPropagation();
                        setQrTable(table);
                        setShowQrModal(true);
                      }} style={{ width: '16px', height: '16px', borderRadius: '50%', border: 'none', background: 'rgba(201,168,76,0.2)', cursor: 'pointer', fontSize: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>📱</button>
                      {/* Edit Button */}
                      <button onClick={(e) => {
                        e.stopPropagation();
                        setEditingTable(table);
                        setEditTableName(table.table_name || `Table ${table.table_number}`);
                        setEditTableType(table.type || 'non-ac');
                      }} style={{ width: '16px', height: '16px', borderRadius: '50%', border: 'none', background: 'rgba(201,168,76,0.2)', cursor: 'pointer', fontSize: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✏️</button>
                      {/* Delete Button */}
                      <button onClick={(e) => { e.stopPropagation(); handleDeleteTable(table.table_number); }}
                        style={{ width: '16px', height: '16px', borderRadius: '50%', border: 'none', background: 'rgba(163,48,48,0.15)', cursor: 'pointer', fontSize: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>🗑</button>
                    </div>

                    {isEditing ? (
                      <div onClick={e => e.stopPropagation()} style={{ marginTop: '10px' }}>
                        <input value={editTableName} onChange={e => setEditTableName(e.target.value)}
                          style={{ width: '100%', padding: '4px 6px', border: '0.5px solid rgba(201,168,76,0.4)', borderRadius: '6px', fontSize: '11px', background: '#FFFDF7', color: '#1A1208', outline: 'none', textAlign: 'center', fontFamily: "'DM Sans', sans-serif", marginBottom: '4px' }} />
                        <select value={editTableType} onChange={e => setEditTableType(e.target.value)}
                          style={{ width: '100%', padding: '4px 6px', border: '0.5px solid rgba(201,168,76,0.4)', borderRadius: '6px', fontSize: '11px', background: '#FFFDF7', color: '#1A1208', outline: 'none', fontFamily: "'DM Sans', sans-serif", marginBottom: '6px' }}>
                          <option value="non-ac">Non-AC</option>
                          <option value="ac">AC</option>
                        </select>
                        <div style={{ display: 'flex', gap: '4px' }}>
                          <button onClick={() => handleEditTableName(table)} style={{ flex: 1, padding: '3px', background: '#C9A84C', color: '#1A1208', border: 'none', borderRadius: '5px', fontSize: '9px', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>Save</button>
                          <button onClick={() => setEditingTable(null)} style={{ flex: 1, padding: '3px', background: 'transparent', color: '#8A7A5A', border: '0.5px solid rgba(201,168,76,0.2)', borderRadius: '5px', fontSize: '9px', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <div onClick={() => handleTableClick(table)} style={{ cursor: 'pointer', paddingTop: '12px' }}>
                        <div style={{ fontSize: '14px', fontWeight: '500', color: '#1A1208', marginBottom: '2px' }}>
                          {table.table_name || `Table ${table.table_number}`}
                        </div>
                        <div style={{ marginBottom: '2px' }}>
                          <span style={{ fontSize: '8px', padding: '1px 6px', borderRadius: '4px', background: table.type === 'ac' ? '#DBEAFE' : '#F3F4F6', color: table.type === 'ac' ? '#1D4ED8' : '#374151' }}>
                            {table.type === 'ac' ? 'AC' : 'Non-AC'}
                          </span>
                        </div>
                        <div style={{ fontSize: '9px', color: c.color, fontWeight: '500' }}>
                          {table.status === 'available' ? 'Available' : table.status === 'occupied' ? 'Occupied' : 'Billing'}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* QR Modal */}
        {showQrModal && qrTable && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(26,18,8,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '1rem' }}>
            <div style={{ background: '#FDF8EE', borderRadius: '20px', padding: '28px 24px', width: '100%', maxWidth: '320px', border: '0.5px solid rgba(201,168,76,0.2)', textAlign: 'center' }}>

              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '18px', color: '#1A1208', marginBottom: '4px' }}>
                {qrTable.table_name || `Table ${qrTable.table_number}`}
              </div>
              <div style={{ fontSize: '11px', color: '#8A7A5A', marginBottom: '6px' }}>Scan to view menu</div>
              <div style={{ marginBottom: '16px' }}>
                <span style={{ fontSize: '9px', padding: '2px 8px', borderRadius: '6px', background: qrTable.type === 'ac' ? '#DBEAFE' : '#F3F4F6', color: qrTable.type === 'ac' ? '#1D4ED8' : '#374151', fontWeight: '500' }}>
                  {qrTable.type === 'ac' ? 'AC' : 'Non-AC'}
                </span>
              </div>

              {/* QR Code */}
              <div style={{ display: 'inline-block', padding: '16px', background: '#fff', borderRadius: '14px', border: '0.5px solid rgba(201,168,76,0.2)', marginBottom: '16px' }}>
                <QRCodeCanvas
                  id="qr-canvas"
                  value={`https://ice-magic.netlify.app/menu/${qrTable.table_number}`}
                  size={180}
                  bgColor="#ffffff"
                  fgColor="#1A1208"
                  level="H"
                />
              </div>

              {/* URL */}
              <div style={{ fontSize: '10px', color: '#8A7A5A', background: '#F5E6C0', borderRadius: '8px', padding: '6px 12px', marginBottom: '20px', wordBreak: 'break-all' }}>
                https://ice-magic.netlify.app/menu/{qrTable.table_number}
              </div>

              {/* Buttons */}
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={handleDownloadQR} style={{ flex: 1, padding: '10px', background: '#C9A84C', color: '#1A1208', border: 'none', borderRadius: '10px', fontSize: '12px', fontWeight: '500', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>
                  Download QR
                </button>
                <button onClick={() => { setShowQrModal(false); setQrTable(null); }} style={{ flex: 1, padding: '10px', background: 'transparent', color: '#8A7A5A', border: '0.5px solid rgba(201,168,76,0.2)', borderRadius: '10px', fontSize: '12px', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ─── ORDER SCREEN ─────────────────────────────────────────────────────────────
  if (screen === 'order') {
    const filteredItems = allMenuItems.filter(item =>
      !menuSearch || item.name.toLowerCase().includes(menuSearch.toLowerCase())
    );
    const tableType = selectedTable?.type || 'non-ac';

    return (
      <div style={{ minHeight: '100vh', background: '#FDF8EE', ...st }}>
        <NavBar showBack />
        <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 48px)' }}>

          <div style={{ background: '#FFFDF7', borderBottom: '0.5px solid rgba(201,168,76,0.18)', padding: '12px 16px', flexShrink: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontFamily: "'Playfair Display', serif", fontSize: '14px', color: '#1A1208' }}>
                  {selectedTable?.table_name || `Table ${selectedTable?.table_number}`}
                </span>
                <span style={{ fontSize: '8px', padding: '1px 6px', borderRadius: '4px', background: tableType === 'ac' ? '#DBEAFE' : '#F3F4F6', color: tableType === 'ac' ? '#1D4ED8' : '#374151' }}>
                  {tableType === 'ac' ? 'AC' : 'Non-AC'}
                </span>
              </div>
              <span style={{ fontFamily: "'Playfair Display', serif", fontSize: '18px', color: '#C9A84C' }}>₹{totalAmount}</span>
            </div>

            {!order?.items?.length ? (
              <p style={{ fontSize: '11px', color: '#8A7A5A', textAlign: 'center', padding: '4px 0' }}>Tap items below to add</p>
            ) : (
              <div style={{ maxHeight: '120px', overflowY: 'auto' }}>
                {order.items.map(item => (
                  <div key={item.menuItem_id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '3px 0', borderBottom: '0.5px solid rgba(201,168,76,0.08)' }}>
                    <span style={{ fontSize: '11px', color: '#1A1208', flex: 1 }}>{item.name}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <button onClick={() => updateQuantity(item.menuItem_id, -1)} style={{ width: '18px', height: '18px', borderRadius: '50%', border: '0.5px solid rgba(201,168,76,0.3)', background: '#FDF8EE', cursor: 'pointer', fontSize: '12px', color: '#1A1208', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</button>
                      <span style={{ fontSize: '11px', fontWeight: '500', minWidth: '14px', textAlign: 'center' }}>{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.menuItem_id, 1)} style={{ width: '18px', height: '18px', borderRadius: '50%', border: '0.5px solid rgba(201,168,76,0.3)', background: '#FDF8EE', cursor: 'pointer', fontSize: '12px', color: '#1A1208', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
                      <span style={{ fontSize: '11px', color: '#C9A84C', minWidth: '40px', textAlign: 'right' }}>₹{formatAmount((Number(item.price) || 0) * (Number(item.quantity) || 0))}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
              <input placeholder="Special instructions..." value={notes} onChange={(e) => setNotes(e.target.value)}
                style={{ flex: 1, padding: '6px 10px', border: '0.5px solid rgba(201,168,76,0.3)', borderRadius: '8px', fontSize: '11px', background: '#FDF8EE', color: '#1A1208', outline: 'none', fontFamily: "'DM Sans', sans-serif" }} />
              <button onClick={saveOrder} disabled={loading || !order?.items?.length} style={{ padding: '6px 12px', background: !order?.items?.length ? '#8A7A5A' : '#C9A84C', color: '#1A1208', border: 'none', borderRadius: '8px', fontSize: '11px', fontWeight: '500', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", whiteSpace: 'nowrap' }}>
                {loading ? '...' : 'Save'}
              </button>
              <button onClick={() => setShowBillModal(true)} disabled={!order?.items?.length} style={{ padding: '6px 12px', background: !order?.items?.length ? '#8A7A5A' : '#1A1208', color: '#C9A84C', border: '0.5px solid #C9A84C', borderRadius: '8px', fontSize: '11px', fontWeight: '500', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", whiteSpace: 'nowrap' }}>
                Bill
              </button>
            </div>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px' }}>
            <input type="text" placeholder="Search items..." value={menuSearch} onChange={(e) => setMenuSearch(e.target.value)}
              style={{ width: '100%', padding: '8px 14px', border: '0.5px solid rgba(201,168,76,0.3)', borderRadius: '10px', fontSize: '12px', background: '#FFFDF7', color: '#1A1208', outline: 'none', fontFamily: "'DM Sans', sans-serif", marginBottom: '14px' }} />

            {categories.map(category => {
              const catItems = filteredItems.filter(item => item.category === category);
              if (catItems.length === 0) return null;
              return (
                <div key={category} style={{ marginBottom: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                    <span style={{ fontSize: '10px', fontWeight: '500', color: '#8A7A5A', letterSpacing: '1.5px', textTransform: 'uppercase' }}>{category}</span>
                    <div style={{ flex: 1, height: '0.5px', background: 'rgba(201,168,76,0.18)' }}></div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                    {catItems.map(item => {
                      const inOrder = order?.items?.find(i => i.menuItem_id === item._id);
                      const displayPrice = tableType === 'ac' ? item.ac_price : item.non_ac_price;
                      return (
                        <div key={item._id} onClick={() => item.availability && addItem(item)} style={{
                          background: '#FFFDF7',
                          border: inOrder ? '1.5px solid #C9A84C' : '0.5px solid rgba(201,168,76,0.18)',
                          borderRadius: '12px', overflow: 'hidden',
                          opacity: item.availability ? 1 : 0.45,
                          cursor: item.availability ? 'pointer' : 'not-allowed',
                          position: 'relative'
                        }}>
                          <div style={{ height: '70px', background: 'linear-gradient(135deg, #f5e8c8, #e8d5a0)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
                            {item.image_url
                              ? <img src={item.image_url} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { e.target.style.display = 'none'; }} />
                              : <span style={{ fontSize: '24px' }}>🍽️</span>}
                            {inOrder && (
                              <div style={{ position: 'absolute', top: '4px', right: '4px', width: '18px', height: '18px', borderRadius: '50%', background: '#C9A84C', color: '#1A1208', fontSize: '10px', fontWeight: '500', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{inOrder.quantity}</div>
                            )}
                          </div>
                          <div style={{ padding: '6px 8px 8px' }}>
                            <div style={{ fontSize: '10px', fontWeight: '500', color: '#1A1208', marginBottom: '2px', lineHeight: '1.3', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{item.name}</div>
                            <div style={{ fontSize: '11px', color: '#C9A84C', fontWeight: '500' }}>₹{displayPrice}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {allMenuItems.length === 0 && (
              <div style={{ textAlign: 'center', padding: '3rem', color: '#8A7A5A' }}>No menu items. Add from Menu tab!</div>
            )}
          </div>
        </div>

        {/* Bill Modal */}
        {showBillModal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(26,18,8,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '1rem' }}>
            <div style={{ background: '#FDF8EE', borderRadius: '20px', padding: '24px', width: '100%', maxWidth: '360px', border: '0.5px solid rgba(201,168,76,0.2)' }}>
              <div style={{ textAlign: 'center', marginBottom: '16px', paddingBottom: '12px', borderBottom: '0.5px dashed rgba(201,168,76,0.3)' }}>
                <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '18px', color: '#1A1208' }}>ICE MAGIC</div>
                <div style={{ fontSize: '10px', color: '#8A7A5A', marginTop: '2px' }}>
                  {selectedTable?.table_name || `Table ${selectedTable?.table_number}`} • {tableType === 'ac' ? 'AC' : 'Non-AC'} — {new Date().toLocaleDateString('en-IN')}
                </div>
              </div>
              <input type="text" placeholder="Customer Name" value={customerName} onChange={(e) => setCustomerName(e.target.value)} style={inputStyle} />
              <div style={{ marginBottom: '12px' }}>
                {order?.items?.map(item => (
                  <div key={item.menuItem_id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', padding: '4px 0', color: '#1A1208' }}>
                    <span>{item.name} × {item.quantity}</span>
                    <span>₹{formatAmount((Number(item.price) || 0) * (Number(item.quantity) || 0))}</span>
                  </div>
                ))}
                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '0.5px dashed rgba(201,168,76,0.3)', paddingTop: '8px', marginTop: '8px' }}>
                  <span style={{ fontSize: '14px', fontWeight: '500', color: '#1A1208' }}>Total</span>
                  <span style={{ fontFamily: "'Playfair Display', serif", fontSize: '18px', color: '#C9A84C' }}>₹{totalAmount}</span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                {['Cash', 'UPI', 'Card'].map(method => (
                  <button key={method} onClick={() => setPaymentMethod(method)} style={{ flex: 1, padding: '8px', background: paymentMethod === method ? '#1A1208' : '#FDF8EE', color: paymentMethod === method ? '#C9A84C' : '#8A7A5A', border: `0.5px solid ${paymentMethod === method ? '#C9A84C' : 'rgba(201,168,76,0.2)'}`, borderRadius: '8px', fontSize: '12px', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>{method}</button>
                ))}
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => setShowBillModal(false)} style={{ flex: 1, padding: '11px', background: 'transparent', color: '#8A7A5A', border: '0.5px solid rgba(201,168,76,0.2)', borderRadius: '10px', fontSize: '13px', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>Cancel</button>
                <button onClick={handleGenerateBill} disabled={loading} style={{ flex: 1, padding: '11px', background: '#C9A84C', color: '#1A1208', border: 'none', borderRadius: '10px', fontSize: '13px', fontWeight: '500', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>
                  {loading ? 'Processing...' : 'Confirm Payment'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ─── BILLS ────────────────────────────────────────────────────────────────────
  if (screen === 'bills') {
    return (
      <div style={{ minHeight: '100vh', background: '#FDF8EE', ...st }}>
        <NavBar />
        <div style={{ padding: '20px 16px' }}>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '22px', color: '#1A1208', marginBottom: '4px' }}>Bill History</h2>
          <p style={{ fontSize: '12px', color: '#8A7A5A', marginBottom: '20px' }}>All past bills</p>
          {bills.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#8A7A5A' }}>No bills yet</div>
          ) : bills.map(bill => (
            <div key={bill._id} style={{ background: '#FFFDF7', border: '0.5px solid rgba(201,168,76,0.18)', borderRadius: '14px', padding: '14px', marginBottom: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: '500', color: '#1A1208' }}>{bill.customer_name}</div>
                  <div style={{ fontSize: '10px', color: '#8A7A5A' }}>Table {bill.table_number} • {new Date(bill.createdAt).toLocaleDateString('en-IN')} {new Date(bill.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '18px', color: '#C9A84C' }}>₹{bill.total_amount}</div>
                  <div style={{ fontSize: '9px', padding: '2px 8px', borderRadius: '8px', background: '#D8F3DC', color: '#2D6A4F', display: 'inline-block' }}>{bill.payment_method}</div>
                </div>
              </div>
              <div style={{ borderTop: '0.5px dashed rgba(201,168,76,0.2)', paddingTop: '8px' }}>
                {bill.items?.map((item, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#8A7A5A', padding: '2px 0' }}>
                    <span>{item.name} × {item.quantity}</span>
                    <span>₹{formatAmount((Number(item.price) || 0) * (Number(item.quantity) || 0))}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ─── MENU MANAGEMENT ─────────────────────────────────────────────────────────
  if (screen === 'menu') {
    const tabItems = menuItems.filter(item => item.category === activeMenuTab);

    return (
      <div style={{ minHeight: '100vh', background: '#FDF8EE', ...st }}>
        <NavBar />
        <div style={{ padding: '20px 16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '22px', color: '#1A1208' }}>Menu</h2>
              <p style={{ fontSize: '12px', color: '#8A7A5A' }}>Manage categories and items</p>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => setShowCategoryForm(!showCategoryForm)} style={{ background: 'transparent', color: '#C9A84C', border: '0.5px solid #C9A84C', borderRadius: '10px', padding: '7px 12px', fontSize: '11px', fontWeight: '500', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>+ Category</button>
              <button onClick={() => {
                setShowMenuForm(true);
                setEditingMenu(null);
                setMenuForm({ name: '', category: activeMenuTab, ac_price: '', non_ac_price: '', image_url: '', description: '', availability: true });
              }} style={{ background: '#C9A84C', color: '#1A1208', border: 'none', borderRadius: '10px', padding: '7px 12px', fontSize: '11px', fontWeight: '500', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>+ Add Item</button>
            </div>
          </div>

          {showCategoryForm && (
            <div style={{ background: '#FFFDF7', border: '0.5px solid rgba(201,168,76,0.2)', borderRadius: '12px', padding: '14px', marginBottom: '16px' }}>
              <p style={{ fontSize: '12px', fontWeight: '500', color: '#1A1208', marginBottom: '10px' }}>Add New Category</p>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input placeholder="e.g. Desserts, Soups..." value={newCategory} onChange={e => setNewCategory(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAddCategory()}
                  style={{ flex: 1, padding: '8px 12px', border: '0.5px solid rgba(201,168,76,0.3)', borderRadius: '8px', fontSize: '13px', background: '#FDF8EE', color: '#1A1208', outline: 'none', fontFamily: "'DM Sans', sans-serif" }} />
                <button onClick={handleAddCategory} style={{ padding: '8px 16px', background: '#C9A84C', color: '#1A1208', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: '500', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>Add</button>
                <button onClick={() => setShowCategoryForm(false)} style={{ padding: '8px 12px', background: 'transparent', color: '#8A7A5A', border: '0.5px solid rgba(201,168,76,0.2)', borderRadius: '8px', fontSize: '12px', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>Cancel</button>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '8px', marginBottom: '16px' }}>
            {categories.map(cat => (
              <div key={cat} style={{ display: 'flex', alignItems: 'center', gap: '2px', flexShrink: 0 }}>
                <button onClick={() => setActiveMenuTab(cat)} style={{
                  padding: '6px 14px',
                  background: activeMenuTab === cat ? '#C9A84C' : '#FFFDF7',
                  color: activeMenuTab === cat ? '#1A1208' : '#8A7A5A',
                  border: `0.5px solid ${activeMenuTab === cat ? '#C9A84C' : 'rgba(201,168,76,0.2)'}`,
                  borderRadius: '8px', fontSize: '11px',
                  fontWeight: activeMenuTab === cat ? '500' : '400',
                  cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", whiteSpace: 'nowrap'
                }}>{cat}</button>
                {!['Veg-Starters', 'Paneer-Items', 'Ice Cream', 'Beverage'].includes(cat) && (
                  <button onClick={() => handleDeleteCategory(cat)} style={{ width: '16px', height: '16px', borderRadius: '50%', border: 'none', background: 'rgba(163,48,48,0.15)', color: '#A33030', fontSize: '10px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>×</button>
                )}
              </div>
            ))}
          </div>

          {showMenuForm && (
            <div style={{ background: '#FFFDF7', border: '0.5px solid rgba(201,168,76,0.2)', borderRadius: '14px', padding: '16px', marginBottom: '20px' }}>
              <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '15px', color: '#1A1208', marginBottom: '12px' }}>
                {editingMenu ? 'Edit Item' : `Add to ${activeMenuTab}`}
              </h3>
              <input placeholder="Item Name *" value={menuForm.name} onChange={e => setMenuForm({ ...menuForm, name: e.target.value })} style={inputStyle} />
              <select value={menuForm.category} onChange={e => setMenuForm({ ...menuForm, category: e.target.value })} style={inputStyle}>
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input placeholder="AC Price (₹) *" type="number" value={menuForm.ac_price}
                  onChange={e => setMenuForm({ ...menuForm, ac_price: e.target.value })}
                  style={{ ...inputStyle, flex: 1 }} />
                <input placeholder="Non-AC Price (₹) *" type="number" value={menuForm.non_ac_price}
                  onChange={e => setMenuForm({ ...menuForm, non_ac_price: e.target.value })}
                  style={{ ...inputStyle, flex: 1 }} />
              </div>
              {/* Image Upload */}
<div style={{ marginBottom: '10px' }}>
  <p style={{ fontSize: '11px', color: '#8A7A5A', marginBottom: '6px' }}>Food Image</p>
  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
    <label style={{
      padding: '8px 14px', background: '#F5E6C0', color: '#856A00',
      borderRadius: '8px', fontSize: '12px', cursor: 'pointer',
      border: '0.5px solid rgba(201,168,76,0.3)', fontFamily: "'DM Sans', sans-serif"
    }}>
      {uploadingImage ? 'Uploading...' : '📷 Upload Photo'}
      <input
        type="file" accept="image/*" style={{ display: 'none' }}
        onChange={handleImageUpload}
        disabled={uploadingImage}
      />
    </label>
    <span style={{ fontSize: '10px', color: '#8A7A5A' }}>or</span>
    <input
      placeholder="Paste image URL"
      value={menuForm.image_url}
      onChange={e => setMenuForm({ ...menuForm, image_url: e.target.value })}
      style={{ flex: 1, padding: '8px 12px', border: '0.5px solid rgba(201,168,76,0.3)', borderRadius: '8px', fontSize: '12px', background: '#FFFDF7', color: '#1A1208', outline: 'none', fontFamily: "'DM Sans', sans-serif" }}
    />
  </div>
</div>
              <input placeholder="Description (optional)" value={menuForm.description} onChange={e => setMenuForm({ ...menuForm, description: e.target.value })} style={inputStyle} />
              {menuForm.image_url && (
                <div style={{ marginBottom: '12px' }}>
                  <p style={{ fontSize: '10px', color: '#8A7A5A', marginBottom: '6px' }}>Preview:</p>
                  <img src={menuForm.image_url} alt="preview" style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '10px', border: '0.5px solid rgba(201,168,76,0.2)' }} onError={(e) => { e.target.style.display = 'none'; }} />
                </div>
              )}
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={handleAddMenu} disabled={loading} style={{ flex: 1, padding: '10px', background: '#C9A84C', color: '#1A1208', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '500', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>
                  {loading ? 'Saving...' : editingMenu ? 'Update Item' : 'Add Item'}
                </button>
                <button onClick={() => { setShowMenuForm(false); setEditingMenu(null); }} style={{ flex: 1, padding: '10px', background: 'transparent', color: '#8A7A5A', border: '0.5px solid rgba(201,168,76,0.2)', borderRadius: '8px', fontSize: '13px', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>Cancel</button>
              </div>
            </div>
          )}

          {tabItems.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#8A7A5A' }}>No items in {activeMenuTab} yet. Click "+ Add Item"!</div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
              {tabItems.map(item => (
                <div key={item._id} style={{ background: '#FFFDF7', border: '0.5px solid rgba(201,168,76,0.18)', borderRadius: '14px', overflow: 'hidden', opacity: item.availability ? 1 : 0.65 }}>
                  <div style={{ height: '90px', background: 'linear-gradient(135deg, #f5e8c8, #e8d5a0)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
                    {item.image_url
                      ? <img src={item.image_url} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { e.target.style.display = 'none'; }} />
                      : <span style={{ fontSize: '28px' }}>🍽️</span>}
                    <div style={{ position: 'absolute', top: '5px', left: '5px', fontSize: '7px', padding: '2px 5px', borderRadius: '5px', background: item.availability ? '#D8F3DC' : '#FDECEA', color: item.availability ? '#2D6A4F' : '#A33030', fontWeight: '500' }}>
                      {item.availability ? '● On' : '● Off'}
                    </div>
                  </div>
                  <div style={{ padding: '8px 10px' }}>
                    <div style={{ fontSize: '11px', fontWeight: '500', color: '#1A1208', marginBottom: '4px', lineHeight: '1.3' }}>{item.name}</div>
                    <div style={{ fontSize: '10px', color: '#1D4ED8', marginBottom: '1px' }}>AC: ₹{item.ac_price}</div>
                    <div style={{ fontSize: '10px', color: '#374151', marginBottom: '6px' }}>Non-AC: ₹{item.non_ac_price}</div>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button onClick={() => handleToggleAvailability(item._id)} style={{ flex: 1, fontSize: '8px', padding: '4px 2px', borderRadius: '5px', background: item.availability ? '#FDECEA' : '#D8F3DC', color: item.availability ? '#A33030' : '#2D6A4F', border: 'none', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>
                        {item.availability ? 'Disable' : 'Enable'}
                      </button>
                      <button onClick={() => {
                        setEditingMenu(item);
                        setMenuForm({ name: item.name, category: item.category, ac_price: item.ac_price, non_ac_price: item.non_ac_price, image_url: item.image_url || '', description: item.description || '', availability: item.availability });
                        setShowMenuForm(true);
                      }} style={{ flex: 1, fontSize: '8px', padding: '4px 2px', borderRadius: '5px', background: '#F5E6C0', color: '#856A00', border: 'none', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>Edit</button>
                      <button onClick={() => handleDeleteMenu(item._id)} style={{ flex: 1, fontSize: '8px', padding: '4px 2px', borderRadius: '5px', background: '#FDECEA', color: '#A33030', border: 'none', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>Delete</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ─── STAFF ────────────────────────────────────────────────────────────────────
  if (screen === 'staff') {
    return (
      <div style={{ minHeight: '100vh', background: '#FDF8EE', ...st }}>
        <NavBar />
        <div style={{ padding: '20px 16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '22px', color: '#1A1208' }}>Staff</h2>
              <p style={{ fontSize: '12px', color: '#8A7A5A' }}>Manage staff accounts</p>
            </div>
            <button onClick={() => setShowStaffForm(true)} style={{ background: '#C9A84C', color: '#1A1208', border: 'none', borderRadius: '10px', padding: '8px 16px', fontSize: '12px', fontWeight: '500', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>+ Add Staff</button>
          </div>
          {showStaffForm && (
            <div style={{ background: '#FFFDF7', border: '0.5px solid rgba(201,168,76,0.2)', borderRadius: '14px', padding: '16px', marginBottom: '20px' }}>
              <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '15px', color: '#1A1208', marginBottom: '12px' }}>Add New Staff</h3>
              <input placeholder="Full Name" value={staffForm.name} onChange={e => setStaffForm({ ...staffForm, name: e.target.value })} style={inputStyle} />
              <input placeholder="Username" value={staffForm.username} onChange={e => setStaffForm({ ...staffForm, username: e.target.value })} style={inputStyle} />
              <input placeholder="Password" type="password" value={staffForm.password} onChange={e => setStaffForm({ ...staffForm, password: e.target.value })} style={inputStyle} />
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={handleAddStaff} disabled={loading} style={{ flex: 1, padding: '10px', background: '#C9A84C', color: '#1A1208', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '500', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>
                  {loading ? 'Creating...' : 'Create Staff'}
                </button>
                <button onClick={() => setShowStaffForm(false)} style={{ flex: 1, padding: '10px', background: 'transparent', color: '#8A7A5A', border: '0.5px solid rgba(201,168,76,0.2)', borderRadius: '8px', fontSize: '13px', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>Cancel</button>
              </div>
            </div>
          )}
          {staff.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#8A7A5A' }}>No staff yet. Click "+ Add Staff"!</div>
          ) : staff.map(member => (
            <div key={member._id} style={{ background: '#FFFDF7', border: '0.5px solid rgba(201,168,76,0.18)', borderRadius: '12px', padding: '12px 14px', marginBottom: '10px', display: 'flex', alignItems: 'center' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#F5E6C0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: '500', color: '#856A00', marginRight: '10px', flexShrink: 0 }}>
                {member.name?.charAt(0).toUpperCase()}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '13px', fontWeight: '500', color: '#1A1208' }}>{member.name}</div>
                <div style={{ fontSize: '10px', color: '#8A7A5A' }}>@{member.username}</div>
              </div>
              <button onClick={() => handleDeleteStaff(member._id)} style={{ fontSize: '10px', padding: '4px 10px', borderRadius: '6px', background: '#FDECEA', color: '#A33030', border: 'none', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>Delete</button>
            </div>
          ))}
        </div>
      </div>
    );
  }
};

export default AdminDashboard;