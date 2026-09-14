import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../../api/client';
import { useCartStore } from '../../stores/cart.store';
import type { Table } from '../../types';

export default function LandingPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const setTableId = useCartStore((s) => s.setTableId);
  const [error, setError] = useState<'not_found' | 'inactive' | 'missing' | null>(null);

  useEffect(() => {
    const tableId = searchParams.get('tableId');
    if (!tableId) {
      setError('missing');
      return;
    }

    api.get<Table>(`/tables/${tableId}`)
      .then((table) => {
        setTableId(table.id);
        navigate('/menu', { replace: true });
      })
      .catch((err: Error & { status?: number; body?: { error?: string } }) => {
        if (err.status === 404) setError('not_found');
        else if (err.status === 403) setError('inactive');
        else setError('not_found');
      });
  }, [searchParams, navigate, setTableId]);

  if (error === 'not_found' || error === 'missing') {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <div style={styles.icon}>❌</div>
          <h2 style={styles.title}>Bàn không hợp lệ</h2>
          <p style={styles.text}>Mã QR này không còn hoạt động. Vui lòng liên hệ nhân viên.</p>
        </div>
      </div>
    );
  }

  if (error === 'inactive') {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <div style={styles.icon}>🚫</div>
          <h2 style={styles.title}>Bàn hiện không phục vụ</h2>
          <p style={styles.text}>Bàn này tạm thời không nhận đặt món. Vui lòng liên hệ nhân viên.</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.spinner} />
        <p style={styles.text}>Đang tải thực đơn...</p>
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
    background: '#f5f5f5',
  },
  card: {
    background: '#fff',
    borderRadius: 16,
    padding: '40px 32px',
    textAlign: 'center',
    boxShadow: '0 2px 16px rgba(0,0,0,0.1)',
    maxWidth: 360,
    width: '90%',
  },
  icon: { fontSize: 48, marginBottom: 16 },
  title: { margin: '0 0 8px', fontSize: 20, color: '#222' },
  text: { color: '#666', margin: 0 },
  spinner: {
    width: 40,
    height: 40,
    border: '4px solid #eee',
    borderTop: '4px solid #e53935',
    borderRadius: '50%',
    margin: '0 auto 16px',
    animation: 'spin 0.8s linear infinite',
  },
};
