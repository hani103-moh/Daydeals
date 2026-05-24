import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { CheckCircle2, XCircle, ArrowRight, ShieldCheck, Landmark, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'motion/react';
import { formatPrice } from '@/lib/utils';

const PaymentSimulation = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [isVerifying, setIsVerifying] = useState(false);
  const [status, setStatus] = useState<'pending' | 'success' | 'failed'>('pending');

  const txRef = searchParams.get('tx_ref') || '';
  const orderId = searchParams.get('orderId') || '';
  const amount = parseFloat(searchParams.get('amount') || '0');
  const currency = searchParams.get('currency') || 'ETB';

  const handleSimulatePayment = async (simulatedStatus: 'success' | 'failed') => {
    setIsVerifying(true);
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`/api/payments/chapa/verify/${txRef}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ status: simulatedStatus })
      });

      if (!res.ok) {
        throw new Error('Verification failed');
      }

      const data = await res.json();
      if (simulatedStatus === 'success') {
        setStatus('success');
        toast.success('Chapa payment simulation successful! Order updated.');
      } else {
        setStatus('failed');
        toast.error('Chapa payment simulation cancelled or failed.');
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to communicate with the verification server.');
    } finally {
      setIsVerifying(false);
    }
  };

  if (status === 'success') {
    return (
      <div className="container mx-auto px-4 py-24 text-center max-w-md">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="glass-card p-8 rounded-[2rem] border-green-500/20 bg-green-500/5 space-y-6"
        >
          <div className="w-16 h-16 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-black uppercase text-green-500">Payment Confirmed!</h2>
            <p className="text-sm text-muted-foreground/80 leading-relaxed">
              DayDeals has successfully received your secure payment via Chapa checkout gateway.
            </p>
          </div>
          <div className="p-4 rounded-xl bg-green-500/5 text-xs text-left space-y-2 border border-green-500/10 font-mono">
            <p><span className="text-muted-foreground">Order ID:</span> {orderId}</p>
            <p><span className="text-muted-foreground">Transaction ID:</span> {txRef}</p>
            <p><span className="text-muted-foreground">Settlement Amount:</span> {formatPrice(amount)}</p>
          </div>
          <Button 
            className="w-full h-12 rounded-xl font-black uppercase text-xs"
            onClick={() => navigate('/orders')}
          >
            Track Order <ArrowRight className="ml-2 w-4 h-4" />
          </Button>
        </motion.div>
      </div>
    );
  }

  if (status === 'failed') {
    return (
      <div className="container mx-auto px-4 py-24 text-center max-w-md">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="glass-card p-8 rounded-[2rem] border-red-500/20 bg-red-500/5 space-y-6"
        >
          <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto">
            <XCircle className="w-10 h-10" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-black uppercase text-red-500">Payment Failed</h2>
            <p className="text-sm text-muted-foreground/80 leading-relaxed">
              The Chapa payment attempt was cancelled or returned an authorization error from the issuer bank.
            </p>
          </div>
          <div className="flex gap-3">
            <Button 
              variant="outline"
              className="flex-1 h-12 rounded-xl font-bold text-xs"
              onClick={() => navigate('/cart')}
            >
              Back to Cart
            </Button>
            <Button 
              className="flex-1 h-12 rounded-xl font-black uppercase text-xs"
              onClick={() => setStatus('pending')}
            >
              Retry Payment
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-16 max-w-md">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-6 rounded-3xl space-y-6"
      >
        {/* Simulator Banner */}
        <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 text-center rounded-2xl">
          <p className="text-[10px] font-black uppercase tracking-widest leading-none">Chapa Checkout Sandbox Mode</p>
          <p className="text-[9px] text-muted-foreground mt-1">High-fidelity Simulation Integration</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
            <Landmark className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-black uppercase leading-tight">Chapa Secure Pay</h2>
            <p className="text-[9px] uppercase tracking-wider font-extrabold text-muted-foreground/80">DayDeals eCommerce</p>
          </div>
        </div>

        {/* Invoice Summary */}
        <div className="space-y-3 p-4 rounded-2xl bg-white/5 border border-white/5 text-sm">
          <div className="flex justify-between items-center pb-2 border-b border-white/5">
            <span className="text-xs text-muted-foreground font-black uppercase">Order Ref:</span>
            <span className="font-extrabold text-xs">{orderId}</span>
          </div>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Transaction ID:</span>
              <span className="font-mono text-muted-foreground">{txRef}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Currency:</span>
              <span>{currency}</span>
            </div>
          </div>
          <div className="flex justify-between items-end pt-2 border-t border-white/5">
            <span className="text-xs font-black uppercase text-muted-foreground leading-none">Total Amount:</span>
            <span className="text-xl font-black text-foreground">{formatPrice(amount)}</span>
          </div>
        </div>

        {/* Simul actions */}
        <div className="space-y-3">
          <p className="text-[10px] font-black uppercase text-muted-foreground/60 tracking-wider text-center">
            Simulate Provider Verification Triggers:
          </p>
          
          <Button 
            disabled={isVerifying}
            className="w-full h-12 rounded-xl text-black font-black uppercase text-xs bg-green-500 hover:bg-green-600 transition-all border-none"
            onClick={() => handleSimulatePayment('success')}
          >
            {isVerifying ? (
              <RefreshCw className="mr-2 w-4 h-4 animate-spin" />
            ) : "Simulate Payment Success 👍"}
          </Button>

          <Button 
            disabled={isVerifying}
            variant="outline"
            className="w-full h-12 rounded-xl text-red-500 hover:text-red-400 hover:bg-red-500/10 border-red-500/20 transition-all text-xs font-black uppercase"
            onClick={() => handleSimulatePayment('failed')}
          >
            Simulate Payment Cancel/Fail ❌
          </Button>
        </div>

        <div className="flex items-center justify-center gap-1.5 text-muted-foreground/60">
          <ShieldCheck className="w-4 h-4 text-primary" />
          <span className="text-[8px] font-black uppercase tracking-widest">256-bit Secure encryption</span>
        </div>
      </motion.div>
    </div>
  );
};

export default PaymentSimulation;
