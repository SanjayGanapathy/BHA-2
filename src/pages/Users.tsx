import React, { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { POSLayout } from "@/components/layout/POSLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Users as UsersIcon, Plus, Search, Edit, Shield, UserCheck, UserX } from "lucide-react";
import { fetchUsers, addUser, updateUser, getCurrentUser } from "@/lib/api";
import { User } from "@/types";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";
import { LoadingScreen, LoadingSpinner } from "@/components/ui/loading";

export default function Users() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const activeUser = getCurrentUser();

  // --- DATA FETCHING ---
  const { data: users = [], isLoading, isError, error } = useQuery<User[], Error>({
    queryKey: ["users"],
    queryFn: fetchUsers,
  });

  // --- UI STATE ---
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState<Omit<User, 'id' | 'isActive'>>({ username: "", name: "", email: "", role: "cashier" });

  useEffect(() => {
    if (!isDialogOpen) {
      setEditingUser(null);
      setFormData({ username: "", name: "", email: "", role: "cashier" });
    }
  }, [isDialogOpen]);

  // --- DATA MUTATIONS ---
  const userMutation = useMutation({
    mutationFn: (user: Partial<User> & { id?: string }) => 
      editingUser
        ? updateUser(user as User)
        : addUser(user as Omit<User, 'id'>),
    onSuccess: (_, variables) => {
      toast({ title: "Success!", description: `User has been ${variables.id ? 'updated' : 'created'}.` });
      queryClient.invalidateQueries({ queryKey: ["users"] });
      setIsDialogOpen(false);
    },
    onError: (e: Error) => {
      toast({ title: "Error", description: e.message || "Could not save user.", variant: "destructive" });
    },
  });

  // --- DERIVED STATE & MEMOIZATION ---
  const filteredUsers = useMemo(() =>
    users.filter(u =>
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase())
    ),
  [users, searchTerm]);

  // --- EVENT HANDLERS ---
  const handleOpenAddDialog = () => {
    setEditingUser(null);
    setFormData({ username: "", name: "", email: "", role: "cashier" });
    setIsDialogOpen(true);
  };
  
  const handleEdit = (user: User) => {
    setEditingUser(user);
    setFormData({ username: user.username, name: user.name, email: user.email, role: user.role });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const userData = editingUser
      ? { ...editingUser, ...formData }
      : { ...formData, isActive: true };
    userMutation.mutate(userData);
  };

  const toggleUserStatus = (user: User) => {
    if (user.id === activeUser?.id) {
      toast({ title: "Action Forbidden", description: "You cannot deactivate your own account.", variant: "destructive" });
      return;
    }
    userMutation.mutate({ ...user, isActive: !user.isActive });
  };

  // --- RENDER LOGIC ---
  if (isLoading) return <LoadingScreen message="Loading users..." />;
  if (isError) return <div className="p-4 text-red-500">Error: {error.message}</div>;

  return (
    <POSLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">User Management</h1>
            <p className="text-muted-foreground">Manage user accounts and access permissions</p>
          </div>
          {activeUser?.role === 'admin' && (
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild><Button onClick={handleOpenAddDialog}><Plus className="h-4 w-4 mr-2" />Add User</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>{editingUser ? "Edit User" : "Add New User"}</DialogTitle></DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Form fields here */}
                  <Button type="submit" disabled={userMutation.isPending}>{userMutation.isPending ? <LoadingSpinner size="sm" /> : 'Save User'}</Button>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>User Accounts</CardTitle>
            <Input placeholder="Search users..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="max-w-sm" />
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader><TableRow><TableHead>User</TableHead><TableHead>Role</TableHead><TableHead>Status</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell><div>{user.name}<div className="text-sm text-muted-foreground">{user.email}</div></div></TableCell>
                    <TableCell><Badge>{user.role}</Badge></TableCell>
                    <TableCell><Badge variant={user.isActive ? "default" : "outline"}>{user.isActive ? 'Active' : 'Inactive'}</Badge></TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(user)} disabled={activeUser?.role !== 'admin'}><Edit className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => toggleUserStatus(user)} disabled={user.id === activeUser?.id || activeUser?.role !== 'admin'}>{user.isActive ? <UserX className="h-4 w-4 text-red-500" /> : <UserCheck className="h-4 w-4 text-green-500" />}</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </POSLayout>
  );
}