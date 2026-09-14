import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api/client';
import { useCartStore } from '../../stores/cart.store';

export default function CartPage() {
  const navigate = useNavigate();
  const {
    items,
    tableId,
    updateQuantity,
    updateItemNotes,
    orderNotes,
    setOrderNotes,
    removeItem,
    clearCart,
    totalQuantity,
    totalPrice,
  } = useCartStore();

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const QUICK_SUGGESTIONS = ['Ít ngọt', 'Thêm đá', 'Ít đá', 'Không hành', 'Nhiều cay', 'Ít cay'];

  const handleOrder = async () => {
    if (items.length === 0) return;
    if (!tableId) {
      navigate('/', { replace: true });
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);
    try {
      await api.post('/orders', {
        tableId,
        notes: orderNotes,
        items: items.map((i) => ({
          menuItemId: i.menuItemId,
          quantity: i.quantity,
          notes: i.notes,
        })),
      });
      clearCart();
      navigate('/order-success');
    } catch (err: unknown) {
      const e = err as Error & { body?: { error?: string } };
      if (e.body?.error === 'TABLE_INACTIVE') {
        setErrorMsg('Bàn này hiện không phục vụ.');
      } else if (e.body?.error === 'ITEM_UNAVAILABLE') {
        setErrorMsg('Có món đã hết hàng trong giỏ. Vui lòng xóa bớt và thử lại.');
      } else {
        setErrorMsg('Đặt món thất bại. Vui lòng thử lại.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (items.length === 0) {
    return (
      <div style={styles.empty}>
        <div style={styles.emptyIcon}>🛒</div>
        <h3>Giỏ hàng trống</h3>
        <p>Hãy chọn món từ thực đơn nhé.</p>
        <button style={styles.backBtn} onClick={() => navigate('/menu')}>
          Xem thực đơn
        </button>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <button style={styles.backArrow} onClick={() => navigate('/menu')}>←</button>
        <h2 style={styles.title}>Giỏ hàng</h2>
      </div>

      <div style={styles.list}>
        {items.map((item) => (
          <div key={item.menuItemId} style={styles.rowCard}>
            <div style={styles.rowTop}>
              {item.imageUrl && (
                <img src={item.imageUrl} alt={item.name} style={styles.thumb} />
              )}
              {!item.imageUrl && <div style={styles.thumbPlaceholder}>🍽️</div>}
              <div style={styles.info}>
                <p style={styles.name}>{item.name}</p>
                <p style={styles.price}>
                  {(item.price * item.quantity).toLocaleString('vi-VN')}đ
                </p>
              </div>
              <div style={styles.controls}>
                <button
                  style={styles.ctrlBtn}
                  onClick={() => updateQuantity(item.menuItemId, item.quantity - 1)}
                >−</button>
                <span style={styles.qty}>{item.quantity}</span>
                <button
                  style={styles.ctrlBtn}
                  onClick={() => updateQuantity(item.menuItemId, item.quantity + 1)}
                >+</button>
                <button
                  style={styles.delBtn}
                  onClick={() => removeItem(item.menuItemId)}
                >🗑️</button>
              </div>
            </div>

            {/* Note field for item */}
            <div style={styles.noteSection}>
              <input
                style={styles.noteInput}
                placeholder="✍️ Ghi chú (VD: ít đường, thêm đá, không hành...)"
                value={item.notes || ''}
                onChange={(e) => updateItemNotes(item.menuItemId, e.target.value)}
              />
              <div style={styles.tagsRow}>
                {QUICK_SUGGESTIONS.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    style={styles.tagBtn}
                    onClick={() => {
                      const current = item.notes || '';
                      const newNotes = current ? `${current}, ${tag}` : tag;
                      updateItemNotes(item.menuItemId, newNotes);
                    }}
                  >
                    +{tag}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ))}

        {/* General Order Notes */}
        <div style={styles.generalNoteCard}>
          <label style={styles.generalNoteLabel}>📝 Ghi chú chung cho toàn bộ đơn hàng</label>
          <textarea
            style={styles.generalNoteInput}
            placeholder="Ví dụ: Lấy cho em thêm thìa đũa, mang nước trước..."
            value={orderNotes}
            onChange={(e) => setOrderNotes(e.target.value)}
            rows={2}
          />
        </div>
      </div>

      <div style={styles.summary}>
        <p>Tổng {totalQuantity()} món</p>
        <p style={styles.total}>{totalPrice().toLocaleString('vi-VN')}đ</p>
      </div>

      {errorMsg && <p style={styles.error}>{errorMsg}</p>}

      <button
        style={{ ...styles.orderBtn, opacity: submitting ? 0.6 : 1 }}
        disabled={submitting}
        onClick={handleOrder}
      >
        {submitting ? 'Đang gửi...' : `Đặt món — ${totalPrice().toLocaleString('vi-VN')}đ`}
      </button>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: { minHeight: '100vh', background: '#fafafa', paddingBottom: 100 },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '16px',
    background: '#fff',
    borderBottom: '1px solid #eee',
    position: 'sticky',
    top: 0,
    zIndex: 10,
  },
  backArrow: {
    background: 'none',
    border: 'none',
    fontSize: 22,
    cursor: 'pointer',
    padding: '0 4px',
  },
  title: { margin: 0, fontSize: 18 },
  list: { padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 12 },
  rowCard: {
    background: '#fff',
    borderRadius: 12,
    padding: '12px',
    boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  rowTop: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  },
  thumb: { width: 56, height: 56, borderRadius: 8, objectFit: 'cover', flexShrink: 0 },
  thumbPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 8,
    background: '#f5f5f5',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 24,
    flexShrink: 0,
  },
  info: { flex: 1 },
  name: { margin: '0 0 4px', fontWeight: 600, fontSize: 14 },
  price: { margin: 0, color: '#e53935', fontSize: 13 },
  controls: { display: 'flex', alignItems: 'center', gap: 6 },
  ctrlBtn: {
    width: 28,
    height: 28,
    border: '1px solid #ddd',
    borderRadius: '50%',
    background: '#f5f5f5',
    cursor: 'pointer',
    fontSize: 16,
  },
  qty: { fontSize: 15, fontWeight: 600, minWidth: 20, textAlign: 'center' },
  delBtn: { background: 'none', border: 'none', cursor: 'pointer', fontSize: 16 },
  noteSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    background: '#fcfcfc',
    padding: 8,
    borderRadius: 8,
    border: '1px solid #f0f0f0',
  },
  noteInput: {
    padding: '7px 10px',
    border: '1px solid #e0e0e0',
    borderRadius: 6,
    fontSize: 13,
    outline: 'none',
  },
  tagsRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 6,
  },
  tagBtn: {
    padding: '3px 8px',
    background: '#f0f4f8',
    color: '#1976d2',
    border: '1px solid #d0e1f9',
    borderRadius: 12,
    fontSize: 11,
    cursor: 'pointer',
    fontWeight: 500,
  },
  generalNoteCard: {
    background: '#fff',
    borderRadius: 12,
    padding: 12,
    boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  generalNoteLabel: {
    fontSize: 13,
    fontWeight: 600,
    color: '#444',
  },
  generalNoteInput: {
    padding: '8px 10px',
    border: '1px solid #e0e0e0',
    borderRadius: 8,
    fontSize: 13,
    outline: 'none',
    resize: 'none',
    fontFamily: 'inherit',
  },
  summary: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '12px 20px',
    background: '#fff',
    borderTop: '1px solid #eee',
    borderBottom: '1px solid #eee',
    margin: '8px 0',
  },
  total: { fontWeight: 700, fontSize: 16, color: '#e53935' },
  error: {
    color: '#e53935',
    background: '#fff3f3',
    margin: '8px 16px',
    padding: '10px 16px',
    borderRadius: 8,
    fontSize: 14,
  },
  orderBtn: {
    position: 'fixed',
    bottom: 16,
    left: '50%',
    transform: 'translateX(-50%)',
    width: 'calc(100% - 32px)',
    maxWidth: 480,
    background: '#e53935',
    color: '#fff',
    border: 'none',
    borderRadius: 12,
    padding: '16px',
    fontSize: 16,
    fontWeight: 700,
    cursor: 'pointer',
    boxShadow: '0 4px 16px rgba(229,57,53,0.4)',
    zIndex: 100,
  },
  empty: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    color: '#666',
  },
  emptyIcon: { fontSize: 56, marginBottom: 8 },
  backBtn: {
    marginTop: 16,
    padding: '10px 24px',
    background: '#e53935',
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    cursor: 'pointer',
    fontSize: 15,
  },
};
