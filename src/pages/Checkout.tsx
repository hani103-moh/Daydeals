import React, { useState } from 'react';
import { useStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, ChevronRight, Truck, HandCoins, MapPin } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Separator } from '@/components/ui/separator';
import { formatPrice } from '@/lib/utils';
import { PLACEHOLDER_IMAGE } from '@/lib/constants';

const Checkout = () => {
  const { cart, clearCart, user } = useStore();
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    fullName: user?.displayName || '',
    phone: user?.shippingPhone || '',
    address: user?.shippingAddress || '',
    city: user?.shippingCity || 'Addis Ababa',
    area: user?.area || '',
  });

  // Sync with user data when available
  React.useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        fullName: user.displayName || prev.fullName,
        phone: user.shippingPhone || prev.phone,
        address: user.shippingAddress || prev.address,
        city: user.shippingCity || prev.city,
        area: user.area || prev.area,
      }));
    }
  }, [user]);

  const subtotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const shipping = 150; // Standard delivery fee in ETB
  const total = subtotal + shipping;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handlePlaceOrder = async () => {
    if (cart.length === 0) {
      toast.error('Your cart is empty');
      return;
    }
    
    setIsProcessing(true);

    try {
      const orderData = {
        items: cart,
        total,
        shippingAddress: {
          fullName: formData.fullName,
          phone: formData.phone,
          address: formData.address,
          city: formData.city,
          area: formData.area,
        },
      };

      const token = localStorage.getItem('token');

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(orderData),
      });
      
      if (!res.ok) {
        const errData = await res.json().catch(() => ({ error: 'Order taking failed' }));
        throw new Error(errData.error || 'Order taking failed');
      }
      
      clearCart();
      toast.success('Ameseginalen! Order placed successfully!');
      setStep(3);
    } catch (err: any) {
      console.error('Checkout Error Details:', err);
      if (err.name === 'AbortError') {
        toast.error('Order timed out but might have been created. Please check your orders page.');
      } else {
        toast.error(err.message || 'Failed to place order. Please check your connection and try again.');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  if (step === 3) {
    return (
      <div className="container mx-auto px-4 py-24 text-center space-y-8">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="w-24 h-24 bg-primary/10 text-primary rounded-[2rem] flex items-center justify-center mx-auto"
        >
          <CheckCircle2 className="w-12 h-12" />
        </motion.div>
        <div className="space-y-4">
          <h2 className="text-4xl font-black tracking-tight uppercase">Order Received!</h2>
          <p className="text-muted-foreground text-sm max-w-sm mx-auto">
            Ameseginalen! We'll call you shortly to confirm your delivery and bring your items right to your door.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
          <Button size="lg" className="h-14 px-10 rounded-2xl font-black uppercase text-xs w-full sm:w-auto" onClick={() => navigate('/orders')}>
            Track Order
          </Button>
          <Button size="lg" variant="outline" className="h-14 px-10 rounded-2xl font-bold w-full sm:w-auto" onClick={() => navigate('/')}>
            Back to Shop
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex items-center gap-2 mb-8">
        <div className={`flex items-center gap-2 ${step >= 1 ? 'text-primary' : 'text-muted-foreground'}`}>
          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black ${step >= 1 ? 'bg-primary text-black' : 'bg-muted'}`}>1</div>
          <span className="text-xs font-bold uppercase tracking-wider">Delivery</span>
        </div>
        <ChevronRight className="w-3 h-3 text-muted-foreground" />
        <div className={`flex items-center gap-2 ${step >= 2 ? 'text-primary' : 'text-muted-foreground'}`}>
          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black ${step >= 2 ? 'bg-primary text-black' : 'bg-muted'}`}>2</div>
          <span className="text-xs font-bold uppercase tracking-wider">Confirm</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
        <div className="md:col-span-3 space-y-6">
          <AnimatePresence mode="wait">
            {step === 1 ? (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="glass-card p-6 rounded-3xl space-y-6"
              >
                <div className="flex items-center gap-3">
                   <div className="p-2 rounded-xl bg-primary/10 text-primary">
                      <MapPin className="w-5 h-5" />
                   </div>
                   <h2 className="text-xl font-black uppercase">Delivery Address</h2>
                </div>
                
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-black uppercase ml-1">Full Name</Label>
                    <Input name="fullName" value={formData.fullName} onChange={handleInputChange} className="h-11 rounded-xl glass border-white/10" placeholder="John Doe" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-black uppercase ml-1">Phone Number</Label>
                    <Input name="phone" value={formData.phone} onChange={handleInputChange} className="h-11 rounded-xl glass border-white/10" placeholder="0911..." />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-black uppercase ml-1">Area / Subcity</Label>
                    <Input name="area" value={formData.area} onChange={handleInputChange} className="h-11 rounded-xl glass border-white/10" placeholder="e.g., Bole, Mekanisa" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-black uppercase ml-1">House No. / Landmark</Label>
                    <Input name="address" value={formData.address} onChange={handleInputChange} className="h-11 rounded-xl glass border-white/10" placeholder="H.No 123 near..." />
                  </div>
                </div>

                <Button 
                  className="w-full h-12 rounded-xl font-black uppercase text-xs"
                  onClick={() => setStep(2)}
                  disabled={!formData.fullName || !formData.phone || !formData.address}
                >
                  Confirm Delivery
                </Button>
              </motion.div>
            ) : (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="glass-card p-6 rounded-3xl space-y-6"
              >
                <div className="flex items-center gap-3">
                   <div className="p-2 rounded-xl bg-primary/10 text-primary">
                      <HandCoins className="w-5 h-5" />
                   </div>
                   <h2 className="text-xl font-black uppercase">Payment Mode</h2>
                </div>

                <div className="p-4 rounded-xl border border-primary/20 bg-primary/5 space-y-2">
                   <div className="flex items-center justify-between">
                      <p className="font-bold">Cash on Delivery</p>
                      <CheckCircle2 className="w-5 h-5 text-primary" />
                   </div>
                   <p className="text-xs text-muted-foreground leading-relaxed">
                     Simple and safe. Pay only when you receive your items at your doorstep. We currently only support COD for your safety.
                   </p>
                </div>

                <div className="space-y-4 pt-4 border-t border-white/5">
                   <h3 className="text-[10px] font-black uppercase text-muted-foreground">Order for:</h3>
                   <div className="text-sm font-medium space-y-1">
                      <p>{formData.fullName}</p>
                      <p>{formData.phone}</p>
                      <p className="text-muted-foreground text-xs">{formData.address}, {formData.area}</p>
                   </div>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1 h-12 rounded-xl font-bold" onClick={() => setStep(1)}>
                    Back
                  </Button>
                  <Button 
                    className="flex-[2] h-12 rounded-xl font-black uppercase text-xs"
                    onClick={handlePlaceOrder}
                    disabled={isProcessing}
                  >
                    {isProcessing ? 'Processing...' : `Order - ${formatPrice(total)}`}
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="md:col-span-2">
          <div className="glass-card p-6 rounded-3xl space-y-6 sticky top-24">
            <h2 className="text-sm font-black uppercase tracking-tight mb-4">Summary</h2>
            <div className="space-y-3 max-h-48 overflow-y-auto pr-2 no-scrollbar">
              {cart.map((item) => (
                <div key={item.id} className="flex justify-between items-center text-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg overflow-hidden glass border border-white/5">
                      <img src={item.images?.[0] || PLACEHOLDER_IMAGE} alt={item.name} className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <p className="font-bold line-clamp-1">{item.name}</p>
                      <p className="text-[8px] font-medium text-muted-foreground uppercase">{item.quantity} × {formatPrice(item.price)}</p>
                    </div>
                  </div>
                  <span className="font-bold">{formatPrice(item.price * item.quantity)}</span>
                </div>
              ))}
            </div>
            
            <Separator className="bg-white/5" />
            
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Delivery Fee</span>
                <span>{formatPrice(shipping)}</span>
              </div>
              <div className="flex justify-between pt-2">
                <span className="text-sm font-black uppercase">Total</span>
                <span className="text-xl font-black text-foreground">{formatPrice(total)}</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-primary/10 border border-primary/20 text-center">
               <p className="text-[10px] font-black text-primary uppercase tracking-tighter">Fast delivery within 1-3 days in Addis Ababa.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
