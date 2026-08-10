import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { AuthProvider, useAuth } from './context/AuthContext';
import PageTransition from './components/PageTransition';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Signup from './pages/Signup';
import BuyerDashboard from './pages/buyer/Dashboard';
import PostRequest from './pages/buyer/PostRequest';
import RequestDetail from './pages/buyer/RequestDetail';
import MyPurchases from './pages/buyer/MyPurchases';
import EditRequest from './pages/buyer/EditRequest';
import ShopDashboard from './pages/shop/Dashboard';
import BrowseRequests from './pages/shop/BrowseRequests';
import MyBids from './pages/shop/MyBids';
import BidDetail from './pages/shop/BidDetail';
import CompletedTransactions from './pages/shop/CompletedTransactions';

const ProtectedRoute = ({ children, requiredRole }) => {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FFFCE1]">
        <div className="animate-pulse text-2xl font-bold text-[#FFBE91]">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && user?.role !== requiredRole) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

const AnimatedRoutes = () => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={
          <PageTransition>
            <Landing />
          </PageTransition>
        } />
        <Route path="/login" element={
          <PageTransition>
            <Login />
          </PageTransition>
        } />
        <Route path="/signup" element={
          <PageTransition>
            <Signup />
          </PageTransition>
        } />
        
        {/* Buyer Routes */}
        <Route path="/buyer/dashboard" element={
          <PageTransition>
            <ProtectedRoute requiredRole="buyer">
              <BuyerDashboard />
            </ProtectedRoute>
          </PageTransition>
        } />
        <Route path="/buyer/post-request" element={
          <PageTransition>
            <ProtectedRoute requiredRole="buyer">
              <PostRequest />
            </ProtectedRoute>
          </PageTransition>
        } />
        <Route path="/buyer/request/:id" element={
          <PageTransition>
            <ProtectedRoute requiredRole="buyer">
              <RequestDetail />
            </ProtectedRoute>
          </PageTransition>
        } />
        <Route path="/buyer/purchases" element={
          <PageTransition>
            <ProtectedRoute requiredRole="buyer">
              <MyPurchases />
            </ProtectedRoute>
          </PageTransition>
        } />
        <Route path="/buyer/edit-request/:id" element={
          <PageTransition>
            <ProtectedRoute requiredRole="buyer">
              <EditRequest />
            </ProtectedRoute>
          </PageTransition>
        } />
        
        {/* Shop Routes */}
        <Route path="/shop/dashboard" element={
          <PageTransition>
            <ProtectedRoute requiredRole="shop_owner">
              <ShopDashboard />
            </ProtectedRoute>
          </PageTransition>
        } />
        <Route path="/shop/browse" element={
          <PageTransition>
            <ProtectedRoute requiredRole="shop_owner">
              <BrowseRequests />
            </ProtectedRoute>
          </PageTransition>
        } />
        <Route path="/shop/my-bids" element={
          <PageTransition>
            <ProtectedRoute requiredRole="shop_owner">
              <MyBids />
            </ProtectedRoute>
          </PageTransition>
        } />
        <Route path="/shop/bid/:id" element={
          <PageTransition>
            <ProtectedRoute requiredRole="shop_owner">
              <BidDetail />
            </ProtectedRoute>
          </PageTransition>
        } />
        <Route path="/shop/completed" element={
          <PageTransition>
            <ProtectedRoute requiredRole="shop_owner">
              <CompletedTransactions />
            </ProtectedRoute>
          </PageTransition>
        } />
        
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
  );
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AnimatedRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;