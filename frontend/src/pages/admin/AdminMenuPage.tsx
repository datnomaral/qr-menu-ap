import { useEffect, useState } from 'react';
import { api } from '../../api/client';
import type { Category, MenuItem } from '../../types';

export default function AdminMenuPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [selectedCat, setSelectedCat] = useState<string | null>(null);

  // Category form
  const [newCatName, setNewCatName] = useState('');
  const [editCat, setEditCat] = useState<Category | null>(null);

  // MenuItem form
  const [showItemForm, setShowItemForm] = useState(false);
  const [editItem, setEditItem] = useState<MenuItem | null>(null);
  const [uploading, setUploading] = useState(false);
  const [itemForm, setItemForm] = useState({
    name: '', price: '', imageUrl: '', isAvailable: true, categoryId: '',
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      const res = await fetch('/api/v1/upload', { method: 'POST', body: formData });
      const data = await res.json();
      if (data.imageUrl) {
        setItemForm((prev) => ({ ...prev, imageUrl: data.imageUrl }));
      } else {
        alert('Upload ảnh thất bại.');
      }
    } catch {
      alert('Lỗi kết nối khi upload ảnh.');
    } finally {
      setUploading(false);
    }
  };

  const loadCategories = async () => {
    const data = await api.get<Category[]>('/categories');
    setCategories(data);
  };

  const loadItems = async (catId: string) => {
    const data = await api.get<MenuItem[]>(`/menu-items?categoryId=${catId}`);
    setMenuItems(data);
  };

  useEffect(() => { loadCategories(); }, []);
  useEffect(() => {
    if (selectedCat) loadItems(selectedCat);
    else setMenuItems([]);
  }, [selectedCat]);

  // Category actions
  const addCategory = async () => {
    if (!newCatName.trim()) return;
    await api.post('/categories', { name: newCatName.trim(), displayOrder: categories.length });
    setNewCatName('');
    loadCategories();
  };

  const saveEditCat = async () => {
    if (!editCat) return;
    await api.put(`/categories/${editCat.id}`, { name: editCat.name });
    setEditCat(null);
    loadCategories();
  };

  const deleteCategory = async (id: string) => {
    if (!confirm('Xóa danh mục này? Đảm bảo đã xóa hết món trước.')) return;
    try {
      await api.delete(`/categories/${id}`);
      if (selectedCat === id) setSelectedCat(null);
      loadCategories();
    } catch (err: unknown) {
      const e = err as Error & { body?: { error?: string } };
      if (e.body?.error === 'CATEGORY_HAS_ITEMS') {
        alert('Danh mục còn món ăn. Hãy xóa hết món trước khi xóa danh mục.');
      } else {
        alert('Xóa thất bại.');
      }
    }
  };

  // MenuItem actions
  const openAddItem = () => {
    setEditItem(null);
    setItemForm({ name: '', price: '', imageUrl: '', isAvailable: true, categoryId: selectedCat ?? '' });
    setShowItemForm(true);
  };

  const openEditItem = (item: MenuItem) => {
    setEditItem(item);
    setItemForm({
      name: item.name,
      price: String(item.price),
      imageUrl: item.imageUrl ?? '',
      isAvailable: item.isAvailable,
      categoryId: item.categoryId,
    });
    setShowItemForm(true);
  };

  const saveItem = async () => {
    const targetCatId = itemForm.categoryId || selectedCat;
    if (!targetCatId) {
      alert('Vui lòng chọn danh mục trước khi thêm món.');
      return;
    }
    const name = itemForm.name.trim();
    const price = parseFloat(itemForm.price);
    if (!name) {
      alert('Vui lòng nhập tên món.');
      return;
    }
    if (isNaN(price) || price < 0) {
      alert('Vui lòng nhập giá hợp lệ.');
      return;
    }

    const payload = {
      name,
      price,
      imageUrl: itemForm.imageUrl.trim() || undefined,
      isAvailable: itemForm.isAvailable,
      categoryId: targetCatId,
      displayOrder: menuItems.length,
    };

    try {
      if (editItem) {
        await api.put(`/menu-items/${editItem.id}`, payload);
      } else {
        await api.post('/menu-items', payload);
      }
      setShowItemForm(false);
      if (selectedCat) {
        loadItems(selectedCat);
      } else {
        setSelectedCat(targetCatId);
        loadItems(targetCatId);
      }
    } catch (err) {
      console.error('Save item error:', err);
      alert('Lưu món thất bại. Vui lòng kiểm tra lại thông tin.');
    }
  };

  const toggleAvailable = async (item: MenuItem) => {
    await api.put(`/menu-items/${item.id}`, { isAvailable: !item.isAvailable });
    if (selectedCat) loadItems(selectedCat);
  };

  const deleteItem = async (id: string) => {
    if (!confirm('Xóa món này?')) return;
    await api.delete(`/menu-items/${id}`);
    if (selectedCat) loadItems(selectedCat);
  };

  return (
    <div style={styles.page}>
      <h1 style={styles.heading}>Quản lý thực đơn</h1>

      <div style={styles.layout}>
        {/* Left: Categories */}
        <div style={styles.catPanel}>
          <h3 style={styles.panelTitle}>Danh mục</h3>
          <div style={styles.addRow}>
            <input
              style={styles.input}
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
              placeholder="Tên danh mục mới"
              onKeyDown={(e) => e.key === 'Enter' && addCategory()}
            />
            <button style={styles.addBtn} onClick={addCategory}>+</button>
          </div>

          {categories.map((cat) => (
            <div
              key={cat.id}
              style={{
                ...styles.catRow,
                background: selectedCat === cat.id ? '#e8eaf6' : '#fff',
                border: selectedCat === cat.id ? '1px solid #3f51b5' : '1px solid #eee',
              }}
              onClick={() => setSelectedCat(cat.id)}
            >
              {editCat?.id === cat.id ? (
                <>
                  <input
                    style={{ ...styles.input, flex: 1 }}
                    value={editCat.name}
                    onChange={(e) => setEditCat({ ...editCat, name: e.target.value })}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <button style={styles.saveBtn} onClick={(e) => { e.stopPropagation(); saveEditCat(); }}>💾</button>
                  <button style={styles.iconBtn} onClick={(e) => { e.stopPropagation(); setEditCat(null); }}>✕</button>
                </>
              ) : (
                <>
                  <span style={styles.catName}>{cat.name}</span>
                  <button style={styles.iconBtn} onClick={(e) => { e.stopPropagation(); setEditCat(cat); }}>✏️</button>
                  <button style={styles.iconBtn} onClick={(e) => { e.stopPropagation(); deleteCategory(cat.id); }}>🗑️</button>
                </>
              )}
            </div>
          ))}
        </div>

        {/* Right: MenuItems */}
        <div style={styles.itemPanel}>
          <div style={styles.itemHeader}>
            <h3 style={styles.panelTitle}>
              {selectedCat ? categories.find((c) => c.id === selectedCat)?.name : 'Chọn danh mục'}
            </h3>
            {selectedCat && (
              <button style={styles.addItemBtn} onClick={openAddItem}>+ Thêm món</button>
            )}
          </div>

          {!selectedCat && <p style={styles.hint}>← Chọn một danh mục để xem món ăn</p>}

          {menuItems.map((item) => (
            <div key={item.id} style={styles.itemRow}>
              {item.imageUrl && <img src={item.imageUrl} alt={item.name} style={styles.itemImg} />}
              {!item.imageUrl && <div style={styles.itemImgPlaceholder}>🍽️</div>}
              <div style={styles.itemInfo}>
                <p style={styles.itemName}>{item.name}</p>
                <p style={styles.itemPrice}>{Number(item.price).toLocaleString('vi-VN')}đ</p>
              </div>
              <div style={styles.itemActions}>
                <button
                  style={{
                    ...styles.availBtn,
                    background: item.isAvailable ? '#e8f5e9' : '#fff3e0',
                    color: item.isAvailable ? '#2e7d32' : '#e65100',
                  }}
                  onClick={() => toggleAvailable(item)}
                >
                  {item.isAvailable ? '✅ Còn' : '❌ Hết'}
                </button>
                <button style={styles.iconBtn} onClick={() => openEditItem(item)}>✏️</button>
                <button style={styles.iconBtn} onClick={() => deleteItem(item.id)}>🗑️</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Item form modal */}
      {showItemForm && (
        <div style={styles.overlay} onClick={() => setShowItemForm(false)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h3>{editItem ? 'Sửa món' : 'Thêm món mới'}</h3>
            <label style={styles.label}>Tên món</label>
            <input style={styles.modalInput} value={itemForm.name} onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })} />
            <label style={styles.label}>Giá (VND)</label>
            <input style={styles.modalInput} type="number" value={itemForm.price} onChange={(e) => setItemForm({ ...itemForm, price: e.target.value })} />
            <label style={styles.label}>Hình ảnh món ăn</label>

            {/* Live Preview */}
            {itemForm.imageUrl && (
              <div style={styles.previewContainer}>
                <img src={itemForm.imageUrl} alt="Preview" style={styles.previewImg} />
                <button
                  type="button"
                  style={styles.removeImgBtn}
                  onClick={() => setItemForm({ ...itemForm, imageUrl: '' })}
                >
                  ✕ Xóa ảnh
                </button>
              </div>
            )}

            {/* Choose file from computer/phone */}
            <div style={styles.uploadArea}>
              <label style={styles.fileUploadLabel}>
                {uploading ? '⏳ Đang tải ảnh lên...' : '📁 Chọn ảnh từ thiết bị (Máy tính / Điện thoại)'}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  disabled={uploading}
                  style={styles.fileInput}
                />
              </label>
            </div>

            {/* Or enter URL manually */}
            <div style={styles.orRow}>
              <span style={styles.orText}>hoặc nhập URL hình ảnh</span>
            </div>
            <input
              style={styles.modalInput}
              placeholder="https://..."
              value={itemForm.imageUrl}
              onChange={(e) => setItemForm({ ...itemForm, imageUrl: e.target.value })}
            />

            <label style={styles.checkLabel}>
              <input type="checkbox" checked={itemForm.isAvailable} onChange={(e) => setItemForm({ ...itemForm, isAvailable: e.target.checked })} />
              Còn hàng
            </label>
            <div style={styles.modalBtns}>
              <button style={styles.cancelBtn} onClick={() => setShowItemForm(false)}>Hủy</button>
              <button style={styles.saveModalBtn} onClick={saveItem} disabled={uploading}>
                {uploading ? 'Đang tải ảnh...' : 'Lưu'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: { padding: 24 },
  heading: { margin: '0 0 20px', fontSize: 22 },
  layout: { display: 'flex', gap: 20 },
  catPanel: { width: 240, flexShrink: 0 },
  itemPanel: { flex: 1 },
  panelTitle: { margin: '0 0 12px', fontSize: 16 },
  addRow: { display: 'flex', gap: 8, marginBottom: 12 },
  input: {
    padding: '8px 12px',
    border: '1px solid #ddd',
    borderRadius: 8,
    fontSize: 14,
    outline: 'none',
    width: '100%',
  },
  addBtn: {
    padding: '8px 14px',
    background: '#3f51b5',
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    cursor: 'pointer',
    fontSize: 18,
    flexShrink: 0,
  },
  catRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '10px 12px',
    borderRadius: 8,
    marginBottom: 6,
    cursor: 'pointer',
  },
  catName: { flex: 1, fontSize: 14 },
  iconBtn: { background: 'none', border: 'none', cursor: 'pointer', fontSize: 16 },
  saveBtn: { background: 'none', border: 'none', cursor: 'pointer', fontSize: 16 },
  itemHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  addItemBtn: {
    padding: '8px 16px',
    background: '#3f51b5',
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    cursor: 'pointer',
    fontSize: 14,
  },
  hint: { color: '#aaa', fontSize: 14, marginTop: 20 },
  itemRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    background: '#fff',
    borderRadius: 10,
    padding: '10px 14px',
    marginBottom: 8,
    boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
  },
  itemImg: { width: 50, height: 50, borderRadius: 8, objectFit: 'cover', flexShrink: 0 },
  itemImgPlaceholder: {
    width: 50, height: 50, borderRadius: 8, background: '#f5f5f5',
    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0,
  },
  itemInfo: { flex: 1 },
  itemName: { margin: '0 0 4px', fontWeight: 600, fontSize: 14 },
  itemPrice: { margin: 0, color: '#e53935', fontSize: 13 },
  itemActions: { display: 'flex', alignItems: 'center', gap: 8 },
  availBtn: {
    padding: '4px 10px',
    border: 'none',
    borderRadius: 6,
    cursor: 'pointer',
    fontSize: 13,
    fontWeight: 600,
  },
  overlay: {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200,
  },
  modal: {
    background: '#fff', borderRadius: 14, padding: 28,
    width: 380, maxWidth: '90vw',
    display: 'flex', flexDirection: 'column', gap: 8,
  },
  label: { fontSize: 13, color: '#555', fontWeight: 600 },
  modalInput: {
    padding: '9px 12px',
    border: '1px solid #ddd',
    borderRadius: 8,
    fontSize: 14,
    outline: 'none',
  },
  previewContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    background: '#f9f9f9',
    padding: 8,
    borderRadius: 8,
    border: '1px dashed #ccc',
  },
  previewImg: {
    width: 60,
    height: 60,
    borderRadius: 8,
    objectFit: 'cover',
  },
  removeImgBtn: {
    background: '#ffebee',
    color: '#c62828',
    border: 'none',
    padding: '6px 12px',
    borderRadius: 6,
    cursor: 'pointer',
    fontSize: 12,
    fontWeight: 600,
  },
  uploadArea: {
    margin: '4px 0',
  },
  fileUploadLabel: {
    display: 'block',
    padding: '10px 14px',
    background: '#e8eaf6',
    color: '#3f51b5',
    borderRadius: 8,
    textAlign: 'center',
    cursor: 'pointer',
    fontSize: 13,
    fontWeight: 600,
    border: '1px dashed #3f51b5',
  },
  fileInput: {
    display: 'none',
  },
  orRow: {
    textAlign: 'center',
    margin: '2px 0',
  },
  orText: {
    fontSize: 12,
    color: '#999',
  },
  checkLabel: { display: 'flex', alignItems: 'center', gap: 8, fontSize: 14 },
  modalBtns: { display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 },
  cancelBtn: {
    padding: '9px 20px', border: '1px solid #ddd', borderRadius: 8,
    background: '#fff', cursor: 'pointer', fontSize: 14,
  },
  saveModalBtn: {
    padding: '9px 20px', background: '#3f51b5', color: '#fff',
    border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 14,
  },
};
