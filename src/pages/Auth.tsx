import React, { useState } from 'react';
import { useStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Mail, Chrome, ArrowRight, UserPlus, LogIn, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

const Auth = () => {
  const { login, signUpWithEmail, signInWithEmail, user, loading: storeLoading } = useStore();
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [formData, setFormData] = useState({ email: '', password: '', name: '' });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  React.useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const handleGoogleLogin = async () => {
    setIsLoggingIn(true);
    await login();
    setIsLoggingIn(false);
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    console.log(`Starting ${authMode} for ${formData.email}...`);
    try {
      if (authMode === 'signup') {
        if (!formData.name) throw new Error('Please enter your name');
        if (formData.password.length < 6) throw new Error('Password must be at least 6 characters');
        await signUpWithEmail(formData.email, formData.password, formData.name);
        toast.success('Account created successfully!');
      } else {
        await signInWithEmail(formData.email, formData.password);
        toast.success('Welcome back!');
      }
      // Rely on the useEffect to navigate once 'user' is populated in store
      console.log('Auth success, waiting for store update...');
    } catch (err: any) {
      console.error('Auth Error:', err);
      toast.error(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 min-h-[90vh] flex items-center justify-center py-10">
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-8 md:p-12 rounded-[3rem] w-full max-w-md text-center space-y-8 relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 blur-[50px] -translate-y-1/2 translate-x-1/2" />
        
        <div className="space-y-3">
          <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto shadow-2xl shadow-primary/30 mb-4">
            <span className="text-white font-black text-2xl">DD</span>
          </div>
          <h1 className="text-3xl font-black tracking-tight uppercase">
            {authMode === 'login' ? 'Welcome ' : 'Join '}
            <span className="gradient-text">{authMode === 'login' ? 'Back' : 'Us'}</span>
          </h1>
          <p className="text-xs text-muted-foreground font-medium">
            {authMode === 'login' ? 'Sync your deals across all devices' : 'Start your habesha deal hunting adventure'}
          </p>
        </div>

        <form onSubmit={handleEmailAuth} className="space-y-4 text-left">
          {authMode === 'signup' && (
            <div className="space-y-1.5">
              <Label className="text-[10px] font-black uppercase tracking-widest ml-1">Full Name</Label>
              <Input 
                required
                placeholder="Enter your name"
                className="h-12 rounded-xl bg-muted/50 border-none px-4"
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
              />
            </div>
          )}
          <div className="space-y-1.5">
            <Label className="text-[10px] font-black uppercase tracking-widest ml-1">Email Address</Label>
            <Input 
              required
              type="email"
              placeholder="name@example.com"
              className="h-12 rounded-xl bg-muted/50 border-none px-4"
              value={formData.email}
              onChange={e => setFormData({...formData, email: e.target.value})}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[10px] font-black uppercase tracking-widest ml-1">Password</Label>
            <Input 
              required
              type="password"
              placeholder="••••••••"
              className="h-12 rounded-xl bg-muted/50 border-none px-4"
              value={formData.password}
              onChange={e => setFormData({...formData, password: e.target.value})}
            />
          </div>
          <Button 
            type="submit"
            className="w-full h-12 rounded-xl font-bold uppercase tracking-widest text-[10px] shadow-lg shadow-primary/20"
            disabled={loading}
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : (authMode === 'login' ? <LogIn className="w-4 h-4 mr-2" /> : <UserPlus className="w-4 h-4 mr-2" />)}
            {authMode === 'login' ? 'Sign In' : 'Create Account'}
          </Button>
        </form>

        <div className="flex items-center space-x-4">
          <div className="h-px flex-1 bg-border/50" />
          <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Or continue with</span>
          <div className="h-px flex-1 bg-border/50" />
        </div>

        <Button 
          className="w-full h-12 rounded-xl font-bold bg-white text-black hover:bg-gray-100 border border-gray-200 shadow-sm flex items-center justify-center space-x-3"
          onClick={handleGoogleLogin}
          disabled={isLoggingIn || storeLoading}
        >
          <Chrome className="w-5 h-5 text-blue-500" />
          <span className="text-xs">Google</span>
        </Button>

        <div className="pt-2">
          <button 
            type="button"
            onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')}
            className="text-[10px] font-black uppercase tracking-widest text-primary hover:underline"
          >
            {authMode === 'login' ? "Don't have an account? Sign Up" : "Already have an account? Login"}
          </button>
        </div>

        <div className="flex justify-center pt-2">
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-[8px] font-black uppercase tracking-[0.2em] opacity-40 hover:opacity-100"
            onClick={async () => {
              try {
                const res = await fetch('/api/health');
                const data = await res.json();
                if (data.status === 'ok') toast.success('Server connection: OK');
                else toast.error('Server connection: ' + (data.message || 'Error'));
              } catch (e) {
                toast.error('Cannot reach server. Please refresh.');
              }
            }}
          >
            Check Connection
          </Button>
        </div>

        <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-black opacity-50 px-4">
          By continuing, you agree to DayDeals Terms of Service & Privacy Policy
        </p>
      </motion.div>
    </div>
  );
};

export default Auth;
