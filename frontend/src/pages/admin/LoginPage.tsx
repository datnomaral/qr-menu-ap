import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api/client';
import { useAuthStore, User } from '../../stores/auth.store';

export default function LoginPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);

  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setError('Vui lòng nhập tên đăng nhập và mật khẩu.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await api.post<{ token: string; user: User }>('/auth/login', {
        username,
        password,
      });
      setAuth(data.token, data.user);
      navigate('/admin/orders', { replace: true });
    } catch (err: unknown) {
      const e = err as Error & { body?: { error?: string } };
      if (e.body?.error === 'INVALID_CREDENTIALS') {
        setError('Tài khoản hoặc mật khẩu không chính xác.');
      } else {
        setError('Đăng nhập thất bại. Vui lòng kiểm tra lại.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.header}>
          <div style={styles.logo}>🛡️</div>
          <h2 style={styles.title}>Đăng Nhập Quản Trị</h2>
          <p style={styles.subtitle}>Hệ thống QR Menu Order Thương Mại</p>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.field}>
            <label style={styles.label}>Tên đăng nhập</label>
            <input
              style={styles.input}
              type="text"
              placeholder="Tên tài khoản (mặc định: admin)"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={loading}
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Mật khẩu</label>
            <input
              style={styles.input}
              type="password"
              placeholder="Nhập mật khẩu (mặc định: admin123)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
            />
          </div>

          {error && <div style={styles.error}>{error}</div>}

          <button
            type="submit"
            style={{ ...styles.submitBtn, opacity: loading ? 0.7 : 1 }}
            disabled={loading}
          >
            {loading ? 'Đang xác thực...' : 'Đăng Nhập ➔'}
          </button>
        </form>

        <div style={styles.hint}>
          💡 Tài khoản mặc định: <strong>admin</strong> / <strong>admin123</strong>
        </div>
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
    background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
    padding: 16,
    fontFamily: '"Segoe UI", Roboto, sans-serif',
  },
  card: {
    background: '#ffffff',
    borderRadius: 16,
    padding: '32px 28px',
    maxWidth: 400,
    width: '100%',
    boxShadow: '0 12px 40px rgba(0,0,0,0.3)',
  },
  header: {
    textAlign: 'center',
    marginBottom: 24,
  },
  logo: {
    fontSize: 48,
    marginBottom: 8,
  },
  title: {
    margin: '0 0 4px',
    fontSize: 22,
    fontWeight: 700,
    color: '#1a1a2e',
  },
  subtitle: {
    margin: 0,
    fontSize: 13,
    color: '#666',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: 600,
    color: '#444',
  },
  input: {
    padding: '12px 14px',
    border: '1px solid #ddd',
    borderRadius: 8,
    fontSize: 14,
    outline: 'none',
    transition: 'border 0.2s',
  },
  error: {
    padding: '10px 12px',
    background: '#ffebee',
    color: '#d32f2f',
    borderRadius: 8,
    fontSize: 13,
  },
  submitBtn: {
    padding: '14px',
    background: '#1a1a2e',
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    fontSize: 15,
    fontWeight: 700,
    cursor: 'pointer',
    marginTop: 8,
    boxShadow: '0 4px 14px rgba(26,26,46,0.3)',
  },
  hint: {
    marginTop: 20,
    paddingTop: 16,
    borderTop: '1px dashed #eee',
    textAlign: 'center',
    fontSize: 12,
    color: '#888',
  },
};
