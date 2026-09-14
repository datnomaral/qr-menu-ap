import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api/client';
import { useCartStore } from '../../stores/cart.store';

interface StoreConfig {
  storeName: string;
  bankId: string;
  bankAccountNo: string;
  bankAccountName: string;
}

export default function OrderSuccessPage() {
  const navigate = useNavigate();
  const tableId = useCartStore((s) => s.tableId);

  const [config, setConfig] = useState<StoreConfig | null>(null);

  useEffect(() => {
    api.get<StoreConfig>('/store-config')
      .then((data) => setConfig(data))
      .catch((err) => console.error('Load store config error:', err));
  }, []);

  // Construct VietQR Image URL
  const vietQrUrl = config
    ? `https://img.vietqr.io/image/${config.bankId}-${config.bankAccountNo}-compact2.png?accountName=${encodeURIComponent(
        config.bankAccountName
      )}&addInfo=${encodeURIComponent('THANH TOAN GOI MON QR')}`
    : null;

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.icon}>✅</div>
        <h2 style={styles.title}>Đặt món thành công!</h2>
        <p style={styles.text}>
          Đơn hàng của bạn đã được chuyển thẳng tới Bếp & Pha chế.
        </p>

        {/* VietQR Payment Card */}
        {vietQrUrl && config && (
          <div style={styles.qrCard}>
            <div style={styles.qrBadge}>💳 Thanh toán Chuyển khoản VietQR</div>
            <p style={styles.qrSubtitle}>Quét mã bằng app Ngân hàng (MB, VCB, Momo...) để thanh toán</p>
            <img src={vietQrUrl} alt="Mã VietQR Thanh Toán" style={styles.qrImg} />
            <div style={styles.bankMeta}>
              <p style={styles.bankRow}>
                <strong>Ngân hàng:</strong> {config.bankId}
              </p>
              <p style={styles.bankRow}>
                <strong>Số tài khoản:</strong> <span style={styles.accNum}>{config.bankAccountNo}</span>
              </p>
              <p style={styles.bankRow}>
                <strong>Chủ tài khoản:</strong> {config.bankAccountName}
              </p>
            </div>
          </div>
        )}

        <button
          style={styles.btn}
          onClick={() => navigate(tableId ? `/menu?tableId=${tableId}` : '/')}
        >
          ➕ Đặt thêm món khác
        </button>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#f4f6f8',
    padding: 16,
    fontFamily: '"Segoe UI", Roboto, sans-serif',
  },
  card: {
    background: '#fff',
    borderRadius: 20,
    padding: '32px 24px',
    textAlign: 'center',
    boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
    maxWidth: 420,
    width: '100%',
  },
  icon: { fontSize: 56, marginBottom: 12 },
  title: { margin: '0 0 8px', fontSize: 22, color: '#2e7d32', fontWeight: 700 },
  text: { color: '#666', margin: '0 0 20px', fontSize: 14, lineHeight: 1.5 },
  qrCard: {
    background: '#fcfcfc',
    border: '1px solid #e0e0e0',
    borderRadius: 14,
    padding: 16,
    marginBottom: 24,
  },
  qrBadge: {
    fontWeight: 700,
    fontSize: 14,
    color: '#1565c0',
    marginBottom: 4,
  },
  qrSubtitle: {
    fontSize: 12,
    color: '#777',
    margin: '0 0 12px',
  },
  qrImg: {
    width: '100%',
    maxWidth: 240,
    borderRadius: 8,
    border: '1px solid #eee',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
  },
  bankMeta: {
    marginTop: 12,
    paddingTop: 10,
    borderTop: '1px dashed #ddd',
    textAlign: 'left',
    fontSize: 13,
  },
  bankRow: { margin: '3px 0', color: '#444' },
  accNum: { fontWeight: 700, color: '#d32f2f' },
  btn: {
    width: '100%',
    padding: '14px',
    background: '#e53935',
    color: '#fff',
    border: 'none',
    borderRadius: 12,
    cursor: 'pointer',
    fontSize: 16,
    fontWeight: 700,
    boxShadow: '0 4px 12px rgba(229,57,53,0.3)',
  },
};
