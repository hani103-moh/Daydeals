import React, { useState, useEffect } from 'react';
import { UserProfile } from '@/types';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { User, Mail, Shield, Search, Calendar } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { format } from 'date-fns';

const UsersAdmin = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch('/api/users', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          setUsers(await res.json());
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  const filteredUsers = users.filter(u => 
    u.display_name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div className="space-y-1">
        <h1 className="text-4xl font-black tracking-tight uppercase">User <span className="gradient-text">Management</span></h1>
        <p className="text-muted-foreground font-medium">View and manage customer accounts</p>
      </div>

      <Card className="glass-card border-none overflow-hidden rounded-3xl pt-2">
        <div className="p-6 pb-0 flex items-center mb-6">
           <div className="relative flex-1 max-w-md">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
             <Input 
               placeholder="Search name or email..." 
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
                <TableHead className="font-bold px-6">User</TableHead>
                <TableHead className="font-bold">Email</TableHead>
                <TableHead className="font-bold">Joined</TableHead>
                <TableHead className="font-bold">Role</TableHead>
                <TableHead className="font-bold text-right px-6">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((u) => (
                <TableRow key={u.id} className="hover:bg-primary/5 transition-colors group">
                  <TableCell className="px-6 py-5">
                    <div className="flex items-center space-x-3">
                       <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
                         {u.display_name?.charAt(0) || <User className="w-4 h-4" />}
                       </div>
                       <div className="flex flex-col">
                         <span className="font-black text-sm uppercase tracking-tighter">{u.display_name || 'Anonymous'}</span>
                         <span className="text-[10px] text-muted-foreground uppercase font-black tracking-widest leading-none mt-0.5">ID: {u.id.slice(0, 8)}</span>
                       </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                      <Mail className="w-3.5 h-3.5" />
                      {u.email}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                      <Calendar className="w-3.5 h-3.5" />
                      {u.created_at ? format(new Date(u.created_at), 'MMM d, yyyy') : 'Recently'}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={`rounded-lg border-none px-3 py-1 font-bold text-[10px] uppercase tracking-widest ${u.role === 'admin' ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'}`}>
                      {u.role || 'customer'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right px-6">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Active
                    </span>
                  </TableCell>
                </TableRow>
              ))}
              {filteredUsers.length === 0 && !loading && (
                <TableRow>
                  <TableCell colSpan={5} className="h-40 text-center text-muted-foreground font-medium">
                    No users found matching your search.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
};

export default UsersAdmin;
