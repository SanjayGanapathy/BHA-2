import React, { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { POSLayout } from "@/components/layout/POSLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Search, Package, Edit, AlertTriangle, TrendingDown, Trash2 } from "lucide-react";
import { fetchProducts, addProduct, updateProduct, deleteProduct } from "@/lib/api";
import { Product } from "@/types";
import { cn } from "@/lib/utils";
import { LoadingScreen, LoadingSpinner } from "@/components/ui/loading";
import { useToast } from "@/components/ui/use-toast";
import { config } from "@/lib/config";

const productSchema = z.object({
  name: z.string().min(3, { message: "Name must be at least 3 characters." }),
  category: z.string().min(2, { message: "Category is required." }),
  price: z.coerce.number().positive({ message: "Price must be a positive number." }),
  cost: z.coerce.number().nonnegative({ message: "Cost cannot be negative." }),
  stock: z.coerce.number().int().nonnegative({ message: "Stock must be a whole number." }),
  description: z.string().optional(),
});
type ProductFormData = z.infer<typeof productSchema>;

const getStockStatus = (stock: number) => {
  if (stock === 0) return { label: "Out of Stock", color: "text-red-600 bg-red-50 border-red-200" };
  if (stock < config.business.lowStockThreshold) return { label: "Low Stock", color: "text-orange-600 bg-orange-50 border-orange-200" };
  return { label: "In Stock", color: "text-green-600 bg-green-50 border-green-200" };
};

export default function Products() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: products = [], isLoading, isError, error } = useQuery<Product[], Error>({
    queryKey: ["products"],
    queryFn: fetchProducts,
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
  });
  
  useEffect(() => {
    if (isAddDialogOpen) {
      if (editingProduct) {
        reset(editingProduct);
      } else {
        reset({ name: "", category: "", price: 0, cost: 0, stock: 0, description: "" });
      }
    } else {
        setEditingProduct(null);
    }
  }, [isAddDialogOpen, editingProduct, reset]);

  const productMutation = useMutation({
    mutationFn: (data: { productData: ProductFormData; id?: string }) => 
      data.id ? updateProduct({ ...data.productData, id: data.id }) : addProduct(data.productData),
    onSuccess: (_, variables) => {
      toast({ title: "Success!", description: `Product has been ${variables.id ? "updated" : "added"}.` });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      setIsAddDialogOpen(false);
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const productDeleteMutation = useMutation({
    mutationFn: deleteProduct,
    onSuccess: () => {
      toast({ title: "Product Deleted", description: `"${deletingProduct?.name}" has been removed.` });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      setIsDeleteDialogOpen(false);
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const onSubmit = (data: ProductFormData) => {
    productMutation.mutate({ productData: data, id: editingProduct?.id });
  };

  const handleDeleteClick = (product: Product) => {
    setDeletingProduct(product);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (deletingProduct) {
      productDeleteMutation.mutate(deletingProduct.id);
    }
  };

  const stats = useMemo(() => ({
    lowStockProducts: products.filter(p => p.stock > 0 && p.stock < config.business.lowStockThreshold),
    outOfStockProducts: products.filter(p => p.stock === 0),
    totalValue: products.reduce((sum, p) => sum + p.price * p.stock, 0),
    totalCost: products.reduce((sum, p) => sum + p.cost * p.stock, 0),
  }), [products]);
  
  const filteredProducts = useMemo(() =>
    products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.category.toLowerCase().includes(searchTerm.toLowerCase())),
  [products, searchTerm]);

  if (isLoading) return <LoadingScreen message="Loading products..." />;
  if (isError) return <div className="p-4 text-red-500">Error: {error.message}</div>;

  return (
    <POSLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div><h1 className="text-3xl font-bold tracking-tight text-blue-900">Product Management</h1><p className="text-muted-foreground">Manage your inventory and product catalog</p></div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}><DialogTrigger asChild><Button><Plus className="mr-2 h-4 w-4" />Add Product</Button></DialogTrigger>
            <DialogContent><DialogHeader><DialogTitle>{editingProduct ? 'Edit Product' : 'Add New Product'}</DialogTitle><DialogDescription>{editingProduct ? "Update this product's information." : "Add a new product to your inventory."}</DialogDescription></DialogHeader>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div><Label htmlFor="name">Product Name</Label><Input id="name" {...register("name")} /><p className="text-sm text-red-500 mt-1 h-4">{errors.name?.message}</p></div>
                  <div><Label htmlFor="category">Category</Label><Input id="category" {...register("category")} /><p className="text-sm text-red-500 mt-1 h-4">{errors.category?.message}</p></div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div><Label htmlFor="price">Price ($)</Label><Input id="price" type="number" step="0.01" {...register("price")} /><p className="text-sm text-red-500 mt-1 h-4">{errors.price?.message}</p></div>
                  <div><Label htmlFor="cost">Cost ($)</Label><Input id="cost" type="number" step="0.01" {...register("cost")} /><p className="text-sm text-red-500 mt-1 h-4">{errors.cost?.message}</p></div>
                  <div><Label htmlFor="stock">Stock</Label><Input id="stock" type="number" {...register("stock")} /><p className="text-sm text-red-500 mt-1 h-4">{errors.stock?.message}</p></div>
                </div>
                <div><Label htmlFor="description">Description</Label><Input id="description" {...register("description")} /></div>
                <div className="flex gap-2 pt-2">
                    <Button type="submit" className="flex-1" disabled={productMutation.isPending}>{productMutation.isPending ? <LoadingSpinner size="sm"/> : "Save Product"}</Button>
                    <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}><DialogContent><DialogHeader><DialogTitle className="text-red-600">Delete Product</DialogTitle><DialogDescription>Are you sure you want to delete "{deletingProduct?.name}"? This action cannot be undone.</DialogDescription></DialogHeader><div className="flex gap-2 mt-4"><Button variant="destructive" onClick={confirmDelete} className="flex-1" disabled={productDeleteMutation.isPending}>{productDeleteMutation.isPending ? <LoadingSpinner size="sm" /> : "Delete Product"}</Button><Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)} className="flex-1">Cancel</Button></div></DialogContent></Dialog>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Total Products</CardTitle><Package className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{products.length}</div></CardContent></Card>
            <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Inventory Value</CardTitle><TrendingDown className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">${stats.totalValue.toFixed(2)}</div><p className="text-xs text-muted-foreground">Cost: ${stats.totalCost.toFixed(2)}</p></CardContent></Card>
            <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Low Stock</CardTitle><AlertTriangle className="h-4 w-4 text-orange-500" /></CardHeader><CardContent><div className="text-2xl font-bold text-orange-600">{stats.lowStockProducts.length}</div></CardContent></Card>
            <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Out of Stock</CardTitle><AlertTriangle className="h-4 w-4 text-red-500" /></CardHeader><CardContent><div className="text-2xl font-bold text-red-600">{stats.outOfStockProducts.length}</div></CardContent></Card>
        </div>

        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search products..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10"/>
        </div>

        <Card>
          <CardHeader><CardTitle>Product Inventory</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader><TableRow><TableHead>Product</TableHead><TableHead>Category</TableHead><TableHead>Price</TableHead><TableHead>Cost</TableHead><TableHead>Stock</TableHead><TableHead>Status</TableHead><TableHead>Value</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
              <TableBody>
                {filteredProducts.map((p) => (<TableRow key={p.id}>
                    <TableCell><div><div className="font-medium">{p.name}</div>{p.description && <div className="text-sm text-muted-foreground">{p.description}</div>}</div></TableCell>
                    <TableCell><Badge variant="secondary">{p.category}</Badge></TableCell>
                    <TableCell>${p.price.toFixed(2)}</TableCell>
                    <TableCell><div>${p.cost.toFixed(2)}<div className="text-xs text-muted-foreground">{p.price > 0 ? (((p.price - p.cost) / p.price) * 100).toFixed(1) : 0}% margin</div></div></TableCell>
                    <TableCell><span className={cn("font-medium", p.stock === 0 ? "text-red-600" : p.stock < 10 ? "text-orange-600" : "text-green-600")}>{p.stock}</span></TableCell>
                    <TableCell><Badge variant="outline" className={getStockStatus(p.stock).color}>{getStockStatus(p.stock).label}</Badge></TableCell>
                    <TableCell>${(p.price * p.stock).toFixed(2)}</TableCell>
                    <TableCell><div className="flex items-center gap-2"><Button variant="ghost" size="sm" onClick={() => { setEditingProduct(p); setIsAddDialogOpen(true);}}><Edit className="h-4 w-4" /></Button><Button variant="ghost" size="sm" onClick={() => handleDeleteClick(p)} className="hover:bg-red-50 text-red-600 hover:text-red-700"><Trash2 className="h-4 w-4" /></Button></div></TableCell>
                  </TableRow>))}
              </TableBody>
            </Table>
            {filteredProducts.length === 0 && (<div className="text-center py-8"><Package className="h-12 w-12 mx-auto mb-3 text-muted-foreground" /><p className="text-muted-foreground">{searchTerm ? "No products found matching your search." : "No products in inventory."}</p></div>)}
          </CardContent>
        </Card>
      </div>
    </POSLayout>
  );
}