import React, { useState, useEffect, useCallback } from 'react';
import { getListings, updateListingStatus } from '../../services/adminService';
import ProductTable from '../../components/admin/ProductTable';
import Pagination from '../../components/common/Pagination';
import './ProductManagementPage.css';

const ProductManagementPage = () => {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchListings = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getListings(page);
      setListings(data.listings);
      setTotalPages(data.pages);
      setError(null);
    } catch (err) {
      setError('Failed to fetch listings.');
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  const handleStatusUpdate = async (listingId, newStatus) => {
    try {
      await updateListingStatus(listingId, newStatus);
      // Refresh the product list to show the updated status
      fetchListings();
    } catch (error) {
      setError('Failed to update product status.');
    }
  };

  return (
    <div className="product-management-page">
      <h1>Product Management</h1>
      {loading && <div className="loading">Loading...</div>}
      {error && <div className="error-message">{error}</div>}
      {!loading && !error && (
        <>
          <ProductTable listings={listings} onStatusUpdate={handleStatusUpdate} />
          <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
        </>
      )}
    </div>
  );
};

export default ProductManagementPage;
