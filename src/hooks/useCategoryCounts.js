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

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 60000);

    // Fetch both categories and product counts in parallel
    Promise.all([
      fetch(`${baseUrl}/categories`, { signal: controller.signal }).then(res => res.json()),
      fetch(`${baseUrl}/products/categories/counts`, { signal: controller.signal }).then(res => res.json())
    ])
      .then(([categoriesData, countsData]) => {
        if (isMounted) {
          // Create counts object from categories collection
          const categoryNames = {};
          
          // Add categories from database
          if (Array.isArray(categoriesData)) {
            categoriesData.forEach(cat => {
              if (cat.name) {
                categoryNames[cat.name] = 0; // Initialize with 0
              }
            });
          }
          
          // Add actual product counts
          if (Array.isArray(countsData)) {
            countsData.forEach(item => {
              if (item._id && typeof item.count === 'number') {
                categoryNames[item._id] = item.count;
              }
            });
          }
          
          setCounts(categoryNames);
          setError(null);
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
