import type { Order } from '../types';

interface ReceiptModalProps {
  order: Order | null;
  onClose: () => void;
}

export default function ReceiptModal({ order, onClose }: ReceiptModalProps) {
  if (!order) return null;

  const totalAmount = order.orderItems.reduce((sum, item) => {
    const price = Number(item.priceAtOrder || 0);
    return sum + price * item.quantity;
  }, 0);

  const formattedDate = new Date(order.orderedAt).toLocaleString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  const handlePrint = () => {
    window.print();
  };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Printable Bill Area */}
        <div id="printable-receipt" style={styles.receipt}>
          <div style={styles.receiptHeader}>
            <h2 style={styles.storeTitle}>MENU QR ORDER</h2>
            <p style={styles.receiptSubtitle}>HÓA ĐƠN THANH TOÁN</p>
            <div style={styles.divider} />
          </div>

          <div style={styles.metaRow}>
            <span><strong>Bàn:</strong> {order.table?.name || 'N/A'}</span>
            <span><strong>Mã đơn:</strong> #{order.id.slice(0, 8).toUpperCase()}</span>
          </div>

          <div style={styles.metaRow}>
            <span><strong>Thời gian:</strong> {formattedDate}</span>
            <span>
              <strong>Trạng thái:</strong>{' '}
              {order.status === 'completed'
                ? 'Đã hoàn tất'
                : order.status === 'served'
                ? 'Đã phục vụ'
                : order.status === 'confirmed'
                ? 'Đã xác nhận'
                : 'Chờ xác nhận'}
            </span>
          </div>

          <div style={styles.divider} />

          <table style={styles.table}>
            <thead>
              <tr style={styles.tableHeaderRow}>
                <th style={{ ...styles.th, textAlign: 'left' }}>Tên món</th>
                <th style={{ ...styles.th, textAlign: 'center' }}>SL</th>
                <th style={{ ...styles.th, textAlign: 'right' }}>Đơn giá</th>
                <th style={{ ...styles.th, textAlign: 'right' }}>Thành tiền</th>
              </tr>
            </thead>
            <tbody>
              {order.orderItems.map((item) => {
                const price = Number(item.priceAtOrder || 0);
                const itemTotal = price * item.quantity;
                return (
                  <tr key={item.id} style={styles.tableRow}>
                    <td style={styles.tdName}>
                      <div>{item.menuItem?.name || 'Món ăn'}</div>
                      {item.notes && (
                        <div style={styles.receiptItemNote}>({item.notes})</div>
                      )}
                    </td>
                    <td style={{ ...styles.td, textAlign: 'center' }}>{item.quantity}</td>
                    <td style={{ ...styles.td, textAlign: 'right' }}>
                      {price.toLocaleString('vi-VN')}đ
                    </td>
                    <td style={{ ...styles.td, textAlign: 'right', fontWeight: 600 }}>
                      {itemTotal.toLocaleString('vi-VN')}đ
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {order.notes && (
            <div style={styles.receiptOrderNote}>
              <strong>Ghi chú:</strong> {order.notes}
            </div>
          )}

          <div style={styles.divider} />

          <div style={styles.totalRow}>
            <span style={styles.totalLabel}>TỔNG CỘNG:</span>
            <span style={styles.totalValue}>{totalAmount.toLocaleString('vi-VN')} VNĐ</span>
          </div>

          <div style={styles.receiptFooter}>
            <p style={styles.thankYou}>Cảm ơn quý khách & Hẹn gặp lại!</p>
            <p style={styles.footnote}>Phần mềm quản lý gọi món QR Order</p>
          </div>
        </div>

        {/* Action Buttons (Hidden when printing) */}
        <div style={styles.modalActions} className="no-print">
          <button style={styles.closeBtn} onClick={onClose}>
            ✕ Đóng
          </button>
          <button style={styles.printBtn} onClick={handlePrint}>
            🖨️ In Hóa Đơn
          </button>
        </div>
      </div>

      {/* Print styles inserted directly */}
      <style>{`
        @media print {
          @page {
            margin: 0;
            size: 80mm auto;
          }
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            background: #fff !important;
          }
          body * {
            visibility: hidden !important;
          }
          #printable-receipt, #printable-receipt * {
            visibility: visible !important;
          }
          #printable-receipt {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 80mm !important;
            margin: 0 auto !important;
            padding: 15px 10px 20px 10px !important;
            background: #fff !important;
            color: #000 !important;
            box-shadow: none !important;
            font-size: 13px !important;
            box-sizing: border-box !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.55)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: 16,
  },
  modal: {
    background: '#fff',
    borderRadius: 16,
    padding: 24,
    maxWidth: 420,
    width: '100%',
    boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
    maxHeight: '90vh',
    overflowY: 'auto',
  },
  receipt: {
    background: '#fff',
    fontFamily: '"Segoe UI", Roboto, sans-serif',
    color: '#222',
  },
  receiptHeader: {
    textAlign: 'center',
    marginBottom: 12,
  },
  storeTitle: {
    margin: '0 0 4px',
    fontSize: 20,
    fontWeight: 800,
    letterSpacing: 1,
    color: '#1a1a2e',
  },
  receiptSubtitle: {
    margin: 0,
    fontSize: 13,
    fontWeight: 600,
    color: '#666',
  },
  divider: {
    borderBottom: '1px dashed #bbb',
    margin: '12px 0',
  },
  metaRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: 13,
    marginBottom: 6,
    color: '#444',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: 13,
    margin: '8px 0',
  },
  tableHeaderRow: {
    borderBottom: '1px solid #ddd',
  },
  th: {
    padding: '6px 4px',
    fontSize: 12,
    fontWeight: 700,
    color: '#555',
  },
  tableRow: {
    borderBottom: '1px solid #f0f0f0',
  },
  tdName: {
    padding: '8px 4px',
    fontWeight: 500,
  },
  receiptItemNote: {
    fontSize: 11,
    color: '#d32f2f',
    fontStyle: 'italic',
    marginTop: 2,
  },
  receiptOrderNote: {
    fontSize: 12,
    color: '#e65100',
    background: '#fff3e0',
    padding: '6px 8px',
    borderRadius: 4,
    margin: '8px 0',
  },
  td: {
    padding: '8px 4px',
  },
  totalRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 0',
    fontSize: 16,
  },
  totalLabel: {
    fontWeight: 700,
  },
  totalValue: {
    fontWeight: 800,
    color: '#e53935',
    fontSize: 18,
  },
  receiptFooter: {
    textAlign: 'center',
    marginTop: 16,
    paddingTop: 8,
  },
  thankYou: {
    margin: '0 0 4px',
    fontWeight: 600,
    fontSize: 13,
    color: '#333',
  },
  footnote: {
    margin: 0,
    fontSize: 11,
    color: '#888',
  },
  modalActions: {
    display: 'flex',
    gap: 12,
    marginTop: 20,
    justifyContent: 'flex-end',
  },
  closeBtn: {
    padding: '10px 18px',
    border: '1px solid #ddd',
    borderRadius: 8,
    background: '#fff',
    cursor: 'pointer',
    fontSize: 14,
    fontWeight: 600,
  },
  printBtn: {
    padding: '10px 20px',
    border: 'none',
    borderRadius: 8,
    background: '#1a1a2e',
    color: '#fff',
    cursor: 'pointer',
    fontSize: 14,
    fontWeight: 600,
  },
};
