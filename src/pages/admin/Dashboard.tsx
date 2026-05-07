import React from 'react';
import { Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  BarChart3, 
  Settings, 
  ChevronRight,
  TrendingUp,
  Users as UsersIcon,
  DollarSign,
  LayoutGrid
} from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';
import ProductsAdmin from './Products';
import OrdersAdmin from './Orders';
import CategoriesAdmin from './Categories';
import UsersAdmin from './Users';
import Overview from './Overview';

const AdminDashboard = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const menuItems = [
    { name: 'Overview', path: '/admin', icon: LayoutDashboard },
    { name: 'Products', path: '/admin/products', icon: Package },
    { name: 'Categories', path: '/admin/categories', icon: LayoutGrid },
    { name: 'Orders', path: '/admin/orders', icon: ShoppingCart },
    { name: 'Users', path: '/admin/users', icon: UsersIcon },
    { name: 'Analytics', path: '/admin/analytics', icon: BarChart3 },
    { name: 'Settings', path: '/admin/settings', icon: Settings },
  ];

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-muted/30">
      {/* Mobile Nav */}
      <div className="lg:hidden flex items-center gap-2 overflow-x-auto p-4 bg-background sticky top-0 z-50 no-scrollbar border-b border-border shadow-sm">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={cn(
                "flex items-center gap-2 px-6 py-3 rounded-2xl whitespace-nowrap font-black uppercase text-[10px] tracking-widest transition-all",
                isActive ? "bg-primary text-white shadow-lg shadow-primary/20 scale-105" : "bg-muted/50 text-muted-foreground"
              )}
            >
              <item.icon className={cn("w-3.5 h-3.5", isActive ? "text-white" : "text-muted-foreground")} />
              {item.name}
            </button>
          );
        })}
      </div>

      {/* Sidebar */}
      <aside className="w-64 glass border-r border-border hidden lg:flex flex-col sticky top-20 h-[calc(100vh-5rem)]">
        <div className="p-8 pb-4">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-6">Management</p>
          <nav className="space-y-2">
            {menuItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link 
                  key={item.path} 
                  to={item.path}
                >
                  <motion.div
                    whileHover={{ x: 5 }}
                    className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-300 ${
                      isActive 
                        ? 'bg-primary text-white shadow-lg shadow-primary/20' 
                        : 'hover:bg-primary/10 hover:text-primary text-muted-foreground'
                    }`}
                  >
                    <item.icon className="w-5 h-5" />
                    <span className="font-bold text-sm">{item.name}</span>
                    {isActive && <motion.div layoutId="activeInd" className="ml-auto w-1.5 h-1.5 rounded-full bg-white" />}
                  </motion.div>
                </Link>
              );
            })}
          </nav>
        </div>
        
        <div className="mt-auto p-8 pt-4">
           <div className="glass-card p-4 rounded-2xl bg-primary/5 border-primary/10">
              <p className="text-[10px] font-black uppercase text-primary mb-2">Pro Plan</p>
              <p className="text-xs font-bold mb-3 leading-snug">Unlock advanced analytics and scale your store.</p>
              <button className="w-full py-2 bg-primary text-white text-[10px] font-black uppercase tracking-widest rounded-lg">Upgrade Now</button>
           </div>
        </div>
      </aside>

      {/* Content */}
      <main className="flex-1 p-4 md:p-8 lg:p-12 overflow-x-hidden">
        <Routes>
          <Route index element={<Overview />} />
          <Route path="products" element={<ProductsAdmin />} />
          <Route path="categories" element={<CategoriesAdmin />} />
          <Route path="orders" element={<OrdersAdmin />} />
          <Route path="users" element={<UsersAdmin />} />
          <Route path="analytics" element={<Overview />} /> {/* Temporary */}
          <Route path="settings" element={<div className="text-4xl font-black">Settings Coming Soon</div>} />
        </Routes>
      </main>
    </div>
  );
};

export default AdminDashboard;
