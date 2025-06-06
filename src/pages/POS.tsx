import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { POSLayout } from "@/components/layout/POSLayout";
import { ProductTile } from "@/components/pos/ProductTile";
import { ShoppingCart } from "@/components/pos/ShoppingCart";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Search, Filter, CheckCircle, CreditCard, DollarSign, Smartphone } from "lucide-react";
import { fetchProducts, createSale } from "@/lib/api";
import { Product, CartItem } from "@/types";
import { LoadingScreen } from "@/components/ui/loading";
import { useToast } from "@/components/ui/use-toast";

export default function POS() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // --- DATA FETCHING ---
  const { data: products = [], isLoading } = useQuery<Product[], Error>({
    queryKey: ["products"],
    queryFn: fetchProducts,
  });

  // --- UI STATE ---
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [saleComplete, setSaleComplete] = useState(false);

  // --- DATA MUTATIONS ---
  const saleMutation = useMutation({
    mutationFn: createSale,
    onSuccess: () => {
      toast({ title: "Sale Completed!", description: "The transaction has been recorded." });
      setCart([]);
      setSaleComplete(true);
      // Invalidate queries to refetch data and keep the app in sync
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["sales"] });
    },
    onError: (error: Error) => {
      toast({ title: "Checkout Error", description: error.message, variant: "destructive" });
    },
  });

  // --- DERIVED STATE & MEMOIZATION ---
  const categories = useMemo(() => ["All", ...new Set(products.map((p) => p.category))], [products]);

  const filteredProducts = useMemo(() =>
    products.filter((product) => {
      const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === "All" || product.category === selectedCategory;
      return matchesSearch && matchesCategory;
    }),
  [products, searchTerm, selectedCategory]);
  
  // --- EVENT HANDLERS ---
  const addToCart = (product: Product) => {
    if (product.stock === 0) return;
    setSaleComplete(false); // Hide success message on new action
    setCart((currentCart) => {
      const existingItem = currentCart.find((item) => item.product.id === product.id);
      if (existingItem) {
        if (existingItem.quantity >= product.stock) return currentCart; // Don't add more than available stock
        return currentCart.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...currentCart, { product, quantity: 1 }];
    });
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity === 0) {
      removeFromCart(productId);
      return;
    }
    setCart((currentCart) =>
      currentCart.map((item) =>
        item.product.id === productId ? { ...item, quantity } : item
      )
    );
  };

  const removeFromCart = (productId: string) => {
    setCart((currentCart) => currentCart.filter((item) => item.product.id !== productId));
  };
  
  const clearCart = () => {
    setCart([]);
    setSaleComplete(false);
  };

  const processCheckout = () => {
    if (cart.length === 0) {
      toast({ title: "Empty Cart", description: "Please add products to the cart before checkout.", variant: "destructive" });
      return;
    }
    saleMutation.mutate(cart);
  };

  // --- RENDER LOGIC ---
  if (isLoading) return <LoadingScreen message="Loading terminal..." />;

  return (
    <POSLayout>
      <div className="h-full flex">
        {/* Product Selection Area */}
        <div className="flex-1 flex flex-col">
          <div className="p-6 border-b bg-card">
            <h1 className="text-2xl font-bold text-blue-900">Sales Terminal</h1>
            <div className="flex gap-4 mt-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search products..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
              </div>
              <div className="flex gap-2 items-center overflow-x-auto">
                {categories.map((cat) => (
                  <Button key={cat} variant={selectedCategory === cat ? "default" : "outline"} size="sm" onClick={() => setSelectedCategory(cat)}>
                    {cat}
                  </Button>
                ))}
              </div>
            </div>
          </div>
          <div className="flex-1 p-6 overflow-auto">
            {saleComplete && (
              <Alert className="mb-6 bg-blue-50 border-blue-200">
                <CheckCircle className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-800">Transaction completed successfully!</AlertDescription>
              </Alert>
            )}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {filteredProducts.map((product) => <ProductTile key={product.id} product={product} onClick={addToCart} />)}
            </div>
          </div>
        </div>

        {/* Cart Area */}
        <div className="w-96 border-l bg-card">
          <ShoppingCart
            items={cart}
            onUpdateQuantity={updateQuantity}
            onRemoveItem={removeFromCart}
            onCheckout={processCheckout}
            onClear={clearCart}
            isProcessing={saleMutation.isPending}
            className="h-full"
          />
          {/* Your payment methods UI can stay here */}
        </div>
      </div>
    </POSLayout>
  );
}