import React, { useState } from 'react';
import { Category } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  LayoutGrid,
  Smartphone, 
  Shirt, 
  Sparkles, 
  Home, 
  Scissors, 
  MoreHorizontal,
  Save,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { CATEGORIES as DEFAULT_CATEGORIES } from '@/lib/mockData';
import { useStore } from '@/lib/store';

const iconMap: Record<string, React.ReactNode> = {
  Smartphone: <Smartphone className="w-5 h-5" />,
  Shirt: <Shirt className="w-5 h-5" />,
  Sparkles: <Sparkles className="w-5 h-5" />,
  Home: <Home className="w-5 h-5" />,
  Scissors: <Scissors className="w-5 h-5" />,
  MoreHorizontal: <MoreHorizontal className="w-5 h-5" />,
};

const CategoriesAdmin = () => {
  const { categories, fetchCategories } = useStore();
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Category>>({});
  const [isAdding, setIsAdding] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editForm.name) return;

    try {
      const token = localStorage.getItem('token');
      if (isEditing && isEditing !== 'new') {
        const res = await fetch(`/api/categories/${isEditing}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify(editForm)
        });
        if (!res.ok) throw new Error('Failed to update');
        toast.success('Category updated!');
      } else {
        const res = await fetch(`/api/categories`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ ...editForm, icon: editForm.icon || 'MoreHorizontal' })
        });
        if (!res.ok) throw new Error('Failed to add');
        toast.success('Category added!');
      }
      setIsEditing(null);
      setIsAdding(false);
      setEditForm({});
      fetchCategories();
    } catch (err) {
      toast.error('Failed to save category');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this category?')) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/categories/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to delete');
      toast.success('Category deleted!');
      fetchCategories();
    } catch (err) {
      toast.error('Failed to delete category');
    }
  };


  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-black uppercase tracking-tight">Categories</h1>
          <p className="text-muted-foreground">Manage your product classifications</p>
        </div>
        <Button 
          className="rounded-xl font-bold uppercase tracking-widest h-12 px-6 shadow-lg shadow-primary/20"
          onClick={() => {
            setIsEditing('new');
            setIsAdding(true);
            setEditForm({ name: '', description: '', icon: 'MoreHorizontal' });
          }}
        >
          <Plus className="mr-2 w-5 h-5" /> Add Category
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence mode="popLayout">
          {(isAdding || isEditing) && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="glass-card p-6 rounded-3xl border-primary/20 ring-2 ring-primary/10"
            >
              <form onSubmit={handleSave} className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest ml-1">Category Name</Label>
                  <Input 
                    autoFocus
                    value={editForm.name || ''} 
                    onChange={e => setEditForm({...editForm, name: e.target.value})}
                    placeholder="E.g. Electronics"
                    className="h-11 rounded-xl bg-muted/50 border-none px-4"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest ml-1">Icon Type</Label>
                  <select 
                    className="w-full h-11 rounded-xl bg-muted/50 border-none px-4 text-sm font-medium focus:ring-1 focus:ring-primary/50"
                    value={editForm.icon || 'MoreHorizontal'}
                    onChange={e => setEditForm({...editForm, icon: e.target.value})}
                  >
                    {Object.keys(iconMap).map(icon => (
                      <option key={icon} value={icon}>{icon}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest ml-1">Description</Label>
                  <Input 
                    value={editForm.description || ''} 
                    onChange={e => setEditForm({...editForm, description: e.target.value})}
                    placeholder="Short summary..."
                    className="h-11 rounded-xl bg-muted/50 border-none px-4"
                  />
                </div>
                <div className="flex gap-2 pt-2">
                  <Button type="submit" className="flex-1 rounded-xl font-bold h-11">
                    <Save className="mr-2 w-4 h-4" /> Save
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="w-11 h-11 p-0 rounded-xl"
                    onClick={() => { setIsEditing(null); setIsAdding(false); }}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </form>
            </motion.div>
          )}

          {categories.map((cat) => (
            <motion.div
              key={cat.id}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card p-6 rounded-3xl border border-white/5 relative group hover:border-primary/20 transition-all duration-300"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                  {iconMap[cat.icon || 'MoreHorizontal'] || <LayoutGrid className="w-6 h-6" />}
                </div>
                <div>
                  <h3 className="font-black uppercase tracking-tight">{cat.name}</h3>
                  <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">{cat.id}</p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed h-8 overflow-hidden line-clamp-2">
                {cat.description}
              </p>
              
              <div className="mt-6 flex gap-2">
                 <Button 
                   variant="ghost" 
                   size="sm" 
                   className="h-9 px-4 rounded-lg bg-muted/30 hover:bg-primary/10 hover:text-primary font-bold text-[10px] uppercase"
                   onClick={() => {
                     setIsEditing(cat.id);
                     setEditForm(cat);
                   }}
                 >
                   <Edit2 className="mr-1.5 w-3.5 h-3.5" /> Edit
                 </Button>
                 <Button 
                   variant="ghost" 
                   size="sm" 
                   className="h-9 px-4 rounded-lg bg-muted/30 hover:bg-destructive/10 hover:text-destructive font-bold text-[10px] uppercase ml-auto"
                   onClick={() => handleDelete(cat.id)}
                 >
                   <Trash2 className="mr-1.5 w-3.5 h-3.5" /> Delete
                 </Button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default CategoriesAdmin;
