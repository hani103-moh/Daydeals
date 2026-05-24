import React, { useState, useEffect } from 'react';
import { useStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Package, Truck, CheckCircle2, Clock, ChevronRight, ShoppingBag, XCircle, Info, Calendar, Phone, MapPin } from 'lucide-react';
import { formatPrice, cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { PLACEHOLDER_IMAGE } from '@/lib/constants';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

const Orders = () => {
  const { user, loading: authLoading, orders, fetchOrders } = useStore();
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'processing' | 'shipped' | 'delivered'>('all');
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [orderToCancel, setOrderToCancel] = useState<any | null>(null);
  const [isCancelling, setIsCancelling] = useState<string | null>(null);
  const navigate = useNavigate();

  const filteredOrders = orders.filter(order => {
    if (filter === 'all') return true;
    if (filter === 'processing') return order.status === 'processing';
    if (filter === 'shipped') return order.status === 'shipped';
    return order.status === filter;
  });

  useEffect(() => {
    if (!user) {
      if (!authLoading) setLoading(false);
      return;
    }
    fetchOrders().finally(() => setLoading(false));
  }, [user, authLoading]);

  const handleCancelOrder = async () => {
    if (!orderToCancel) return;
    setIsCancelling(orderToCancel.id);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/orders/${orderToCancel.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) {
        const errText = await res.text();
        console.error('Delete order request failed:', errText);
        throw new Error('Delete failed');
      }
      
      toast.success('Order cancelled successfully');
      if (selectedOrder?.id === orderToCancel.id) setSelectedOrder(null);
      setOrderToCancel(null);
      fetchOrders();
    } catch (err) {
      console.error('Cancel Order Error:', err);
      toast.error('Failed to cancel order');
    } finally {
      setIsCancelling(null);
    }
  };

  if (loading || authLoading) {
    return (
      <div className="container mx-auto px-4 py-20 flex justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
          <p className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Finding your orders...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-32 text-center space-y-6">
        <div className="w-20 h-20 bg-primary/5 text-primary rounded-3xl flex items-center justify-center mx-auto">
          <Package className="w-10 h-10" />
        </div>
        <div className="space-y-2">
          <h2 className="text-3xl font-black uppercase tracking-tight">Sign in to track</h2>
          <p className="text-muted-foreground max-w-xs mx-auto">
            Log in to your account to view and track all your orders from Day Deals.
          </p>
        </div>
        <Button size="lg" className="h-14 px-10 rounded-2xl font-bold uppercase" onClick={() => navigate('/auth')}>
          Sign In Now
        </Button>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="container mx-auto px-4 py-32 text-center space-y-6">
        <div className="w-20 h-20 bg-muted/30 text-muted-foreground rounded-3xl flex items-center justify-center mx-auto opacity-50">
          <ShoppingBag className="w-10 h-10" />
        </div>
        <div className="space-y-2">
          <h2 className="text-3xl font-black uppercase tracking-tight">No orders yet</h2>
          <p className="text-muted-foreground max-w-xs mx-auto">
            You haven't placed any orders yet. Start shopping to see your tracking information here!
          </p>
        </div>
        <Button size="lg" className="h-14 px-10 rounded-2xl font-bold uppercase" onClick={() => navigate('/')}>
          Start Shopping
        </Button>
      </div>
    );
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4 text-amber-500" />;
      case 'processing': 
      case 'shipped': return <Truck className="w-4 h-4 text-blue-500" />;
      case 'delivered': return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      default: return <Package className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      case 'processing':
      case 'shipped': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'delivered': return 'bg-green-500/10 text-green-500 border-green-500/20';
      default: return 'bg-muted text-muted-foreground border-transparent';
    }
  };

  const getStepIndex = (status: string) => {
    const steps = ['pending', 'confirmed', 'packed', 'shipped', 'out_for_delivery', 'delivered'];
    return steps.indexOf(status);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex items-center justify-between mb-8">
        <div>
           <h1 className="text-3xl font-black tracking-tight uppercase">My Orders</h1>
           <p className="text-sm text-muted-foreground">Track and manage your purchases</p>
        </div>
        <Package className="w-8 h-8 text-primary/40" />
      </div>

      <div className="flex gap-2 overflow-x-auto pb-4 no-scrollbar mb-6">
        {[
          { id: 'all', label: 'All', icon: <Package className="w-3.5 h-3.5" /> },
          { id: 'pending', label: 'Pending', icon: <Clock className="w-3.5 h-3.5" /> },
          { id: 'processing', label: 'Processing', icon: <Truck className="w-3.5 h-3.5" /> },
          { id: 'shipped', label: 'Shipped', icon: <Truck className="w-3.5 h-3.5" /> },
          { id: 'delivered', label: 'Delivered', icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilter(tab.id as any)}
            className={cn(
              "flex items-center gap-2 px-6 py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all",
              filter === tab.id 
                ? "bg-primary text-black shadow-lg shadow-primary/20 scale-105" 
                : "bg-muted/30 text-muted-foreground hover:bg-muted/50"
            )}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      <div className="space-y-6">
        <AnimatePresence mode="popLayout">
          {filteredOrders.length > 0 ? (
            filteredOrders.map((order) => (
            <motion.div
              key={order.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={() => setSelectedOrder(order)}
              className="glass-card rounded-[2rem] overflow-hidden border border-white/5 group hover:border-primary/20 transition-all duration-500 cursor-pointer"
            >
              <div className="p-6">
                <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Order ID</p>
                    <p className="text-sm font-bold opacity-60">#{order.id?.slice(-8).toUpperCase()}</p>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                       <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Date</p>
                       <p className="text-xs font-bold">{new Date(order.createdAt).toLocaleDateString()}</p>
                    </div>
                    <Badge variant="outline" className={`rounded-xl px-3 py-1 text-[10px] uppercase font-black tracking-tighter ${getStatusColor(order.status)}`}>
                      <span className="mr-1.5">{getStatusIcon(order.status)}</span>
                      {order.status}
                    </Badge>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <div className="flex -space-x-4">
                      {order.items.slice(0, 3).map((item, i) => (
                        <div key={i} className="w-12 h-12 rounded-xl border-2 border-background overflow-hidden glass shrink-0 shadow-lg">
                          <img src={item.images?.[0] || PLACEHOLDER_IMAGE} alt="" className="w-full h-full object-cover" />
                        </div>
                      ))}
                      {order.items.length > 3 && (
                        <div className="w-12 h-12 rounded-xl border-2 border-background flex items-center justify-center glass bg-primary/20 font-bold text-xs shrink-0 shadow-lg">
                          +{order.items.length - 3}
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="font-bold text-sm">{order.items.length} {order.items.length === 1 ? 'Item' : 'Items'}</p>
                      <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">Click to view details</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Amount</p>
                      <p className="text-xl font-black text-primary">{formatPrice(order.totalAmount)}</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                </div>
              </div>
              
              <div className={`h-1.5 w-full bg-muted/30 relative overflow-hidden`}>
                 <motion.div 
                   initial={{ width: 0 }}
                   animate={{ 
                     width: order.status === 'delivered' ? '100%' : 
                            (order.status === 'shipped' || order.status === 'processing') ? '66%' : '33%' 
                   }}
                   className={`h-full absolute left-0 top-0 ${
                     order.status === 'delivered' ? 'bg-green-500' :
                     (order.status === 'shipped' || order.status === 'processing') ? 'bg-blue-500' : 'bg-amber-500'
                   } shadow-[0_0_10px_rgba(0,0,0,0.5)]`}
                 />
              </div>
            </motion.div>
          ))
        ) : (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20 glass rounded-[2rem] border border-white/5"
          >
            <p className="text-muted-foreground font-medium">No {filter} orders found.</p>
          </motion.div>
        )}
        </AnimatePresence>
      </div>

      <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <DialogContent className="max-w-2xl glass-card border-white/10 rounded-[2.5rem] p-0 overflow-hidden outline-none">
          {selectedOrder && (
            <div className="max-h-[85vh] overflow-y-auto no-scrollbar">
              <div className="p-6 md:p-8 space-y-8">
                <DialogHeader>
                  <div className="flex items-center justify-between mb-4">
                    <Badge variant="outline" className={`rounded-full px-4 py-1.5 text-[10px] uppercase font-black tracking-widest ${getStatusColor(selectedOrder.status)}`}>
                      {getStatusIcon(selectedOrder.status)}
                      <span className="ml-2">{selectedOrder.status}</span>
                    </Badge>
                    <div className="text-right">
                      <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Order ID</p>
                      <p className="text-sm font-bold opacity-60">#{selectedOrder.id.toUpperCase()}</p>
                    </div>
                  </div>
                  <DialogTitle className="text-3xl font-black uppercase tracking-tight">Order Details</DialogTitle>
                  <DialogDescription className="flex items-center gap-2 mt-2 font-bold uppercase text-[10px] tracking-widest">
                    <Calendar className="w-3.5 h-3.5" />
                    Placed on {new Date(selectedOrder.createdAt).toLocaleString()}
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-6">
                  {/* Live Tracking Timeline */}
                  {selectedOrder.status !== 'cancelled' ? (
                    <div className="space-y-4 bg-white/5 p-6 rounded-3xl border border-white/5">
                      <h3 className="text-xs font-black uppercase tracking-widest text-primary flex items-center gap-2">
                        <Truck className="w-4 h-4" /> Live Tracking Status
                      </h3>
                      
                      <div className="relative pt-6 pb-2">
                        {/* Track bar backgrounds */}
                        <div className="absolute top-[28px] left-6 right-6 h-0.5 bg-white/10 -z-1" />
                        
                        <div className="absolute top-[28px] left-6 h-0.5 bg-primary transition-all duration-500 -z-1" 
                             style={{ 
                               width: `${Math.max(0, (getStepIndex(selectedOrder.status) / 5) * 88)}%` 
                             }} 
                        />

                        <div className="flex justify-between items-start relative z-10 overflow-x-auto pb-2 no-scrollbar gap-2">
                          {['pending', 'confirmed', 'packed', 'shipped', 'out_for_delivery', 'delivered'].map((step, idx) => {
                            const isCompleted = idx <= getStepIndex(selectedOrder.status);
                            const isActive = step === selectedOrder.status;
                            const niceLabels: Record<string, string> = {
                              pending: 'Pending',
                              confirmed: 'Confirmed',
                              packed: 'Packed',
                              shipped: 'Shipped',
                              out_for_delivery: 'Out for delivery',
                              delivered: 'Delivered'
                            };

                            return (
                              <div key={step} className="flex flex-col items-center shrink-0 w-14 text-center space-y-2">
                                <div className={cn(
                                  "w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-black transition-all",
                                  isActive ? "bg-primary text-black scale-110 ring-4 ring-primary/20" :
                                  isCompleted ? "bg-primary/80 text-black animate-pulse" : "bg-white/15 text-muted-foreground/60"
                                )}>
                                  {isCompleted ? '✓' : idx + 1}
                                </div>
                                <span className={cn(
                                  "text-[7px] font-extrabold uppercase tracking-tighter leading-none block max-w-[50px] mx-auto",
                                  isActive ? "text-primary font-boldScale" : "text-muted-foreground/50"
                                )}>
                                  {niceLabels[step]}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-3xl flex items-center gap-3">
                      <XCircle className="w-5 h-5 shrink-0" />
                      <div className="text-xs">
                        <p className="font-bold uppercase leading-none">Order Was Cancelled</p>
                        <p className="opacity-75 mt-1">This order is closed and stock balances have been returned.</p>
                      </div>
                    </div>
                  )}

                  <div>
                    <h3 className="text-xs font-black uppercase tracking-widest text-primary mb-4 flex items-center gap-2">
                       <ShoppingBag className="w-4 h-4" /> Items Ordered
                    </h3>
                    <div className="space-y-4">
                      {selectedOrder.items.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between bg-white/5 p-4 rounded-3xl border border-white/5">
                          <div className="flex items-center gap-4">
                            <div className="w-20 h-20 rounded-2xl overflow-hidden glass border border-white/10 shrink-0">
                              <img src={item.images?.[0] || PLACEHOLDER_IMAGE} alt={item.name} className="w-full h-full object-cover" />
                            </div>
                            <div>
                              <p className="font-bold text-base leading-tight mb-1">{item.name}</p>
                              <Badge variant="secondary" className="rounded-lg text-[10px] font-bold">Qty: {item.quantity}</Badge>
                            </div>
                          </div>
                          <div className="text-right">
                             <p className="font-black text-lg">{formatPrice(item.price * item.quantity)}</p>
                             <p className="text-[10px] text-muted-foreground font-bold">{formatPrice(item.price)} each</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Separator className="bg-white/5" />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <h3 className="text-xs font-black uppercase tracking-widest text-primary flex items-center gap-2">
                        <Truck className="w-4 h-4" /> Shipping Address
                      </h3>
                      <div className="bg-white/5 p-5 rounded-3xl border border-white/5 space-y-2">
                        <p className="font-black text-lg">{selectedOrder.shippingAddress?.fullName || 'N/A'}</p>
                        <div className="space-y-1 text-sm font-medium opacity-80">
                          <p className="flex items-center gap-2"><Phone className="w-3.5 h-3.5" /> {selectedOrder.shippingAddress?.phone || 'N/A'}</p>
                          <p className="flex items-start gap-2"><MapPin className="w-3.5 h-3.5 mt-1" /> {selectedOrder.shippingAddress?.address || 'N/A'}, {selectedOrder.shippingAddress?.area || 'N/A'}</p>
                          <p className="ml-5 font-black uppercase text-[10px] tracking-widest opacity-60">{selectedOrder.shippingAddress?.city || 'N/A'}, Ethiopia</p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-xs font-black uppercase tracking-widest text-primary flex items-center gap-2">
                        <Info className="w-4 h-4" /> Payment Summary
                      </h3>
                      <div className="bg-primary text-black p-5 rounded-3xl shadow-xl shadow-primary/10 space-y-3">
                        <div className="flex justify-between items-center text-xs font-black uppercase tracking-widest opacity-60">
                           <span>Subtotal</span>
                           <span>{formatPrice(selectedOrder.totalAmount)}</span>
                        </div>
                        <div className="flex justify-between items-center text-xs font-black uppercase tracking-widest opacity-60">
                           <span>Delivery</span>
                           <span>FREE</span>
                        </div>
                        <Separator className="bg-black/10" />
                        <div className="flex justify-between items-center">
                           <span className="font-black uppercase tracking-tighter text-sm">Amount Paid</span>
                           <span className="font-black text-2xl">{formatPrice(selectedOrder.totalAmount)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {selectedOrder.status === 'pending' && (
                  <div className="pt-4">
                    <Button 
                      variant="destructive" 
                      className="w-full h-16 rounded-2xl font-black uppercase tracking-widest bg-red-500 hover:bg-red-600 border-none group"
                      onClick={() => setOrderToCancel(selectedOrder)}
                      disabled={isCancelling === selectedOrder.id}
                    >
                      {isCancelling === selectedOrder.id ? (
                        <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                      ) : (
                        <>
                          <XCircle className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
                          Cancel This Order
                        </>
                      )}
                    </Button>
                    <p className="text-[10px] text-center mt-3 text-muted-foreground font-bold uppercase tracking-widest opacity-60">
                      Orders can only be cancelled while in pending status
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!orderToCancel} onOpenChange={() => setOrderToCancel(null)}>
        <DialogContent className="glass-card border-none rounded-[2rem] p-8 max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black uppercase text-center">Cancel Order?</DialogTitle>
            <DialogDescription className="text-center font-medium pt-2">
              Are you sure you want to cancel order #{orderToCancel?.id?.slice(-8).toUpperCase()}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3 mt-6">
            <Button 
              variant="destructive" 
              className="h-14 rounded-2xl font-black uppercase tracking-widest"
              onClick={handleCancelOrder}
              disabled={!!isCancelling}
            >
              {isCancelling ? 'Processing...' : 'Yes, Cancel Order'}
            </Button>
            <Button 
              variant="ghost" 
              className="h-14 rounded-2xl font-bold"
              onClick={() => setOrderToCancel(null)}
              disabled={!!isCancelling}
            >
              Keep Order
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Orders;
