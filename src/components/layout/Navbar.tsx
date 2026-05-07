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
    <nav className={`glass-nav transition-all duration-300 ${isScrolled ? 'py-2 shadow-lg' : 'py-4'}`}>
      <div className="container mx-auto px-4 flex items-center justify-between">
        {/* Logo & Back */}
        <div className="flex items-center space-x-2">
          {location.pathname !== '/' && (
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => navigate(-1)}
              className="mr-1 h-9 w-9 rounded-xl hover:bg-primary/10 transition-transform active:scale-90"
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
          )}
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
              <span className="text-white font-bold text-xl">DD</span>
            </div>
            <span className="hidden md:block font-bold text-xl tracking-tight">DayDeals</span>
          </Link>
        </div>

        {/* Desktop Search */}
        <div className="hidden lg:flex flex-1 max-w-md mx-8 relative">
          <Input 
            placeholder="Search amazing deals..." 
            className="pl-10 h-11 bg-muted/50 border-none focus-visible:ring-1 focus-visible:ring-primary/50 rounded-2xl"
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        </div>

        {/* Desktop Actions */}
        <div className="hidden md:flex items-center space-x-1 lg:space-x-4">
          <Link to="/orders">
            <Button variant="ghost" className="relative flex items-center gap-2 hover:bg-primary/10 hover:text-primary rounded-xl px-3 h-10 group">
              <Package className="w-5 h-5 transition-transform group-hover:-rotate-12" />
              <span className="text-xs font-bold uppercase tracking-wider">Track</span>
              {ordersCount > 0 && (
                <Badge className="absolute -top-1 right-0 h-5 w-5 flex items-center justify-center p-0 text-[10px] bg-red-500 text-white border-background border-2 animate-pulse">
                  {ordersCount}
                </Badge>
              )}
            </Button>
          </Link>
          <Link to="/wishlist">
            <Button variant="ghost" size="icon" className="relative hover:bg-primary/10 hover:text-primary rounded-xl">
              <Heart className="w-5 h-5" />
              {wishlist.length > 0 && (
                <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-[10px] bg-primary border-background">
                  {wishlist.length}
                </Badge>
              )}
            </Button>
          </Link>
          <Link to="/cart">
            <Button variant="ghost" size="icon" className="relative hover:bg-primary/10 hover:text-primary rounded-xl">
              <ShoppingCart className="w-5 h-5" />
              {cart.length > 0 && (
                <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-[10px] bg-primary border-background">
                  {cart.length}
                </Badge>
              )}
            </Button>
          </Link>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="hover:bg-primary/10 hover:text-primary rounded-xl transition-all active:scale-95"
              >
                {user?.photoURL ? (
                  <img src={user.photoURL} alt="User" className="w-6 h-6 rounded-full ring-1 ring-primary/20" />
                ) : (
                  <User className="w-5 h-5" />
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 glass border-border mt-2 p-1.5 rounded-[1.5rem] shadow-2xl">
              <DropdownMenuGroup>
                <DropdownMenuLabel className="font-black uppercase text-[10px] tracking-widest text-muted-foreground px-3 py-2">Account</DropdownMenuLabel>
              </DropdownMenuGroup>
              <DropdownMenuSeparator className="bg-border/50 mx-1" />
              {user ? (
                <>
                  <DropdownMenuItem 
                    onClick={() => navigate('/profile')} 
                    className="rounded-xl cursor-pointer py-2.5 px-3 focus:bg-primary/5 focus:text-primary"
                  >
                    My Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => navigate('/orders')} 
                    className="rounded-xl cursor-pointer py-2.5 px-3 focus:bg-primary/5 focus:text-primary"
                  >
                    Order History
                  </DropdownMenuItem>
                  {user.role === 'admin' && (
                    <>
                      <DropdownMenuSeparator className="bg-border/50 mx-1" />
                      <DropdownMenuItem 
                        onClick={() => navigate('/admin')} 
                        className="rounded-xl cursor-pointer py-2.5 px-3 font-bold text-primary bg-primary/5 hover:bg-primary/10 focus:bg-primary/10"
                      >
                        Admin Dashboard
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator className="bg-border/50 mx-1" />
                  <DropdownMenuItem 
                    onClick={logout} 
                    className="rounded-xl cursor-pointer py-2.5 px-3 text-destructive focus:bg-destructive/5 focus:text-destructive"
                  >
                    Log out
                  </DropdownMenuItem>
                </>
              ) : (
                <DropdownMenuItem 
                  onClick={() => navigate('/auth')} 
                  className="rounded-xl cursor-pointer py-2.5 px-3 font-bold text-primary focus:bg-primary/5 focus:text-primary"
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
            <Button variant="ghost" size="icon" className="relative rounded-lg h-9 w-9">
              <Package className="w-5 h-5" />
              {ordersCount > 0 && (
                <Badge className="absolute top-0 right-0 h-4 w-4 flex items-center justify-center p-0 text-[8px] bg-red-500 text-white border-none">
                  {ordersCount}
                </Badge>
              )}
            </Button>
          </Link>
          <Link to="/wishlist">
            <Button variant="ghost" size="icon" className="relative rounded-lg h-9 w-9">
              <Heart className="w-5 h-5" />
              {wishlist.length > 0 && (
                <Badge className="absolute top-0 right-0 h-4 w-4 flex items-center justify-center p-0 text-[8px] bg-primary border-none">
                  {wishlist.length}
                </Badge>
              )}
            </Button>
          </Link>
          <Link to="/cart">
            <Button variant="ghost" size="icon" className="relative rounded-lg h-9 w-9">
              <ShoppingCart className="w-5 h-5" />
              {cart.length > 0 && (
                <Badge className="absolute top-0 right-0 h-4 w-4 flex items-center justify-center p-0 text-[8px] bg-primary border-none">
                  {cart.length}
                </Badge>
              )}
            </Button>
          </Link>
          
          <Button 
            variant="ghost" 
            size="icon" 
            className="rounded-lg h-9 w-9 ml-1"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
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
            className="md:hidden glass border-t border-border overflow-hidden"
          >
            <div className="container mx-auto px-4 py-6 space-y-4">
              <div className="relative">
                <Input placeholder="Search deals..." className="pl-10 h-10 bg-muted/50 border-none rounded-xl" />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Link to="/orders" onClick={() => setIsMobileMenuOpen(false)}>
                  <Button variant="outline" className="w-full justify-start space-x-2 rounded-xl h-12">
                    <Package className="w-4 h-4" />
                    <span>Track Orders</span>
                  </Button>
                </Link>
                <Link to="/wishlist" onClick={() => setIsMobileMenuOpen(false)}>
                  <Button variant="outline" className="w-full justify-start space-x-2 rounded-xl h-12">
                    <Heart className="w-4 h-4" />
                    <span>Wishlist ({wishlist.length})</span>
                  </Button>
                </Link>
              </div>
              <div className="grid grid-cols-1 gap-4">
                <Link to="/cart" onClick={() => setIsMobileMenuOpen(false)}>
                  <Button variant="outline" className="w-full justify-start space-x-2 rounded-xl h-12">
                    <ShoppingCart className="w-4 h-4" />
                    <span>View Cart ({cart.reduce((acc, item) => acc + item.quantity, 0)})</span>
                  </Button>
                </Link>
              </div>
              <Button 
                className="w-full h-12 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/20"
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
                  className="w-full h-12 rounded-xl text-primary border-primary/20 font-black uppercase tracking-widest"
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
