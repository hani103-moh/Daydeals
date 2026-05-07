import React, { useEffect } from 'react';
import { useStore } from '@/lib/store';
import { ProductCard } from '@/components/storefront/ProductCard';
import { Heart, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

const Wishlist = () => {
  const { wishlist, user, products, fetchProducts } = useStore();

  useEffect(() => {
    if (products.length === 0) {
      fetchProducts();
    }
  }, []);

  const wishlistedProducts = products.filter(p => wishlist.includes(p.id));

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-32 text-center space-y-6">
        <div className="w-24 h-24 bg-primary/10 text-primary rounded-3xl flex items-center justify-center mx-auto mb-6">
          <Heart className="w-12 h-12" />
        </div>
        <h2 className="text-4xl font-black tracking-tight uppercase">Sign in for Wishlist</h2>
        <p className="text-muted-foreground text-xl max-w-sm mx-auto">
          Save your favorite deals and access them from any device.
        </p>
        <Link to="/auth">
          <Button size="lg" className="h-14 px-10 rounded-2xl font-bold mt-4">
            Sign In Now
          </Button>
        </Link>
      </div>
    );
  }

  if (wishlistedProducts.length === 0) {
    return (
      <div className="container mx-auto px-4 py-32 text-center space-y-6">
        <div className="w-24 h-24 bg-primary/10 text-primary rounded-3xl flex items-center justify-center mx-auto mb-6">
          <Heart className="w-12 h-12" />
        </div>
        <h2 className="text-4xl font-black tracking-tight uppercase">Your Wishlist is empty</h2>
        <p className="text-muted-foreground text-xl max-w-sm mx-auto">
          Start adding products you love to your wishlist.
        </p>
        <Link to="/">
          <Button size="lg" className="h-14 px-10 rounded-2xl font-bold mt-4">
            Browse Products
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="space-y-2 mb-12">
        <h1 className="text-5xl font-black tracking-tight uppercase">My <span className="gradient-text">Wishlist</span></h1>
        <p className="text-muted-foreground font-medium">Your curated collection of amazing deals</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-8">
        {wishlistedProducts.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
};

export default Wishlist;
