import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Signup from './pages/Signup';
import BuyerDashboard from './pages/buyer/Dashboard';
import PostRequest from './pages/buyer/PostRequest';
import RequestDetail from './pages/buyer/RequestDetail';
import MyPurchases from './pages/buyer/MyPurchases';  // ← Add this
import ShopDashboard from './pages/shop/Dashboard';
import BrowseRequests from './pages/shop/BrowseRequests';
import MyBids from './pages/shop/MyBids';
import BidDetail from './pages/shop/BidDetail';
import CompletedTransactions from './pages/shop/CompletedTransactions';

const ProtectedRoute = ({ children, requiredRole }) => {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && user?.role !== requiredRole) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      
      {/* Buyer Routes */}
      <Route 
        path="/buyer/dashboard" 
        element={
          <ProtectedRoute requiredRole="buyer">
            <BuyerDashboard />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/buyer/post-request" 
        element={
          <ProtectedRoute requiredRole="buyer">
            <PostRequest />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/buyer/request/:id" 
        element={
          <ProtectedRoute requiredRole="buyer">
            <RequestDetail />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/buyer/purchases" 
        element={
          <ProtectedRoute requiredRole="buyer">
            <MyPurchases />
          </ProtectedRoute>
        } 
      />
      
      {/* Shop Routes */}
      <Route 
        path="/shop/dashboard" 
        element={
          <ProtectedRoute requiredRole="shop_owner">
            <ShopDashboard />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/shop/browse" 
        element={
          <ProtectedRoute requiredRole="shop_owner">
            <BrowseRequests />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/shop/my-bids" 
        element={
          <ProtectedRoute requiredRole="shop_owner">
            <MyBids />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/shop/bid/:id" 
        element={
        <ProtectedRoute requiredRole="shop_owner">
          <BidDetail />
        </ProtectedRoute>
        } 
      />

      <Route 
        path="/shop/completed" 
        element={
        <ProtectedRoute requiredRole="shop_owner">
          <CompletedTransactions />
        </ProtectedRoute>
        } 
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;