import React, { useEffect, useState } from 'react';
import { fetchCategories, createCategory, updateCategory, deleteCategory } from '../../services/catalogService';

const emptyForm = { name: '', subcategories: [''] };

const CatalogCategoriesPage = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState(null); // category id or null

  const load = async () => {
    try {
      setLoading(true);
      const data = await fetchCategories();
      setCategories(data);
      setError('');
    } catch (e) {
      setError('Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const onSubmit = async (e) => {
    e.preventDefault();
    try {
      const trimmedName = form.name.trim();
      if (!trimmedName) {
        setError('Category name is required');
        return;
      }
      const payload = {
        name: trimmedName,
        subcategories: form.subcategories.filter(s => s.trim() !== ''),
      };
      if (editing) {
        await updateCategory(editing, payload);
      } else {
        await createCategory(payload);
      }
      setForm(emptyForm);
      setEditing(null);
      await load();
    } catch (e) {
      const msg = e?.response?.data?.message || e?.message || 'Failed to save category';
      setError(msg);
      // Optional: console detail for debugging
      // eslint-disable-next-line no-console
      console.error('[CatalogCategoriesPage] save error:', {
        message: msg,
        status: e?.response?.status,
        data: e?.response?.data,
      });
    }
  };

  const onEdit = (cat) => {
    setEditing(cat._id);
    const subcats = (cat.subcategories || []).map(sub => 
      typeof sub === 'string' ? sub : (sub.name || sub.toString())
    );
    setForm({ 
      name: cat.name, 
      subcategories: subcats.length > 0 ? subcats : ['']
    });
  };

  const onDelete = async (id) => {
    if (!window.confirm('Delete this category?')) return;
    try {
      await deleteCategory(id);
      await load();
    } catch (e) {
      setError('Failed to delete category');
    }
  };

  const handleSubcategoryChange = (index, value) => {
    const newSubcategories = [...form.subcategories];
    newSubcategories[index] = value;
    setForm({ ...form, subcategories: newSubcategories });
  };

  const addSubcategoryField = () => {
    setForm({ ...form, subcategories: [...form.subcategories, ''] });
  };

  const removeSubcategoryField = (index) => {
    if (form.subcategories.length <= 1) return;
    const newSubcategories = [...form.subcategories];
    newSubcategories.splice(index, 1);
    setForm({ ...form, subcategories: newSubcategories });
  };

  return (
    <div className="catalog-categories-page">
      <h1>Catalog • Categories</h1>
      {error && <div className="error" style={{ color: 'var(--color-danger, #dc2626)' }}>{error}</div>}
      <form onSubmit={onSubmit} style={{ marginBottom: 16, display: 'grid', gap: 8 }}>
        <div>
          <label>Name</label>
          <input
            value={form.name}
            onChange={e => setForm({ ...form, name: e.target.value })}
            placeholder="e.g. Electronics"
            required
          />
        </div>
        <div>
          <label>Subcategories</label>
          {form.subcategories.map((sub, index) => (
            <div key={index} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
              <input
                value={sub}
                onChange={e => handleSubcategoryChange(index, e.target.value)}
                placeholder={`Subcategory ${index + 1}`}
                style={{ flex: 1 }}
              />
              {form.subcategories.length > 1 && (
                <button 
                  type="button" 
                  onClick={() => removeSubcategoryField(index)}
                  style={{ 
                    backgroundColor: 'var(--color-danger, #dc2626)', 
                    color: 'white', 
                    border: 'none', 
                    borderRadius: '4px',
                    padding: '6px 12px',
                    cursor: 'pointer'
                  }}
                >
                  Remove
                </button>
              )}
            </div>
          ))}
          <button 
            type="button" 
            onClick={addSubcategoryField}
            style={{ 
              backgroundColor: 'var(--color-primary, #3b82f6)', 
              color: 'white', 
              border: 'none', 
              borderRadius: '4px',
              padding: '6px 12px',
              cursor: 'pointer',
              marginTop: 8
            }}
          >
            Add Subcategory
          </button>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button type="submit" className="btn btn-primary">
            {editing ? 'Update Category' : 'Add Category'}
          </button>
          {editing && (
            <button 
              type="button" 
              onClick={() => { setEditing(null); setForm(emptyForm); }}
              style={{ 
                backgroundColor: 'var(--color-secondary, #6b7280)', 
                color: 'white', 
                border: 'none', 
                borderRadius: '4px',
                padding: '6px 12px',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      {loading ? (
        <div>Loading...</div>
      ) : (
        <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left' }}>Name</th>
              <th style={{ textAlign: 'left' }}>Subcategories</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {categories.map(cat => (
              <tr key={cat._id}>
                <td>{cat.name}</td>
                <td>{(cat.subcategories || []).map(sub => 
                  typeof sub === 'string' ? sub : (sub.name || sub.toString())
                ).join(', ')}</td>
                <td style={{ textAlign: 'center' }}>
                  <button onClick={() => onEdit(cat)} style={{ marginRight: 8 }}>Edit</button>
                  <button onClick={() => onDelete(cat._id)} style={{ color: 'var(--color-danger, #dc2626)' }}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default CatalogCategoriesPage;
