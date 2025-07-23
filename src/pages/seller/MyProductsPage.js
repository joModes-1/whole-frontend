import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import './MyProductsPage.css';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

const MyProductsPage = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const { user, token } = useAuth();

    useEffect(() => {
        const fetchProducts = async () => {
            if (!user) {
                setError('You must be logged in to view this page.');
                setLoading(false);
                return;
            }

            try {
                const config = {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                };
                const { data } = await axios.get(`${API_BASE_URL}/products/seller/my-products`, config);
                setProducts(data);
                setLoading(false);
            } catch (err) {
                setError('Failed to fetch products. ' + (err.response?.data?.message || err.message));
                setLoading(false);
            }
        };

        fetchProducts();
    }, [user, token]);

    const deleteProductHandler = async (productId) => {
        if (window.confirm('Are you sure you want to delete this product?')) {
            try {
                const config = {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                };
                await axios.delete(`${API_BASE_URL}/products/seller/${productId}`, config);
                setProducts(products.filter(p => p._id !== productId));
            } catch (err) {
                setError('Failed to delete product. ' + (err.response?.data?.message || err.message));
            }
        }
    };

    if (loading) {
        return <div>Loading...</div>;
    }

    if (error) {
        return <div className="error-message">{error}</div>;
    }

    return (
        <div className="my-products-container">
            <div className="my-products-header">
                <h1>My Products</h1>
                <Link to="/seller/products/add" className="btn btn-primary">Add Product</Link>
            </div>
            {products.length === 0 ? (
                <p>You have not added any products yet.</p>
            ) : (
                <table className="products-table">
                    <thead>
                        <tr>
                            <th>Image</th>
                            <th>Name</th>
                            <th>Price</th>
                            <th>Category</th>
                            <th>Stock</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {products.map(product => (
                            <tr key={product._id}>
                                <td>
                                    <img
                                        src={
                                            (Array.isArray(product.images) && product.images[0] && (product.images[0].url || product.images[0])) ||
                                            product.image ||
                                            '/placeholder.png'
                                        }
                                        alt={product.name}
                                        className="product-table-image"
                                    />
                                </td>
                                <td>{product.name}</td>
                                <td>${product.price.toFixed(2)}</td>
                                <td>{product.category}</td>
                                <td>{product.stock}</td>
                                <td className="product-actions">
                                    <Link to={`/seller/products/edit/${String(product._id)}`} className="btn btn-sm btn-light">Edit</Link>
                                    <button onClick={() => deleteProductHandler(product._id)} className="btn btn-sm btn-danger">Delete</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
};

export default MyProductsPage;
