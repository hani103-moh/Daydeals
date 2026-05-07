import React, { useState } from 'react';
import { useStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { toast } from 'sonner';
import { User, MapPin, Phone, Mail, Camera, ShieldCheck, LogOut } from 'lucide-react';
import { motion } from 'motion/react';

const Profile = () => {
  const { user, loading, logout, checkAuth } = useStore();
  const [isUpdating, setIsUpdating] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [formData, setFormData] = useState({
    displayName: user?.displayName || '',
    shippingAddress: user?.shippingAddress || '',
    shippingPhone: user?.shippingPhone || '',
    shippingCity: user?.shippingCity || '',
  });

  // Sync state when user loads
  React.useEffect(() => {
    if (user) {
      setFormData({
        displayName: user.displayName || '',
        shippingAddress: user.shippingAddress || '',
        shippingPhone: user.shippingPhone || '',
        shippingCity: user.shippingCity || '',
      });
    }
  }, [user]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsUpdating(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          displayName: formData.displayName,
          shippingAddress: formData.shippingAddress,
          shippingPhone: formData.shippingPhone,
          shippingCity: formData.shippingCity
        })
      });
      if (!res.ok) throw new Error('Update failed');
      
      toast.success('Profile updated successfully!');
      checkAuth();
    } catch (err) {
      console.error('Update Profile Error:', err);
      toast.error('Failed to update profile.');
    } finally {
      setIsUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-20 flex justify-center">
        <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-32 text-center space-y-6">
        <h2 className="text-3xl font-black uppercase tracking-tight">Access Denied</h2>
        <p className="text-muted-foreground">Please sign in to view your profile.</p>
        <Button onClick={() => window.location.href = '/auth'}>Sign In</Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-2xl">
      <div className="flex items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center relative group">
            {user.photoURL ? (
              <img src={user.photoURL} alt="Profile" className="w-full h-full rounded-3xl object-cover" />
            ) : (
              <User className="w-10 h-10 text-primary" />
            )}
            <button className="absolute -bottom-2 -right-2 bg-white text-black p-1.5 rounded-xl shadow-lg border border-black/5 opacity-0 group-hover:opacity-100 transition-opacity">
              <Camera className="w-4 h-4" />
            </button>
          </div>
          <div>
            <h1 className="text-3xl font-black uppercase tracking-tight">{user.displayName || 'Day Deal Hunter'}</h1>
            <p className="text-muted-foreground flex items-center gap-2">
              <Mail className="w-4 h-4" /> {user.email}
            </p>
          </div>
        </div>
        
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={async () => {
            setIsLoggingOut(true);
            await logout();
            setIsLoggingOut(false);
          }}
          disabled={isLoggingOut}
          className="rounded-2xl w-12 h-12 hover:bg-red-500/10 hover:text-red-500 transition-colors"
        >
          {isLoggingOut ? (
            <div className="w-4 h-4 border-2 border-red-500/20 border-t-red-500 rounded-full animate-spin" />
          ) : (
            <LogOut className="w-5 h-5" />
          )}
        </Button>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className="glass-card rounded-[2.5rem] border-white/5 overflow-hidden">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl font-black uppercase tracking-tight flex items-center gap-2">
              <MapPin className="w-5 h-5 text-primary" />
              Shipping Information
            </CardTitle>
            <CardDescription>Update your default shipping address for faster checkout.</CardDescription>
          </CardHeader>
          <CardContent>
            <form id="profile-form" onSubmit={handleUpdate} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Full Name</Label>
                  <Input 
                    value={formData.displayName}
                    onChange={(e) => setFormData({...formData, displayName: e.target.value})}
                    placeholder="E.g. John Doe"
                    className="h-12 rounded-xl bg-muted/30 border-none focus-visible:ring-1 focus-visible:ring-primary/50"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Default Shipping Address</Label>
                  <Input 
                    value={formData.shippingAddress}
                    onChange={(e) => setFormData({...formData, shippingAddress: e.target.value})}
                    placeholder="E.g. 123 Street"
                    className="h-12 rounded-xl bg-muted/30 border-none focus-visible:ring-1 focus-visible:ring-primary/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">City</Label>
                  <Input 
                    value={formData.shippingCity}
                    onChange={(e) => setFormData({...formData, shippingCity: e.target.value})}
                    placeholder="E.g. New York"
                    className="h-12 rounded-xl bg-muted/30 border-none focus-visible:ring-1 focus-visible:ring-primary/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Phone Number</Label>
                  <Input 
                    value={formData.shippingPhone}
                    onChange={(e) => setFormData({...formData, shippingPhone: e.target.value})}
                    placeholder="E.g. +1 234 567 890"
                    className="h-12 rounded-xl bg-muted/30 border-none focus-visible:ring-1 focus-visible:ring-primary/50"
                  />
                </div>
              </div>

              {user.role === 'admin' && (
                <div className="p-6 rounded-2xl bg-primary/5 border border-primary/20 flex flex-col md:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <ShieldCheck className="w-5 h-5 text-primary" />
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-primary">Account Status</p>
                      <p className="text-sm font-bold">Administrator Access</p>
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    className="rounded-xl font-bold uppercase text-[10px] tracking-widest h-10 border-primary/30 text-primary hover:bg-primary/10"
                    onClick={() => window.location.href = '/admin'}
                  >
                    Manage Dashboard
                  </Button>
                </div>
              )}
            </form>
          </CardContent>
          <CardFooter className="bg-muted/10 p-6 flex justify-end">
            <Button 
              type="submit" 
              form="profile-form" 
              disabled={isUpdating}
              className="h-12 px-8 rounded-xl font-bold uppercase tracking-wider shadow-lg shadow-primary/20"
            >
              {isUpdating ? 'Saving...' : 'Save Changes'}
            </Button>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
};

export default Profile;
