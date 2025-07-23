import React from 'react';
import { FaMobileAlt, FaTshirt, FaLaptop, FaCouch, FaCarSide, FaAppleAlt, FaShoppingBag } from 'react-icons/fa';
import './Categories.css';

const iconMap = {
  Electronics: FaMobileAlt,
  Phones: FaMobileAlt,
  Gadgets: FaMobileAlt,
  Fashion: FaTshirt,
  Clothing: FaTshirt,
  Computers: FaLaptop,
  Laptops: FaLaptop,
  Furniture: FaCouch,
  Automotive: FaCarSide,
  Groceries: FaAppleAlt,
};

const Categories = ({ categories = [], selectedCategory, onCategoryClick, categoryCounts = {} }) => {
  return (
    <div className="categories-panel">
      
      <ul className="categories-list">
        <h3>Categories</h3>
        {categories.map((category) => (
    <li key={category.id}>
      <button
        className={`category-btn ${selectedCategory === category.name ? 'active' : ''}`}
        onClick={() => onCategoryClick(category.name)}
      >
        {(() => {
          const IconComp = iconMap[category.name] || FaShoppingBag;
          return <IconComp className="category-icon" />;
        })()} {category.name}
              {categoryCounts[category.name] !== undefined && (
                <span className="category-badge">{categoryCounts[category.name]}</span>
              )}
      </button>
    </li>
        ))}
      </ul>
    </div>
  );
};

export default Categories;
