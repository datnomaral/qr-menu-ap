import { useEffect, useState } from 'react';
import { api } from '../../api/client';
import type { Table } from '../../types';

export default function AdminTablesPage() {
  const [tables, setTables] = useState<Table[]>([]);
  const [newName, setNewName] = useState('');
  const [editTable, setEditTable] = useState<Table | null>(null);

  const load = async () => {
    const data = await api.get<Table[]>('/tables');
    setTables(data);
  };

  useEffect(() => { load(); }, []);

  const addTable = async () => {
    if (!newName.trim()) return;
    await api.post('/tables', { name: newName.trim(), isActive: true });
    setNewName('');
    load();
  };

  const saveEdit = async () => {
    if (!editTable) return;
    await api.put(`/tables/${editTable.id}`, {
      name: editTable.name,
      isActive: editTable.isActive,
    });
    setEditTable(null);
    load();
  };

  const toggleActive = async (table: Table) => {
    await api.put(`/tables/${table.id}`, { isActive: !table.isActive });
    load();
  };

  const downloadQR = async (table: Table) => {
    const res = await fetch(`/api/v1/tables/${table.id}/qr`);
    if (!res.ok) { alert('Không thể tạo QR.'); return; }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `qr-${table.name}.png`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={styles.page}>
      <h1 style={styles.heading}>Quản lý bàn & QR</h1>

      <div style={styles.addRow}>
        <input
          style={styles.input}
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Tên bàn mới (VD: Bàn 5)"
          onKeyDown={(e) => e.key === 'Enter' && addTable()}
        />
        <button style={styles.addBtn} onClick={addTable}>+ Thêm bàn</button>
      </div>

      <div style={styles.tableList}>
        {tables.map((table) => (
          <div key={table.id} style={styles.row}>
            {editTable?.id === table.id ? (
              <>
                <input
                  style={{ ...styles.input, flex: 1 }}
                  value={editTable.name}
                  onChange={(e) => setEditTable({ ...editTable, name: e.target.value })}
                />
                <button style={styles.saveBtn} onClick={saveEdit}>💾 Lưu</button>
                <button style={styles.cancelBtn} onClick={() => setEditTable(null)}>Hủy</button>
              </>
            ) : (
              <>
                <div style={styles.tableInfo}>
                  <span style={styles.tableName}>{table.name}</span>
                  <span style={{
                    ...styles.badge,
                    background: table.isActive ? '#e8f5e9' : '#fce4ec',
                    color: table.isActive ? '#2e7d32' : '#c62828',
                  }}>
                    {table.isActive ? '🟢 Hoạt động' : '🔴 Tạm dừng'}
                  </span>
                </div>
                <div style={styles.actions}>
                  <button style={styles.editBtn} onClick={() => setEditTable(table)}>✏️ Sửa</button>
                  <button
                    style={{
                      ...styles.toggleBtn,
                      background: table.isActive ? '#fff3e0' : '#e8f5e9',
                      color: table.isActive ? '#e65100' : '#2e7d32',
                    }}
                    onClick={() => toggleActive(table)}
                  >
                    {table.isActive ? '⏸ Tạm dừng' : '▶ Kích hoạt'}
                  </button>
                  <button style={styles.qrBtn} onClick={() => downloadQR(table)}>
                    📱 Tải QR
                  </button>
                </div>
              </>
            )}
          </div>
        ))}

        {tables.length === 0 && (
          <p style={styles.empty}>Chưa có bàn nào. Thêm bàn đầu tiên!</p>
        )}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: { padding: 24 },
  heading: { margin: '0 0 24px', fontSize: 22 },
  addRow: { display: 'flex', gap: 10, marginBottom: 24, maxWidth: 520 },
  input: {
    flex: 1,
    padding: '10px 14px',
    border: '1px solid #ddd',
    borderRadius: 8,
    fontSize: 14,
    outline: 'none',
  },
  addBtn: {
    padding: '10px 18px',
    background: '#3f51b5',
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    cursor: 'pointer',
    fontSize: 14,
    whiteSpace: 'nowrap',
  },
  tableList: { display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 680 },
  row: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    background: '#fff',
    borderRadius: 12,
    padding: '14px 16px',
    boxShadow: '0 1px 4px rgba(0,0,0,0.07)',
  },
  tableInfo: { flex: 1, display: 'flex', alignItems: 'center', gap: 12 },
  tableName: { fontWeight: 600, fontSize: 15 },
  badge: {
    fontSize: 12,
    padding: '3px 10px',
    borderRadius: 20,
    fontWeight: 600,
  },
  actions: { display: 'flex', gap: 8 },
  editBtn: {
    padding: '6px 12px',
    border: '1px solid #ddd',
    borderRadius: 7,
    background: '#fff',
    cursor: 'pointer',
    fontSize: 13,
  },
  toggleBtn: {
    padding: '6px 12px',
    border: 'none',
    borderRadius: 7,
    cursor: 'pointer',
    fontSize: 13,
    fontWeight: 600,
  },
  qrBtn: {
    padding: '6px 14px',
    background: '#1a1a2e',
    color: '#fff',
    border: 'none',
    borderRadius: 7,
    cursor: 'pointer',
    fontSize: 13,
  },
  saveBtn: {
    padding: '8px 14px',
    background: '#4caf50',
    color: '#fff',
    border: 'none',
    borderRadius: 7,
    cursor: 'pointer',
    fontSize: 13,
  },
  cancelBtn: {
    padding: '8px 14px',
    border: '1px solid #ddd',
    borderRadius: 7,
    background: '#fff',
    cursor: 'pointer',
    fontSize: 13,
  },
  empty: { color: '#aaa', textAlign: 'center', padding: 40 },
};
