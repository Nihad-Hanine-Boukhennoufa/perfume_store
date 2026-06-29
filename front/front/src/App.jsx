import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useContext } from "react";

import Navbar from "./components/layout/Navbar";
import Footer from "./components/layout/Footer";

import AdminLayout   from "./pages/admin/AdminLayout";
import Login         from "./pages/auth/Login";
import Register      from "./pages/auth/Register";
import Profile       from "./pages/auth/Profile";
import ForgotPassword from "./pages/auth/ForgotPassword";   
import ResetPassword  from "./pages/auth/ResetPassword";    

import Home           from "./pages/shop/Home";
import Products       from "./pages/shop/Allproducts";
import ProductDetails from "./pages/shop/ProductDetails";
import Cart           from "./pages/shop/Cart";
import Wishlist       from "./pages/shop/Wishlist";
import MyOrders       from "./pages/shop/MyOrders";         

import Dashboard     from "./pages/admin/Dashboard";
import Users         from "./pages/admin/UsersAdmin";
import ProductsAdmin from "./pages/admin/ProductsAdmin";
import BrandsAdmin   from "./pages/admin/BrandAdmin";
import NotesAdmin    from "./pages/admin/NotesAdmin";       
import Orders        from "./pages/admin/OrdersAdmin";
import AnalyticsAdmin from "./pages/admin/AnalyticsAdmin";

import { ProtectedRoute, AdminRoute } from "./components/routes/ProtectedRoute";
import AuthContext from "./context/AuthContext";

// ── QueryClient (single instance) ────────────────────────────────────────────
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000,
    },
  },
});

// ── Layout wrapper — hides Footer on admin pages ──────────────────────────────
function AppLayout() {
  const { isAdmin } = useContext(AuthContext);
  const { pathname } = useLocation();
  const isAdminPage = pathname.startsWith("/dashboard");

  return (
    <>
      {/* Navbar hides itself when isAdmin (already handled inside Navbar) */}
      <Navbar />

      <main className="min-h-screen">
        <Routes>

          {/* ── Public ──────────────────────────────────────────────── */}
          <Route path="/"              element={<Home />} />
          <Route path="/products"      element={<Products />} />
          <Route path="/products/:id"  element={<ProductDetails />} />
          <Route path="/login"         element={<Login />} />
          <Route path="/register"      element={<Register />} />
          <Route path="/forgot-password"        element={<ForgotPassword />} />   {/* ✅ */}
          <Route path="/reset-password/:token"  element={<ResetPassword />} />    {/* ✅ */}

          {/* ── Protected (logged-in users) ─────────────────────────── */}
          <Route path="/cart" element={
            <ProtectedRoute><Cart /></ProtectedRoute>
          } />
          <Route path="/wishlist" element={
            <ProtectedRoute><Wishlist /></ProtectedRoute>
          } />
          <Route path="/profile" element={
            <ProtectedRoute><Profile /></ProtectedRoute>
          } />
          <Route path="/orders" element={                                          {/* ✅ */}
            <ProtectedRoute><MyOrders /></ProtectedRoute>
          } />

          {/* ── Admin ───────────────────────────────────────────────── */}
          <Route path="/dashboard" element={
            <AdminRoute><AdminLayout /></AdminRoute>
          }>
            <Route index             element={<Dashboard />} />
            <Route path="products"   element={<ProductsAdmin />} />
            <Route path="brands"     element={<BrandsAdmin />} />
            <Route path="notes"      element={<NotesAdmin />} />               {/* ✅ */}
            <Route path="orders"     element={<Orders />} />
            <Route path="users"      element={<Users />} />
            <Route path="analytics"  element={<AnalyticsAdmin />} />
          </Route>

          {/* ── 404 ─────────────────────────────────────────────────── */}
          <Route path="*" element={
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
              <p className="label-eyebrow">404</p>
              <h1 className="heading-display text-4xl">Page Not Found</h1>
            </div>
          } />

        </Routes>
      </main>

      {/* ✅ FIX: hide Footer on admin pages */}
      {!isAdminPage && <Footer />}
    </>
  );
}

// ── App root ──────────────────────────────────────────────────────────────────
function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppLayout />
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;