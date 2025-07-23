// Helper to resolve the best image URL from varied product shapes
export const getProductImage = (product) => {
  const apiBase = process.env.REACT_APP_API_BASE_URL || 'http://localhost:4000';
  
  // 1. Cloudinary / absolute string on product itself
  const directFields = ['imageUrl', 'image', 'photo', 'picture'];
  for (const key of directFields) {
    const val = product[key];
    if (typeof val === 'string' && val.trim()) return normalise(val.trim(), apiBase);
  }

  // 2. images array present?
  const imgArr = product.images;
  if (Array.isArray(imgArr) && imgArr.length) {
    const first = imgArr[0];
    if (typeof first === 'string') return normalise(first.trim(), apiBase);
    if (typeof first === 'object' && first) {
      const objFields = ['secure_url', 'url', 'link', 'src'];
      for (const k of objFields) {
        if (typeof first[k] === 'string' && first[k].trim()) return normalise(first[k].trim(), apiBase);
      }
    }
  }
  
  // 3. fallback placeholder
  return getPlaceholderImage();
};

export const getPlaceholderImage = () => {
  return 'data:image/svg+xml;utf8,%3Csvg%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20width%3D%22300%22%20height%3D%22300%22%3E%3Crect%20width%3D%22100%25%22%20height%3D%22100%25%22%20fill%3D%22%23f0f0f0%22/%3E%3Ctext%20x%3D%2250%25%22%20y%3D%2250%25%22%20dominant-baseline%3D%22middle%22%20text-anchor%3D%22middle%22%20fill%3D%22%23aaaaaa%22%20font-size%3D%2224%22%3ENo%20Image%3C/text%3E%3C/svg%3E';
};

const normalise = (raw, apiBase) => {
  if (!raw) return getPlaceholderImage();
  let resolved = raw;
  if (raw.startsWith('http://') || raw.startsWith('https://')) {
    resolved = raw;
  } else if (raw.startsWith('//')) {
    resolved = `https:${raw}`;
  } else if (raw.startsWith('/uploads/')) {
    resolved = `${apiBase}${raw}`;
  } else if (!raw.startsWith('data:') && !raw.startsWith('blob:')) {
    resolved = `${apiBase}/uploads/${raw}`;
  }
  return resolved;
};
