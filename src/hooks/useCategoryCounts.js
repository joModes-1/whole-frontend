import { useEffect, useState } from 'react';

// Custom hook to fetch category counts from backend
export default function useCategoryCounts() {
  const [counts, setCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    const baseUrl = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';
    const apiUrl = `${baseUrl}/products/categories/counts`;
    fetch(apiUrl)
      .then(res => res.json())
      .then(data => {
        if (isMounted) {
          setCounts(data.success ? data.data : {});
          setError(data.success ? null : data.message || 'Failed to fetch counts');
        }
      })
      .catch(err => {
        if (isMounted) setError(err.message);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });
    return () => { isMounted = false; };
  }, []);

  return { counts, loading, error };
}
