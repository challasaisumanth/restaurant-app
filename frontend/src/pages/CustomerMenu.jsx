import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../utils/api';

const CustomerMenu = () => {
  const { tableNumber } = useParams();
  const [screen, setScreen] = useState('welcome');
  const [categories, setCategories] = useState(['Veg-Starters', 'Paneer-Items', 'Ice Creams', 'Beverages']);
  const [categoryImages, setCategoryImages] = useState({});
  const [selectedCategory, setSelectedCategory] = useState('');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [tableType, setTableType] = useState('non-ac');
  const [allItemsCache, setAllItemsCache] = useState({});

  const categoryIcons = {
    'Veg-Starters': '🥗',
    'Paneer-Items': '🍛',
    'Ice Creams': '🍨',
    'Beverages': '🥤'
  };

  const categoryDesc = {
    'Veg-Starters': 'Fresh & handcrafted',
    'Paneer-Items': 'Rich flavours, slow cooked',
    'Ice Creams': 'Chilled & indulgent',
    'Beverages': 'Refreshing sips'
  };

  const categoryGradients = {
    'Veg-Starters': 'linear-gradient(135deg, #2D6A4F, #52B788)',
    'Paneer-Items': 'linear-gradient(135deg, #C9A84C, #E9C46A)',
    'Ice Creams': 'linear-gradient(135deg, #185FA5, #4EA8DE)',
    'Beverages': 'linear-gradient(135deg, #A33030, #E76F51)',
  };

  const getGradient = (cat) => categoryGradients[cat] || 'linear-gradient(135deg, #8A7A5A, #C9A84C)';

  // ✅ All API calls at once using Promise.all — much faster!
  useEffect(() => {
    const fetchAll = async () => {
      setCategoriesLoading(true);
      try {
        const [tableRes, catRes, menuRes] = await Promise.allSettled([
          api.get(`/tables/public/${tableNumber}`),
          api.get('/menu/categories'),
          api.get('/menu')
        ]);

        if (tableRes.status === 'fulfilled' && tableRes.value.data.table?.type) {
          setTableType(tableRes.value.data.table.type);
        }

        const fetchedCategories = Array.isArray(catRes.status === 'fulfilled' ? catRes.value.data.categories : [])
          ? (catRes.status === 'fulfilled' ? catRes.value.data.categories : [])
          : [];
        const allItems = menuRes.status === 'fulfilled' ? menuRes.value.data.items : [];
        const itemCategories = Array.from(new Set(allItems
          .map(item => item.category)
          .filter(Boolean)));
        const finalCategories = Array.from(new Set([...fetchedCategories, ...itemCategories]));
        const categoriesToUse = finalCategories.length > 0
          ? finalCategories
          : ['Veg-Starters', 'Paneer-Items', 'Ice Creams', 'Beverages'];
        setCategories(categoriesToUse);

        // Set category images from first available item per category
        const imgMap = {};
        allItems.forEach(item => {
          if (item.image_url && item.availability && !imgMap[item.category]) {
            imgMap[item.category] = item.image_url;
          }
        });
        setCategoryImages(imgMap);

        // ✅ Cache all items per category so clicking category is instant!
        const itemsCache = {};
        categoriesToUse.forEach(cat => {
          itemsCache[cat] = allItems.filter(i => i.category === cat);
        });
        setAllItemsCache(itemsCache);

      } catch (err) {
        console.error(err);
      } finally {
        setCategoriesLoading(false);
      }
    };

    fetchAll();
  }, [tableNumber]);

  // ✅ Uses cache — no API call needed when clicking category!
  const handleCategoryClick = (category) => {
    setSelectedCategory(category);
    if (allItemsCache[category]) {
      setItems(allItemsCache[category]);
    } else {
      fetchItems(category);
    }
    setScreen('items');
  };

  const fetchItems = async (category) => {
    setLoading(true);
    try {
      const res = await api.get(`/menu?category=${category}`);
      setItems(res.data.items);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // ── Loading Screen ──────────────────────────────────────────────────────────
  if (categoriesLoading && screen !== 'welcome') {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#1A1208',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '16px',
        fontFamily: "'DM Sans', sans-serif"
      }}>
        <div style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: '28px',
          color: '#C9A84C',
          letterSpacing: '3px'
        }}>ICE MAGIC</div>
        <div style={{
          fontSize: '12px',
          color: 'rgba(201,168,76,0.5)',
          letterSpacing: '2px'
        }}>
          Loading menu...
        </div>
        <div style={{
          width: '120px', height: '3px',
          background: 'rgba(201,168,76,0.15)',
          borderRadius: '2px',
          overflow: 'hidden'
        }}>
          <div style={{
            height: '100%',
            width: '40%',
            background: '#C9A84C',
            borderRadius: '2px',
            animation: 'slide 1.5s ease-in-out infinite'
          }}></div>
        </div>
        <style>{`
          @keyframes slide {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(350%); }
          }
        `}</style>
      </div>
    );
  }

  // ── Welcome Screen ──────────────────────────────────────────────────────────
  if (screen === 'welcome') {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#1A1208',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
        textAlign: 'center',
        fontFamily: "'DM Sans', sans-serif",
        position: 'relative'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.5rem' }}>
          <div style={{ height: '0.5px', width: '70px', background: 'linear-gradient(90deg, transparent, #C9A84C)' }}></div>
          <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#C9A84C' }}></div>
          <div style={{ height: '0.5px', width: '70px', background: 'linear-gradient(90deg, #C9A84C, transparent)' }}></div>
        </div>

        <h1 style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: '42px',
          color: '#C9A84C',
          letterSpacing: '3px',
          lineHeight: '1.15',
          marginBottom: '8px'
        }}>
          ICE<br />MAGIC
        </h1>

        <p style={{
          fontSize: '11px',
          color: 'rgba(201,168,76,0.45)',
          letterSpacing: '3.5px',
          textTransform: 'uppercase',
          marginBottom: '1.8rem'
        }}>
          Fine Dining Experience
        </p>

        <div style={{
          background: 'rgba(201,168,76,0.1)',
          border: '0.5px solid rgba(201,168,76,0.3)',
          borderRadius: '20px',
          padding: '6px 20px',
          fontSize: '12px',
          color: 'rgba(255,255,255,0.6)',
          letterSpacing: '1px',
          marginBottom: '1rem'
        }}>
          ✦ Table No. {tableNumber} ✦
        </div>

        <div style={{
          fontSize: '10px',
          padding: '3px 12px',
          borderRadius: '10px',
          marginBottom: '2rem',
          background: tableType === 'ac' ? 'rgba(29,78,216,0.15)' : 'rgba(255,255,255,0.06)',
          color: tableType === 'ac' ? '#93C5FD' : 'rgba(255,255,255,0.4)',
          border: `0.5px solid ${tableType === 'ac' ? 'rgba(29,78,216,0.3)' : 'rgba(255,255,255,0.1)'}`,
          letterSpacing: '1px'
        }}>
          {tableType === 'ac' ? '❄️ AC Section' : '🌿 Non-AC Section'}
        </div>

        <button
          onClick={() => setScreen('categories')}
          style={{
            background: '#C9A84C',
            color: '#1A1208',
            border: 'none',
            borderRadius: '28px',
            padding: '13px 48px',
            fontSize: '14px',
            fontWeight: '500',
            fontFamily: "'DM Sans', sans-serif",
            cursor: 'pointer',
            letterSpacing: '0.5px'
          }}
        >
          Enter
        </button>

        {/* Your name credit */}
        <div style={{
          position: 'absolute',
          bottom: '20px',
          left: 0,
          right: 0,
          textAlign: 'center',
          fontSize: '10px',
          color: 'rgba(201,168,76,0.25)',
          letterSpacing: '1px',
          fontFamily: "'DM Sans', sans-serif"
        }}>
          Designed & Developed by Sai Sumanth
        </div>
      </div>
    );
  }

  // ── Categories Screen ───────────────────────────────────────────────────────
  if (screen === 'categories') {
    return (
      <div style={{ minHeight: '100vh', background: '#1A1208', fontFamily: "'DM Sans', sans-serif" }}>

        {/* Top Bar */}
        <div style={{
          background: '#1A1208',
          padding: '14px 18px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'sticky',
          top: 0,
          zIndex: 10,
          borderBottom: '0.5px solid rgba(201,168,76,0.1)'
        }}>
          <span style={{ fontFamily: "'Playfair Display', serif", fontSize: '16px', color: '#C9A84C' }}>
            ICE MAGIC
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{
              fontSize: '9px', padding: '2px 8px', borderRadius: '8px',
              background: tableType === 'ac' ? 'rgba(29,78,216,0.2)' : 'rgba(255,255,255,0.08)',
              color: tableType === 'ac' ? '#93C5FD' : 'rgba(255,255,255,0.4)',
              border: `0.5px solid ${tableType === 'ac' ? 'rgba(29,78,216,0.3)' : 'rgba(255,255,255,0.15)'}`,
            }}>
              {tableType === 'ac' ? '❄️ AC' : '🌿 Non-AC'}
            </span>
            <span style={{
              fontSize: '10px', color: 'rgba(201,168,76,0.6)',
              background: 'rgba(201,168,76,0.1)',
              border: '0.5px solid rgba(201,168,76,0.2)',
              borderRadius: '10px', padding: '3px 10px'
            }}>
              Table {tableNumber}
            </span>
          </div>
        </div>

        <div style={{ padding: '22px 16px 32px' }}>
          <h2 style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: '26px',
            color: '#C9A84C',
            marginBottom: '4px'
          }}>
            Our Menu
          </h2>
          <p style={{ fontSize: '12px', color: 'rgba(201,168,76,0.5)', marginBottom: '24px', letterSpacing: '0.5px' }}>
            What would you like today?
          </p>

          {/* Category Grid with Images */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            {categories.map((cat) => (
              <div
                key={cat}
                onClick={() => handleCategoryClick(cat)}
                style={{
                  borderRadius: '18px',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  border: '0.5px solid rgba(201,168,76,0.2)',
                  position: 'relative',
                  aspectRatio: '1 / 1.1'
                }}
              >
                {/* Background Image or Gradient */}
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  background: categoryImages[cat] ? 'none' : getGradient(cat),
                  zIndex: 0
                }}>
                  {categoryImages[cat] && (
                    <img
                      src={categoryImages[cat]}
                      alt={cat}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.parentElement.style.background = getGradient(cat);
                      }}
                    />
                  )}
                </div>

                {/* Dark overlay */}
                <div style={{
                  position: 'absolute', inset: 0,
                  background: 'linear-gradient(to top, rgba(26,18,8,0.9) 0%, rgba(26,18,8,0.3) 50%, rgba(26,18,8,0.1) 100%)',
                  zIndex: 1
                }}></div>

                {/* Content */}
                <div style={{
                  position: 'absolute', inset: 0, zIndex: 2,
                  display: 'flex', flexDirection: 'column',
                  justifyContent: 'space-between', padding: '14px'
                }}>
                  {/* Icon top left */}
                  <div style={{
                    width: '36px', height: '36px', borderRadius: '10px',
                    background: 'rgba(201,168,76,0.2)',
                    border: '0.5px solid rgba(201,168,76,0.4)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '18px'
                  }}>
                    {categoryIcons[cat] || '🍽️'}
                  </div>

                  {/* Name + desc bottom */}
                  <div>
                    <div style={{
                      fontFamily: "'Playfair Display', serif",
                      fontSize: '16px', color: '#FFFDF7',
                      marginBottom: '3px', fontWeight: '500'
                    }}>
                      {cat}
                    </div>
                    <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.6)', marginBottom: '8px' }}>
                      {categoryDesc[cat] || 'Delicious selections'}
                    </div>
                    <div style={{
                      display: 'inline-flex', alignItems: 'center', gap: '4px',
                      background: 'rgba(201,168,76,0.2)',
                      border: '0.5px solid rgba(201,168,76,0.4)',
                      borderRadius: '20px', padding: '3px 10px',
                      fontSize: '10px', color: '#C9A84C'
                    }}>
                      View Menu ›
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── Items Screen ────────────────────────────────────────────────────────────
  if (screen === 'items') {
    const availableItems = items.filter(i => i.availability);
    const unavailableItems = items.filter(i => !i.availability);

    return (
      <div style={{ minHeight: '100vh', background: '#FDF8EE', fontFamily: "'DM Sans', sans-serif" }}>

        {/* Top Bar */}
        <div style={{
          background: '#1A1208',
          padding: '14px 18px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'sticky',
          top: 0,
          zIndex: 10
        }}>
          <span style={{ fontFamily: "'Playfair Display', serif", fontSize: '16px', color: '#C9A84C' }}>
            ICE MAGIC
          </span>
          <button
            onClick={() => setScreen('categories')}
            style={{
              fontSize: '11px', color: 'rgba(201,168,76,0.7)',
              background: 'rgba(201,168,76,0.08)',
              border: '0.5px solid rgba(201,168,76,0.2)',
              borderRadius: '8px', padding: '4px 10px',
              cursor: 'pointer', fontFamily: "'DM Sans', sans-serif"
            }}
          >
            ← Back
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{
              fontSize: '9px', padding: '2px 8px', borderRadius: '8px',
              background: tableType === 'ac' ? 'rgba(29,78,216,0.2)' : 'rgba(255,255,255,0.08)',
              color: tableType === 'ac' ? '#93C5FD' : 'rgba(255,255,255,0.4)',
              border: `0.5px solid ${tableType === 'ac' ? 'rgba(29,78,216,0.3)' : 'rgba(255,255,255,0.15)'}`,
            }}>
              {tableType === 'ac' ? '❄️ AC' : '🌿 Non-AC'}
            </span>
            <span style={{
              fontSize: '10px', color: 'rgba(201,168,76,0.6)',
              background: 'rgba(201,168,76,0.1)',
              border: '0.5px solid rgba(201,168,76,0.2)',
              borderRadius: '10px', padding: '3px 10px'
            }}>
              Table {tableNumber}
            </span>
          </div>
        </div>

        {/* Category Header Banner */}
        <div style={{
          height: '120px',
          background: categoryImages[selectedCategory] ? 'none' : getGradient(selectedCategory),
          position: 'relative',
          overflow: 'hidden'
        }}>
          {categoryImages[selectedCategory] && (
            <img
              src={categoryImages[selectedCategory]}
              alt={selectedCategory}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.parentElement.style.background = getGradient(selectedCategory);
              }}
            />
          )}
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(to right, rgba(26,18,8,0.85), rgba(26,18,8,0.4))',
            display: 'flex', alignItems: 'center', padding: '0 20px', gap: '12px'
          }}>
            <div style={{ fontSize: '32px' }}>{categoryIcons[selectedCategory] || '🍽️'}</div>
            <div>
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '20px', color: '#C9A84C' }}>
                {selectedCategory}
              </div>
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)' }}>
                {categoryDesc[selectedCategory] || 'Delicious selections'}
              </div>
            </div>
          </div>
        </div>

        <div style={{ padding: '20px 16px 32px' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#C9A84C' }}>
              Loading...
            </div>
          ) : (
            <>
              {availableItems.length > 0 && (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                    <div style={{ flex: 1, height: '0.5px', background: 'rgba(201,168,76,0.18)' }}></div>
                    <span style={{ fontSize: '9px', color: '#8A7A5A', letterSpacing: '1.5px', textTransform: 'uppercase' }}>
                      Available Now
                    </span>
                    <div style={{ flex: 1, height: '0.5px', background: 'rgba(201,168,76,0.18)' }}></div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    {availableItems.map((item) => (
                      <ItemCard key={item._id} item={item} tableType={tableType} />
                    ))}
                  </div>
                </>
              )}

              {unavailableItems.length > 0 && (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '20px 0 16px' }}>
                    <div style={{ flex: 1, height: '0.5px', background: 'rgba(201,168,76,0.18)' }}></div>
                    <span style={{ fontSize: '9px', color: '#8A7A5A', letterSpacing: '1.5px', textTransform: 'uppercase' }}>
                      Currently Unavailable
                    </span>
                    <div style={{ flex: 1, height: '0.5px', background: 'rgba(201,168,76,0.18)' }}></div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    {unavailableItems.map((item) => (
                      <ItemCard key={item._id} item={item} unavailable tableType={tableType} />
                    ))}
                  </div>
                </>
              )}

              {items.length === 0 && (
                <div style={{ textAlign: 'center', padding: '3rem', color: '#8A7A5A' }}>
                  No items in this category yet
                </div>
              )}
            </>
          )}
        </div>
      </div>
    );
  }
};

// ── Item Card ──────────────────────────────────────────────────────────────
const ItemCard = ({ item, unavailable, tableType }) => {
  const displayPrice = tableType === 'ac' ? item.ac_price : item.non_ac_price;

  return (
    <div style={{
      background: '#FFFDF7',
      border: '0.5px solid rgba(201,168,76,0.18)',
      borderRadius: '16px',
      overflow: 'hidden',
      opacity: unavailable ? 0.5 : 1
    }}>
      <div style={{
        height: '110px',
        background: 'linear-gradient(135deg, #f5e8c8, #e8d5a0)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {item.image_url ? (
          <img
            src={item.image_url}
            alt={item.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            onError={(e) => { e.target.style.display = 'none'; }}
          />
        ) : (
          <span style={{ fontSize: '38px' }}>🍽️</span>
        )}
        <span style={{
          position: 'absolute', top: '8px', right: '8px',
          fontSize: '8px', padding: '2px 7px',
          borderRadius: '6px', fontWeight: '500',
          background: unavailable ? '#FDECEA' : '#D8F3DC',
          color: unavailable ? '#A33030' : '#2D6A4F',
          border: `0.5px solid ${unavailable ? 'rgba(163,48,48,0.2)' : 'rgba(45,106,79,0.2)'}`
        }}>
          {unavailable ? 'Unavailable' : 'Available'}
        </span>
      </div>

      <div style={{ padding: '10px 12px 12px' }}>
        <div style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: '12px', color: '#1A1208',
          marginBottom: '3px', lineHeight: '1.3'
        }}>
          {item.name}
        </div>
        {item.description && (
          <div style={{ fontSize: '9px', color: '#8A7A5A', marginBottom: '6px', lineHeight: '1.4' }}>
            {item.description}
          </div>
        )}
        <div style={{ fontSize: '14px', fontWeight: '500', color: '#C9A84C' }}>
          ₹{displayPrice}
        </div>
      </div>
    </div>
  );
};

export default CustomerMenu;