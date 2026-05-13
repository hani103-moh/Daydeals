import React, { useState } from 'react';
import { Product } from '@/types';
import { useStore } from '@/lib/store';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogTrigger,
  DialogFooter
} from '@/components/ui/dialog';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Edit2, Trash2, Search } from 'lucide-react';
import { PLACEHOLDER_IMAGE } from '@/lib/constants';
import { toast } from 'sonner';

const ProductsAdmin = () => {
  const { products, categories, fetchProducts } = useStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [productToDelete, setProductToDelete] = useState<string | null>(null);

  React.useEffect(() => {
    fetchProducts(true);
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingProduct?.name || !editingProduct?.category || !editingProduct?.price || !editingProduct?.description) {
      toast.error('Please fill in all required fields');
      return;
    }

    const images = editingProduct.images || [];

    setIsSaving(true);
    const cleanData = {
      name: editingProduct.name,
      category: editingProduct.category,
      price: Number(editingProduct.price),
      description: editingProduct.description,
      stock: Number(editingProduct.stock || 0),
      images: images,
    };

    try {
      const token = localStorage.getItem('token');
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), 120000); // 120s timeout

      if (editingProduct?.id) {
        const res = await fetch(`/api/products/${editingProduct.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(cleanData),
          signal: controller.signal
        });
        clearTimeout(id);
        if (!res.ok) {
           const errData = await res.json().catch(() => ({ error: 'Unknown error' }));
           throw new Error(errData.error || 'Failed to update product');
        }
        toast.success(`${cleanData.name} updated successfully.`);
      } else {
        const res = await fetch(`/api/products`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(cleanData),
          signal: controller.signal
        });
        clearTimeout(id);
        if (!res.ok) {
           const errData = await res.json().catch(() => ({ error: 'Unknown error' }));
           throw new Error(errData.error || 'Failed to create product');
        }
        toast.success(`${cleanData.name} created successfully.`);
      }
      setIsDialogOpen(false);
      setEditingProduct(null);
      fetchProducts(true);
    } catch (err: any) {
      console.error('Save Error Details:', err);
      if (err.name === 'AbortError') {
        toast.error('Upload timed out. Try using a smaller photo or check your connection.');
      } else {
        toast.error(err.message || 'Failed to save product. If images are very large, try smaller ones.');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!productToDelete) return;
    const id = productToDelete;
    setIsSaving(true); // Reuse isSaving for loading state
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/products/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) {
         let errMsg = 'Failed to delete';
         try {
           const errData = await res.json();
           errMsg = errData.error || errMsg;
         } catch(e) {}
         throw new Error(errMsg);
      }
      toast.success('Product deleted.');
      setProductToDelete(null);
      fetchProducts(true);
    } catch (err: any) {
      console.error('Delete error details:', err);
      toast.error(err.message || 'Failed to delete product');
    } finally {
      setIsSaving(false);
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    p.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-4xl font-black tracking-tight uppercase">Manage <span className="gradient-text">Products</span></h1>
          <p className="text-muted-foreground font-medium">Add, edit, or remove products from your storefront</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="lg" className="h-14 px-8 rounded-2xl font-bold shadow-xl shadow-primary/20" onClick={() => setEditingProduct({})}>
              <Plus className="mr-2 w-5 h-5" /> Add Product
            </Button>
          </DialogTrigger>
          <DialogContent className="glass max-w-2xl border-none p-10 rounded-[2.5rem]">
            <DialogHeader>
              <DialogTitle className="text-3xl font-black uppercase tracking-tight">
                {editingProduct?.id ? 'Edit Product' : 'New Product'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSave} className="space-y-6 pt-4">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2 lg:col-span-2">
                  <Label className="font-bold">Product Name</Label>
                  <Input 
                    required 
                    value={editingProduct?.name || ''} 
                    onChange={e => setEditingProduct({ ...editingProduct, name: e.target.value })}
                    className="h-12 rounded-xl glass border-none"
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="font-bold">Category</Label>
                    <Link to="/admin/categories" className="text-[10px] font-bold text-primary hover:underline">Manage</Link>
                  </div>
                  <select 
                    required
                    className="w-full h-12 rounded-xl glass border-none px-4 text-sm font-medium focus:ring-1 focus:ring-primary/50 outline-none appearance-none"
                    value={editingProduct?.category || ''}
                    onChange={e => setEditingProduct({ ...editingProduct, category: e.target.value })}
                  >
                    <option value="" disabled>Select Category</option>
                    {categories.length === 0 ? (
                      <option value="" disabled>No categories found. Create one first!</option>
                    ) : (
                      categories.map(cat => (
                        <option key={cat.id} value={cat.name} className="bg-background">{cat.name}</option>
                      ))
                    )}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label className="font-bold">Price (ETB)</Label>
                  <Input 
                    required 
                    type="number" 
                    step="0.01"
                    value={editingProduct?.price || ''} 
                    onChange={e => setEditingProduct({ ...editingProduct, price: parseFloat(e.target.value) })}
                    className="h-12 rounded-xl glass border-none"
                  />
                </div>
                <div className="space-y-2 lg:col-span-2">
                  <div className="flex items-center justify-between">
                    <Label className="font-bold">Product Images</Label>
                    <label className="cursor-pointer group">
                      <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-primary hover:bg-primary/10 px-3 py-1.5 rounded-lg transition-colors">
                        <Plus className="w-3 h-3" /> Add from Gallery
                      </div>
                      <input 
                        type="file" 
                        accept="image/*" 
                        multiple 
                        className="hidden" 
                        onChange={async (e: React.ChangeEvent<HTMLInputElement>) => {
                          const files = Array.from(e.target.files || []);
                          if (files.length === 0) return;
                          
                          const newImages: string[] = [];
                          for (const file of files as File[]) {
                            if (file.size > 2 * 1024 * 1024) {
                              toast.info(`Note: ${file.name} is quite large and may take time to upload.`);
                            }
                            const compressImage = (base64: string): Promise<string> => {
                              return new Promise((resolve) => {
                                const img = new Image();
                                img.src = base64;
                                img.onload = () => {
                                  const canvas = document.createElement('canvas');
                                  const MAX_WIDTH = 800; // Reduced from 1200
                                  const MAX_HEIGHT = 800; // Reduced from 1200
                                  let width = img.width;
                                  let height = img.height;

                                  if (width > height) {
                                    if (width > MAX_WIDTH) {
                                      height *= MAX_WIDTH / width;
                                      width = MAX_WIDTH;
                                    }
                                  } else {
                                    if (height > MAX_HEIGHT) {
                                      width *= MAX_HEIGHT / height;
                                      height = MAX_HEIGHT;
                                    }
                                  }

                                  canvas.width = width;
                                  canvas.height = height;
                                  const ctx = canvas.getContext('2d');
                                  ctx?.drawImage(img, 0, 0, width, height);
                                  resolve(canvas.toDataURL('image/jpeg', 0.7)); // 70% quality jpeg for better size
                                };
                              });
                            };

                            const base64 = await new Promise<string>((resolve) => {
                              const reader = new FileReader();
                              reader.onloadend = () => resolve(reader.result as string);
                              reader.readAsDataURL(file);
                            });
                            
                            const compressed = await compressImage(base64);
                            newImages.push(compressed);
                          }
                          
                          setEditingProduct(prev => ({
                            ...prev,
                            images: [...(prev?.images || []), ...newImages]
                          }));
                        }}
                      />
                    </label>
                  </div>
                  <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar min-h-[100px]">
                    {(editingProduct?.images || []).map((img, idx) => (
                      <div key={idx} className="relative group shrink-0">
                        <div className="w-24 h-24 rounded-2xl glass overflow-hidden border border-white/10">
                          <img src={img} className="w-full h-full object-cover" />
                        </div>
                        <button 
                          type="button"
                          onClick={() => setEditingProduct(prev => ({
                            ...prev,
                            images: prev?.images?.filter((_, i) => i !== idx)
                          }))}
                          className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Plus className="w-3 h-3 rotate-45" />
                        </button>
                      </div>
                    ))}
                    {(!editingProduct?.images || editingProduct.images.length === 0) && (
                      <div className="flex-1 rounded-2xl border-2 border-dashed border-white/10 flex items-center justify-center text-muted-foreground italic text-[10px] py-10">
                        No images uploaded yet
                      </div>
                    )}
                  </div>
                </div>
                <div className="space-y-2 lg:col-span-2">
                  <Label className="font-bold">Or enter Image URL</Label>
                  <Input 
                    placeholder="Paste URL and press Enter"
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        const val = (e.target as HTMLInputElement).value.trim();
                        if (val) {
                          setEditingProduct(prev => ({
                            ...prev,
                            images: [...(prev?.images || []), val]
                          }));
                          (e.target as HTMLInputElement).value = '';
                        }
                      }
                    }}
                    className="h-12 rounded-xl glass border-none"
                  />
                </div>
                <div className="space-y-2 lg:col-span-2">
                  <Label className="font-bold">Description</Label>
                  <textarea 
                    required 
                    className="w-full h-32 rounded-xl glass border-none p-4 focus:ring-1 focus:ring-primary/50 outline-none"
                    value={editingProduct?.description || ''}
                    onChange={e => setEditingProduct({ ...editingProduct, description: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="font-bold">Stock Quantity</Label>
                  <Input 
                    required 
                    type="number" 
                    value={editingProduct?.stock || ''} 
                    onChange={e => setEditingProduct({ ...editingProduct, stock: parseInt(e.target.value) })}
                    className="h-12 rounded-xl glass border-none"
                  />
                </div>
              </div>
              <DialogFooter className="pt-6">
                <Button type="submit" size="lg" className="w-full h-14 rounded-2xl font-bold" disabled={isSaving}>
                  {isSaving ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                      Saving...
                    </div>
                  ) : (
                    editingProduct?.id ? 'Update Product' : 'Create Product'
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="glass-card border-none overflow-hidden rounded-3xl pt-2">
        <div className="p-6 pb-0 flex items-center mb-6">
           <div className="relative flex-1 max-w-md">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
             <Input 
               placeholder="Search products..." 
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
                <TableHead className="font-bold px-6">Product</TableHead>
                <TableHead className="font-bold">Category</TableHead>
                <TableHead className="font-bold text-center">Price</TableHead>
                <TableHead className="font-bold text-center">Stock</TableHead>
                <TableHead className="font-bold text-right px-6">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.map((p) => (
                <TableRow key={p.id} className="hover:bg-primary/5 transition-colors group">
                  <TableCell className="px-6 py-4">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 rounded-xl overflow-hidden glass shrink-0">
                        <img src={p.images?.[0] || PLACEHOLDER_IMAGE} alt={p.name} className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <p className="font-bold text-sm leading-tight group-hover:text-primary transition-colors">{p.name}</p>
                        <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">ID: {p.id.slice(0, 8)}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-xs font-bold uppercase tracking-wider bg-primary/10 text-primary px-3 py-1 rounded-lg">
                      {p.category}
                    </span>
                  </TableCell>
                  <TableCell className="text-center font-black text-lg text-primary">
                    ETB {p.price.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-center">
                    <span className={`text-sm font-bold ${p.stock < 10 ? 'text-red-500' : 'text-foreground'}`}>
                      {p.stock} units
                    </span>
                  </TableCell>
                  <TableCell className="text-right px-6">
                    <div className="flex items-center justify-end space-x-2">
                      <Button variant="ghost" size="icon" className="h-11 w-11 rounded-xl hover:bg-blue-500/10 hover:text-blue-500" onClick={() => { setEditingProduct(p); setIsDialogOpen(true); }}>
                        <Edit2 className="w-5 h-5" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-11 w-11 rounded-xl hover:bg-red-500/10 hover:text-red-500" 
                        onClick={() => setProductToDelete(p.id)}
                        disabled={isSaving && productToDelete === p.id}
                      >
                        {isSaving && productToDelete === p.id ? (
                          <div className="w-5 h-5 border-2 border-red-500/20 border-t-red-500 rounded-full animate-spin" />
                        ) : (
                          <Trash2 className="w-5 h-5" />
                        )}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>

      <Dialog open={!!productToDelete} onOpenChange={() => setProductToDelete(null)}>
        <DialogContent className="glass border-none rounded-[2rem] p-8 max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black uppercase text-center">Delete Product?</DialogTitle>
            <DialogDescription className="text-center font-medium pt-2">
              Are you sure? This will permanently remove this item from the storefront.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3 mt-6">
            <Button 
              variant="destructive" 
              className="h-14 rounded-2xl font-black uppercase"
              onClick={handleDelete}
              disabled={isSaving}
            >
              {isSaving ? 'Deleting...' : 'Yes, Delete Item'}
            </Button>
            <Button 
              variant="ghost" 
              className="h-14 rounded-2xl font-bold"
              onClick={() => setProductToDelete(null)}
              disabled={isSaving}
            >
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProductsAdmin;
