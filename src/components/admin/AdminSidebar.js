import React from 'react';
import { NavLink } from 'react-router-dom';
import { FaShoppingCart, FaTruck, FaMoneyBillWave, FaBullhorn, FaFileAlt, FaChartLine, FaShieldAlt, FaCog, FaQuestionCircle } from 'react-icons/fa';
import './AdminSidebar.css';

const AdminSidebar = () => {
  return (
    <aside className="admin-sidebar">
      <div className="admin-sidebar-header">
        <h3>Admin Panel</h3>
      </div>
      <nav className="admin-sidebar-nav">
        <ul>
          <li>
            <NavLink to="/admin/dashboard" className={({ isActive }) => isActive ? 'active' : ''}>
              Dashboard
            </NavLink>
          </li>
          <li>
            <NavLink to="/admin/users" className={({ isActive }) => isActive ? 'active' : ''}>
              User Management
            </NavLink>
          </li>
          <li>
            <NavLink to="/admin/products" className={({ isActive }) => isActive ? 'active' : ''}>
              Product Management
            </NavLink>
          </li>
          <li>
            <NavLink to="/admin/orders" className={({ isActive }) => (isActive ? 'active' : '')}>
              <FaShoppingCart />
              <span>Order Management</span>
            </NavLink>
          </li>
          <li>
            <NavLink to="/admin/delivery" className={({ isActive }) => (isActive ? 'active' : '')}>
              <FaTruck />
              <span>Delivery</span>
            </NavLink>
          </li>
          <li>
            <NavLink to="/admin/finance" className={({ isActive }) => (isActive ? 'active' : '')}>
              <FaMoneyBillWave />
              <span>Finance</span>
            </NavLink>
          </li>
          <li>
            <NavLink to="/admin/marketing" className={({ isActive }) => (isActive ? 'active' : '')}>
              <FaBullhorn />
              <span>Marketing</span>
            </NavLink>
          </li>
          <li>
            <NavLink to="/admin/content" className={({ isActive }) => (isActive ? 'active' : '')}>
              <FaFileAlt />
              <span>Content</span>
            </NavLink>
          </li>
          <li>
            <NavLink to="/admin/analytics" className={({ isActive }) => (isActive ? 'active' : '')}>
              <FaChartLine />
              <span>Analytics</span>
            </NavLink>
          </li>
          <li>
            <NavLink to="/admin/security" className={({ isActive }) => (isActive ? 'active' : '')}>
              <FaShieldAlt />
              <span>Security</span>
            </NavLink>
          </li>
          <li>
            <NavLink to="/admin/integrations" className={({ isActive }) => (isActive ? 'active' : '')}>
              <FaCog />
              <span>Integrations</span>
            </NavLink>
          </li>
          <li>
            <NavLink to="/admin/support" className={({ isActive }) => (isActive ? 'active' : '')}>
              <FaQuestionCircle />
              <span>Support</span>
            </NavLink>
          </li>
          {/* More links will be added here */}
        </ul>
      </nav>
    </aside>
  );
};

export default AdminSidebar;
