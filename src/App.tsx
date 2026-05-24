import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { StoreProvider, useStore } from '@/lib/store';
import { Navbar } from '@/components/layout/Navbar';
import ScrollToTop from '@/components/layout/ScrollToTop';
import { Toaster } from '@/components/ui/sonner';
import { Skeleton } from '@/components/ui/skeleton';

// Lazy load pages
const Home = lazy(() => import('@/pages/Home'));
const ProductDetail = lazy(() => import('@/pages/ProductDetail'));
const Cart = lazy(() => import('./pages/Cart'));
const Wishlist = lazy(() => import('@/pages/Wishlist'));
const Orders = lazy(() => import('@/pages/Orders'));
const Checkout = lazy(() => import('@/pages/Checkout'));
const Auth = lazy(() => import('@/pages/Auth'));
const Profile = lazy(() => import('@/pages/Profile'));
const ForgotPassword = lazy(() => import('@/pages/ForgotPassword'));
const ResetPassword = lazy(() => import('@/pages/ResetPassword'));
const AdminDashboard = lazy(() => import('@/pages/admin/Dashboard'));
const PaymentSimulation = lazy(() => import('@/pages/PaymentSimulation'));

const LoadingFallback = () => (
  <div className="container mx-auto px-4 py-8 space-y-8">
    <Skeleton className="w-full h-[400px] rounded-3xl" />
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {[1, 2, 3, 4].map((i) => (
        <Skeleton key={i} className="h-[300px] rounded-3xl" />
      ))}
    </div>
  </div>
);

const ProtectedRoute = ({ children, adminOnly = false }: { children: React.ReactNode, adminOnly?: boolean }) => {
  const { user, loading } = useStore();

  if (loading) return <LoadingFallback />;
  if (!user) return <Navigate to="/auth" />;
  if (adminOnly && user.role !== 'admin') return <Navigate to="/" />;

  return <>{children}</>;
};

const AppContent = () => {
  return (
    <Router>
      <ScrollToTop />
      <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary/20">
        <Navbar />
        <main className="pb-20">
          <Suspense fallback={<LoadingFallback />}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/product/:id" element={<ProductDetail />} />
              <Route path="/cart" element={<Cart />} />
              <Route path="/wishlist" element={
                <ProtectedRoute>
                  <Wishlist />
                </ProtectedRoute>
              } />
              <Route path="/orders" element={
                <ProtectedRoute>
                  <Orders />
                </ProtectedRoute>
              } />
              <Route path="/profile" element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              } />
              <Route path="/auth" element={<Auth />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/checkout" element={
                <ProtectedRoute>
                  <Checkout />
                </ProtectedRoute>
              } />
              <Route path="/payment-simulation" element={
                <ProtectedRoute>
                  <PaymentSimulation />
                </ProtectedRoute>
              } />
              <Route path="/admin/*" element={
                <ProtectedRoute adminOnly>
                  <AdminDashboard />
                </ProtectedRoute>
              } />
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </Suspense>
        </main>
        <Toaster position="top-center" richColors />
      </div>
    </Router>
  );
};

const App = () => {
  return (
    <StoreProvider>
      <AppContent />
    </StoreProvider>
  );
};

export default App;
