import React, { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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

// Zod schema for validating the user form
const userSchema = z.object({
  name: z.string().min(2, { message: "Full name is required." }),
  username: z.string().min(3, { message: "Username must be at least 3 characters." }),
  email: z.string().email({ message: "Please enter a valid email address." }),
  role: z.enum(["admin", "manager", "cashier"]),
});
type UserFormData = z.infer<typeof userSchema>;

export default function Users() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const activeUser = getCurrentUser();

  const { data: users = [], isLoading, isError, error } = useQuery<User[], Error>({
    queryKey: ["users"],
    queryFn: fetchUsers,
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const { register, handleSubmit, reset, control, formState: { errors } } = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
    defaultValues: { role: "cashier" },
  });

  useEffect(() => {
    if (isDialogOpen) {
      if (editingUser) {
        reset(editingUser);
      } else {
        reset({ name: "", username: "", email: "", role: "cashier" });
      }
    } else {
      setEditingUser(null);
    }
  }, [isDialogOpen, editingUser, reset]);

  const userMutation = useMutation({
    mutationFn: (data: { userData: UserFormData, id?: string }) => {
        const payload = data.id 
            ? { ...editingUser!, ...data.userData } as User
            : { ...data.userData, isActive: true } as Omit<User, 'id'>;
        return data.id ? updateUser(payload as User) : addUser(payload);
    },
    onSuccess: (_, variables) => {
      toast({ title: "Success!", description: `User has been ${variables.id ? 'updated' : 'created'}.` });
      queryClient.invalidateQueries({ queryKey: ["users"] });
      setIsDialogOpen(false);
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
  
  const toggleStatusMutation = useMutation({
    mutationFn: updateUser,
    onSuccess: (updatedUser) => {
      toast({title: "Status Updated", description: `${updatedUser.name} is now ${updatedUser.isActive ? 'active' : 'inactive'}.`});
      queryClient.invalidateQueries({queryKey: ['users']});
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const onSubmit = (data: UserFormData) => {
    userMutation.mutate({ userData: data, id: editingUser?.id });
  };
  
  const handleEditClick = (user: User) => {
    setEditingUser(user);
    setIsDialogOpen(true);
  };
  
  const handleAddClick = () => {
    setEditingUser(null);
    setIsDialogOpen(true);
  };

  const handleToggleStatus = (user: User) => {
    if (user.id === activeUser?.id) {
      toast({ title: "Action Forbidden", description: "You cannot deactivate your own account.", variant: "destructive" });
      return;
    }
    toggleStatusMutation.mutate({ ...user, isActive: !user.isActive });
  };

  const filteredUsers = useMemo(() =>
    users.filter(u =>
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase())
    ),
  [users, searchTerm]);
  
  const stats = useMemo(() => ({
    active: users.filter(u => u.isActive).length,
    inactive: users.filter(u => !u.isActive).length,
    admins: users.filter(u => u.role === 'admin').length,
  }), [users]);

  if (isLoading) return <LoadingScreen message="Loading users..." />;
  if (isError) return <div className="p-4 text-red-500">Error: {error.message}</div>;

  return (
    <POSLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-blue-900">User Management</h1>
            <p className="text-muted-foreground">Manage user accounts and access permissions</p>
          </div>
          {activeUser?.role === 'admin' && (
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild><Button onClick={handleAddClick}><Plus className="mr-2 h-4 w-4"/>Add User</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader>
                    <DialogTitle>{editingUser ? "Edit User" : "Add New User"}</DialogTitle>
                    <DialogDescription>{editingUser ? "Update this user's information." : "Create a new user account."}</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
                  <fieldset disabled={userMutation.isPending} className="space-y-3">
                    <div className="space-y-1">
                      <Label htmlFor="name">Full Name</Label>
                      <Input id="name" {...register("name")} />
                      {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <Label htmlFor="username">Username</Label>
                            <Input id="username" {...register("username")} />
                            {errors.username && <p className="text-sm text-red-500">{errors.username.message}</p>}
                        </div>
                        <div className="space-y-1">
                            <Label htmlFor="role">Role</Label>
                            <Controller name="role" control={control} render={({ field }) => (
                            <Select onValueChange={field.onChange} value={field.value}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="cashier">Cashier</SelectItem>
                                    <SelectItem value="manager">Manager</SelectItem>
                                    <SelectItem value="admin">Admin</SelectItem>
                                </SelectContent>
                            </Select>
                            )} />
                        </div>
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="email">Email Address</Label>
                      <Input id="email" type="email" {...register("email")} />
                      {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
                    </div>
                  </fieldset>
                  <div className="flex justify-end gap-2 pt-4">
                    <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)} disabled={userMutation.isPending}>Cancel</Button>
                    <Button type="submit" disabled={userMutation.isPending}>{userMutation.isPending ? <LoadingSpinner size="sm"/> : "Save User"}</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Total Users</CardTitle><UsersIcon className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{users.length}</div></CardContent></Card>
            <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Active Users</CardTitle><UserCheck className="h-4 w-4 text-green-500" /></CardHeader><CardContent><div className="text-2xl font-bold text-green-600">{stats.active}</div></CardContent></Card>
            <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Inactive Users</CardTitle><UserX className="h-4 w-4 text-red-500" /></CardHeader><CardContent><div className="text-2xl font-bold text-red-600">{stats.inactive}</div></CardContent></Card>
            <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Administrators</CardTitle><Shield className="h-4 w-4 text-blue-500" /></CardHeader><CardContent><div className="text-2xl font-bold text-blue-600">{stats.admins}</div></CardContent></Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>User Accounts</CardTitle>
            <div className="relative max-w-sm"><Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground"/><Input placeholder="Search by name, username, or email..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-8"/></div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader><TableRow><TableHead>User</TableHead><TableHead>Role</TableHead><TableHead>Status</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell><div><span className="font-medium">{user.name}</span>{user.id === activeUser?.id && <Badge variant="outline" className="ml-2">You</Badge>}<div className="text-sm text-muted-foreground">{user.email}</div></div></TableCell>
                    <TableCell><Badge variant="secondary">{user.role}</Badge></TableCell>
                    <TableCell><Badge className={cn(user.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800")}>{user.isActive ? 'Active' : 'Inactive'}</Badge></TableCell>
                    <TableCell>
                        {activeUser?.role === 'admin' && user.id !== activeUser?.id && (
                            <div className="flex items-center gap-1">
                                <Button variant="ghost" size="icon" onClick={() => handleEditClick(user)}><Edit className="h-4 w-4"/></Button>
                                <Button variant="ghost" size="icon" onClick={() => handleToggleStatus(user)} disabled={toggleStatusMutation.isPending}>{user.isActive ? <UserX className="h-4 w-4 text-red-500"/> : <UserCheck className="h-4 w-4 text-green-500"/>}</Button>
                            </div>
                        )}
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