import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/auth.store';

export default function AdminLayout() {
  const navigate = useNavigate();
  const logout = useAuthStore((s) => s.logout);
  const user = useAuthStore((s) => s.user);

  const handleLogout = () => {
    logout();
    navigate('/admin/login', { replace: true });
  };

  return (
    <div style={styles.shell}>
      <aside style={styles.sidebar}>
        <div style={styles.logo}>🍜 Admin Panel</div>
        {user && <div style={styles.userInfo}>👤 {user.name} ({user.role})</div>}
        <nav style={styles.nav}>
          <NavLink to="/admin/orders" style={navStyle}>📋 Đơn hàng</NavLink>
          <NavLink to="/kitchen" target="_blank" style={navStyle}>👨‍🍳 Bếp & Bar (KDS) ↗</NavLink>
          <NavLink to="/admin/menu" style={navStyle}>🍽️ Thực đơn</NavLink>
          <NavLink to="/admin/tables" style={navStyle}>🪑 Bàn & QR</NavLink>
          <NavLink to="/admin/settings" style={navStyle}>💳 Cấu hình VietQR</NavLink>
        </nav>
        <button style={styles.logoutBtn} onClick={handleLogout}>
          🚪 Đăng xuất
        </button>
      </aside>
      <main style={styles.main}>
        <Outlet />
      </main>
    </div>
  );
}

function navStyle({ isActive }: { isActive: boolean }): React.CSSProperties {
  return {
    display: 'block',
    padding: '10px 16px',
    borderRadius: 8,
    textDecoration: 'none',
    color: isActive ? '#fff' : '#ddd',
    background: isActive ? 'rgba(255,255,255,0.2)' : 'transparent',
    fontWeight: isActive ? 700 : 400,
    marginBottom: 4,
  };
}

const styles: Record<string, React.CSSProperties> = {
  shell: { display: 'flex', minHeight: '100vh' },
  sidebar: {
    width: 200,
    background: '#1a1a2e',
    flexShrink: 0,
    padding: '20px 12px',
    display: 'flex',
    flexDirection: 'column',
  },
  logo: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 700,
    marginBottom: 8,
    paddingLeft: 8,
  },
  userInfo: {
    color: '#888',
    fontSize: 12,
    marginBottom: 20,
    paddingLeft: 8,
  },
  nav: { display: 'flex', flexDirection: 'column', flex: 1 },
  logoutBtn: {
    padding: '10px 16px',
    background: 'rgba(255,255,255,0.08)',
    color: '#ff8a80',
    border: '1px solid rgba(255,138,128,0.2)',
    borderRadius: 8,
    cursor: 'pointer',
    textAlign: 'left',
    fontSize: 14,
    marginTop: 'auto',
  },
  main: { flex: 1, background: '#f5f7fa', overflowY: 'auto' },
};
