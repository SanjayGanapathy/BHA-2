import React, { useState, useMemo, useEffect } from "react";
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
import {
  fetchProducts,
  addProduct,
  updateProduct,
  deleteProduct,
} from "@/lib/api";
import { Product } from "@/types";
import { cn } from "@/lib/utils";
import { LoadingScreen, LoadingSpinner } from "@/components/ui/loading";
import { useToast } from "@/components/ui/use-toast";
import { config } from "@/lib/config";

const getStockStatus = (stock: number) => {
  if (stock === 0)
    return {
      label: "Out of Stock",
      color: "text-red-600 bg-red-50 border-red-200",
    };
  if (stock < config.business.lowStockThreshold)
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
  const queryClient = useQueryClient();

  // --- DATA FETCHING ---
  const {
    data: products = [],
    isLoading,
    isError,
    error,
  } = useQuery<Product[], Error>({
    queryKey: ["products"],
    queryFn: fetchProducts,
  });

  // --- UI STATE ---
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    name: "", price: "", cost: "", category: "", stock: "", description: "",
  });
  
  // Reset form when dialog closes
  useEffect(() => {
    if (!isAddDialogOpen) {
      setEditingProduct(null);
      resetForm();
    }
  }, [isAddDialogOpen]);

  // --- DATA MUTATIONS ---
  const productMutation = useMutation({
    mutationFn: (newProduct: Product) =>
      editingProduct
        ? updateProduct(newProduct)
        : addProduct(newProduct),
    onSuccess: () => {
      toast({
        title: "Success!",
        description: `Product has been ${editingProduct ? "updated" : "added"}.`,
      });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      setIsAddDialogOpen(false);
    },
    onError: (err: Error) => {
      toast({
        title: "Error",
        description: err.message || "Could not save the product.",
        variant: "destructive",
      });
    },
  });

  const productDeleteMutation = useMutation({
    mutationFn: deleteProduct,
    onSuccess: () => {
      toast({
        title: "Product Deleted",
        description: `"${deletingProduct?.name}" has been removed.`,
      });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      setIsDeleteDialogOpen(false);
    },
    onError: (err: Error) => {
      toast({
        title: "Error",
        description: err.message || "Could not delete the product.",
        variant: "destructive",
      });
    },
  });

  // --- DERIVED STATE & MEMOIZATION ---
  const filteredProducts = useMemo(
    () =>
      products.filter(
        (product) =>
          product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          product.category.toLowerCase().includes(searchTerm.toLowerCase())
      ),
    [products, searchTerm]
  );

  const stats = useMemo(() => {
    return {
      lowStockProducts: products.filter((p) => p.stock > 0 && p.stock < config.business.lowStockThreshold),
      outOfStockProducts: products.filter((p) => p.stock === 0),
      totalValue: products.reduce((sum, p) => sum + p.price * p.stock, 0),
      totalCost: products.reduce((sum, p) => sum + p.cost * p.stock, 0),
    };
  }, [products]);

  // --- EVENT HANDLERS ---
  const resetForm = () => {
    setFormData({ name: "", price: "", cost: "", category: "", stock: "", description: "" });
  };
  
  const handleOpenAddDialog = () => {
    setEditingProduct(null);
    resetForm();
    setIsAddDialogOpen(true);
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const productData: Product = {
      id: editingProduct?.id || "", // ID will be generated by API for new products
      name: formData.name,
      price: parseFloat(formData.price) || 0,
      cost: parseFloat(formData.cost) || 0,
      category: formData.category,
      stock: parseInt(formData.stock) || 0,
      description: formData.description,
    };
    productMutation.mutate(productData);
  };
  
  const handleDelete = (product: Product) => {
    setDeletingProduct(product);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (deletingProduct) {
      productDeleteMutation.mutate(deletingProduct.id);
    }
  };

  // --- RENDER LOGIC ---
  if (isLoading) return <LoadingScreen message="Loading products..." />;
  if (isError) return <div className="p-4 text-red-500">Error: {error.message}</div>;

  return (
    <POSLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-blue-900">Product Management</h1>
            <p className="text-muted-foreground">Manage your inventory and product catalog</p>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={handleOpenAddDialog} className="gap-2 bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4" /> Add Product
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>{editingProduct ? "Edit Product" : "Add New Product"}</DialogTitle>
                <DialogDescription>{editingProduct ? "Update product information" : "Add a new product to your inventory"}</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Form fields here, e.g., */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <Label htmlFor="name">Product Name</Label>
                        <Input id="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
                    </div>
                    <div>
                        <Label htmlFor="category">Category</Label>
                        <Input id="category" value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} required />
                    </div>
                </div>
                {/* ... other form fields ... */}
                <div className="flex gap-2">
                  <Button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700" disabled={productMutation.isPending}>
                    {productMutation.isPending ? <LoadingSpinner size="sm" /> : (editingProduct ? "Update Product" : "Add Product")}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Delete Confirmation Dialog */}
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-red-600">Delete Product</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete "{deletingProduct?.name}"? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <div className="flex gap-2 mt-4">
              <Button variant="destructive" onClick={confirmDelete} className="flex-1" disabled={productDeleteMutation.isPending}>
                {productDeleteMutation.isPending ? <LoadingSpinner size="sm" /> : "Delete Product"}
              </Button>
              <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)} className="flex-1">Cancel</Button>
            </div>
          </DialogContent>
        </Dialog>
        
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card><CardHeader><CardTitle className="text-sm font-medium">Total Products</CardTitle><Package className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{products.length}</div></CardContent></Card>
            <Card><CardHeader><CardTitle className="text-sm font-medium">Inventory Value</CardTitle><TrendingDown className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">${stats.totalValue.toFixed(2)}</div><p className="text-xs text-muted-foreground">Cost: ${stats.totalCost.toFixed(2)}</p></CardContent></Card>
            <Card><CardHeader><CardTitle className="text-sm font-medium">Low Stock</CardTitle><AlertTriangle className="h-4 w-4 text-orange-500" /></CardHeader><CardContent><div className="text-2xl font-bold text-orange-600">{stats.lowStockProducts.length}</div></CardContent></Card>
            <Card><CardHeader><CardTitle className="text-sm font-medium">Out of Stock</CardTitle><AlertTriangle className="h-4 w-4 text-red-500" /></CardHeader><CardContent><div className="text-2xl font-bold text-red-600">{stats.outOfStockProducts.length}</div></CardContent></Card>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search products..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10"/>
        </div>

        {/* Products Table */}
        <Card>
          <CardHeader><CardTitle>Product Inventory</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead><TableHead>Category</TableHead><TableHead>Price</TableHead><TableHead>Cost</TableHead><TableHead>Stock</TableHead><TableHead>Status</TableHead><TableHead>Value</TableHead><TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell><div><div className="font-medium">{product.name}</div>{product.description && <div className="text-sm text-muted-foreground">{product.description}</div>}</div></TableCell>
                    <TableCell><Badge variant="secondary">{product.category}</Badge></TableCell>
                    <TableCell>${product.price.toFixed(2)}</TableCell>
                    <TableCell><div>${product.cost.toFixed(2)}<div className="text-xs text-muted-foreground">{product.price > 0 ? (((product.price - product.cost) / product.price) * 100).toFixed(1) : 0}% margin</div></div></TableCell>
                    <TableCell><span className={cn("font-medium", product.stock === 0 ? "text-red-600" : product.stock < 10 ? "text-orange-600" : "text-green-600")}>{product.stock}</span></TableCell>
                    <TableCell><Badge variant="outline" className={getStockStatus(product.stock).color}>{getStockStatus(product.stock).label}</Badge></TableCell>
                    <TableCell>${(product.price * product.stock).toFixed(2)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(product)} className="hover:bg-blue-50"><Edit className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(product)} className="hover:bg-red-50 text-red-600 hover:text-red-700"><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {filteredProducts.length === 0 && (<div className="text-center py-8"><Package className="h-12 w-12 mx-auto mb-3 text-muted-foreground" /><p className="text-muted-foreground">{searchTerm ? "No products found matching your search." : "No products in inventory."}</p></div>)}
          </CardContent>
        </Card>
      </div>
    </POSLayout>
  );
}