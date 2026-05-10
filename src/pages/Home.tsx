import React, { useState, useMemo, useEffect } from 'react';
import { ProductCard } from '@/components/storefront/ProductCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useStore } from '@/lib/store';
import { Category, Product } from '@/types';
import { 
  Search, 
  SlidersHorizontal, 
  Sparkles, 
  TrendingUp, 
  Zap,
  LayoutGrid,
  Shirt,
  Sparkles as SparklesIcon,
  Home as HomeIcon,
  Scissors,
  MoreHorizontal,
  Smartphone,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from '@/lib/utils';

const iconMap: Record<string, React.ReactNode> = {
  Smartphone: <Smartphone className="w-4 h-4" />,
  Shirt: <Shirt className="w-4 h-4" />,
  Sparkles: <SparklesIcon className="w-4 h-4" />,
  Home: <HomeIcon className="w-4 h-4" />,
  Scissors: <Scissors className="w-4 h-4" />,
  MoreHorizontal: <MoreHorizontal className="w-4 h-4" />,
};

const Home = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'newest' | 'price-low' | 'price-high'>('newest');
  const { products, categories, dbLoading, fetchProducts } = useStore();

  const filteredProducts = useMemo(() => {
    let filtered = products.filter(product => {
      const name = product.name?.toLowerCase() || '';
      const description = product.description?.toLowerCase() || '';
      const matchesSearch = name.includes(searchTerm.toLowerCase()) ||
                           description.includes(searchTerm.toLowerCase());
      const matchesCategory = !selectedCategory || 
                              (product.category && product.category.toLowerCase().trim() === selectedCategory.toLowerCase().trim());
      return matchesSearch && matchesCategory;
    });

    if (sortBy === 'price-low') filtered.sort((a, b) => a.price - b.price);
    if (sortBy === 'price-high') filtered.sort((a, b) => b.price - a.price);
    if (sortBy === 'newest') filtered.sort((a, b) => b.createdAt - a.createdAt);

    return filtered;
  }, [searchTerm, selectedCategory, sortBy, products]);

  return (
    <div className="pb-20 space-y-8">
      {/* Hero Section - Compact for Mobile */}
      <section className="relative h-[300px] md:h-[450px] flex items-center overflow-hidden rounded-[2rem] mx-4 mt-4">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent z-10" />
          <img 
            src="https://images.unsplash.com/photo-1586880244406-556ebe35f282?q=80&w=1200&auto=format&fit=crop" 
            alt="Merkato Marketplace" 
            className="w-full h-full object-cover scale-105 hover:scale-110 transition-transform duration-10000"
          />
        </div>

        <div className="container mx-auto px-6 relative z-20 mt-auto pb-10">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-xl space-y-4"
          >
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full glass border-white/20 text-white mb-2">
              <Sparkles className="w-3 h-3 text-secondary" />
              <span className="text-[10px] font-bold tracking-wider uppercase">DAY DEALS × MERKATO</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-black text-white leading-tight uppercase tracking-tighter">
              MERKATO <br/>
              <span className="text-secondary text-base md:text-2xl opacity-80 block mt-2">Delivered to your doorstep</span>
              <span className="text-secondary">DIGITAL</span> DEALS
            </h1>
            <p className="text-[10px] md:text-xs text-secondary font-black uppercase tracking-[0.2em] mb-4 bg-secondary/10 w-fit px-3 py-1 rounded-full border border-secondary/20">Merkato's Choice • Authentic Habesha Deals</p>
            <p className="text-sm md:text-base text-white/80 font-medium max-w-sm italic">
              Authentic Habesha quality, sourced from the heart of Addis.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Search & Sort Bar - Fixed height, sticky-ready */}
      <div className="container mx-auto px-4">
        <div className="flex gap-2 sticky top-20 z-30 bg-background/50 backdrop-blur-xl p-2 rounded-2xl border border-white/5">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search products..." 
              className="h-10 pl-10 rounded-xl bg-muted/50 border-none focus-visible:ring-primary/30"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="h-10 w-10 rounded-xl glass border-white/10">
                <SlidersHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 rounded-xl glass">
              <DropdownMenuItem onClick={() => setSortBy('newest')}>Newest First</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy('price-low')}>Price: Low to High</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy('price-high')}>Price: High to Low</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Responsive Clickable Categories */}
      <div className="container mx-auto px-4 overflow-hidden">
        <div className="flex items-center justify-between mb-4 px-1">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Zap className="w-4 h-4 text-primary fill-primary" />
            Categories
          </h2>
          {selectedCategory && (
            <Button 
              variant="link" 
              className="h-auto p-0 text-xs text-primary" 
              onClick={() => setSelectedCategory(null)}
            >
              Clear Filter
            </Button>
          )}
        </div>
        <div className="flex gap-3 overflow-x-auto pb-4 no-scrollbar -mx-4 px-4">
          {categories.map((cat) => (
            <motion.button
              key={cat.id}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSelectedCategory(selectedCategory === cat.name ? null : cat.name)}
              className={cn(
                "flex-shrink-0 flex items-center gap-3 px-4 py-3 rounded-2xl glass border border-white/10 transition-all",
                selectedCategory === cat.name ? "bg-primary text-black border-primary ring-2 ring-primary/20" : "hover:bg-white/5"
              )}
            >
              <div className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center",
                selectedCategory === cat.name ? "bg-black/10" : "bg-primary/10 text-primary"
              )}>
                {iconMap[cat.icon || ''] || <TrendingUp className="w-4 h-4" />}
              </div>
              <span className="text-xs font-bold whitespace-nowrap">{cat.name}</span>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Products Grid - Compact and Quick */}
      <section className="container mx-auto px-4 pb-12">
        <div className="flex items-center justify-between mb-6 px-1">
          <h2 className="text-xl font-black uppercase tracking-tight">
            {selectedCategory ? selectedCategory : "Hot Deals"}
          </h2>
        </div>
        
        {dbLoading && products.length === 0 ? (
          <div className="space-y-8">
            <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
              <div className="relative">
                <Loader2 className="w-12 h-12 text-primary animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Zap className="w-4 h-4 text-primary" />
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold uppercase tracking-tight">Waking up Merkato...</h3>
                <p className="text-muted-foreground text-sm max-w-xs mx-auto italic">
                  Our database is warming up. This usually takes a few seconds on the first visit.
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2 md:gap-4 opacity-20 pointer-events-none">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="aspect-[3/4] rounded-2xl glass animate-pulse" />
              ))}
            </div>
          </div>
        ) : (
          <>
            <AnimatePresence mode="popLayout">
              <motion.div 
                layout
                className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2 md:gap-4"
              >
                {filteredProducts.map((product) => (
                  <motion.div
                    key={product.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ProductCard product={product} />
                  </motion.div>
                ))}
              </motion.div>
            </AnimatePresence>

            {filteredProducts.length === 0 && !dbLoading && (
              <div className="py-20 text-center space-y-4 glass rounded-3xl border border-white/5 mx-4">
                <Search className="w-12 h-12 mx-auto text-muted-foreground/20" />
                <p className="text-muted-foreground font-medium">No products found matching your search.</p>
                <div className="flex justify-center gap-4">
                  <Button variant="outline" onClick={() => { setSearchTerm(''); setSelectedCategory(null); }}>
                    Reset Filters
                  </Button>
                  <Button onClick={() => fetchProducts()}>
                    Refresh Data
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </section>

      {/* Stay Tuned Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="glass-card rounded-[3rem] p-12 border-dashed border-white/10"
        >
          <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Sparkles className="w-8 h-8 text-primary animate-pulse" />
          </div>
          <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tight mb-4">
            We will add more product soon
          </h2>
          <p className="text-xl text-muted-foreground font-medium italic">
            Stay Tuned! Great deals are on the way.
          </p>
          <div className="flex justify-center gap-2 mt-8">
            <div className="w-2 h-2 rounded-full bg-primary" />
            <div className="w-2 h-2 rounded-full bg-primary/60" />
            <div className="w-2 h-2 rounded-full bg-primary/30" />
          </div>
        </motion.div>
      </section>
      
    </div>
  );
};

export default Home;
