import React, { useState } from 'react';
import { Product } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Heart, ShoppingBag, Star, Plus, ChevronLeft, ChevronRight, Eye } from 'lucide-react';
import { useStore } from '@/lib/store';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { formatPrice, cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogTrigger, DialogTitle, DialogDescription } from '@/components/ui/dialog';

import { PLACEHOLDER_IMAGE } from '@/lib/constants';

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { addToCart, toggleWishlist, wishlist } = useStore();
  const isWishlisted = wishlist.includes(product.id);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const images = product.images || [];

  const nextImage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileTap={{ scale: 0.98 }}
      className="h-full"
    >
      <Card className={cn(
        "mobile-card flex flex-col h-full group transition-all",
        product.stock <= 0 && "opacity-80 saturate-50"
      )}>
        <div className="relative aspect-square rounded-lg overflow-hidden bg-muted/30">
          <Link to={`/product/${product.id}`} className={cn("block w-full h-full", product.stock <= 0 && "blur-[2px] pointer-events-none")}>
            <img 
              src={images[currentImageIndex] || PLACEHOLDER_IMAGE} 
              alt={product.name}
              className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-105"
            />
          </Link>

          {product.stock <= 0 && (
            <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/40 backdrop-blur-[1px]">
              <div className="bg-red-500 text-white text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-full shadow-2xl border border-white/20">
                Out of Stock
              </div>
            </div>
          )}
          
          {images.length > 1 && (
            <>
              <button 
                onClick={prevImage}
                className="absolute left-1 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full glass bg-black/30 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/50 z-20"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button 
                onClick={nextImage}
                className="absolute right-1 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full glass bg-black/30 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/50 z-20"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-0.5 z-20">
                {images.map((_, idx) => (
                  <div 
                    key={idx} 
                    className={cn(
                      "w-1 h-1 rounded-full bg-white/40 transition-all",
                      currentImageIndex === idx ? "w-2.5 bg-white" : ""
                    )}
                  />
                ))}
              </div>
            </>
          )}

          <button
            onClick={() => toggleWishlist(product.id)}
            className={cn(
              "absolute top-2 right-2 z-10 w-8 h-8 rounded-full glass flex items-center justify-center transition-all",
              isWishlisted ? "text-red-500 bg-white/20" : "text-white/70 hover:text-white"
            )}
          >
            <Heart className={cn("w-4 h-4", isWishlisted && "fill-current")} />
          </button>
          
          <button
            onClick={() => addToCart(product)}
            className="absolute bottom-2 right-2 z-10 w-9 h-9 rounded-xl bg-primary text-black flex items-center justify-center shadow-lg active:scale-90 transition-transform"
          >
            <Plus className="w-5 h-5" />
          </button>

          {product.tags?.includes('featured') && (
            <div className="absolute top-2 left-0 z-10">
              <span className="bg-secondary text-black text-[8px] font-black px-2 py-0.5 rounded-r-md uppercase flex items-center gap-1">
                <Star className="w-2 h-2 fill-current" /> Hot
              </span>
            </div>
          )}

          <div className="absolute inset-x-0 bottom-4 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20 pointer-events-none">
            <Dialog>
              <DialogTrigger asChild>
                <Button 
                  size="sm" 
                  className="pointer-events-auto rounded-full bg-black/80 hover:bg-black text-white hover:text-white border border-white/20 shadow-xl backdrop-blur-md gap-1.5 h-8 px-4 font-bold text-xs"
                >
                  <Eye className="w-3.5 h-3.5" /> Quick View
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl p-0 overflow-hidden bg-background border-border/40 gap-0">
                <DialogTitle className="sr-only">{product.name}</DialogTitle>
                <DialogDescription className="sr-only">{product.description}</DialogDescription>
                
                <div className="grid md:grid-cols-2">
                  <div className="bg-muted aspect-square md:aspect-auto">
                    <img 
                      src={images[0] || PLACEHOLDER_IMAGE} 
                      alt={product.name} 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-6 md:p-8 flex flex-col h-full max-h-[80vh] overflow-y-auto">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-xs font-black text-primary uppercase tracking-widest bg-primary/10 px-3 py-1 rounded-full">{product.category}</span>
                      <div className="flex items-center gap-1 text-secondary">
                        <Star className="w-3.5 h-3.5 fill-current" />
                        <span className="text-xs font-bold text-foreground">{product.rating || (4.5).toFixed(1)}</span>
                      </div>
                    </div>
                    
                    <h2 className="text-2xl font-black uppercase tracking-tight mb-2">{product.name}</h2>
                    
                    <div className="flex items-baseline gap-2 mb-6">
                      <span className="text-2xl font-black text-primary">{formatPrice(product.price)}</span>
                      <span className="text-sm text-muted-foreground line-through font-medium">
                        {formatPrice(product.price * 1.2)}
                      </span>
                    </div>

                    <p className="text-muted-foreground mb-8 line-clamp-4">{product.description}</p>
                    
                    <div className="mt-auto space-y-3 pt-6 border-t border-border/40">
                      <Button 
                        onClick={() => addToCart(product)} 
                        className="w-full shadow-lg h-12 text-black font-bold uppercase tracking-wide gap-2 bg-primary hover:bg-primary/90"
                        disabled={product.stock <= 0}
                      >
                        <ShoppingBag className="w-4 h-4" /> 
                        {product.stock <= 0 ? 'Out of Stock' : 'Add to Cart'}
                      </Button>
                      <Button 
                        asChild
                        variant="outline" 
                        className="w-full h-12 font-bold uppercase tracking-wide gap-2"
                      >
                         <Link to={`/product/${product.id}`}>
                           View Full Details
                         </Link>
                      </Button>
                    </div>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <CardContent className="p-2 pt-3 flex flex-col flex-1 gap-0.5">
          <div className="flex items-center justify-between">
            <span className="text-[7px] font-black text-primary uppercase tracking-widest bg-primary/10 px-1.5 py-0.5 rounded-full">{product.category}</span>
            <div className="flex items-center gap-1">
              <div className="flex items-center gap-0.5">
                <Star className="w-2 h-2 fill-secondary text-secondary" />
                <span className="text-[7px] font-bold">{product.rating || (4.5)}</span>
              </div>
            </div>
          </div>
          
          <Link to={`/product/${product.id}`}>
            <h3 className="font-bold text-[10px] leading-tight line-clamp-1 group-hover:text-primary transition-colors">
              {product.name}
            </h3>
          </Link>
          
          <div className="mt-auto pt-1 flex items-center justify-between">
            <div className="flex items-baseline gap-1">
              <span className="text-xs font-black text-foreground">{formatPrice(product.price)}</span>
            </div>
            {product.sold_count && product.sold_count > 0 && (
              <span className="text-[7px] font-black text-muted-foreground uppercase">{product.sold_count} Sold</span>
            )}
          </div>

          <div className="text-[7px] font-bold text-primary flex items-center gap-1 mt-1 bg-primary/5 w-fit px-1.5 py-0.5 rounded-full">
             <span className="w-1 h-1 rounded-full bg-primary animate-pulse" />
             1-3 days
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};
