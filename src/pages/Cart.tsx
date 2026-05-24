import React from 'react';
import { useStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { PLACEHOLDER_IMAGE } from '@/lib/constants';
import { ShoppingBag, Minus, Plus, Trash2, ArrowRight, ShieldCheck, MapPin } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Separator } from '@/components/ui/separator';
import { formatPrice } from '@/lib/utils';

const Cart = () => {
  const { cart, removeFromCart, updateQuantity } = useStore();
  const navigate = useNavigate();

  const subtotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const shipping = 150; // Standard ETB shipping
  const total = subtotal + shipping;

  if (cart.length === 0) {
    return (
      <div className="container mx-auto px-4 py-32 text-center space-y-6">
        <div className="w-20 h-20 bg-primary/10 text-primary rounded-3xl flex items-center justify-center mx-auto mb-6">
          <ShoppingBag className="w-10 h-10" />
        </div>
        <h2 className="text-3xl font-black tracking-tight uppercase">Your cart is empty</h2>
        <p className="text-muted-foreground text-lg max-w-sm mx-auto">
          Seems like you haven't picked up any Habesha treasures yet.
        </p>
        <Link to="/">
          <Button size="lg" className="h-12 px-8 rounded-xl font-bold mt-4">
            Browse Products
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-black tracking-tight uppercase mb-8">Shopping <span className="text-primary">Bag</span></h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-4">
          <AnimatePresence mode="popLayout">
            {cart.map((item) => (
              <motion.div
                key={item.id + (item.selectedVariant ? '-' + item.selectedVariant.id : '')}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="mobile-card p-3 flex items-center gap-4 relative"
              >
                <div className="w-24 h-24 rounded-xl overflow-hidden glass shrink-0">
                  <img src={item.images?.[0] || PLACEHOLDER_IMAGE} alt={item.name} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 space-y-1 min-w-0">
                  <h3 className="font-bold text-sm truncate">
                    <Link to={`/product/${item.id}`}>{item.name}</Link>
                  </h3>
                  
                  {item.selectedVariant && (
                    <div className="px-2 py-0.5 rounded bg-primary/10 text-primary text-[10px] font-bold uppercase w-fit tracking-wide">
                      {item.selectedVariant.size && `Size: ${item.selectedVariant.size}`}
                      {item.selectedVariant.size && item.selectedVariant.color && ' | '}
                      {item.selectedVariant.color && `Color: ${item.selectedVariant.color}`}
                    </div>
                  )}

                  <div className="flex items-baseline gap-2">
                    <p className="text-foreground font-black text-sm">{formatPrice(item.selectedVariant?.price || item.price)}</p>
                    <p className="text-[9px] text-muted-foreground/40 line-through">{formatPrice((item.selectedVariant?.price || item.price) * 1.2)}</p>
                  </div>
                  <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">{item.category}</p>
                  
                  <div className="flex items-center gap-4 mt-2">
                    <div className="flex items-center gap-2 glass bg-white/5 p-1 rounded-lg">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 rounded-md hover:bg-primary/10"
                        onClick={() => updateQuantity(item.id, item.quantity - 1, item.selectedVariant?.id)}
                      >
                        <Minus className="w-3 h-3" />
                      </Button>
                      <span className="font-bold text-xs w-4 text-center">{item.quantity}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 rounded-md hover:bg-primary/10"
                        onClick={() => updateQuantity(item.id, item.quantity + 1, item.selectedVariant?.id)}
                      >
                        <Plus className="w-3 h-3" />
                      </Button>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive/60 hover:text-destructive hover:bg-destructive/10 rounded-lg"
                      onClick={() => removeFromCart(item.id, item.selectedVariant?.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Order Summary */}
        <div className="space-y-4">
          <div className="glass-card p-6 rounded-3xl sticky top-24 border border-white/5">
            <h2 className="text-lg font-black uppercase mb-6">Summary</h2>
            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-bold">{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Delivery (Addis)</span>
                <span className="font-bold">{formatPrice(shipping)}</span>
              </div>
              <Separator className="bg-white/5" />
              <div className="flex justify-between items-end pt-2">
                <span className="text-xs font-black uppercase text-muted-foreground">Total</span>
                <span className="text-2xl font-black text-foreground">{formatPrice(total)}</span>
              </div>
            </div>

            <Button 
              className="w-full h-12 rounded-xl text-sm font-black uppercase shadow-lg"
              onClick={() => navigate('/checkout')}
            >
              Checkout <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
            
            <div className="mt-6 pt-6 border-t border-white/5 flex items-center justify-center gap-2 text-muted-foreground">
              <ShieldCheck className="w-4 h-4 text-green-500" />
              <span className="text-[10px] font-bold uppercase tracking-wider">Cash on Delivery - Verified</span>
            </div>
          </div>
          
          <div className="glass p-4 rounded-2xl flex items-center gap-3">
             <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <MapPin className="w-4 h-4" />
             </div>
             <p className="text-[10px] font-bold text-muted-foreground">Delivering products across Addis Ababa in 1-3 days.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
