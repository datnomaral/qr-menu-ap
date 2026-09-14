import { useEffect, useState, useRef } from 'react';
import { api } from '../../api/client';
import type { Order } from '../../types';

export default function KitchenPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Web Audio API Synthesizer for "Ting Ting" Chime
  const playChimeSound = () => {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtx();

      // First note (High pitch "Ting")
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(1046.5, ctx.currentTime); // C6 note
      gain1.gain.setValueAtTime(0.5, ctx.currentTime);
      gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(ctx.currentTime);
      osc1.stop(ctx.currentTime + 0.5);

      // Second note (Higher pitch "Ting")
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(1318.5, ctx.currentTime + 0.15); // E6 note
      gain2.gain.setValueAtTime(0.6, ctx.currentTime + 0.15);
      gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.7);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(ctx.currentTime + 0.15);
      osc2.stop(ctx.currentTime + 0.7);
    } catch (e) {
      console.warn('Audio play error:', e);
    }
  };

  const soundEnabledRef = useRef(soundEnabled);
  soundEnabledRef.current = soundEnabled;

  const loadPendingOrders = () => {
    api.get<Order[]>('/orders')
      .then((data) => {
        // Only show pending, confirmed, served orders in kitchen
        const kitchenOrders = data.filter((o) => o.status !== 'completed');
        setOrders(kitchenOrders);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    loadPendingOrders();

    // Setup SSE EventSource for real-time order updates
    const envUrl = (import.meta as unknown as { env?: { VITE_BACKEND_URL?: string } }).env?.VITE_BACKEND_URL;
    const backendUrl = envUrl || 'http://localhost:3001';
    const es = new EventSource(`${backendUrl}/api/v1/orders/stream`);

    es.onmessage = (event) => {
      try {
        const newOrder: Order = JSON.parse(event.data);
        if (newOrder && newOrder.id) {
          setOrders((prev) => {
            const exists = prev.find((o) => o.id === newOrder.id);
            if (!exists && newOrder.status !== 'completed') {
              if (soundEnabledRef.current) playChimeSound();
              return [...prev, newOrder];
            }
            return prev.map((o) => (o.id === newOrder.id ? newOrder : o));
          });
        }
      } catch (err) {
        console.error('SSE parse error:', err);
      }
    };

    return () => {
      es.close();
    };
  }, []);

  const updateStatus = async (id: string, status: string) => {
    try {
      await api.put(`/orders/${id}/status`, { status });
      loadPendingOrders();
    } catch (err) {
      alert('Không thể cập nhật trạng thái đơn.');
    }
  };

  return (
    <div style={styles.page}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <span style={styles.chefIcon}>👨‍🍳</span>
          <h1 style={styles.title}>MÀN HÌNH BẾP & PHA CHẾ (KDS)</h1>
        </div>
        <div style={styles.headerRight}>
          <button
            style={{
              ...styles.soundBtn,
              background: soundEnabled ? '#2e7d32' : '#c62828',
            }}
            onClick={() => {
              setSoundEnabled(!soundEnabled);
              if (!soundEnabled) playChimeSound();
            }}
          >
            {soundEnabled ? '🔔 Chuông: Bật' : '🔕 Chuông: Tắt'}
          </button>
          <button style={styles.refreshBtn} onClick={loadPendingOrders}>
            🔄 Làm mới
          </button>
        </div>
      </div>

      {/* Orders grid */}
      <div style={styles.body}>
        {loading ? (
          <p style={styles.emptyText}>Đang tải danh sách đơn...</p>
        ) : orders.length === 0 ? (
          <div style={styles.emptyBox}>
            <div style={{ fontSize: 48 }}>✅</div>
            <p style={styles.emptyText}>Hiện chưa có đơn món nào cần chế biến.</p>
          </div>
        ) : (
          <div style={styles.grid}>
            {orders.map((order) => {
              const isPending = order.status === 'pending';
              const isConfirmed = order.status === 'confirmed';
              const timeFormatted = new Date(order.orderedAt).toLocaleTimeString('vi-VN', {
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <div
                  key={order.id}
                  style={{
                    ...styles.card,
                    borderColor: isPending ? '#ff9800' : isConfirmed ? '#2196f3' : '#4caf50',
                  }}
                >
                  <div
                    style={{
                      ...styles.cardHeader,
                      background: isPending ? '#e65100' : isConfirmed ? '#0d47a1' : '#1b5e20',
                    }}
                  >
                    <div>
                      <span style={styles.tableName}>{order.table?.name}</span>
                      <span style={styles.orderId}> #{order.id.slice(0, 6)}</span>
                    </div>
                    <span style={styles.orderTime}>⏱️ {timeFormatted}</span>
                  </div>

                  {order.notes && (
                    <div style={styles.orderNoteBox}>
                      📝 <strong>Ghi chú đơn:</strong> {order.notes}
                    </div>
                  )}

                  <ul style={styles.itemList}>
                    {order.orderItems.map((item) => (
                      <li key={item.id} style={styles.itemRow}>
                        <div style={styles.itemMain}>
                          <span style={styles.qtyBadge}>×{item.quantity}</span>
                          <span style={styles.itemName}>{item.menuItem?.name}</span>
                        </div>
                        {item.notes && (
                          <div style={styles.itemNoteBadge}>✏️ {item.notes}</div>
                        )}
                      </li>
                    ))}
                  </ul>

                  <div style={styles.cardActions}>
                    {isPending && (
                      <button
                        style={styles.confirmBtn}
                        onClick={() => updateStatus(order.id, 'confirmed')}
                      >
                        🔥 Nhận đơn (Đang nấu)
                      </button>
                    )}
                    {isConfirmed && (
                      <button
                        style={styles.doneBtn}
                        onClick={() => updateStatus(order.id, 'served')}
                      >
                        ✨ Nấu xong (Chuyển bồi bàn)
                      </button>
                    )}
                    {order.status === 'served' && (
                      <button
                        style={styles.completeBtn}
                        onClick={() => updateStatus(order.id, 'completed')}
                      >
                        ✔️ Hoàn tất đơn
                      </button>
                    )}
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

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    background: '#121212',
    color: '#ffffff',
    fontFamily: '"Segoe UI", Roboto, sans-serif',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 24px',
    background: '#1e1e1e',
    borderBottom: '2px solid #333',
    position: 'sticky',
    top: 0,
    zIndex: 100,
  },
  headerLeft: { display: 'flex', alignItems: 'center', gap: 12 },
  chefIcon: { fontSize: 28 },
  title: { margin: 0, fontSize: 20, fontWeight: 700, letterSpacing: 1 },
  headerRight: { display: 'flex', gap: 12 },
  soundBtn: {
    padding: '10px 16px',
    border: 'none',
    borderRadius: 8,
    color: '#fff',
    fontSize: 14,
    fontWeight: 700,
    cursor: 'pointer',
  },
  refreshBtn: {
    padding: '10px 16px',
    border: 'none',
    borderRadius: 8,
    background: '#333',
    color: '#fff',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
  },
  body: { padding: 24 },
  emptyBox: {
    textAlign: 'center',
    padding: '80px 20px',
    color: '#888',
  },
  emptyText: { fontSize: 18, color: '#aaa' },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: 20,
  },
  card: {
    background: '#1e1e1e',
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 2,
    borderStyle: 'solid',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
  },
  cardHeader: {
    padding: '12px 16px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tableName: { fontSize: 18, fontWeight: 800, color: '#fff' },
  orderId: { fontSize: 12, opacity: 0.8 },
  orderTime: { fontSize: 13, fontWeight: 600, color: '#fff' },
  orderNoteBox: {
    background: '#332a00',
    color: '#ffd54f',
    padding: '8px 12px',
    fontSize: 13,
    borderBottom: '1px solid #443c00',
  },
  itemList: {
    listStyle: 'none',
    margin: 0,
    padding: 16,
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  itemRow: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    borderBottom: '1px solid #2c2c2c',
    paddingBottom: 8,
  },
  itemMain: { display: 'flex', alignItems: 'center', gap: 10 },
  qtyBadge: {
    background: '#e53935',
    color: '#fff',
    fontWeight: 800,
    fontSize: 16,
    padding: '2px 8px',
    borderRadius: 6,
  },
  itemName: { fontSize: 16, fontWeight: 600 },
  itemNoteBadge: {
    fontSize: 13,
    color: '#ff8a80',
    background: '#3e1616',
    padding: '3px 8px',
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  cardActions: { padding: 12, background: '#181818' },
  confirmBtn: {
    width: '100%',
    padding: 12,
    background: '#ff9800',
    color: '#000',
    border: 'none',
    borderRadius: 8,
    fontSize: 15,
    fontWeight: 700,
    cursor: 'pointer',
  },
  doneBtn: {
    width: '100%',
    padding: 12,
    background: '#2196f3',
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    fontSize: 15,
    fontWeight: 700,
    cursor: 'pointer',
  },
  completeBtn: {
    width: '100%',
    padding: 12,
    background: '#4caf50',
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    fontSize: 15,
    fontWeight: 700,
    cursor: 'pointer',
  },
};
