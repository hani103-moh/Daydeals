import React, { useState, useEffect } from 'react';
import { ShoppingCart, Heart, User, Search, Menu, X, Laptop, Smartphone, Watch, Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useStore } from '@/lib/store';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuGroup,
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'motion/react';
import { Package, ChevronLeft } from 'lucide-react';

export const Navbar = () => {
  const { cart, wishlist, user, logout, ordersCount } = useStore();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    console.log('Navbar ordersCount:', ordersCount);
  }, [ordersCount]);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={`glass-nav sticky top-0 z-50 backdrop-blur-md bg-white/85 dark:bg-black/85 border-b border-neutral-150 dark:border-neutral-900 transition-all duration-300 ${isScrolled ? 'py-2.5 shadow-sm' : 'py-4'}`}>
      <div className="container mx-auto px-4 md:px-6 flex items-center justify-between">
        {/* Logo & Back */}
        <div className="flex items-center space-x-3">
          {location.pathname !== '/' && (
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => navigate(-1)}
              className="mr-1 h-8 w-8 rounded-full hover:bg-neutral-105 dark:hover:bg-neutral-900 transition-colors"
            >
              <ChevronLeft className="w-4 h-4 text-black dark:text-white" />
            </Button>
          )}
          <Link to="/" className="flex items-center space-x-2.5 group">
            <div className="w-8 h-8 bg-black dark:bg-white text-white dark:text-black rounded-sm flex items-center justify-center transition-all duration-300">
              <span className="font-mono font-extrabold text-[15px] tracking-tighter">DM</span>
            </div>
            <div className="flex flex-col">
              <span className="font-black text-[12px] tracking-[0.24em] uppercase text-black dark:text-white leading-none">
                DAYDEALS
              </span>
              <span className="text-[7.5px] tracking-[0.380em] uppercase text-neutral-400 dark:text-neutral-500 font-bold mt-0.5 leading-none">
                MERKATO
              </span>
            </div>
          </Link>
        </div>

        {/* Desktop Search */}
        <div className="hidden lg:flex flex-1 max-w-md mx-10 relative">
          <input 
            type="text"
            placeholder="Search our collection..." 
            className="w-full pl-10 pr-4 h-9 bg-neutral-50 dark:bg-neutral-900/60 text-xs text-black dark:text-white placeholder:text-neutral-400 outline-none border border-neutral-200/70 dark:border-neutral-800/70 focus:border-black dark:focus:border-white focus:bg-white dark:focus:bg-black rounded-sm transition-all"
          />
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400" />
        </div>

        {/* Desktop Actions */}
        <div className="hidden md:flex items-center space-x-2">
          <Link to="/orders">
            <Button variant="ghost" className="relative flex items-center gap-1.5 hover:bg-neutral-50 dark:hover:bg-neutral-900 rounded-sm px-3.5 h-9 group transition-colors">
              <Package className="w-4 h-4 text-neutral-600 dark:text-neutral-400 group-hover:text-black dark:group-hover:text-white transition-colors" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-600 dark:text-neutral-400 group-hover:text-black dark:group-hover:text-white transition-colors">Track</span>
              {ordersCount > 0 && (
                <span className="absolute -top-1 -right-1 h-3.5 w-3.5 flex items-center justify-center rounded-full text-[8px] font-semibold bg-black text-white dark:bg-white dark:text-black border border-white dark:border-black animate-pulse">
                  {ordersCount}
                </span>
              )}
            </Button>
          </Link>

          <Link to="/wishlist">
            <Button variant="ghost" size="icon" className="relative hover:bg-neutral-50 dark:hover:bg-neutral-900 rounded-sm h-9 w-9 text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white transition-colors">
              <Heart className="w-4 h-4" />
              {wishlist.length > 0 && (
                <span className="absolute -top-1 -right-1 h-3.5 w-3.5 flex items-center justify-center rounded-full text-[8px] font-semibold bg-black text-white dark:bg-white dark:text-black border border-white dark:border-black">
                  {wishlist.length}
                </span>
              )}
            </Button>
          </Link>

          <Link to="/cart">
            <Button variant="ghost" size="icon" className="relative hover:bg-neutral-50 dark:hover:bg-neutral-900 rounded-sm h-9 w-9 text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white transition-colors">
              <ShoppingCart className="w-4 h-4" />
              {cart.length > 0 && (
                <span className="absolute -top-1 -right-1 h-3.5 w-3.5 flex items-center justify-center rounded-full text-[8px] font-semibold bg-black text-white dark:bg-white dark:text-black border border-white dark:border-black">
                  {cart.length}
                </span>
              )}
            </Button>
          </Link>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="hover:bg-neutral-50 dark:hover:bg-neutral-900 rounded-sm h-9 w-9 text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white transition-all active:scale-95"
              >
                {user?.photoURL ? (
                  <img src={user.photoURL} alt="User" className="w-5 h-5 rounded-full ring-1 ring-neutral-200" />
                ) : (
                  <User className="w-4 h-4" />
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52 bg-white dark:bg-black border border-neutral-200 dark:border-neutral-800 mt-2 p-1.5 rounded-sm shadow-xl">
              <DropdownMenuGroup>
                <DropdownMenuLabel className="font-bold uppercase text-[9px] tracking-widest text-neutral-400 px-3 py-1.5">Account</DropdownMenuLabel>
              </DropdownMenuGroup>
              <DropdownMenuSeparator className="bg-neutral-100 dark:bg-neutral-900 mx-1" />
              {user ? (
                <>
                  <DropdownMenuItem 
                    onClick={() => navigate('/profile')} 
                    className="rounded-none cursor-pointer py-2 px-3 text-xs text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-955 focus:bg-neutral-50 dark:focus:bg-neutral-955"
                  >
                    My Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => navigate('/orders')} 
                    className="rounded-none cursor-pointer py-2 px-3 text-xs text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-955 focus:bg-neutral-50 dark:focus:bg-neutral-955"
                  >
                    Order History
                  </DropdownMenuItem>
                  {user.role === 'admin' && (
                    <>
                      <DropdownMenuSeparator className="bg-neutral-100 dark:bg-neutral-900 mx-1" />
                      <DropdownMenuItem 
                        onClick={() => navigate('/admin')} 
                        className="rounded-none cursor-pointer py-2 px-3 text-xs font-bold text-black dark:text-white bg-neutral-50 dark:bg-neutral-950 hover:bg-neutral-100 dark:hover:bg-neutral-900 focus:bg-neutral-100 dark:focus:bg-neutral-900"
                      >
                        Admin Dashboard
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator className="bg-neutral-100 dark:bg-neutral-900 mx-1" />
                  <DropdownMenuItem 
                    onClick={logout} 
                    className="rounded-none cursor-pointer py-2 px-3 text-xs text-destructive hover:bg-destructive/5 dark:hover:bg-destructive/10 focus:bg-destructive/5 dark:focus:bg-destructive/10"
                  >
                    Log out
                  </DropdownMenuItem>
                </>
              ) : (
                <DropdownMenuItem 
                  onClick={() => navigate('/auth')} 
                  className="rounded-none cursor-pointer py-2 px-3 text-xs font-bold text-black dark:text-white hover:bg-neutral-50 dark:hover:bg-neutral-950 focus:bg-neutral-50 dark:focus:bg-neutral-950"
                >
                  Sign In / Register
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Mobile Header Actions */}
        <div className="flex md:hidden items-center space-x-1">
          <Link to="/orders">
            <Button variant="ghost" size="icon" className="relative h-8 w-8 hover:bg-neutral-50 dark:hover:bg-neutral-900 rounded-sm">
              <Package className="w-4 h-4 text-neutral-600 dark:text-neutral-400" />
              {ordersCount > 0 && (
                <span className="absolute top-0 right-0 h-3.5 w-3.5 flex items-center justify-center rounded-full text-[8px] font-semibold bg-black text-white dark:bg-white dark:text-black">
                  {ordersCount}
                </span>
              )}
            </Button>
          </Link>
          <Link to="/wishlist">
            <Button variant="ghost" size="icon" className="relative h-8 w-8 hover:bg-neutral-50 dark:hover:bg-neutral-900 rounded-sm">
              <Heart className="w-4 h-4 text-neutral-600 dark:text-neutral-400" />
              {wishlist.length > 0 && (
                <span className="absolute top-0 right-0 h-3.5 w-3.5 flex items-center justify-center rounded-full text-[8px] font-semibold bg-black text-white dark:bg-white dark:text-black">
                  {wishlist.length}
                </span>
              )}
            </Button>
          </Link>
          <Link to="/cart">
            <Button variant="ghost" size="icon" className="relative h-8 w-8 hover:bg-neutral-50 dark:hover:bg-neutral-900 rounded-sm">
              <ShoppingCart className="w-4 h-4 text-neutral-600 dark:text-neutral-400" />
              {cart.length > 0 && (
                <span className="absolute top-0 right-0 h-3.5 w-3.5 flex items-center justify-center rounded-full text-[8px] font-semibold bg-black text-white dark:bg-white dark:text-black">
                  {cart.length}
                </span>
              )}
            </Button>
          </Link>
          
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 ml-0.5 hover:bg-neutral-50 dark:hover:bg-neutral-900 rounded-sm"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X className="w-4 h-4 text-neutral-600 dark:text-neutral-400" /> : <Menu className="w-4 h-4 text-neutral-600 dark:text-neutral-400" />}
          </Button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white dark:bg-black border-t border-neutral-100 dark:border-neutral-900 overflow-hidden"
          >
            <div className="container mx-auto px-4 py-5 space-y-4">
              <div className="relative">
                <input 
                  type="text"
                  placeholder="Search products..." 
                  className="w-full pl-9 pr-4 h-9 bg-neutral-50 dark:bg-neutral-900/60 text-xs text-black dark:text-white placeholder:text-neutral-400 outline-none border border-neutral-200/70 dark:border-neutral-800/70 rounded-none focus:border-black dark:focus:border-white transition-all"
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Link to="/orders" onClick={() => setIsMobileMenuOpen(false)}>
                  <Button variant="outline" className="w-full justify-start space-x-2 rounded-none h-10 text-xs border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-900">
                    <Package className="w-3.5 h-3.5 text-neutral-500" />
                    <span>Track Orders</span>
                  </Button>
                </Link>
                <Link to="/wishlist" onClick={() => setIsMobileMenuOpen(false)}>
                  <Button variant="outline" className="w-full justify-start space-x-2 rounded-none h-10 text-xs border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-900">
                    <Heart className="w-3.5 h-3.5 text-neutral-500" />
                    <span>Wishlist ({wishlist.length})</span>
                  </Button>
                </Link>
              </div>
              <div className="grid grid-cols-1 gap-3">
                <Link to="/cart" onClick={() => setIsMobileMenuOpen(false)}>
                  <Button variant="outline" className="w-full justify-start space-x-2 rounded-none h-10 text-xs border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-900">
                    <ShoppingCart className="w-3.5 h-3.5 text-neutral-500" />
                    <span>Cart ({cart.reduce((acc, item) => acc + item.quantity, 0)})</span>
                  </Button>
                </Link>
              </div>
              <Button 
                className="w-full h-10 rounded-none text-[9px] font-bold uppercase tracking-widest bg-black text-white hover:bg-neutral-950 dark:bg-white dark:text-black dark:hover:bg-neutral-100 border border-neutral-200"
                onClick={() => {
                  navigate(user ? '/profile' : '/auth');
                  setIsMobileMenuOpen(false);
                }}
              >
                {user ? 'View My Profile' : 'Sign In Now'}
              </Button>

              {user?.role === 'admin' && (
                <Button 
                  variant="outline"
                  className="w-full h-10 rounded-none text-black dark:text-white border-black/25 dark:border-white/25 font-bold text-[9px] uppercase tracking-widest hover:bg-neutral-50 dark:hover:bg-neutral-900"
                  onClick={() => {
                    navigate('/admin');
                    setIsMobileMenuOpen(false);
                  }}
                >
                  Admin Dashboard
                </Button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};
