import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { fetchCategories } from '../../redux/categorySlice';
import './Categories.css';

const Categories = () => {
  const dispatch = useDispatch();
  const { items: categories, status } = useSelector((state) => state.categories);

  useEffect(() => {
    // Fetch categories only if they haven't been fetched or are not currently being fetched.
    if (status === 'idle') {
      dispatch(fetchCategories());
    }
  }, [status, dispatch]);

  // We don't want to show the 'All' category on the homepage list
  const filteredCategories = categories.filter(c => c._id !== 'All');

  return (
    <section className="categories-section">
      <h2 className="section-title">Shop by Category</h2>
      <div className="categories-container">
        {status === 'loading' && <p>Loading categories...</p>}
        {status === 'succeeded' && filteredCategories.map((category) => (
          <Link 
            to={`/products?category=${encodeURIComponent(category._id)}`} 
            key={category._id} 
            className="category-card"
          >
            <div className="category-name">{category._id}</div>
          </Link>
        ))}
        {status === 'failed' && <p>Could not load categories.</p>}
      </div>
    </section>
  );
};

export default Categories;
