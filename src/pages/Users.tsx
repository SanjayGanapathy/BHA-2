import React, { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Users as UsersIcon, Plus, Search, MoreHorizontal, Trash2, Edit } from "lucide-react";
import { fetchUsers, addUser, updateUser, deleteUser } from "@/lib/api";
import { useAuth } from "@/auth/useAuth";
import { User } from "@/types";
import { useToast } from "@/components/ui/use-toast";
import { LoadingScreen, LoadingSpinner } from "@/components/ui/loading";
import { Switch } from "@/components/ui/switch";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuPortal
} from '@/components/ui/dropdown-menu';

const userSchema = z.object({
  name: z.string().min(2, "Full name is required."),
  username: z.string().min(3, "Username must be at least 3 characters."),
  email: z.string().email("Please enter a valid email address."),
  role: z.enum(["admin", "manager", "cashier"]),
  is_active: z.boolean(),
  password: z.string().min(8, "Password must be at least 8 characters.").optional().or(z.literal('')),
});

type UserFormData = z.infer<typeof userSchema>;

const roleHierarchy = {
  admin: 2,
  manager: 1,
  cashier: 0,
};

export default function Users() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user: activeUser } = useAuth();

  const { data: users = [], isLoading, isError, error } = useQuery<User[], Error>({
    queryKey: ["users"],
    queryFn: fetchUsers,
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

  const { register, handleSubmit, reset, control, formState: { errors } } = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
    defaultValues: { role: "cashier", is_active: true },
  });

  useEffect(() => {
    if (isFormDialogOpen) {
      if (editingUser) {
        reset({ ...editingUser, password: '' });
      } else {
        reset({ name: "", username: "", email: "", role: "cashier", password: "", is_active: true });
      }
    } else {
      setEditingUser(null);
    }
  }, [isFormDialogOpen, editingUser, reset]);

  const userFormMutation = useMutation({
    mutationFn: (formData: UserFormData) => {
      const payload = { ...formData, id: editingUser?.id };
      if (editingUser) {
        const { password, ...updateData } = payload;
        return updateUser(updateData as User);
      } else {
        if (!payload.password) throw new Error("Password is required for new users.");
        return addUser(payload as Omit<User, 'id'> & { password: string });
      }
    },
    onSuccess: () => {
      toast({ title: "Success!", description: `User has been ${editingUser ? "updated" : "added"}.` });
      queryClient.invalidateQueries({ queryKey: ["users"] });
      setIsFormDialogOpen(false);
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
  
  const roleUpdateMutation = useMutation({
    mutationFn: (data: { user: User; role: "admin" | "manager" | "cashier" }) => 
      updateUser({ ...data.user, role: data.role }),
    onSuccess: (updatedUser) => {
        toast({ title: "Role Updated", description: `${updatedUser.name}'s role has been changed to ${updatedUser.role}.` });
        queryClient.invalidateQueries({ queryKey: ["users"] });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const userDeleteMutation = useMutation({
    mutationFn: (userId: string) => deleteUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast({ title: "Success", description: "User has been deleted." });
      setUserToDelete(null);
    },
    onError: (e: Error) => toast({ title: "Error", description: `Failed to delete user: ${e.message}`, variant: "destructive" }),
  });

  const onSubmit = (data: UserFormData) => {
    userFormMutation.mutate(data);
  };

  const stats = useMemo(() => ({
    totalUsers: users.length,
    activeUsers: users.filter(u => u.is_active).length,
  }), [users]);
  
  const filteredUsers = useMemo(() =>
    users.filter(u => 
      (u.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
      (u.email || '').toLowerCase().includes(searchTerm.toLowerCase())
    ),
  [users, searchTerm]);

  if (isLoading) return <LoadingScreen message="Loading users..." />;
  if (isError) return <div className="p-4 text-red-500">Error: {error.message}</div>;

  const canPerformAction = (targetUser: User) => {
    if (!activeUser) return false;
    return roleHierarchy[activeUser.role as keyof typeof roleHierarchy] > roleHierarchy[targetUser.role as keyof typeof roleHierarchy];
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-3xl font-bold tracking-tight text-blue-900">User Management</h1><p className="text-muted-foreground">Manage your user accounts</p></div>
        <Dialog open={isFormDialogOpen} onOpenChange={setIsFormDialogOpen}>
            <DialogTrigger asChild><Button><Plus className="mr-2 h-4 w-4" />Add User</Button></DialogTrigger>
            <DialogContent><DialogHeader><DialogTitle>{editingUser ? 'Edit User' : 'Add New User'}</DialogTitle><DialogDescription>{editingUser ? "Update this user's information." : "Add a new user to your system."}</DialogDescription></DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
              <fieldset disabled={userFormMutation.isPending}>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Full Name</Label>
                    <Input id="name" {...register("name")} />
                    <p className="text-sm text-red-500 mt-1 h-4">{errors.name?.message}</p>
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" {...register("email")} />
                    <p className="text-sm text-red-500 mt-1 h-4">{errors.email?.message}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="username">Username</Label>
                    <Input id="username" {...register("username")} />
                    <p className="text-sm text-red-500 mt-1 h-4">{errors.username?.message}</p>
                  </div>
                  <div>
                    <Label htmlFor="role">Role</Label>
                    <Controller name="role" control={control} render={({ field }) => (
                        <Select onValueChange={field.onChange} value={field.value}>
                            <SelectTrigger><SelectValue placeholder="Select role" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="admin">Admin</SelectItem>
                                <SelectItem value="manager">Manager</SelectItem>
                                <SelectItem value="cashier">Cashier</SelectItem>
                            </SelectContent>
                        </Select>
                    )} />
                    <p className="text-sm text-red-500 mt-1 h-4">{errors.role?.message}</p>
                  </div>
                </div>
                 <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="password">Password {editingUser ? '(leave blank to keep same)' : ''}</Label>
                    <Input id="password" type="password" {...register("password")} />
                    <p className="text-sm text-red-500 mt-1 h-4">{errors.password?.message}</p>
                  </div>
                  <div className="flex items-center space-x-2 pt-6">
                     <Controller name="is_active" control={control} render={({ field }) => (
                         <Switch id="is_active" checked={field.value} onCheckedChange={field.onChange} />
                      )}/>
                     <Label htmlFor="is_active">Active</Label>
                   </div>
                </div>
              </fieldset>
              <div className="flex gap-2 pt-2">
                  <Button type="submit" className="flex-1" disabled={userFormMutation.isPending}>
                    {userFormMutation.isPending ? <LoadingSpinner size="sm"/> : "Save User"}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setIsFormDialogOpen(false)}>Cancel</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Total Users</CardTitle><UsersIcon className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{stats.totalUsers}</div></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Active Users</CardTitle><UsersIcon className="h-4 w-4 text-green-500" /></CardHeader><CardContent><div className="text-2xl font-bold text-green-500">{stats.activeUsers}</div></CardContent></Card>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search users..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10"/>
      </div>

      <Card>
        <CardHeader><CardTitle>User List</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Email</TableHead><TableHead>Role</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
            <TableBody>
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell><div><div className="font-medium">{user.name}</div><div className="text-sm text-muted-foreground">@{user.username}</div></div></TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell><Badge variant="secondary" className="capitalize">{user.role}</Badge></TableCell>
                    <TableCell>
                        <Badge variant={user.is_active ? "default" : "destructive"} className="capitalize">
                            {user.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0" disabled={!canPerformAction(user) || user.id === activeUser?.id}>
                                  <span className="sr-only">Open menu</span>
                                  <MoreHorizontal className="h-4 w-4" />
                              </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => { setEditingUser(user); setIsFormDialogOpen(true); }}>
                                  <Edit className="mr-2 h-4 w-4" /> Edit User
                              </DropdownMenuItem>
                              <DropdownMenuSub>
                                <DropdownMenuSubTrigger>
                                  <UsersIcon className="mr-2 h-4 w-4" /> Change Role
                                </DropdownMenuSubTrigger>
                                <DropdownMenuPortal>
                                  <DropdownMenuSubContent>
                                    <DropdownMenuItem onClick={() => roleUpdateMutation.mutate({ user, role: 'admin' })}>Admin</DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => roleUpdateMutation.mutate({ user, role: 'manager' })}>Manager</DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => roleUpdateMutation.mutate({ user, role: 'cashier' })}>Cashier</DropdownMenuItem>
                                  </DropdownMenuSubContent>
                                </DropdownMenuPortal>
                              </DropdownMenuSub>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                  className="text-red-500 focus:text-red-500"
                                  onClick={() => { setUserToDelete(user); }}
                              >
                                  <Trash2 className="mr-2 h-4 w-4" /> Delete User
                              </DropdownMenuItem>
                          </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    {searchTerm ? "No users found matching your search." : "No users yet. Add your first one!"}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      <AlertDialog open={!!userToDelete} onOpenChange={(isOpen) => !isOpen && setUserToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete the user <span className="font-bold">{userToDelete?.name}</span>. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => { if (userToDelete) userDeleteMutation.mutate(userToDelete.id); }}
                disabled={userDeleteMutation.isPending}
                className="bg-red-500 hover:bg-red-600"
              >
                {userDeleteMutation.isPending ? <LoadingSpinner size="sm" /> : 'Delete'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
      </AlertDialog>
    </div>
  );
} 