import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import { useAuth } from './context/AuthContext';

import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import Dashboard from './pages/Dashboard';
import Customers from './pages/Customers';
import AddCustomer from './pages/AddCustomer';
import CustomerDetails from './pages/CustomerDetails';
import DayWiseCustomers from './pages/DayWiseCustomers';
import Profile from './pages/Profile';

export default function App() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-slate-500 dark:text-slate-300">Loading application...</div>;
  }

  return (
    <Router>
      <Routes>
        <Route path="/login" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />} />
        <Route path="/register" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Register />} />
        <Route path="/forgot-password" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <ForgotPassword />} />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Layout>
                <Dashboard />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/customers"
          element={
            <ProtectedRoute>
              <Layout>
                <Customers />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/add-customer"
          element={
            <ProtectedRoute>
              <Layout>
                <AddCustomer />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/customer/:id"
          element={
            <ProtectedRoute>
              <Layout>
                <CustomerDetails />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/weekday/:day"
          element={
            <ProtectedRoute>
              <Layout>
                <DayWiseCustomers />
              </Layout>
            </ProtectedRoute>
          }
        />

        

        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Layout>
                <Profile />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route path="/" element={<Navigate to={isAuthenticated ? '/dashboard' : '/login'} replace />} />
      </Routes>
    </Router>
  );
}
