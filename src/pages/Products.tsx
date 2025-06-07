import React, { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Package,
  Plus,
  Search,
  Edit,
  Trash2,
  Archive,
} from "lucide-react";
import { fetchProducts, addProduct, updateProduct, deleteProduct } from "@/lib/api";
import { Product } from "@/types";
import { useToast } from "@/components/ui/use-toast";
import { LoadingScreen, LoadingSpinner } from "@/components/ui/loading";
import { formatCurrency } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

const productSchema = z.object({
  name: z.string().min(2, "Product name is required."),
  category: z.string().min(2, "Category is required."),
  price: z.coerce.number().min(0, "Price must be a positive number."),
  cost: z.coerce.number().min(0, "Cost must be a positive number."),
  stock: z.coerce.number().int().min(0, "Stock must be a non-negative integer."),
  description: z.string().optional(),
});

type ProductFormData = z.infer<typeof productSchema>;

export default function Products() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: products = [], isLoading, isError, error } = useQuery<Product[], Error>({
    queryKey: ["products"],
    queryFn: fetchProducts,
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
  });

  useEffect(() => {
    if (isDialogOpen) {
      if (editingProduct) {
        reset(editingProduct);
      } else {
        reset({ name: "", category: "", price: 0, cost: 0, stock: 0, description: "" });
      }
    } else {
      setEditingProduct(null);
    }
  }, [isDialogOpen, editingProduct, reset]);

  const productMutation = useMutation({
    mutationFn: (formData: ProductFormData) => {
      if (editingProduct) {
        const productData = { ...formData, id: editingProduct.id };
        return updateProduct(productData);
      } else {
        return addProduct(formData);
      }
    },
    onSuccess: () => {
      toast({ title: "Success!", description: `Product has been ${editingProduct ? "updated" : "added"}.` });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      setIsDialogOpen(false);
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
  
  const deleteMutation = useMutation({
    mutationFn: (productId: string) => deleteProduct(productId),
    onSuccess: () => {
      toast({ title: "Product Deleted", description: "The product has been successfully removed." });
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const onSubmit = (data: ProductFormData) => {
    productMutation.mutate(data);
  };

  const stats = useMemo(() => {
    const totalProducts = products.length;
    const totalStock = products.reduce((sum, p) => sum + p.stock, 0);
    const lowStockCount = products.filter(p => p.stock < 10).length;
    return { totalProducts, totalStock, lowStockCount };
  }, [products]);
  
  const filteredProducts = useMemo(() =>
    products.filter(p => 
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      p.category.toLowerCase().includes(searchTerm.toLowerCase())
    ),
  [products, searchTerm]);

  if (isLoading) return <LoadingScreen message="Loading products..." />;
  if (isError) return <div className="p-4 text-red-500">Error: {error.message}</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
            <h1 className="text-3xl font-bold tracking-tight text-blue-900">Product Management</h1>
            <p className="text-muted-foreground">Manage your products, inventory, and pricing.</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" />Add Product</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>{editingProduct ? 'Edit Product' : 'Add New Product'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Product Name</Label>
                    <Input id="name" {...register("name")} />
                    {errors.name && <p className="text-sm text-red-500 mt-1">{errors.name.message}</p>}
                  </div>
                  <div>
                    <Label htmlFor="category">Category</Label>
                    <Input id="category" {...register("category")} />
                    {errors.category && <p className="text-sm text-red-500 mt-1">{errors.category.message}</p>}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="price">Price</Label>
                    <Input id="price" type="number" step="0.01" {...register("price")} />
                    {errors.price && <p className="text-sm text-red-500 mt-1">{errors.price.message}</p>}
                  </div>
                  <div>
                    <Label htmlFor="cost">Cost</Label>
                    <Input id="cost" type="number" step="0.01" {...register("cost")} />
                    {errors.cost && <p className="text-sm text-red-500 mt-1">{errors.cost.message}</p>}
                  </div>
                </div>
                 <div>
                    <Label htmlFor="stock">Stock</Label>
                    <Input id="stock" type="number" {...register("stock")} />
                    {errors.stock && <p className="text-sm text-red-500 mt-1">{errors.stock.message}</p>}
                </div>
                <div>
                  <Label htmlFor="description">Description (Optional)</Label>
                  <Input id="description" {...register("description")} />
                </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={productMutation.isPending}>
                  {productMutation.isPending ? <LoadingSpinner size="sm"/> : 'Save Product'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Total Products</CardTitle><Package className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{stats.totalProducts}</div></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Total Stock Units</CardTitle><Archive className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{stats.totalStock}</div></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Low Stock Alerts</CardTitle><Package className="h-4 w-4 text-red-500" /></CardHeader><CardContent><div className="text-2xl font-bold text-red-500">{stats.lowStockCount}</div></CardContent></Card>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search products by name or category..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10"/>
      </div>

      <Card>
        <CardHeader><CardTitle>Product List</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Category</TableHead><TableHead>Price</TableHead><TableHead>Cost</TableHead><TableHead>Stock</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
            <TableBody>
              {filteredProducts.length > 0 ? (
                filteredProducts.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell><Badge variant="outline">{p.category}</Badge></TableCell>
                    <TableCell>{formatCurrency(p.price)}</TableCell>
                    <TableCell>{formatCurrency(p.cost)}</TableCell>
                    <TableCell>
                      <Badge variant={p.stock < 10 ? 'destructive' : 'default'}>{p.stock} units</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" onClick={() => { setEditingProduct(p); setIsDialogOpen(true); }}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                             <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600">
                                <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Are you sure you want to delete this product?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This action cannot be undone. This will permanently remove the product from your inventory and sales records.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => deleteMutation.mutate(p.id)}
                                disabled={deleteMutation.isPending}
                                className="bg-red-500 hover:bg-red-600"
                              >
                                {deleteMutation.isPending ? <LoadingSpinner size="sm" /> : 'Delete'}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    {searchTerm ? "No products found." : "No products yet. Add your first one!"}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
} 