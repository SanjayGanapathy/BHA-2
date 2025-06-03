import React, { useState, useEffect } from "react";
import { POSLayout } from "@/components/layout/POSLayout";
import { ProductTile } from "@/components/pos/ProductTile";
import { ShoppingCart } from "@/components/pos/ShoppingCart";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Search,
  Filter,
  CheckCircle,
  CreditCard,
  DollarSign,
  Smartphone,
} from "lucide-react";
import { POSStore } from "@/lib/store";
import { Product, CartItem, Sale } from "@/types";
import { cn } from "@/lib/utils";

export default function POS() {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [isProcessing, setIsProcessing] = useState(false);
  const [saleComplete, setSaleComplete] = useState(false);

  const categories = ["All", ...new Set(products.map((p) => p.category))];

  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      selectedCategory === "All" || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const productsData = POSStore.getProducts();
    const cartData = POSStore.getCart();

    setProducts(productsData);
    setCart(cartData);
  };

  const addToCart = (product: Product) => {
    if (product.stock === 0) return;

    const existingItem = cart.find((item) => item.product.id === product.id);
    let newCart: CartItem[];

    if (existingItem) {
      if (existingItem.quantity >= product.stock) return;

      newCart = cart.map((item) =>
        item.product.id === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item,
      );
    } else {
      newCart = [...cart, { product, quantity: 1 }];
    }

    setCart(newCart);
    POSStore.setCart(newCart);
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity === 0) {
      removeFromCart(productId);
      return;
    }

    const newCart = cart.map((item) =>
      item.product.id === productId ? { ...item, quantity } : item,
    );

    setCart(newCart);
    POSStore.setCart(newCart);
  };

  const removeFromCart = (productId: string) => {
    const newCart = cart.filter((item) => item.product.id !== productId);
    setCart(newCart);
    POSStore.setCart(newCart);
  };

  const clearCart = () => {
    setCart([]);
    POSStore.clearCart();
    setSaleComplete(false);
  };

  const processCheckout = async () => {
    if (cart.length === 0) return;

    setIsProcessing(true);

    try {
      // Simulate payment processing
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const currentUser = POSStore.getCurrentUser();
      if (!currentUser) throw new Error("No user logged in");

      const subtotal = cart.reduce(
        (sum, item) => sum + item.product.price * item.quantity,
        0,
      );
      const tax = subtotal * 0.08;
      const total = subtotal + tax;
      const profit = cart.reduce(
        (sum, item) =>
          sum + (item.product.price - item.product.cost) * item.quantity,
        0,
      );

      const sale: Sale = {
        id: `sale_${Date.now()}`,
        items: cart,
        total,
        profit,
        timestamp: new Date(),
        userId: currentUser.id,
        paymentMethod: "cash", // In a real system, this would be selected
      };

      POSStore.addSale(sale);

      // Update products with new stock levels
      const updatedProducts = POSStore.getProducts();
      setProducts(updatedProducts);

      setSaleComplete(true);
      clearCart();
    } catch (error) {
      console.error("Checkout error:", error);
      alert("Error processing sale. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <POSLayout>
      <div className="h-full flex">
        {/* Product Selection Area */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <div className="p-6 border-b bg-card">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-2xl font-bold text-blue-900">
                Sales Terminal
              </h1>
              <Badge variant="secondary" className="text-sm">
                {filteredProducts.length} products
              </Badge>
            </div>

            {/* Search and Filter */}
            <div className="flex gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              <div className="flex gap-2">
                {categories.map((category) => (
                  <Button
                    key={category}
                    variant={
                      selectedCategory === category ? "default" : "outline"
                    }
                    size="sm"
                    onClick={() => setSelectedCategory(category)}
                  >
                    {category}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          {/* Products Grid */}
          <div className="flex-1 p-6 overflow-auto">
            {saleComplete && (
              <Alert className="mb-6 bg-green-50 border-green-200">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  Sale completed successfully! Receipt printed.
                </AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {filteredProducts.map((product) => (
                <ProductTile
                  key={product.id}
                  product={product}
                  onClick={addToCart}
                />
              ))}
            </div>

            {filteredProducts.length === 0 && (
              <div className="flex items-center justify-center h-64 text-center">
                <div>
                  <Filter className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                  <p className="text-muted-foreground">
                    No products found matching your criteria
                  </p>
                </div>
              </div>
            )}
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
            className="h-full"
          />

          {/* Payment Methods (for UI completeness) */}
          {cart.length > 0 && (
            <div className="p-4 border-t">
              <p className="text-sm font-medium mb-2">Payment Method:</p>
              <div className="grid grid-cols-3 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex flex-col gap-1 h-auto py-2"
                >
                  <DollarSign className="h-4 w-4" />
                  <span className="text-xs">Cash</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex flex-col gap-1 h-auto py-2"
                >
                  <CreditCard className="h-4 w-4" />
                  <span className="text-xs">Card</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex flex-col gap-1 h-auto py-2"
                >
                  <Smartphone className="h-4 w-4" />
                  <span className="text-xs">Mobile</span>
                </Button>
              </div>
            </div>
          )}

          {/* Processing Overlay */}
          {isProcessing && (
            <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
              <div className="bg-card p-6 rounded-lg shadow-lg text-center">
                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-3"></div>
                <p className="font-medium">Processing Sale...</p>
                <p className="text-sm text-muted-foreground">Please wait</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </POSLayout>
  );
}
