import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { POSLayout } from "@/components/layout/POSLayout";
import { ProductTile } from "@/components/pos/ProductTile";
import { ShoppingCart } from "@/components/pos/ShoppingCart";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useLocalStorageState } from "@/hooks/useLocalStorageState";
import { CartItem } from "@/types";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Search, Filter, CheckCircle } from "lucide-react";
import { fetchProducts, createSale } from "@/lib/api";
import { Product, CartItem } from "@/types";
import { LoadingScreen } from "@/components/ui/loading";
import { useToast } from "@/components/ui/use-toast";
import { useLocalStorageState } from "@/hooks/useLocalStorageState";

export default function POS() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // --- DATA FETCHING: Get all available products ---
  const { data: products = [], isLoading, isError, error } = useQuery<Product[], Error>({
    queryKey: ["products"],
    queryFn: fetchProducts,
  });

  // --- UI STATE: Manage local component state ---
  const [cart, setCart] = useLocalStorageState<CartItem[]>('shoppingCart', []);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [saleComplete, setSaleComplete] = useState(false);

  // --- DATA MUTATION: Handle submitting a new sale ---
  const saleMutation = useMutation({
    mutationFn: createSale,
    onSuccess: () => {
      toast({ title: "Sale Completed!", description: "The transaction has been recorded." });
      setCart([]); // Clear the local cart state
      setSaleComplete(true);
      // Invalidate queries to refetch data and keep the entire app in sync
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["sales"] });
    },
    onError: (err: Error) => {
      toast({ title: "Checkout Error", description: err.message, variant: "destructive" });
    },
  });

  // --- DERIVED STATE: Calculations that depend on other state ---
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
    setSaleComplete(false); // Hide previous success message on new action
    setCart((currentCart) => {
      const existingItem = currentCart.find((item) => item.product.id === product.id);
      if (existingItem) {
        if (existingItem.quantity >= product.stock) {
          toast({ title: "Stock Limit Reached", description: `Only ${product.stock} units of ${product.name} are available.`});
          return currentCart;
        }
        return currentCart.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...currentCart, { product, quantity: 1 }];
    });
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
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
  if (isError) return <div className="p-4 text-center text-red-500"><h2>Error loading products.</h2><p>{error.message}</p></div>

  return (
    <POSLayout>
      <div className="h-full flex flex-col md:flex-row">
        {/* Product Selection Area */}
        <div className="flex-1 flex flex-col">
          <div className="p-4 border-b bg-card">
            <h1 className="text-2xl font-bold text-blue-900">Sales Terminal</h1>
            <div className="flex flex-col sm:flex-row gap-4 mt-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search products..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
              </div>
              <div className="flex gap-2 items-center overflow-x-auto pb-2">
                {categories.map((cat) => (
                  <Button key={cat} variant={selectedCategory === cat ? "default" : "outline"} size="sm" onClick={() => setSelectedCategory(cat)} className="flex-shrink-0">
                    {cat}
                  </Button>
                ))}
              </div>
            </div>
          </div>
          <div className="flex-1 p-4 overflow-y-auto">
            {saleComplete && (
              <Alert className="mb-4 bg-blue-50 border-blue-200">
                <CheckCircle className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-800">Transaction completed successfully!</AlertDescription>
              </Alert>
            )}
            {filteredProducts.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {filteredProducts.map((product) => <ProductTile key={product.id} product={product} onClick={addToCart} />)}
                </div>
            ) : (
                <div className="flex items-center justify-center h-full text-center">
                    <div>
                        <Filter className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                        <p className="text-muted-foreground">No products found matching your criteria.</p>
                    </div>
                </div>
            )}
          </div>
        </div>

        {/* Cart Area */}
        <div className="w-full md:w-96 md:border-l bg-card flex-shrink-0">
          <ShoppingCart
            items={cart}
            onUpdateQuantity={updateQuantity}
            onRemoveItem={removeFromCart}
            onCheckout={processCheckout}
            onClear={clearCart}
            isProcessing={saleMutation.isPending}
            className="h-full"
          />
        </div>
      </div>
    </POSLayout>
  );
}