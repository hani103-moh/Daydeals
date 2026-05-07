import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { TrendingUp, Users, DollarSign, Package, ArrowUpRight, ArrowDownRight, Loader2, Plus, ShoppingBag, LayoutGrid } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';

const StatCard = ({ title, value, icon: Icon, trend, trendValue, color, loading }: any) => (
  <Card className="glass-card border-none">
    <CardContent className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-2xl ${color} bg-opacity-10 text-opacity-100`}>
          <Icon className="w-6 h-6" />
        </div>
        {!loading && trendValue && (
          <div className={`flex items-center space-x-1 text-xs font-bold ${trend === 'up' ? 'text-green-500' : 'text-red-500'}`}>
            {trend === 'up' ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
            <span>{trendValue}%</span>
          </div>
        )}
      </div>
      <div>
        <p className="text-xs font-black uppercase text-muted-foreground tracking-widest mb-1">{title}</p>
        <h3 className="text-3xl font-black">
          {loading ? <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /> : value}
        </h3>
      </div>
    </CardContent>
  </Card>
);

const Overview = () => {
  const [stats, setStats] = useState({
    revenue: 0,
    ordersCount: 0,
    usersCount: 0,
    productsCount: 0,
    loading: true
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem('token');
        const headers = { 'Authorization': `Bearer ${token}` };
        
        const [ordersRes, usersRes, productsRes] = await Promise.all([
          fetch('/api/orders', { headers }),
          fetch('/api/users', { headers }),
          fetch('/api/products')
        ]);
        
        const orders = await ordersRes.json();
        const users = await usersRes.json();
        const products = await productsRes.json();

        const totalRev = orders.reduce((acc: number, curr: any) => acc + (Number(curr.totalAmount) || 0), 0);
        
        setStats({
          revenue: totalRev,
          ordersCount: orders.length,
          usersCount: users.length,
          productsCount: products.length,
          loading: false
        });
      } catch (err) {
        console.error(err);
        setStats(prev => ({ ...prev, loading: false }));
      }
    };
    
    fetchStats();
  }, []);

  const chartData = [
    { name: 'Mon', sales: stats.revenue * 0.1, orders: Math.floor(stats.ordersCount * 0.1) },
    { name: 'Tue', sales: stats.revenue * 0.15, orders: Math.floor(stats.ordersCount * 0.15) },
    { name: 'Wed', sales: stats.revenue * 0.12, orders: Math.floor(stats.ordersCount * 0.12) },
    { name: 'Thu', sales: stats.revenue * 0.2, orders: Math.floor(stats.ordersCount * 0.2) },
    { name: 'Fri', sales: stats.revenue * 0.18, orders: Math.floor(stats.ordersCount * 0.18) },
    { name: 'Sat', sales: stats.revenue * 0.15, orders: Math.floor(stats.ordersCount * 0.15) },
    { name: 'Sun', sales: stats.revenue * 0.1, orders: Math.floor(stats.ordersCount * 0.1) },
  ];

  return (
    <div className="space-y-10">
      <div className="space-y-1">
        <h1 className="text-4xl font-black tracking-tight uppercase">Dashboard <span className="gradient-text">Overview</span></h1>
        <p className="text-muted-foreground font-medium">Welcome back, Admin. Real-time insights are ready.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
         <StatCard title="Total Revenue" value={`ETB ${stats.revenue.toLocaleString()}`} icon={DollarSign} trend="up" trendValue="12.5" color="bg-primary text-primary" loading={stats.loading} />
         <StatCard title="Active Users" value={stats.usersCount.toLocaleString()} icon={Users} trend="up" trendValue="8.2" color="bg-blue-500 text-blue-500" loading={stats.loading} />
         <StatCard title="Total Orders" value={stats.ordersCount.toLocaleString()} icon={TrendingUp} trend="up" trendValue="15.4" color="bg-green-500 text-green-500" loading={stats.loading} />
         <StatCard title="Active Products" value={stats.productsCount.toLocaleString()} icon={Package} trend="up" trendValue="2.1" color="bg-orange-500 text-orange-500" loading={stats.loading} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="glass-card border-none p-8 rounded-[2.5rem]">
          <h3 className="text-xl font-black uppercase mb-8">Revenue Distribution</h3>
          <div className="h-[300px]">
             <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="oklch(0.45 0.25 260)" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="oklch(0.45 0.25 260)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="oklch(0.9 0.02 240 / 0.1)" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 600 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 600 }} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}
                  />
                  <Area type="monotone" dataKey="sales" stroke="oklch(0.45 0.25 260)" strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" />
                </AreaChart>
             </ResponsiveContainer>
          </div>
        </Card>

        <Card className="glass-card border-none p-8 rounded-[2.5rem]">
          <h3 className="text-xl font-black uppercase mb-8">Order Volume</h3>
          <div className="h-[300px]">
             <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="oklch(0.9 0.02 240 / 0.1)" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 600 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 600 }} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}
                  />
                  <Bar dataKey="orders" fill="oklch(0.45 0.25 260 / 0.4)" radius={[10, 10, 0, 0]} />
                </BarChart>
             </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <div className="space-y-6">
        <h3 className="text-xl font-black uppercase tracking-tight">Quick <span className="gradient-text">Actions</span></h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link to="/admin/products" className="group">
            <Card className="glass-card border-none p-6 transition-all hover:scale-105 active:scale-95 cursor-pointer bg-primary/5 hover:bg-primary/10 border border-primary/10">
              <div className="flex items-center space-x-4">
                <div className="p-3 rounded-2xl bg-primary/20 text-primary">
                  <Plus className="w-6 h-6" />
                </div>
                <div>
                  <p className="font-black uppercase text-xs tracking-widest">Add Products</p>
                  <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-tight">Manage your inventory</p>
                </div>
              </div>
            </Card>
          </Link>

          <Link to="/admin/orders" className="group">
            <Card className="glass-card border-none p-6 transition-all hover:scale-105 active:scale-95 cursor-pointer bg-blue-500/5 hover:bg-blue-500/10 border border-blue-500/10">
              <div className="flex items-center space-x-4">
                <div className="p-3 rounded-2xl bg-blue-500/20 text-blue-500">
                  <ShoppingBag className="w-6 h-6" />
                </div>
                <div>
                  <p className="font-black uppercase text-xs tracking-widest">Manage Orders</p>
                  <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-tight">View current sales</p>
                </div>
              </div>
            </Card>
          </Link>

          <Link to="/admin/categories" className="group">
            <Card className="glass-card border-none p-6 transition-all hover:scale-105 active:scale-95 cursor-pointer bg-orange-500/5 hover:bg-orange-500/10 border border-orange-500/10">
              <div className="flex items-center space-x-4">
                <div className="p-3 rounded-2xl bg-orange-500/20 text-orange-500">
                  <LayoutGrid className="w-6 h-6" />
                </div>
                <div>
                  <p className="font-black uppercase text-xs tracking-widest">Categories</p>
                  <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-tight">Organize your store</p>
                </div>
              </div>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Overview;
