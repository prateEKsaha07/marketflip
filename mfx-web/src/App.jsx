import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { AuthProvider, useAuth } from './context/AuthContext';
import PageTransition from './components/PageTransition';
import './styles/auth.css';
import Landing from './pages/Landing';
import Auth from './pages/Auth';
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
import AuctionDashboard from './pages/shop/AuctionDashboard';
import PostAuction from './pages/shop/PostAuction';
import MyAuctions from './pages/shop/MyAuctions';
import AuctionDetailShop from './pages/shop/AuctionDetailShop';
import BuyerAuctionDashboard from './pages/buyer/AuctionDashboard';
import BrowseAuctions from './pages/buyer/BrowseAuctions';
import AuctionDetail from './pages/buyer/AuctionDetail';
import Profile from './pages/profile/Profile';
import ProfileFormPage from './pages/profile/ProfileForm';
import TransactionHistory from './pages/history/TransactionHistory';
import ChatList from './pages/chat/ChatList';
import ChatView from './pages/chat/ChatView';

// ====== NEW: Phase 5b Auction Imports ======
import FinalizedAuctions from './pages/shop/FinalizedAuctions';
import ShopAuctionHistory from './pages/shop/AuctionHistory';
import MyWonAuctions from './pages/buyer/MyWonAuctions';
import BuyerAuctionHistory from './pages/buyer/AuctionHistory';

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
    return <Navigate to="/auth" replace />;
  }

  if (requiredRole && user?.role !== requiredRole) {
    return <Navigate to="/auth" replace />;
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
        <Route path="/auth" element={
          <PageTransition>
            <Auth />
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
        <Route path="/buyer/auctions" element={
          <PageTransition>
            <ProtectedRoute requiredRole="buyer">
              <BuyerAuctionDashboard />
            </ProtectedRoute>
          </PageTransition>
        } />
        <Route path="/buyer/auctions/browse" element={
          <PageTransition>
            <ProtectedRoute requiredRole="buyer">
              <BrowseAuctions />
            </ProtectedRoute>
          </PageTransition>
        } />
        <Route path="/buyer/auctions/:id" element={
          <PageTransition>
            <ProtectedRoute requiredRole="buyer">
              <AuctionDetail />
            </ProtectedRoute>
          </PageTransition>
        } />
        
        {/* ====== NEW: Buyer Auction Phase 5b Routes ====== */}
        <Route path="/buyer/my-won-auctions" element={
          <PageTransition>
            <ProtectedRoute requiredRole="buyer">
              <MyWonAuctions />
            </ProtectedRoute>
          </PageTransition>
        } />
        <Route path="/buyer/auction-history" element={
          <PageTransition>
            <ProtectedRoute requiredRole="buyer">
              <BuyerAuctionHistory />
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
        <Route path="/shop/auctions" element={
          <PageTransition>
            <ProtectedRoute requiredRole="shop_owner">
              <AuctionDashboard />
            </ProtectedRoute>
          </PageTransition>
        } />
        <Route path="/shop/auctions/post" element={
          <PageTransition>
            <ProtectedRoute requiredRole="shop_owner">
              <PostAuction />
            </ProtectedRoute>
          </PageTransition>
        } />
        <Route path="/shop/auctions/my" element={
          <PageTransition>
            <ProtectedRoute requiredRole="shop_owner">
              <MyAuctions />
            </ProtectedRoute>
          </PageTransition>
        } />
        <Route path="/shop/auctions/:id" element={
          <PageTransition>
            <ProtectedRoute requiredRole="shop_owner">
              <AuctionDetailShop />
            </ProtectedRoute>
          </PageTransition>
        } />
        
        {/* ====== NEW: Shop Auction Phase 5b Routes ====== */}
        <Route path="/shop/finalized-auctions" element={
          <PageTransition>
            <ProtectedRoute requiredRole="shop_owner">
              <FinalizedAuctions />
            </ProtectedRoute>
          </PageTransition>
        } />
        <Route path="/shop/auction-history" element={
          <PageTransition>
            <ProtectedRoute requiredRole="shop_owner">
              <ShopAuctionHistory />
            </ProtectedRoute>
          </PageTransition>
        } />

        {/* Profile Routes */}
        <Route path="/buyer/profile" element={
          <PageTransition>
            <ProtectedRoute requiredRole="buyer">
              <Profile />
            </ProtectedRoute>
          </PageTransition>
        } />
        <Route path="/buyer/profile/edit" element={
          <PageTransition>
            <ProtectedRoute requiredRole="buyer">
              <ProfileFormPage />
            </ProtectedRoute>
          </PageTransition>
        } />

        <Route path="/shop/profile" element={
          <PageTransition>
            <ProtectedRoute requiredRole="shop_owner">
              <Profile />
            </ProtectedRoute>
          </PageTransition>
        } />
        <Route path="/shop/profile/edit" element={
          <PageTransition>
            <ProtectedRoute requiredRole="shop_owner">
              <ProfileFormPage />
            </ProtectedRoute>
          </PageTransition>
        } />

        {/* Transaction History */}
        <Route path="/buyer/history" element={
          <PageTransition>
            <ProtectedRoute requiredRole="buyer">
              <TransactionHistory />
            </ProtectedRoute>
          </PageTransition>
        } />

        <Route path="/shop/history" element={
          <PageTransition>
            <ProtectedRoute requiredRole="shop_owner">
              <TransactionHistory />
            </ProtectedRoute>
          </PageTransition>
        } />

        {/* Chat Routes */}
        <Route path="/buyer/chat" element={
          <PageTransition>
            <ProtectedRoute requiredRole="buyer">
              <ChatList />
            </ProtectedRoute>
          </PageTransition>
        } />
        <Route path="/buyer/chat/:conversationId" element={
          <PageTransition>
            <ProtectedRoute requiredRole="buyer">
              <ChatView />
            </ProtectedRoute>
          </PageTransition>
        } />
        <Route path="/shop/chat" element={
          <PageTransition>
            <ProtectedRoute requiredRole="shop_owner">
              <ChatList />
            </ProtectedRoute>
          </PageTransition>
        } />
        <Route path="/shop/chat/:conversationId" element={
          <PageTransition>
            <ProtectedRoute requiredRole="shop_owner">
              <ChatView />
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