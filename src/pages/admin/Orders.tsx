import React, { useState, useEffect } from 'react';
import { Order } from '@/types';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ShoppingBag, Calendar, User, Search } from 'lucide-react';
import { PLACEHOLDER_IMAGE } from '@/lib/constants';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';

const statusColors: Record<string, string> = {
  'pending': 'bg-orange-500/10 text-orange-500',
  'processing': 'bg-blue-500/10 text-blue-500',
  'shipped': 'bg-purple-500/10 text-purple-500',
  'delivered': 'bg-green-500/10 text-green-500',
  'cancelled': 'bg-red-500/10 text-red-500',
};

const OrdersAdmin = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/orders', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setOrders(await res.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const updateStatus = async (order: any, newStatus: string) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/orders/${order.id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      if (!res.ok) throw new Error('Status update failed');
      
      toast.success(`Order set to ${newStatus}`);
      fetchOrders();
    } catch (err) {
      console.error('Status update error:', err);
      toast.error('Status update failed');
    }
  };

  const filteredOrders = orders.filter(o => 
    o.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div className="space-y-1">
        <h1 className="text-4xl font-black tracking-tight uppercase">Order <span className="gradient-text">Management</span></h1>
        <p className="text-muted-foreground font-medium">Track and process customer orders in real-time</p>
      </div>

      <Card className="glass-card border-none overflow-hidden rounded-3xl pt-2">
        <div className="p-6 pb-0 flex items-center mb-6">
           <div className="relative flex-1 max-w-md">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
             <Input 
               placeholder="Search order ID or customer..." 
               className="pl-10 h-11 bg-background/50 border-none rounded-2xl" 
               value={searchQuery}
               onChange={e => setSearchQuery(e.target.value)}
             />
           </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow>
                <TableHead className="font-bold px-6">Order Info</TableHead>
                <TableHead className="font-bold">Customer & Shipping</TableHead>
                <TableHead className="font-bold">Items</TableHead>
                <TableHead className="font-bold text-center">Amount</TableHead>
                <TableHead className="font-bold">Status</TableHead>
                <TableHead className="font-bold text-right px-6">Process</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.map((o) => (
                <TableRow key={o.id} className="hover:bg-primary/5 transition-colors group">
                  <TableCell className="px-6 py-5">
                    <div className="flex items-center space-x-3">
                       <div className="p-2 rounded-lg bg-primary/10 text-primary">
                         <ShoppingBag className="w-4 h-4" />
                       </div>
                       <div className="flex flex-col">
                         <span className="font-black text-sm uppercase tracking-tighter">#{o.id.slice(-8)}</span>
                         <span className="text-[10px] text-muted-foreground font-bold">
                           {o.createdAt ? format(o.createdAt, 'MMM d, p') : 'No Date'}
                         </span>
                       </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-foreground">{o.shippingAddress?.fullName || 'N/A'}</span>
                        <Badge variant="secondary" className="text-[9px] h-5 rounded font-black tracking-widest">{o.shippingAddress?.phone || 'N/A'}</Badge>
                      </div>
                      <div className="flex flex-col text-[11px] text-muted-foreground font-medium leading-relaxed bg-muted/20 p-2 rounded-xl">
                        <span className="text-foreground/70">{o.shippingAddress?.address || 'N/A'}</span>
                        <span className="opacity-60">{o.shippingAddress?.area || 'N/A'}, {o.shippingAddress?.city || 'N/A'}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-2 max-w-[250px]">
                      {o.items.map((item, idx) => (
                        <div key={idx} className="flex items-center gap-2 bg-muted/10 p-1.5 rounded-xl border border-white/5">
                          <div className="w-8 h-8 rounded-lg overflow-hidden shrink-0 glass">
                            <img src={item.images?.[0] || PLACEHOLDER_IMAGE} alt="" className="w-full h-full object-cover" />
                          </div>
                          <div className="flex flex-col min-w-0">
                             <span className="text-[11px] font-bold truncate leading-tight uppercase tracking-tight">{item.name}</span>
                             <span className="text-[9px] font-black text-primary uppercase">Qty: {item.quantity}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-center font-black text-base text-primary">
                    ETB {o.totalAmount.toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <Badge className={`rounded-lg border-none px-3 py-1 font-bold text-[10px] uppercase tracking-widest ${statusColors[o.status]}`}>
                      {o.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right px-6">
                    <Select value={o.status} onValueChange={(val) => updateStatus(o, val)}>
                      <SelectTrigger className="w-[140px] h-10 rounded-xl glass border-none font-bold text-xs truncate">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="glass border-border rounded-2xl">
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="processing">Processing</SelectItem>
                        <SelectItem value="shipped">Shipped</SelectItem>
                        <SelectItem value="delivered">Delivered</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
};

export default OrdersAdmin;
