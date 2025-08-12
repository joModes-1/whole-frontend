import { useEffect, useState } from 'react';

// Custom hook to fetch category counts from backend
export default function useCategoryCounts() {
  const [counts, setCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    const baseUrl = process.env.REACT_APP_API_BASE_URL || 'http://localhost:4000/api';
    const apiUrl = `${baseUrl}/products/categories/counts`;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15000);

    fetch(apiUrl, { signal: controller.signal })
      .then(res => res.json())
      .then(data => {
        if (isMounted) {
          const ok = Array.isArray(data);
          setCounts(ok ? data.reduce((acc, cur) => ({ ...acc, [cur._id]: cur.count }), {}) : {});
          if (!ok) setError(data.message || 'Failed to fetch counts');
          else setError(null);
        }
      })
      .catch(err => {
        if (isMounted) setError(err.name === 'AbortError' ? 'Request timed out' : err.message);
      })
      .finally(() => {
        clearTimeout(timer);
        if (isMounted) setLoading(false);
      });
    return () => { isMounted = false; controller.abort(); clearTimeout(timer); };
  }, []);

  return { counts, loading, error };
}
