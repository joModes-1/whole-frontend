import React from 'react';
import './ProductTable.css';

const ProductTable = ({ listings, onStatusUpdate }) => {
  return (
    <div className="product-table-container">
      <table className="product-table">
        <thead>
          <tr>
            <th>Product</th>
            <th>Seller</th>
            <th>Price</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {listings.map((listing) => (
            <tr key={listing._id}>
              <td>
                <div className="product-info">
                  <img src={listing.images[0] || 'https://via.placeholder.com/50'} alt={listing.title} className="product-image" />
                  <span className="product-name">{listing.title}</span>
                </div>
              </td>
              <td>{listing.vendor?.name || 'N/A'}</td>
              <td>UGX {listing.price.toFixed(2)}</td>
              <td>
                <span className={`status-badge status-${listing.status}`}>
                  {listing.status}
                </span>
              </td>
              <td>
                {listing.status === 'pending' ? (
                  <>
                    <button
                      onClick={() => onStatusUpdate(listing._id, 'approved')}
                      className="action-button approve"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => onStatusUpdate(listing._id, 'rejected')}
                      className="action-button reject"
                    >
                      Reject
                    </button>
                  </>
                ) : (
                  <button className="action-button details">View Details</button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ProductTable;
