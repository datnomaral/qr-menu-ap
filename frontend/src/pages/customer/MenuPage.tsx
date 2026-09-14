import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api/client';
import { useCartStore } from '../../stores/cart.store';
import type { Category, MenuItem } from '../../types';

export default function MenuPage() {
  const navigate = useNavigate();
  const tableId = useCartStore((s) => s.tableId);
  const { addItem, items, totalQuantity, totalPrice } = useCartStore();

  const [categories, setCategories] = useState<Category[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [loadingItems, setLoadingItems] = useState(false);

  useEffect(() => {
    if (!tableId) {
      navigate('/', { replace: true });
    }
  }, [tableId, navigate]);

  const fetchCategories = () => {
    setLoading(true);
    setLoadError(false);
    const timeout = setTimeout(() => setLoadError(true), 10_000);
    api.get<Category[]>('/categories')
      .then((cats) => {
        clearTimeout(timeout);
        setCategories(cats);
        if (cats.length > 0) setSelectedCategory(cats[0].id);
        setLoading(false);
      })
      .catch(() => {
        clearTimeout(timeout);
        setLoadError(true);
        setLoading(false);
      });
  };

  useEffect(() => { fetchCategories(); }, []);

  useEffect(() => {
    if (!selectedCategory) return;
    setLoadingItems(true);
    api.get<MenuItem[]>(`/menu-items?categoryId=${selectedCategory}`)
      .then((data) => { setMenuItems(data); setLoadingItems(false); })
      .catch(() => setLoadingItems(false));
  }, [selectedCategory]);

  const cartQty = totalQuantity();
  const cartTotal = totalPrice();

  const getItemQty = (id: string) =>
    items.find((i) => i.menuItemId === id)?.quantity ?? 0;

  if (loading) {
    return (
      <div style={styles.center}>
        <div style={styles.spinner} />
        <p>Đang tải thực đơn...</p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div style={styles.center}>
        <p style={{ color: '#e53935' }}>Không thể tải thực đơn.</p>
        <button style={styles.retryBtn} onClick={fetchCategories}>Thử lại</button>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      {/* Category tabs */}
      <div style={styles.tabs}>
        {categories.map((cat) => (
          <button
            key={cat.id}
            style={{
              ...styles.tab,
              ...(selectedCategory === cat.id ? styles.tabActive : {}),
            }}
            onClick={() => setSelectedCategory(cat.id)}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Menu items */}
      <div style={styles.grid}>
        {loadingItems ? (
          <div style={styles.center}><div style={styles.spinner} /></div>
        ) : menuItems.length === 0 ? (
          <p style={{ color: '#999', padding: 24 }}>Không có món trong danh mục này.</p>
        ) : (
          menuItems.map((item) => (
            <div
              key={item.id}
              style={{
                ...styles.card,
                opacity: item.isAvailable ? 1 : 0.55,
              }}
            >
              {item.imageUrl && (
                <img src={item.imageUrl} alt={item.name} style={styles.img} />
              )}
              {!item.imageUrl && <div style={styles.imgPlaceholder}>🍽️</div>}
              <div style={styles.cardBody}>
                <p style={styles.itemName}>{item.name}</p>
                <p style={styles.itemPrice}>
                  {Number(item.price).toLocaleString('vi-VN')}đ
                </p>
                {!item.isAvailable ? (
                  <span style={styles.soldOut}>Hết hàng</span>
                ) : (
                  <div style={styles.qtyRow}>
                    {getItemQty(item.id) > 0 && (
                      <>
                        <button
                          style={styles.qtyBtn}
                          onClick={() =>
                            useCartStore.getState().updateQuantity(
                              item.id,
                              getItemQty(item.id) - 1
                            )
                          }
                        >−</button>
                        <span style={styles.qtyNum}>{getItemQty(item.id)}</span>
                      </>
                    )}
                    <button
                      style={styles.addBtn}
                      onClick={() =>
                        addItem({
                          menuItemId: item.id,
                          name: item.name,
                          price: Number(item.price),
                          imageUrl: item.imageUrl,
                        })
                      }
                    >
                      +
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Cart bar */}
      {cartQty > 0 && (
        <div style={styles.cartBar} onClick={() => navigate('/cart')}>
          <span style={styles.cartBadge}>{cartQty}</span>
          <span style={styles.cartLabel}>Xem giỏ hàng</span>
          <span style={styles.cartTotal}>{cartTotal.toLocaleString('vi-VN')}đ</span>
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: { minHeight: '100vh', background: '#fafafa', paddingBottom: 80 },
  tabs: {
    display: 'flex',
    gap: 8,
    padding: '12px 16px',
    overflowX: 'auto',
    background: '#fff',
    borderBottom: '1px solid #eee',
    position: 'sticky',
    top: 0,
    zIndex: 10,
  },
  tab: {
    padding: '8px 16px',
    borderRadius: 20,
    border: '1px solid #ddd',
    background: '#f5f5f5',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    fontSize: 14,
  },
  tabActive: {
    background: '#e53935',
    color: '#fff',
    border: '1px solid #e53935',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
    gap: 12,
    padding: 16,
  },
  card: {
    background: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
  },
  img: { width: '100%', height: 120, objectFit: 'cover' },
  imgPlaceholder: {
    width: '100%',
    height: 120,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#f5f5f5',
    fontSize: 36,
  },
  cardBody: { padding: '8px 10px 10px' },
  itemName: { margin: '0 0 4px', fontWeight: 600, fontSize: 14 },
  itemPrice: { margin: '0 0 8px', color: '#e53935', fontSize: 14 },
  soldOut: {
    fontSize: 12,
    color: '#999',
    background: '#f5f5f5',
    padding: '2px 8px',
    borderRadius: 8,
  },
  qtyRow: { display: 'flex', alignItems: 'center', gap: 8 },
  qtyBtn: {
    width: 28,
    height: 28,
    border: '1px solid #ddd',
    borderRadius: '50%',
    background: '#f5f5f5',
    cursor: 'pointer',
    fontSize: 16,
  },
  qtyNum: { fontSize: 15, fontWeight: 600, minWidth: 20, textAlign: 'center' },
  addBtn: {
    width: 28,
    height: 28,
    border: 'none',
    borderRadius: '50%',
    background: '#e53935',
    color: '#fff',
    cursor: 'pointer',
    fontSize: 20,
    lineHeight: 1,
  },
  cartBar: {
    position: 'fixed',
    bottom: 16,
    left: '50%',
    transform: 'translateX(-50%)',
    width: 'calc(100% - 32px)',
    maxWidth: 480,
    background: '#e53935',
    color: '#fff',
    borderRadius: 12,
    padding: '14px 20px',
    display: 'flex',
    alignItems: 'center',
    cursor: 'pointer',
    boxShadow: '0 4px 16px rgba(229,57,53,0.4)',
    zIndex: 100,
  },
  cartBadge: {
    background: 'rgba(255,255,255,0.3)',
    borderRadius: 8,
    padding: '2px 10px',
    fontWeight: 700,
    marginRight: 12,
  },
  cartLabel: { flex: 1, fontWeight: 600 },
  cartTotal: { fontWeight: 700 },
  center: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '60vh',
    gap: 16,
  },
  spinner: {
    width: 36,
    height: 36,
    border: '4px solid #eee',
    borderTop: '4px solid #e53935',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
  retryBtn: {
    padding: '10px 24px',
    background: '#e53935',
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    cursor: 'pointer',
    fontSize: 15,
  },
};
