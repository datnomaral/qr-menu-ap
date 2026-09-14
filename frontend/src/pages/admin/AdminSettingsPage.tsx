import { useEffect, useState } from 'react';
import { api } from '../../api/client';

interface StoreConfig {
  storeName: string;
  bankId: string;
  bankAccountNo: string;
  bankAccountName: string;
}

const POPULAR_BANKS = [
  { id: 'MB', name: 'MBBank (Ngân hàng Quân Đội)' },
  { id: 'VCB', name: 'Vietcombank' },
  { id: 'ICB', name: 'VietinBank' },
  { id: 'BIDV', name: 'BIDV' },
  { id: 'TPB', name: 'TPBank' },
  { id: 'TCB', name: 'Techcombank' },
  { id: 'VPB', name: 'VPBank' },
  { id: 'ACB', name: 'ACB' },
  { id: 'STB', name: 'Sacombank' },
];

export default function AdminSettingsPage() {
  const [storeName, setStoreName] = useState('QR MENU ORDER');
  const [bankId, setBankId] = useState('MB');
  const [bankAccountNo, setBankAccountNo] = useState('');
  const [bankAccountName, setBankAccountName] = useState('');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    api.get<StoreConfig>('/store-config')
      .then((data) => {
        setStoreName(data.storeName || '');
        setBankId(data.bankId || 'MB');
        setBankAccountNo(data.bankAccountNo || '');
        setBankAccountName(data.bankAccountName || '');
      })
      .catch((err) => console.error('Get store config error:', err));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMsg(null);
    try {
      await api.put('/store-config', {
        storeName,
        bankId,
        bankAccountNo,
        bankAccountName,
      });
      setMsg('✅ Đã lưu cấu hình Ngân hàng & VietQR thành công!');
    } catch (err) {
      setMsg('❌ Lưu thất bại. Vui lòng thử lại.');
    } finally {
      setSaving(false);
    }
  };

  const vietQrAutoUrl = `https://img.vietqr.io/image/${bankId}-${bankAccountNo || '00000000'}-compact2.png?accountName=${encodeURIComponent(
    bankAccountName || 'TEN CHU TAI KHOAN'
  )}&addInfo=${encodeURIComponent('THANH TOAN GOI MON QR')}`;

  return (
    <div style={styles.page}>
      <h1 style={styles.heading}>Cấu Hình Cửa Hàng & Thanh Toán VietQR</h1>

      <div style={styles.layout}>
        {/* Form panel */}
        <form onSubmit={handleSave} style={styles.formPanel}>
          <h3 style={styles.sectionTitle}>🏦 Thông tin Ngân hàng Chuyển khoản</h3>

          <div style={styles.field}>
            <label style={styles.label}>Tên Quán / Nhà Hàng</label>
            <input
              style={styles.input}
              value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
              placeholder="VD: Cà Phê Sài Gòn"
              required
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Chọn Ngân hàng</label>
            <select
              style={styles.select}
              value={bankId}
              onChange={(e) => setBankId(e.target.value)}
            >
              {POPULAR_BANKS.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} ({b.id})
                </option>
              ))}
            </select>
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Số tài khoản Ngân hàng</label>
            <input
              style={styles.input}
              value={bankAccountNo}
              onChange={(e) => setBankAccountNo(e.target.value)}
              placeholder="VD: 0388888888"
              required
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Tên Chủ tài khoản (Viết hoa không dấu)</label>
            <input
              style={styles.input}
              value={bankAccountName}
              onChange={(e) => setBankAccountName(e.target.value)}
              placeholder="VD: NGUYEN VAN A"
              required
            />
          </div>

          {msg && <div style={styles.msg}>{msg}</div>}

          <button
            type="submit"
            style={{ ...styles.saveBtn, opacity: saving ? 0.6 : 1 }}
            disabled={saving}
          >
            {saving ? 'Đang lưu...' : '💾 Lưu Cấu Hình'}
          </button>
        </form>

        {/* Live Preview panel */}
        <div style={styles.previewPanel}>
          <h3 style={styles.sectionTitle}>📱 Xem trước Mã QR Khách Quét</h3>
          <div style={styles.qrPreviewCard}>
            <img src={vietQrAutoUrl} alt="VietQR Preview" style={styles.qrImg} />
            <div style={styles.previewMeta}>
              <p><strong>Loại mã:</strong> ⚡ VietQR Tự Động ({bankId})</p>
              <p><strong>STK:</strong> {bankAccountNo || '---'}</p>
              <p><strong>Chủ TK:</strong> {bankAccountName || '---'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: { padding: 24, background: '#fafafa', minHeight: '100vh', fontFamily: '"Segoe UI", Roboto, sans-serif' },
  heading: { margin: '0 0 24px', fontSize: 22, color: '#1a1a2e' },
  layout: { display: 'flex', gap: 24, flexWrap: 'wrap' },
  formPanel: {
    flex: '1 1 400px',
    background: '#fff',
    borderRadius: 14,
    padding: 24,
    boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
  previewPanel: {
    flex: '1 1 300px',
    background: '#fff',
    borderRadius: 14,
    padding: 24,
    boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
    textAlign: 'center',
  },
  sectionTitle: { margin: '0 0 16px', fontSize: 16, color: '#1a1a2e', fontWeight: 700 },
  field: { display: 'flex', flexDirection: 'column', gap: 6 },
  label: { fontSize: 13, fontWeight: 600, color: '#444' },
  input: { padding: '10px 12px', border: '1px solid #ddd', borderRadius: 8, fontSize: 14, outline: 'none' },
  select: { padding: '10px 12px', border: '1px solid #ddd', borderRadius: 8, fontSize: 14, outline: 'none', background: '#fff' },
  saveBtn: {
    padding: '14px',
    background: '#1a1a2e',
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    fontSize: 15,
    fontWeight: 700,
    cursor: 'pointer',
    marginTop: 8,
  },
  msg: { padding: '10px 14px', borderRadius: 8, background: '#e8f5e9', color: '#2e7d32', fontSize: 13 },
  qrPreviewCard: {
    background: '#f9f9f9',
    border: '1px solid #eee',
    borderRadius: 12,
    padding: 16,
    display: 'inline-block',
  },
  qrImg: { width: 220, borderRadius: 8, border: '1px solid #e0e0e0', objectFit: 'contain' },
  previewMeta: { marginTop: 12, textAlign: 'left', fontSize: 13, color: '#555' },
};
