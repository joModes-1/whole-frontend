import React, { useEffect, useState } from 'react';
import { fetchCategories } from '../../services/catalogService';
import { fetchPresetImagesAdmin, createPresetImage, updatePresetImage, deletePresetImage, createPresetImageWithFile, updatePresetImageWithFile } from '../../services/catalogService';

const emptyForm = { category: '', subcategory: '', url: '', name: '', tags: '', imageFile: null };

const CatalogPresetImagesPage = () => {
  const [categories, setCategories] = useState([]);
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState(null);
  const [filters, setFilters] = useState({ category: '', subcategory: '', q: '' });

  const load = async () => {
    try {
      setLoading(true);
      const [cats, imgs] = await Promise.all([
        fetchCategories(),
        fetchPresetImagesAdmin({ category: filters.category || undefined, subcategory: filters.subcategory || undefined, productName: filters.q || undefined })
      ]);
      setCategories(cats);
      setImages(imgs.images || []);
      setError('');
    } catch (e) {
      // Provide a more descriptive error message
      const msg = (e && e.response && (e.response.data?.message || e.response.statusText))
        || e.message
        || 'Unknown error';
      console.error('Failed to load preset images:', e);
      setError(`Failed to load preset images: ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [filters.category, filters.subcategory, filters.q]);

  const onSubmit = async (e) => {
    e.preventDefault();
    try {
      // Require either file or URL
      if (!form.imageFile && !form.url.trim()) {
        setError('Please select an image file or provide an image URL.');
        return;
      }
      // If we have an image file, use the file upload endpoints
      if (form.imageFile) {
        const formData = new FormData();
        formData.append('image', form.imageFile);
        formData.append('category', form.category);
        formData.append('subcategory', form.subcategory);
        formData.append('name', form.name.trim());
        if (form.tags) formData.append('tags', form.tags);
        
        if (editing) {
          await updatePresetImageWithFile(editing, formData);
        } else {
          await createPresetImageWithFile(formData);
        }
      } else {
        // Otherwise use the standard endpoints with URL
        const payload = {
          category: form.category,
          subcategory: form.subcategory,
          url: form.url.trim(),
          name: form.name.trim(),
          tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
        };
        if (editing) {
          await updatePresetImage(editing, payload);
        } else {
          await createPresetImage(payload);
        }
      }
      setForm(emptyForm);
      setEditing(null);
      await load();
    } catch (e) {
      const msg = (e && e.response && (e.response.data?.message || e.response.statusText))
        || e.message
        || 'Unknown error';
      console.error('Failed to save preset image:', e);
      setError(`Failed to save preset image: ${msg}`);
    }
  };

  const onEdit = (img) => {
    setEditing(img._id);
    setForm({
      category: img.category || '',
      subcategory: img.subcategory || '',
      url: img.url || '',
      name: img.name || '',
      tags: (img.tags || []).join(', '),
      imageFile: null
    });
  };

  const onDelete = async (id) => {
    if (!window.confirm('Delete this preset image?')) return;
    try {
      await deletePresetImage(id);
      await load();
    } catch (e) {
      const msg = (e && e.response && (e.response.data?.message || e.response.statusText))
        || e.message
        || 'Unknown error';
      console.error('Failed to delete preset image:', e);
      setError(`Failed to delete preset image: ${msg}`);
    }
  };

  const categoryOptions = categories.map(c => ({
    value: c.name,
    label: c.name,
    subs: (c.subcategories || []).map(s =>
      typeof s === 'string' ? s : (s?.name || s?._id || String(s))
    )
  }));
  const selectedCat = categoryOptions.find(c => c.value === (form.category || filters.category));
  const subOptions = (selectedCat?.subs || []).map(s => ({ value: s, label: s }));

  return (
    <div className="catalog-preset-images-page">
      <h1>Catalog • Preset Images</h1>
      {error && <div className="error" style={{ color: 'var(--color-danger, #dc2626)' }}>{error}</div>}

      <div style={{ display: 'grid', gap: 12, marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <select value={filters.category} onChange={e => setFilters({ ...filters, category: e.target.value, subcategory: '' })}>
            <option value="">All Categories</option>
            {categoryOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <select value={filters.subcategory} onChange={e => setFilters({ ...filters, subcategory: e.target.value })} disabled={!filters.category}>
            <option value="">All Subcategories</option>
            {(categoryOptions.find(c => c.value === filters.category)?.subs || []).map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <input
            value={filters.q}
            onChange={e => setFilters({ ...filters, q: e.target.value })}
            placeholder="Search name/tags..."
            style={{ flex: '1 1 220px' }}
          />
        </div>
      </div>

      <form onSubmit={onSubmit} style={{ marginBottom: 16, display: 'grid', gap: 8 }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value, subcategory: '' })} required>
            <option value="">Select Category</option>
            {categoryOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <select value={form.subcategory} onChange={e => setForm({ ...form, subcategory: e.target.value })} required disabled={!form.category}>
            <option value="">Select Subcategory</option>
            {subOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <input 
            type="file" 
            onChange={e => setForm({ ...form, imageFile: e.target.files[0] })} 
            accept="image/*" 
            style={{ flex: '1 1 220px' }}
          />
          <div style={{ flex: '1 1 220px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>OR</span>
            <input 
              value={form.url} 
              onChange={e => setForm({ ...form, url: e.target.value })} 
              placeholder="Image URL" 
              style={{ flex: 1 }}
            />
          </div>
          <input 
            value={form.name} 
            onChange={e => setForm({ ...form, name: e.target.value })} 
            placeholder="Name" 
            required 
          />
          <input 
            value={form.tags} 
            onChange={e => setForm({ ...form, tags: e.target.value })} 
            placeholder="Tags (comma-separated)" 
          />
        </div>
        {form.imageFile && (
          <div>
            <p>Selected file: {form.imageFile.name}</p>
          </div>
        )}
        <div style={{ display: 'flex', gap: 8 }}>
          <button type="submit" className="btn btn-primary">{editing ? 'Update Preset Image' : 'Add Preset Image'}</button>
          {editing && <button type="button" onClick={() => { setEditing(null); setForm(emptyForm); }}>Cancel</button>}
        </div>
      </form>

      {loading ? (
        <div>Loading...</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
          {images.map(img => (
            <div key={img._id} style={{ border: '1px solid var(--color-border, #eee)', borderRadius: 8, padding: 8 }}>
              <div style={{ aspectRatio: '1 / 1', overflow: 'hidden', borderRadius: 6, marginBottom: 8, background: '#f7f7f7' }}>
                <img src={img.url} alt={img.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e)=>{ e.currentTarget.src='/placeholder-image.svg'; }} />
              </div>
              <div style={{ fontWeight: 600 }}>{img.name}</div>
              <div style={{ fontSize: 12, color: '#666' }}>{img.category} • {img.subcategory}</div>
              <div style={{ fontSize: 12, color: '#666' }}>{(img.tags || []).join(', ')}</div>
              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <button onClick={() => onEdit(img)}>Edit</button>
                <button onClick={() => onDelete(img._id)} style={{ color: 'var(--color-danger, #dc2626)' }}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CatalogPresetImagesPage;
