import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { POSLayout } from "@/components/layout/POSLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Plus,
  Search,
  Package,
  Edit,
  AlertTriangle,
  TrendingDown,
  Trash2,
} from "lucide-react";
import { fetchProducts } from "@/lib/api"; // Step 1: Import our API function
import { Product } from "@/types";
import { cn } from "@/lib/utils";
import { LoadingScreen } from "@/components/ui/loading"; // For loading state
import { useToast } from "@/components/ui/use-toast";
import { config } from "@/lib/config";

// Helper function to get stock status (remains the same)
const getStockStatus = (stock: number) => {
  if (stock === 0)
    return {
      label: "Out of Stock",
      color: "text-red-600 bg-red-50 border-red-200",
    };
  if (stock < config.business.lowStockThreshold) // Use config
    return {
      label: "Low Stock",
      color: "text-orange-600 bg-orange-50 border-orange-200",
    };
  return {
    label: "In Stock",
    color: "text-green-600 bg-green-50 border-green-200",
  };
};


export default function Products() {
  const { toast } = useToast();
  const queryClient = useQueryClient(); // For invalidating cache after mutations

  // Step 2: Fetch data using useQuery instead of useState/useEffect
  const { data: products = [], isLoading, isError, error } = useQuery<Product[], Error>({
    queryKey: ["products"], // Unique key for this data
    queryFn: fetchProducts,   // The function to fetch the data
  });

  // State for local UI control (forms, dialogs, search) remains the same
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "", price: "", cost: "", category: "", stock: "", description: "",
  });

  // Step 3 (Advanced): Set up mutations for adding, updating, and deleting data.
  // In a real app, these would call api.updateProduct, api.addProduct, etc.
  const updateProductMutation = useMutation({
    mutationFn: async (updatedProduct: Product) => {
      // In a real app: await api.updateProduct(updatedProduct);
      console.log("Simulating update for:", updatedProduct);
      toast({ title: "Success", description: "Product updated successfully." });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });

  // Memoize calculations so they don't run on every render
  const filteredProducts = useMemo(() =>
    products.filter(
      (product) =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.category.toLowerCase().includes(searchTerm.toLowerCase())
    ), [products, searchTerm]);

  const { lowStockProducts, outOfStockProducts, totalValue, totalCost } = useMemo(() => {
    const lowStock = products.filter((p) => p.stock > 0 && p.stock < config.business.lowStockThreshold);
    const outOfStock = products.filter((p) => p.stock === 0);
    const value = products.reduce((sum, p) => sum + p.price * p.stock, 0);
    const cost = products.reduce((sum, p) => sum + p.cost * p.stock, 0);
    return { lowStockProducts: lowStock, outOfStockProducts: outOfStock, totalValue: value, totalCost: cost };
  }, [products]);

  // Handler functions remain similar, but now they call mutations
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const productData: Product = {
      id: editingProduct?.id || `product_${Date.now()}`,
      name: formData.name,
      price: parseFloat(formData.price) || 0,
      cost: parseFloat(formData.cost) || 0,
      category: formData.category,
      stock: parseInt(formData.stock) || 0,
      description: formData.description,
    };

    // This would be separate mutations in a real app (add vs. update)
    updateProductMutation.mutate(productData);

    resetForm();
    setIsAddDialogOpen(false);
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      price: product.price.toString(),
      cost: product.cost.toString(),
      category: product.category,
      stock: product.stock.toString(),
      description: product.description || "",
    });
    setIsAddDialogOpen(true);
  };
  
  const resetForm = () => {
      setFormData({ name: "", price: "", cost: "", category: "", stock: "", description: "" });
      setEditingProduct(null);
  };

  // Step 4: Handle loading and error states from useQuery
  if (isLoading) {
    return <LoadingScreen message="Loading products..." />;
  }

  if (isError) {
    return (
      <POSLayout>
        <div className="p-6 text-center">
          <h2 className="text-red-500">Error loading products</h2>
          <p>{error.message}</p>
        </div>
      </POSLayout>
    );
  }

  // The rest of your JSX can now safely assume `products` is an array.
  return (
    <POSLayout>
      <div className="p-6 space-y-6">
        {/* Header and Add Product Dialog (JSX remains mostly the same) */}
        <div className="flex items-center justify-between">
            {/* ... your header JSX ... */}
        </div>
        
        {/* Stats Cards (JSX remains mostly the same, using memoized values) */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Products</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{products.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Inventory Value</CardTitle>
              <TrendingDown className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${totalValue.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">
                Cost: ${totalCost.toFixed(2)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Low Stock</CardTitle>
              <AlertTriangle className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {lowStockProducts.length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Out of Stock</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {outOfStockProducts.length}
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* ... The rest of your JSX for alerts, search, and the table ... */}
        {/* ... Remember to use `filteredProducts` for mapping in the table ... */}
        <Card>
          <CardHeader>
            <CardTitle>Product Inventory</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Cost</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((product) => {
                  const stockStatus = getStockStatus(product.stock);
                  const margin =
                    product.price > 0 ? ((product.price - product.cost) / product.price) * 100 : 0;

                  return (
                    <TableRow key={product.id}>
                      {/* ... TableCells remain the same */}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            {/* ... No products found message ... */}
          </CardContent>
        </Card>

      </div>
    </POSLayout>
  );
}