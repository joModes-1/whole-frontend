import { memo } from 'react';
import { NavLink } from 'react-router-dom';
import './AdminSidebar.css';

const AdminSidebar = memo(() => {
  const isActiveHandler = ({ isActive }) => {
    return isActive ? 'active' : '';
  };

  const ariaCurrentHandler = ({ isActive }) => {
    return isActive ? 'page' : undefined;
  };

  return (
    <aside className="admin-sidebar" aria-label="Admin Panel" role="navigation">
      <div className="admin-sidebar-header">
        <h3 id="admin-panel-header" aria-label="Admin Panel Header">Admin Panel</h3>
      </div>
      <nav className="admin-sidebar-nav" aria-label="Admin navigation">
        <ul role="list">
          <li>
            <NavLink to="/admin/dashboard" className={isActiveHandler} aria-current={ariaCurrentHandler}>
              <span aria-label="Dashboard">Dashboard</span>
            </NavLink>
          </li>
          <li>
            <NavLink to="/admin/users" className={isActiveHandler} aria-current={ariaCurrentHandler}>
              <span aria-label="User Management">User Management</span>
            </NavLink>
          </li>
          <li>
            <NavLink to="/admin/products" className={isActiveHandler} aria-current={ariaCurrentHandler}>
              <span aria-label="Product Management">Product Management</span>
            </NavLink>
          </li>
          <li>
            <NavLink to="/admin/catalog/categories" className={isActiveHandler} aria-current={ariaCurrentHandler}>
              <span aria-label="Catalog: Categories">Catalog: Categories</span>
            </NavLink>
          </li>
          <li>
            <NavLink to="/admin/catalog/preset-images" className={isActiveHandler} aria-current={ariaCurrentHandler}>
              <span aria-label="Catalog: Preset Images">Catalog: Preset Images</span>
            </NavLink>
          </li>
          <li>
            <NavLink to="/admin/orders" className={isActiveHandler} aria-current={ariaCurrentHandler}>
              <span aria-label="Order Management">Order Management</span>
            </NavLink>
          </li>
          <li>
            <NavLink to="/admin/delivery" className={isActiveHandler} aria-current={ariaCurrentHandler}>
              <span aria-label="Delivery">Delivery</span>
            </NavLink>
          </li>
          <li>
            <NavLink to="/admin/finance" className={isActiveHandler} aria-current={ariaCurrentHandler}>
              <span aria-label="Finance">Finance</span>
            </NavLink>
          </li>
          <li>
            <NavLink to="/admin/marketing" className={isActiveHandler} aria-current={ariaCurrentHandler}>
              <span aria-label="Marketing">Marketing</span>
            </NavLink>
          </li>
          <li>
            <NavLink to="/admin/content" className={isActiveHandler} aria-current={ariaCurrentHandler}>
              <span aria-label="Content">Content</span>
            </NavLink>
          </li>
          <li>
            <NavLink to="/admin/analytics" className={isActiveHandler} aria-current={ariaCurrentHandler}>
              <span aria-label="Analytics">Analytics</span>
            </NavLink>
          </li>
          <li>
            <NavLink to="/admin/security" className={isActiveHandler} aria-current={ariaCurrentHandler}>
              <span aria-label="Security">Security</span>
            </NavLink>
          </li>
          <li>
            <NavLink to="/admin/integrations" className={isActiveHandler} aria-current={ariaCurrentHandler}>
              <span aria-label="Integrations">Integrations</span>
            </NavLink>
          </li>
          <li>
            <NavLink to="/admin/support" className={isActiveHandler} aria-current={ariaCurrentHandler}>
              <span aria-label="Support">Support</span>
            </NavLink>
          </li>
        </ul>
      </nav>
    </aside>
  );
});

export default AdminSidebar;