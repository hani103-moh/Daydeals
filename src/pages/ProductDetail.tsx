import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Product } from '@/types';
import { Button } from '@/components/ui/button';
import { useStore } from '@/lib/store';
import { Heart, ShoppingBag, Star, ShieldCheck, Truck, RefreshCw, ChevronLeft, ChevronRight, MapPin, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { formatPrice } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { PLACEHOLDER_IMAGE } from '@/lib/constants';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart, toggleWishlist, wishlist, products, fetchSingleProduct } = useStore();
  const [activeImage, setActiveImage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [productDetail, setProductDetail] = useState<Product | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<any>(null);

  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const data = await fetchSingleProduct(id);
        if (data) setProductDetail(data);
      } catch (err) {
        console.error('Error fetching product:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  // Fallback to store if available while loading or if fetch fails
  const product = productDetail || products.find(p => p.id === id);

  useEffect(() => {
    if (product && product.variants && product.variants.length > 0) {
      setSelectedVariant(product.variants[0]);
    } else {
      setSelectedVariant(null);
    }
  }, [product]);

  const [recentlyViewedIds, setRecentlyViewedIds] = useState<string[]>([]);

  useEffect(() => {
    if (!id) return;
    try {
      const existingRaw = localStorage.getItem('recently-viewed');
      let list: string[] = existingRaw ? JSON.parse(existingRaw) : [];
      setRecentlyViewedIds(list.filter(pId => pId !== id));
      list = [id, ...list.filter(pId => pId !== id)].slice(0, 6);
      localStorage.setItem('recently-viewed', JSON.stringify(list));
    } catch (e) {
      console.error('Failed to log recently viewed:', e);
    }
  }, [id]);

  if (!product && loading) {
    return (
      <div className="container mx-auto px-4 py-40 flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <p className="text-sm font-black uppercase tracking-widest text-muted-foreground">Finding Product...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-40 text-center">
        <h2 className="text-2xl font-black uppercase">Product not found</h2>
        <Button variant="link" onClick={() => navigate('/')}>Return Home</Button>
      </div>
    );
  }

  const isWishlisted = wishlist.includes(product.id);

  const relatedProducts = products.filter(p => p.category === product.category && p.id !== product.id).slice(0, 4);
  const recentlyViewedProducts = products.filter(p => recentlyViewedIds.includes(p.id)).slice(0, 4);

  return (
    <div className="container mx-auto px-4 py-6 max-w-5xl">
      <Button 
        variant="ghost" 
        size="sm"
        onClick={() => navigate(-1)} 
        className="mb-4 hover:bg-primary/10 rounded-xl font-bold text-xs"
      >
        <ChevronLeft className="mr-1 w-4 h-4" /> Back
      </Button>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-16">
        {/* Images Section */}
        <div className="space-y-4 md:col-span-4 lg:col-span-5 max-w-[400px] mx-auto w-full">
          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="aspect-square rounded-2xl overflow-hidden glass relative group border border-primary/10 shadow-xl shadow-primary/5"
          >
            <img 
              src={product.images?.[activeImage] || PLACEHOLDER_IMAGE} 
              alt={product.name}
              className="w-full h-full object-cover"
            />
          </motion.div>
          
          <div className="flex gap-1.5 overflow-x-auto pb-2 no-scrollbar justify-center">
            {(product.images || []).map((img, idx) => (
              <button
                key={idx}
                onClick={() => setActiveImage(idx)}
                className={cn(
                   "flex-shrink-0 w-10 h-10 rounded-lg overflow-hidden glass border-2 transition-all",
                   activeImage === idx ? "border-primary scale-105 shadow-md shadow-primary/10" : "border-transparent opacity-40 hover:opacity-100"
                )}
              >
                <img src={img} alt={`${product.name} ${idx}`} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>

        {/* Info Section */}
        <div className="flex flex-col space-y-4 md:col-span-8 lg:col-span-7">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="bg-primary/10 text-primary border-none rounded-lg px-2 py-0.5 text-[10px] font-black uppercase">
                {product.category}
              </Badge>
              {product.tags?.map(tag => (
                <Badge key={tag} className="bg-white/5 text-foreground/70 border-none rounded-lg px-2 py-0.5 text-[10px] tracking-widest font-bold uppercase">
                  {tag}
                </Badge>
              ))}
            </div>
            <h1 className="text-3xl font-black tracking-tight leading-tight uppercase">
              {product.name}
            </h1>
            <div className="flex items-center gap-2">
              <div className="flex items-center text-secondary">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star key={i} className={cn("w-3.5 h-3.5", i <= Math.round(product.rating || 4.5) ? "fill-current" : "opacity-20")} />
                ))}
              </div>
              <span className="text-[10px] font-bold text-muted-foreground uppercase opacity-60">
                {product.rating || (4.5).toFixed(1)} ({product.sold_count || 0} units sold)
              </span>
            </div>
            {selectedVariant !== null && selectedVariant.stock !== undefined ? (
              <div className="flex items-center gap-2 mt-1">
                <div className={cn(
                  "px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-widest",
                  selectedVariant.stock > 10 ? "bg-green-500/10 text-green-500" : 
                  selectedVariant.stock > 0 ? "bg-orange-500/10 text-orange-500" : 
                  "bg-red-500/10 text-red-500"
                )}>
                  {selectedVariant.stock > 0 ? `Selected Pack Option Stock: ${selectedVariant.stock}` : 'Option Out of Stock'}
                </div>
              </div>
            ) : product.stock !== undefined && (
              <div className="flex items-center gap-2 mt-1">
                <div className={cn(
                  "px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-widest",
                  product.stock > 10 ? "bg-green-500/10 text-green-500" : 
                  product.stock > 0 ? "bg-orange-500/10 text-orange-500" : 
                  "bg-red-500/10 text-red-500"
                )}>
                  {product.stock > 0 ? `Stock Available: ${product.stock}` : 'Out of Stock'}
                </div>
              </div>
            )}
          </div>

          {/* Product Variants Selector */}
          {product.variants && product.variants.length > 0 && (
            <div className="space-y-2 py-1.5">
              <span className="text-[10px] font-black uppercase text-muted-foreground/80 tracking-widest ml-1">Select Variant / Option:</span>
              <div className="flex flex-wrap gap-2">
                {product.variants.map((v: any, idx: number) => (
                  <button
                    key={v.id || idx}
                    type="button"
                    onClick={() => setSelectedVariant(v)}
                    className={cn(
                      "px-3 py-2 rounded-xl border text-xs text-left transition-all outline-none flex flex-col gap-0.5 min-w-[100px]",
                      selectedVariant?.id === v.id
                        ? "border-primary bg-primary/10 text-primary scale-[1.02] shadow shadow-primary/10"
                        : "border-white/10 hover:border-white/20 bg-white/5 text-muted-foreground"
                    )}
                  >
                    <span className="font-extrabold uppercase">
                      {[v.size && `Size ${v.size}`, v.color && `Color ${v.color}`].filter(Boolean).join(' | ')}
                    </span>
                    <span className="text-[9px] font-medium text-muted-foreground/60">{formatPrice(v.price || product.price)}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-baseline gap-3">
             <span className="text-4xl font-black text-foreground">{formatPrice(selectedVariant?.price || product.price)}</span>
             <span className="text-sm text-muted-foreground/50 line-through font-bold">
               {formatPrice((selectedVariant?.price || product.price) * 1.2)}
             </span>
          </div>

          <Separator className="bg-white/5" />

          <p className="text-sm text-muted-foreground leading-relaxed">
            {product.description}
          </p>

          <div className="flex gap-2 py-4">
            <Button 
              size="lg" 
              className="h-14 rounded-2xl text-sm font-black uppercase shadow-lg shadow-primary/20 flex-[2]"
              onClick={() => addToCart(product, selectedVariant)}
              disabled={selectedVariant ? selectedVariant.stock <= 0 : product.stock <= 0}
            >
              <ShoppingBag className="mr-2 w-5 h-5" /> Add to Order
            </Button>
            <Button 
              size="icon" 
              variant="outline" 
              className={cn(
                "h-14 w-14 rounded-2xl glass transition-all",
                isWishlisted && "text-red-500 bg-red-500/10 border-red-500/20"
              )}
              onClick={() => toggleWishlist(product.id)}
            >
              <Heart className={cn("w-6 h-6", isWishlisted && "fill-current")} /> 
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-3 pb-8">
            <div className="flex items-center gap-3 p-3 glass rounded-2xl border border-white/5">
              <div className="w-8 h-8 rounded-lg bg-green-500/10 text-green-500 flex items-center justify-center shrink-0">
                <Truck className="w-4 h-4" />
              </div>
              <div className="text-[10px]">
                <p className="font-bold uppercase tracking-tight">DayDeals Fast Delivery</p>
                <p className="text-muted-foreground opacity-60">Addis Ababa: 1-3 Days</p>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-secondary/5 border border-secondary/10">
             <div className="flex items-center gap-2 mb-2">
                <ShieldCheck className="w-4 h-4 text-secondary" />
                <span className="text-[10px] font-black uppercase tracking-tight">DayDeals Verified Item</span>
             </div>
             <p className="text-[10px] text-muted-foreground leading-tight">
               Every product at Day Deals is sourced directly from trusted wholesalers and verified creators. 100% genuine quality.
             </p>
          </div>
        </div>
      </div>

      {/* Related Products Section */}
      {relatedProducts.length > 0 && (
        <div className="mt-16 space-y-6 pt-12 border-t border-white/5">
          <h2 className="text-xl font-black uppercase tracking-tight">Related <span className="text-primary">Products</span></h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {relatedProducts.map((p) => (
              <div 
                key={p.id}
                onClick={() => {
                  navigate(`/product/${p.id}`);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="mobile-card p-2.5 rounded-2xl border border-white/5 hover:border-primary/20 bg-white/5 cursor-pointer group transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="aspect-square rounded-xl overflow-hidden glass mb-3 relative">
                    <img src={p.images?.[0] || PLACEHOLDER_IMAGE} alt={p.name} className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-300" referrerPolicy="no-referrer" />
                  </div>
                  <h3 className="font-extrabold text-xs truncate uppercase px-1">{p.name}</h3>
                  <p className="text-[10px] text-muted-foreground uppercase px-1 mt-0.5">{p.category}</p>
                </div>
                <div className="flex items-center justify-between mt-3 px-1">
                  <span className="font-black text-xs text-foreground">{formatPrice(p.price)}</span>
                  <span className="text-[8px] bg-primary/10 text-primary font-black uppercase px-1.5 py-0.5 rounded">View</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recently Viewed Products Section */}
      {recentlyViewedProducts.length > 0 && (
        <div className="mt-16 space-y-6 pt-12 border-t border-white/5">
          <h2 className="text-xl font-black uppercase tracking-tight">Recently <span className="text-primary">Viewed</span></h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {recentlyViewedProducts.map((p) => (
              <div 
                key={p.id}
                onClick={() => {
                  navigate(`/product/${p.id}`);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="mobile-card p-2.5 rounded-2xl border border-white/5 hover:border-primary/20 bg-white/5 cursor-pointer group transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="aspect-square rounded-xl overflow-hidden glass mb-3 relative">
                    <img src={p.images?.[0] || PLACEHOLDER_IMAGE} alt={p.name} className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-300" referrerPolicy="no-referrer" />
                  </div>
                  <h3 className="font-extrabold text-xs truncate uppercase px-1">{p.name}</h3>
                  <p className="text-[10px] text-muted-foreground uppercase px-1 mt-0.5">{p.category}</p>
                </div>
                <div className="flex items-center justify-between mt-3 px-1">
                  <span className="font-black text-xs text-foreground">{formatPrice(p.price)}</span>
                  <span className="text-[8px] bg-primary/10 text-primary font-black uppercase px-1.5 py-0.5 rounded">View</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductDetail;
