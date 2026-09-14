import { useEffect, useRef, useState } from 'react';
import { api } from '../../api/client';
import type { Order, OrderStatus } from '../../types';
import ReceiptModal from '../../components/ReceiptModal';

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: '⏳ Chờ xác nhận',
  confirmed: '✅ Đã xác nhận',
  served: '🍽️ Đã phục vụ',
  completed: '✔️ Hoàn tất',
};

const NEXT_STATUS: Partial<Record<OrderStatus, OrderStatus>> = {
  pending: 'confirmed',
  confirmed: 'served',
  served: 'completed',
};

const STATUS_COLORS: Record<OrderStatus, string> = {
  pending: '#ff9800',
  confirmed: '#2196f3',
  served: '#4caf50',
  completed: '#9e9e9e',
};

type Filter = OrderStatus | 'all';

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState<Filter>('all');
  const [sseStatus, setSseStatus] = useState<'connected' | 'reconnecting' | 'error'>('reconnecting');
  const [selectedReceiptOrder, setSelectedReceiptOrder] = useState<Order | null>(null);
  const retryDelay = useRef(1000);
  const esRef = useRef<EventSource | null>(null);

  const fetchOrders = async () => {
    try {
      const data = await api.get<Order[]>('/orders');
      setOrders(data);
    } catch {
      // silently fail — SSE will update
    }
  };

  // SSE connection with exponential backoff
  const connect = () => {
    if (esRef.current) esRef.current.close();
    const es = new EventSource('/api/v1/orders/stream');
    esRef.current = es;

    es.onopen = () => {
      setSseStatus('connected');
      retryDelay.current = 1000;
    };

    es.addEventListener('new-order', (event) => {
      const newOrder: Order = JSON.parse(event.data);
      setOrders((prev) => {
        const exists = prev.some((o) => o.id === newOrder.id);
        if (exists) return prev;
        return [...prev, newOrder].sort(
          (a, b) => new Date(a.orderedAt).getTime() - new Date(b.orderedAt).getTime()
        );
      });
    });

    es.onerror = () => {
      setSseStatus('reconnecting');
      es.close();
      setTimeout(connect, retryDelay.current);
      retryDelay.current = Math.min(retryDelay.current * 2, 30_000);
    };
  };

  useEffect(() => {
    fetchOrders();
    connect();
    return () => { esRef.current?.close(); };
  }, []);

  const updateStatus = async (orderId: string, newStatus: OrderStatus) => {
    try {
      const updated = await api.put<Order>(`/orders/${orderId}/status`, { status: newStatus });
      setOrders((prev) => prev.map((o) => (o.id === orderId ? updated : o)));
    } catch {
      alert('Cập nhật trạng thái thất bại.');
    }
  };

  const filtered = orders
    .filter((o) => filter === 'all' || o.status === filter)
    .sort((a, b) => new Date(a.orderedAt).getTime() - new Date(b.orderedAt).getTime());

  return (
    <div style={styles.page}>
      <div style={styles.topBar}>
        <h1 style={styles.heading}>Đơn hàng</h1>
        <div style={styles.sseTag}>
          <span style={{ ...styles.dot, background: sseStatus === 'connected' ? '#4caf50' : '#ff9800' }} />
          {sseStatus === 'connected' ? 'Kết nối real-time' : 'Đang kết nối lại...'}
        </div>
      </div>

      {/* Filter tabs */}
      <div style={styles.filters}>
        {(['all', 'pending', 'confirmed', 'served', 'completed'] as Filter[]).map((s) => (
          <button
            key={s}
            style={{ ...styles.filterBtn, ...(filter === s ? styles.filterActive : {}) }}
            onClick={() => setFilter(s)}
          >
            {s === 'all' ? 'Tất cả' : STATUS_LABELS[s as OrderStatus]}
          </button>
        ))}
      </div>

      {filtered.length === 0 && (
        <p style={styles.empty}>Không có đơn hàng nào.</p>
      )}

      <div style={styles.grid}>
        {filtered.map((order) => {
          const orderTotal = order.orderItems.reduce(
            (sum, item) => sum + Number(item.priceAtOrder || 0) * item.quantity,
            0
          );

          return (
            <div key={order.id} style={styles.card}>
              <div style={styles.cardHeader}>
                <span style={styles.tableName}>{order.table.name}</span>
                <span
                  style={{
                    ...styles.statusBadge,
                    background: STATUS_COLORS[order.status],
                  }}
                >
                  {STATUS_LABELS[order.status]}
                </span>
              </div>
              <ul style={styles.itemList}>
                {order.orderItems.map((oi) => (
                  <li key={oi.id} style={styles.itemCol}>
                    <div style={styles.itemRow}>
                      <span style={styles.itemNameText}>{oi.menuItem.name}</span>
                      <span style={styles.qty}>×{oi.quantity}</span>
                    </div>
                    {oi.notes && (
                      <span style={styles.itemNote}>✏️ {oi.notes}</span>
                    )}
                  </li>
                ))}
              </ul>
              {order.notes && (
                <div style={styles.orderNoteBadge}>
                  📝 <strong>Ghi chú:</strong> {order.notes}
                </div>
              )}
              <div style={styles.totalRow}>
                <span style={styles.totalLabel}>Tổng tiền:</span>
                <span style={styles.totalVal}>{orderTotal.toLocaleString('vi-VN')}đ</span>
              </div>
              <p style={styles.time}>
                {new Date(order.orderedAt).toLocaleTimeString('vi-VN')}
              </p>

              <div style={styles.cardActions}>
                <button
                  style={styles.billBtn}
                  onClick={() => setSelectedReceiptOrder(order)}
                >
                  🖨️ Xuất Bill
                </button>
                {NEXT_STATUS[order.status] && (
                  <button
                    style={styles.actionBtn}
                    onClick={() => updateStatus(order.id, NEXT_STATUS[order.status]!)}
                  >
                    {order.status === 'pending' && '✅ Xác nhận'}
                    {order.status === 'confirmed' && '🍽️ Phục vụ'}
                    {order.status === 'served' && '✔️ Hoàn tất'}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Bill Modal */}
      {selectedReceiptOrder && (
        <ReceiptModal
          order={selectedReceiptOrder}
          onClose={() => setSelectedReceiptOrder(null)}
        />
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: { padding: 24 },
  topBar: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  heading: { margin: 0, fontSize: 22 },
  sseTag: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    fontSize: 13,
    color: '#555',
    background: '#fff',
    padding: '6px 12px',
    borderRadius: 20,
    boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
  },
  dot: { width: 8, height: 8, borderRadius: '50%', display: 'inline-block' },
  filters: { display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 },
  filterBtn: {
    padding: '6px 14px',
    borderRadius: 20,
    border: '1px solid #ddd',
    background: '#fff',
    cursor: 'pointer',
    fontSize: 13,
  },
  filterActive: { background: '#1a1a2e', color: '#fff', border: '1px solid #1a1a2e' },
  empty: { color: '#999', textAlign: 'center', marginTop: 60, fontSize: 16 },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
    gap: 16,
  },
  card: {
    background: '#fff',
    borderRadius: 12,
    padding: 16,
    boxShadow: '0 2px 8px rgba(0,0,0,0.07)',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  tableName: { fontWeight: 700, fontSize: 16 },
  statusBadge: {
    fontSize: 12,
    color: '#fff',
    padding: '3px 10px',
    borderRadius: 20,
  },
  itemList: { listStyle: 'none', margin: '0 0 10px', padding: 0 },
  itemCol: {
    display: 'flex',
    flexDirection: 'column',
    padding: '4px 0',
    borderBottom: '1px solid #f5f5f5',
  },
  itemRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: 14,
  },
  itemNameText: { fontWeight: 500 },
  qty: { color: '#888' },
  itemNote: {
    fontSize: 12,
    color: '#d32f2f',
    background: '#ffebee',
    padding: '2px 6px',
    borderRadius: 4,
    marginTop: 2,
    display: 'inline-block',
  },
  orderNoteBadge: {
    fontSize: 12,
    color: '#e65100',
    background: '#fff3e0',
    padding: '6px 8px',
    borderRadius: 6,
    margin: '6px 0',
    borderLeft: '3px solid #ff9800',
  },
  totalRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: 14,
    fontWeight: 600,
    margin: '8px 0 4px',
    paddingTop: 6,
    borderTop: '1px dashed #eee',
  },
  totalLabel: { color: '#555' },
  totalVal: { color: '#e53935' },
  time: { fontSize: 12, color: '#aaa', margin: '0 0 12px' },
  cardActions: {
    display: 'flex',
    gap: 8,
  },
  billBtn: {
    flex: 1,
    padding: '8px',
    background: '#f0f0f0',
    color: '#333',
    border: '1px solid #ddd',
    borderRadius: 8,
    cursor: 'pointer',
    fontSize: 13,
    fontWeight: 600,
  },
  actionBtn: {
    flex: 1,
    padding: '8px',
    background: '#1a1a2e',
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    cursor: 'pointer',
    fontSize: 13,
    fontWeight: 600,
  },
};
