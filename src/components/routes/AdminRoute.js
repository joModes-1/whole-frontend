import React from 'react';
import { Outlet } from 'react-router-dom';
// import { useAuth } from '../../context/AuthContext';

const AdminRoute = () => {
  // const { loading } = useAuth();

  // if (loading) {
  //   return <div>Loading...</div>; // Or a spinner component
  // }

  // Authentication disabled for testing - will enable later
  // return user && isAdmin ? <Outlet /> : <Navigate to="/login" replace />;
  return <Outlet />; // Temporarily disabled for UI check
};

export default AdminRoute;
